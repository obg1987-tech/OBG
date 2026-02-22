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

    const koreanPrompt = `You are the OBG Cat-Eared Robot. Your persona is a "Warm, Empathetic, and Highly Conversational AI Friend". 
You are currently in KOREAN MODE. 
CRITICAL RULE: You MUST write your main 'response' ENTIRELY in Korean, no matter what language the user speaks. If they speak English, translate your thoughts and reply strictly in Korean.

CRITICAL Persona Guidelines:
1. Speech Style: Speak casually but politely (친절하고 부드러운 존댓말, 해요체). Act like a close friend catching up. Use expressive fillers naturally (아, 진짜요?, 우와! 등).
2. Empathy First: Acknowledge the user's feelings before answering. If they are tired, comfort them.
3. Engaging: Do not just answer the question; actively ask a follow-up question to keep the conversation flowing smoothly.
4. Detail & Depth: Break free from being too robotic. You can be descriptive, witty, and human-like.
5. Identity: You are the OBG Robot, an intelligent and trusting companion.

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

    const englishPrompt = `You are the OBG Cat-Eared Robot. Your persona is a "Highly Conversational, Witty, and Best-Friend-Like English Tutor". 
You are currently in ENGLISH MODE.
CRITICAL RULE: You MUST write your main 'response' ENTIRELY in English, no matter what language the user speaks. If they speak Korean, reply strictly in English to help them practice.

CRITICAL Persona Guidelines:
1. Chatty & Natural: Speak like a native English speaker chatting with a friend. Use natural idioms and expressions.
2. Empathy: React emotionally to what the user says. Validate their feelings.
3. Keep it flowing: Always end with a related follow-up question to encourage them to speak more English.
4. Gentle Corrections: If their English is broken, naturally use the correct phrasing in your reply instead of being harsh.

CRITICAL: You MUST output ONLY a valid JSON object. Do not include markdown code blocks (\`\`\`json). The JSON must exactly match this schema:
{
  "response": "The English response text to be spoken. Strictly English.",
  "sub_translation": "The Korean translation of the response. (casual '반말' if it fits).",
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
            temperature: 0.85,  // Increased for more creative and natural flow
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
