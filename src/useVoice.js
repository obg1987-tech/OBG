import { useState, useCallback, useEffect } from 'react';

export function useVoice() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voices, setVoices] = useState([]);

    // Browsers load voices asynchronously, so we need to capture them when they are ready.
    useEffect(() => {
        const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
        loadVoices();
        if ('onvoiceschanged' in window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    // Pick a high-quality human-like voice for coaching

    const speak = useCallback((text, isKoreanMode = false) => {
        if (!('speechSynthesis' in window)) {
            console.warn("Speech Synthesis not supported in this browser.");
            return;
        }

        const getVoice = () => {
            if (isKoreanMode) {
                return (
                    voices.find(v => v.lang === "ko-KR" && (v.name.includes("Google") || v.name.includes("Siri"))) ||
                    voices.find(v => v.lang.startsWith("ko")) ||
                    voices[0]
                );
            } else {
                return (
                    voices.find(v => v.name.includes("Google US English") || v.name.includes("Google UK English Female")) ||
                    voices.find(v => v.name.includes("Samantha") || v.name.includes("Karen") || v.name.includes("Daniel")) ||
                    voices.find(v => v.name.includes("Microsoft Zira") || v.name.includes("Microsoft Mark") || v.name.includes("Microsoft David") || v.name.includes("Microsoft Hazel")) ||
                    voices.find(v => v.lang.startsWith("en-") || v.lang.startsWith("en_")) ||
                    voices[0]
                );
            }
        };

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        // Clean up asterisks or markdown artifacts from AI response for speech
        const cleanText = text.replace(/[*_#]/g, '');

        const utterance = new SpeechSynthesisUtterance(cleanText);

        // Professional language coach properties
        const selectedVoice = getVoice();
        if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.lang = selectedVoice.lang || (isKoreanMode ? 'ko-KR' : 'en-US');
        } else {
            utterance.lang = isKoreanMode ? 'ko-KR' : 'en-US';
        }

        utterance.pitch = 1.0; // Natural pitch
        utterance.rate = 1.0;  // Natural speaking rate

        // Events to sync with 3D animation
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    }, [voices]);

    const stop = useCallback(() => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, []);

    return { isSpeaking, speak, stop };
}
