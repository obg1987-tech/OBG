import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, PerspectiveCamera, ContactShadows, Float } from '@react-three/drei';
import { Send, Music, Sparkles, Terminal, Mic, Hexagon, Globe } from 'lucide-react';
import { gsap } from 'gsap';
import { Robot } from './Robot';
import { DataStreamBackground } from './DataStreamBackground';
import { SummoningCircle } from './SummoningCircle';
import { chatWithAI } from './api-service';
import { useVoice } from './useVoice';

function App() {
  const [isKoreanMode, setIsKoreanMode] = useState(true);
  const [inputText, setInputText] = useState("");
  const [response, setResponse] = useState("");
  const [translationData, setTranslationData] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [isRecordingState, setIsRecordingState] = useState(false); // UI State for Recording Status
  const [hoverUI, setHoverUI] = useState(false);
  const [robotEmotion, setRobotEmotion] = useState('default');
  const [showPopup, setShowPopup] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  const toggleMode = () => {
    setIsKoreanMode(prev => {
      stop();
      if (!prev) {
        setResponse("안녕하세요, OBG AI 파트너입니다. 어떤 대화를 나눌까요?");
        setTranslationData({ sub_translation: "Hello, I'm the OBG AI Partner. What shall we talk about?", vocab_notes: [] });
        return true;
      } else {
        setResponse("Hello there! I'm your OBG English Coach. What shall we talk about today?");
        setTranslationData({ sub_translation: "안녕하세요! 여러분의 스피킹 코치입니다. 오늘 어떤 대화를 나눠볼까요?", vocab_notes: [] });
        return false;
      }
    });
    chatHistory.current = []; // Reset history when changing modes to avoid confusion
  };

  // Custom Hook for TTS Web Speech API
  const { isSpeaking, speak, stop, unlockAudio } = useVoice();

  // STT Hook (WebkitSpeechRecognition)
  const isRecording = useRef(false);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef(""); // To store the latest transcript inside closure

  // UI Refs for animations
  const uiContainerRef = useRef();
  const titleRef = useRef();
  const inputContainerRef = useRef();
  const responseRef = useRef();
  const chatHistory = useRef([]);

  useEffect(() => {
    // 카카오톡 인앱 브라우저 강제 탈출 스크립트
    // 카카오톡 인앱 브라우저에서는 Web Speech API (TTS/STT)를 정상적으로 지원하지 않는 경우가 많으므로
    // 접속 즉시 사용자의 기본 브라우저(크롬, 사파리 등)로 강제 우회시킵니다.
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.match(/kakaotalk/i)) {
      location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(location.href);
    }
  }, []);

  useEffect(() => {
    // Entrance Animations using GSAP
    if (!titleRef.current || !responseRef.current || !inputContainerRef.current) return;

    const tl = gsap.timeline();

    tl.fromTo(titleRef.current,
      { opacity: 0, y: -50 },
      { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
    )
      .fromTo(responseRef.current,
        { opacity: 0, scale: 0.9, x: 50 },
        { opacity: 1, scale: 1, x: 0, duration: 0.8, ease: "back.out(1.7)" },
        "-=0.5"
      )
      .fromTo(inputContainerRef.current,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
        "-=0.6"
      );
  }, []);

  const handleSend = async (e, forceText = null) => {
    if (e && e.preventDefault) e.preventDefault();

    const submittedText = forceText !== null ? forceText : inputText;
    if (!submittedText.trim()) return;

    unlockAudio(); // Unlock audio context on mobile immediately upon user action

    const userText = submittedText;
    setInputText("");
    transcriptRef.current = "";
    setIsThinking(true);
    setRobotEmotion('thinking');
    setResponse(""); // Clear for new text
    setTranslationData(null); // Hide translation while thinking/typing

    try {
      // Call Llama 3.3 via Groq for ultra fast responses
      const generatedText = await chatWithAI(userText, chatHistory.current, isKoreanMode);

      let parsedData;
      try {
        parsedData = JSON.parse(generatedText);
      } catch {
        parsedData = { response: generatedText, sub_translation: "", vocab_notes: [] };
      }

      // Save to fake history
      chatHistory.current.push({ role: "user", content: userText });
      chatHistory.current.push({ role: "assistant", content: parsedData.response });

      setIsThinking(false);

      // Determine emotion based on intent/words
      if (/excellent|great|good|perfect|정답|좋아요|최고|완벽/.test((parsedData.sub_translation || "").toLowerCase() + (parsedData.response || "").toLowerCase())) {
        setRobotEmotion('heart');
      } else {
        setRobotEmotion('default');
      }

      typeResponse(parsedData);

      // Auto-play TTS syncing with response
      speak(parsedData.response, isKoreanMode);

    } catch (error) {
      console.error(error);
      setIsThinking(false);
      typeResponse("My circuits are a bit scrambled! Could you check your API Key and try again?");
    }
  };

  const typeResponse = (parsedData) => {
    setIsTalking(true);
    let currentText = "";
    let i = 0;
    const text = typeof parsedData === "string" ? parsedData : parsedData.response;

    // Simple typewriter effect to sync with pulses
    const interval = setInterval(() => {
      currentText += text.charAt(i);
      setResponse(currentText);
      i++;
      if (i >= text.length) {
        clearInterval(interval);

        if (typeof parsedData !== "string") {
          // Typewriter effect for translation
          let subText = "";
          let subIdx = 0;
          const targetSubText = parsedData.sub_translation || "";
          setTranslationData({ ...parsedData, sub_translation: "" });

          const subInterval = setInterval(() => {
            subText += targetSubText.charAt(subIdx);
            setTranslationData(prev => ({ ...prev, sub_translation: subText }));
            subIdx++;
            if (subIdx >= targetSubText.length) {
              clearInterval(subInterval);
              setTimeout(() => setIsTalking(false), 500); // Stop talking after UI translation finishes
            }
          }, 30);
        } else {
          setTimeout(() => setIsTalking(false), 500); // Stop talking after a short delay
        }
      }
    }, 40); // Speed of typing determines speed of talking
  };

  // 3. User Input via STT (Hold to Speak)
  const startRecording = () => {
    unlockAudio(); // Unlock audio context on mobile immediately upon user action
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('음성 인식을 지원하지 않는 브라우저(카카오톡 등)입니다. 키보드를 사용해 주세요.');
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!recognitionRef.current) {
        recognitionRef.current = new SpeechRecognition();
      }
      const recognition = recognitionRef.current;

      recognition.continuous = true; // Keep listening while holding
      recognition.interimResults = true;
      recognition.lang = isKoreanMode ? 'ko-KR' : 'en-US';

      recognition.onstart = () => {
        isRecording.current = true;
        setIsRecordingState(true);
        setInputText("듣는 중... (말씀해 주세요)"); // Feedback to user
        stop(); // Stop any bot speech if user interrupts
      };

      let finalTranscript = '';
      recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        // Show what they are saying in real time
        const fullTranscript = finalTranscript + interimTranscript;
        setInputText(fullTranscript);
        transcriptRef.current = fullTranscript;
      };

      recognition.onerror = (event) => {
        console.error(event.error);
        isRecording.current = false;
        setIsRecordingState(false);
      };

      recognition.onend = () => {
        isRecording.current = false;
        setIsRecordingState(false);
        // Auto-send when they let go
        if (inputContainerRef.current) {
          setHasInteracted(true); // Ensure they are marked interacted

          // Use the transcriptRef instead of the stale inputText closure state
          if (transcriptRef.current.trim() !== '') {
            handleSend(null, transcriptRef.current);
          } else {
            setInputText("");
          }
        }
      };

      try {
        recognition.start();
      } catch (err) {
        console.warn("Recognition start error:", err);
      }
    } catch (err) {
      console.error("Speech Recognition setup error:", err);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording.current) {
      recognitionRef.current.stop();
      isRecording.current = false;
      setIsRecordingState(false);
    }
  };

  const toggleRecording = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isRecording.current) {
      stopRecording();
    } else {
      transcriptRef.current = ""; // Reset transcript before new recording
      startRecording();
    }
  };

  const handleEnterExperience = () => {
    unlockAudio(); // MUST BE CALLED IMMEDIATELY IN ONCLICK
    setHasInteracted(true);

    // Set initial greeting
    setResponse("안녕하세요, OBG AI 어시스턴트입니다. 어떤 대화를 나누고 싶으신가요?");
    setTranslationData({
      sub_translation: "Hello! I'm the OBG AI Assistant. What would you like to talk about today?",
      vocab_notes: []
    });

    // Trigger the speech manually once
    // Must be directly inside the click handler to count as user interaction in WebViews
    speak("안녕하세요, OBG AI 어시스턴트입니다. 어떤 대화를 나누고 싶으신가요?", true);
    setIsTalking(true);
    setTimeout(() => setIsTalking(false), 3000);
  };

  return (
    <div className={`relative w-screen h-[100dvh] bg-transparent overflow-hidden font-sans text-white transition-all duration-300 ${isTalking ? 'bg-global-pulse' : ''}`}>

      {/* Welcome Overlay to FORCE user interaction to bypass mobile browser limits */}
      {!hasInteracted && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-xl transition-opacity duration-500">
          <div className="flex flex-col items-center p-8 bg-slate-900 border border-teal-500/30 rounded-3xl shadow-2xl text-center max-w-sm">
            <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <Music className="w-8 h-8 text-teal-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">OBG AI 어시스턴트</h1>
            <p className="text-slate-400 mb-8 text-sm">로봇이 대답을 들려드립니다. 카카오톡 인앱 브라우저 등의 설정 해제를 위해 아래 버튼을 눌러 시작해 주세요.</p>
            <button
              onClick={handleEnterExperience}
              className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold rounded-xl transition-all shadow-[0_4px_20px_rgba(45,212,191,0.4)] active:scale-95 text-lg"
            >
              채팅 시작하기
            </button>
          </div>
        </div>
      )}

      {/* 3D Canvas */}
      <div className="absolute inset-0 z-0 opacity-100 transition-opacity duration-1000">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0.5, 6]} fov={45} />
          <Suspense fallback={null}>
            {/* <Environment preset="studio" /> */}
            <DataStreamBackground isSpeaking={isTalking || isSpeaking} />

            <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5} position={[0, 0.85, 0]}>
              <Robot
                isThinking={isThinking}
                isTalking={isTalking || isSpeaking}
                hover={hoverUI}
                emotion={robotEmotion}
              />
            </Float>

            <SummoningCircle isThinking={isThinking} isSpeaking={isTalking || isSpeaking} />
            <ContactShadows position={[0, -1.05, 0]} opacity={0.6} scale={10} blur={2} far={4} color="#9df9d9" />
          </Suspense>

          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} color="#9df9d9" />
          <directionalLight position={[-10, 10, -5]} intensity={0.5} color="#ffffff" />
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 sm:p-8" ref={uiContainerRef}>

        {/* Header - Minimalist OBG Logo */}
        <header ref={titleRef} className="flex items-center justify-between pointer-events-auto w-full">
          <button
            onClick={() => setShowPopup(true)}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] bg-slate-900/60 border border-teal-400/40 backdrop-blur-2xl flex items-center justify-center animate-club cursor-pointer relative group flex-shrink-0"
            title="OBG AI System Info"
          >
            <span className="text-teal-400 font-digital text-glitch text-2xl sm:text-3xl mt-1 tracking-widest text-shadow-glow">OBG</span>
            <div className="absolute inset-0 rounded-[1.5rem] bg-teal-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_30px_rgba(45,212,191,0.2)]" />
          </button>

          <button
            onClick={toggleMode}
            className="flex items-center space-x-2 bg-slate-900/80 border border-teal-400/40 backdrop-blur-2xl text-teal-400 px-3 py-2 sm:px-5 sm:py-3 rounded-full hover:bg-teal-400/20 transition-all font-bold shadow-[0_0_15px_rgba(45,212,191,0.3)] active:scale-95 text-xs sm:text-base ml-2"
          >
            <Globe className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="whitespace-nowrap">{isKoreanMode ? 'ENG / 변경' : 'KOR / Switch'}</span>
          </button>
        </header>

        {/* AI Rapper Speech Bubble */}
        <div className="hidden sm:flex flex-1 items-center justify-end w-full sm:max-w-[65%] mx-auto mt-0 pointer-events-none">
          <div
            ref={responseRef}
            className={`w-full max-w-md ml-auto mt-auto mb-10 sm:mb-32 pointer-events-auto backdrop-blur-3xl border border-teal-500/50 p-5 sm:p-7 rounded-3xl relative transition-all duration-500 shadow-2xl ${isTalking
              ? 'bg-gradient-to-br from-teal-950/80 to-slate-900/95 shadow-[0_0_50px_rgba(45,212,191,0.5),inset_0_0_20px_rgba(45,212,191,0.2)] border-teal-400'
              : 'bg-gradient-to-br from-slate-900/90 to-slate-950/95 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_20px_rgba(45,212,191,0.15)] border-teal-500/30'
              }`}
            onMouseEnter={() => setHoverUI(true)}
            onMouseLeave={() => setHoverUI(false)}
          >
            {/* Cyberpunk Decorative Corners */}
            <div className="absolute -top-[1px] -left-[1px] w-8 h-8 border-t-2 border-l-2 border-teal-300 rounded-tl-3xl opacity-70"></div>
            <div className="absolute -bottom-[1px] -right-[1px] w-8 h-8 border-b-2 border-r-2 border-teal-300 rounded-br-3xl opacity-70"></div>

            {/* Background Texture for distinctness */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] rounded-3xl pointer-events-none mix-blend-overlay"></div>

            {/* Connection line to robot (visual only) */}
            <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-teal-400 animate-pulse shadow-[0_0_20px_rgba(157,249,217,1)] border-2 border-slate-900 z-10" />

            <div className="flex items-center space-x-3 mb-4 relative z-10">
              <div className="p-1.5 bg-teal-500/20 rounded-lg shadow-[inset_0_0_10px_rgba(45,212,191,0.3)]">
                <Music className="w-4 h-4 text-teal-300" />
              </div>
              <span className="text-xs font-black text-teal-300 uppercase tracking-widest drop-shadow-md">
                {isKoreanMode ? '한국어 대화 모드' : 'English Conversation Mode'}
              </span>
            </div>

            <div className="min-h-[80px] flex flex-col justify-start">
              {isThinking && !response ? (
                <div className="flex space-x-2 items-center h-full text-slate-400 font-mono text-sm py-4">
                  <Sparkles className="w-4 h-4 animate-spin-slow" />
                  <span>{isKoreanMode ? '생각 중...' : 'Thinking...'}</span>
                </div>
              ) : (
                <div className="flex flex-col space-y-4 max-h-[40vh] sm:max-h-full overflow-y-auto pr-2 custom-scrollbar">
                  <p className="text-base sm:text-lg leading-relaxed text-slate-100 font-medium z-20 font-bold">
                    {response}
                    {isTalking && <span className="inline-block w-2 h-4 ml-1 bg-teal-400 animate-pulse" />}
                  </p>

                  {/* Sub Translation box (Fade in when ready) */}
                  {translationData && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-700 relative z-10 mt-2">
                      <div className="bg-slate-950/80 rounded-xl p-4 border border-teal-500/20 relative overflow-hidden shadow-inner">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-400 to-transparent"></div>
                        <p className="text-[13.5px] text-teal-50/80 ml-2 font-medium leading-relaxed">
                          {translationData.sub_translation}
                        </p>
                      </div>

                      {/* Vocab Notes */}
                      {translationData.vocab_notes && translationData.vocab_notes.length > 0 && (
                        <div className="mt-3 bg-slate-950/50 rounded-lg p-3 border border-slate-800/80">
                          <p className="text-xs font-bold text-slate-500 mb-2 tracking-wider">핵심 단어장</p>
                          <ul className="space-y-1">
                            {translationData.vocab_notes.map((vocab, idx) => (
                              <li key={idx} className="text-xs text-slate-400 flex items-start">
                                <span className="text-teal-400 font-medium mr-2">✦</span>
                                <div>
                                  <span className="font-bold text-slate-200">{vocab.word}</span>
                                  <span className="mx-1 text-slate-600">-</span>
                                  <span>{vocab.meaning}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Area: Input + Audio Visualizer */}
        <div className="w-full max-w-2xl mx-auto pointer-events-auto pb-6 sm:pb-36 relative z-20">

          {/* Spectral Waveform Placeholder (Top of Input Bar) */}
          <div className="flex justify-center items-end space-x-1 h-6 mb-2 opacity-80" aria-hidden="true">
            {[...Array(10)].map((_, idx) => (
              <div
                key={idx}
                className={`w-1 bg-teal-400 rounded-t-full ${isTalking ? 'waveform-bar' : 'h-1'}`}
                style={{ animationDelay: `${idx * 0.1}s`, opacity: isTalking ? 0.8 : 0.2 }}
              />
            ))}
          </div>
          <form
            ref={inputContainerRef}
            onSubmit={handleSend}
            className="relative flex items-center bg-slate-900/80 backdrop-blur-3xl border-2 border-teal-400/40 rounded-full p-2 shadow-[0_0_30px_rgba(45,212,191,0.3),inset_0_0_15px_rgba(45,212,191,0.1)] focus-within:border-teal-400 focus-within:bg-slate-800/90 focus-within:shadow-[0_0_50px_rgba(45,212,191,0.5)] transition-all duration-300 text-sm"
            onMouseEnter={() => setHoverUI(true)}
            onMouseLeave={() => setHoverUI(false)}
          >
            {/* STT Microphone Button */}
            <button
              type="button"
              onMouseDown={!isTouchDevice ? startRecording : undefined}
              onMouseUp={!isTouchDevice ? stopRecording : undefined}
              onMouseLeave={!isTouchDevice ? stopRecording : undefined}
              onClick={isTouchDevice ? toggleRecording : undefined}
              className={`ml-1 mr-2 p-3 rounded-full transition-all ${isRecordingState ? 'bg-red-500/20 text-red-500 animate-pulse scale-105 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-teal-500/10 text-teal-300 hover:text-white hover:bg-teal-500/30 hover:shadow-[0_0_15px_rgba(45,212,191,0.4)]'} select-none`}
              title={isKoreanMode ? (isTouchDevice ? "마이크 켜기/끄기" : "마이크 꾹 누르기") : (isTouchDevice ? "Toggle Microphone" : "Hold to speak")}
              disabled={isThinking || isTalking}
            >
              <Mic className="w-5 h-5 pointer-events-none drop-shadow-md" />
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isKoreanMode ? "메시지를 입력하거나 마이크를 꾹 눌러보세요..." : "Type a message or hold the microphone..."}
              className="flex-1 bg-transparent border-none text-white px-3 py-2 focus:outline-none placeholder-teal-100/40 font-bold tracking-wide text-base"
              disabled={isThinking || isTalking}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isThinking || isTalking}
              className="bg-teal-500 hover:bg-teal-400 text-slate-900 p-3 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 mr-1 shadow-[0_0_15px_rgba(45,212,191,0.4)]"
            >
              <Send className="w-5 h-5 -ml-0.5 mt-0.5" />
            </button>
          </form>
          {!import.meta.env.VITE_GROQ_API_KEY && (
            <div className="mt-3 text-center text-[10px] text-red-500/70 font-mono tracking-widest mb-4">
              경고: .env 파일에 VITE_GROQ_API_KEY 설정이 없습니다.
            </div>
          )}
        </div>

        {/* AI Blessing Popup */}
        {showPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-auto">
            <div
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500"
              onClick={() => setShowPopup(false)}
            />
            <div className="relative w-full max-w-lg bg-slate-900 border-2 border-teal-400/50 rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(45,212,191,0.3)] animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
              {/* Decorative Glows */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-teal-500/20 blur-[80px]" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-teal-500/20 blur-[80px]" />

              <div className="p-10 flex flex-col items-center text-center relative z-10">
                <div className="w-20 h-20 bg-teal-500/10 rounded-3xl flex items-center justify-center mb-8 shadow-[inset_0_0_20px_rgba(45,212,191,0.2)] border border-teal-400/30">
                  <Sparkles className="w-10 h-10 text-teal-400 animate-pulse" />
                </div>

                <h2 className="text-3xl font-black text-white mb-4 tracking-tighter uppercase italic">
                  OBG AI System Message
                </h2>

                <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-teal-400/40 to-transparent mb-8" />

                <p className="text-2xl font-bold text-teal-300 leading-snug drop-shadow-[0_2px_10px_rgba(45,212,191,0.5)]">
                  "부자 되시고 항상 행복하세요!"
                </p>
                <p className="mt-4 text-slate-400 font-medium">
                  May you achieve great wealth <br /> and everlasting happiness.
                </p>

                <div className="mt-10 flex space-x-4 w-full">
                  <button
                    onClick={() => setShowPopup(false)}
                    className="flex-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black py-4 rounded-2xl transition-all shadow-[0_4px_20px_rgba(45,212,191,0.4)] active:scale-95"
                  >
                    SYSTEM ACKNOWLEDGED
                  </button>
                </div>
              </div>

              {/* Scanning Line Animation */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-teal-400/50 shadow-[0_0_15px_rgba(45,212,191,1)] animate-scan" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
