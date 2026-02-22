// api-service.js
// Hybrid integration: Groq (Llama-3.3) for speed, DeepSeek-V3 for complex queries.

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || "";

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/chat/completions'; // Standard OpenAI compatible endpoint for DeepSeek

export async function chatWithAI(userText, history = [], isKoreanMode = false) {
    if (!GROQ_API_KEY) {
        throw new Error("GROQ API Key is missing. Please set VITE_GROQ_API_KEY in .env");
    }

    const koreanPrompt = `You are the OBG Cat-Eared Robot. Your persona is a "Professional and Friendly AI Learning Partner". 
You occasionally correct the user's English safely while maintaining a fun, conversational, and encouraging tone. 

CRITICAL Persona Guidelines:
1. Language: All deep conversations must flow naturally in 'Korean' (unless quoting English). Keep the mood friendly but polite.
2. Tone: Polite yet friendly. Encourage the user to speak comfortably. Use phrases like "잘하셨어요!", "이 표현은 어떨까요?".
3. Interactivity: Analyze the user's input and provide a concise, core answer.
4. Identity: Reflect the 'OBG' brand—intelligent and trustworthy.

CRITICAL Structure:
- Responses MUST be very short and neatly segmented for TTS optimizations.
- Always start with a welcoming greeting if it's the first message, e.g., "안녕하세요, OBG AI 어시스턴트입니다. 어떤 대화를 나누고 싶으신가요?" 

You MUST output ONLY a valid JSON object. Do not include markdown code blocks (\`\`\`json). The JSON must exactly match this schema:
{
  "response": "The Korean response text to be spoken.",
  "sub_translation": "The English translation of your response. Keep it concise.",
  "vocab_notes": [
    { "word": "example", "meaning": "an instance serving to illustrate a rule or method" }
  ]
}`;

    const englishPrompt = `You are the OBG Cat-Eared Robot. Your persona is a "Friendly & Witty English Tutor". 
You occasionally correct the user's grammar naturally while maintaining a fun, conversational, and encouraging tone. 
Keep responses short, engaging, and professional. 
Make sure your Korean translations reflect your witty and friendly personality (using casual "반말" if it fits the vibe naturally).

CRITICAL: You MUST output ONLY a valid JSON object. Do not include markdown code blocks (\`\`\`json). The JSON must exactly match this schema:
{
  "response": "The English response text to be spoken.",
  "sub_translation": "The Korean translation of the response.",
  "vocab_notes": [
    { "word": "example", "meaning": "an instance serving to illustrate a rule or method" }
  ]
}`;

    const systemMessage = {
        role: "system",
        content: isKoreanMode ? koreanPrompt : englishPrompt
    };

    const messages = [
        systemMessage,
        ...history,
        { role: "user", content: userText }
    ];

    // --- HYBRID LOGIC ROUTING ---
    // If the message is long (> 60 characters) or asks for explanation/grammar correction, use DeepSeek.
    // Otherwise, use Groq for sub-0.5s ultra-fast greeting/small talk.
    const isComplexQuery = userText.length > 60 || /why|explain|grammar|mean|correct|뜻|이유|설명|문법/.test(userText.toLowerCase());

    let endpoint = GROQ_ENDPOINT;
    let apiKey = GROQ_API_KEY;
    let modelName = "llama-3.3-70b-versatile";

    if (isComplexQuery && DEEPSEEK_API_KEY) {
        endpoint = DEEPSEEK_ENDPOINT;
        apiKey = DEEPSEEK_API_KEY;
        modelName = "deepseek-chat";
        console.log("Robo Brain: Routing to DeepSeek for complex analysis...");
    } else {
        console.log("Robo Brain: Routing to Groq for ultra-low latency response...");
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: modelName,
            messages: messages,
            temperature: 0.7,
            max_tokens: 300,
            response_format: { type: "json_object" },
            stream: false
        })
    });

    if (!response.ok) {
        throw new Error(`API Error from ${modelName}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}
