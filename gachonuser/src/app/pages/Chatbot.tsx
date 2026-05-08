import { useState, useRef, useEffect, memo, useCallback } from "react";
import BottomNav from "../components/BottomNav";
import { ChevronDown, ChevronUp } from "lucide-react";
import api from "../api/axios"; // axios 인스턴스

import iconShortcut  from "../icons/Togo.svg";
import iconLogo      from "../icons/GAONI.svg";
import iconLike      from "../icons/Like.svg";
import iconLikeBlue  from "../icons/LikeBlue.svg";
import iconDislike   from "../icons/Dislike.svg";
import iconDislikeRed from "../icons/DislikeRed.svg";

// ─── 타입 정의 ─────────────────────────────────────────────

type FeedbackStatus = "like" | "dislike" | null;

interface Message {
  id: string;
  chatLogId?: number; // API 응답에서 받은 로그 ID
  text: string;
  sender: "user" | "bot";
  timestamp: string;
  isInitial?: boolean;
  feedbackStatus?: FeedbackStatus;
  feedbackText?: string;
  isFeedbackOpen?: boolean;
  isFeedbackSubmitted?: boolean;
}

interface ApiResponse {
  data: {
    chatLogId: number;
    sessionId: string;
    answer: string;
    answerStatus: string;
    responseTime: number;
  } | null;
  code: number;
  message: string;
}

// ─── 상수 및 유틸리티 ────────────────────────────────────────

const SUGGESTED_QUESTIONS: readonly string[] = [
  "입실 시간이 언제인가요?",
  "세탁실 이용 방법을 알려주세요",
  "식당 운영 시간이 궁금해요",
  "외박 신청은 어떻게 하나요?",
];

const formatTime = () =>
  new Date().toLocaleTimeString("ko-KR", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

// 세션 ID 생성 및 관리 (비로그인용)
const getOrGenerateSessionId = () => {
  let sid = sessionStorage.getItem("chat_sessionId");
  if (!sid) {
    sid = `guest_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem("chat_sessionId", sid);
  }
  return sid;
};

// ─── 서브 컴포넌트 ─────────────────────────────────────────

const BotAvatar = memo(() => (
  <div className="mt-0.5 flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-transparent">
    <img src={iconLogo} className="h-full w-full scale-[0.9] object-contain" alt="가온이" />
  </div>
));

const TypingIndicator = memo(() => (
  <div className="flex items-start gap-2.5">
    <BotAvatar />
    <div className="flex w-fit space-x-1.5 rounded-[18px] rounded-tl-none border border-[#eef6f7] bg-white px-5 py-4 shadow-md">
      {["-0.3s", "-0.15s", "0s"].map(delay => (
        <div key={delay} style={{ animationDelay: delay }} className="size-1.5 animate-bounce rounded-full bg-[#5eb9ca]" />
      ))}
    </div>
  </div>
));

const FeedbackSection = memo(({ 
  msg, onFeedbackClick, onFeedbackTextChange, onFeedbackSubmit 
}: { 
  msg: Message, 
  onFeedbackClick: (id: string, status: FeedbackStatus) => void,
  onFeedbackTextChange: (id: string, text: string) => void,
  onFeedbackSubmit: (id: string) => void
}) => {
  if (msg.isFeedbackSubmitted) {
    return (
      <div className="ml-1 mt-1 flex animate-in fade-in slide-in-from-left-2 items-center gap-2 text-[11px] font-bold text-[#5eb9ca]">
        <img src={msg.feedbackStatus === "like" ? iconLikeBlue : iconDislikeRed} alt="피드백" className="size-5 opacity-90" />
        <span>소중한 의견이 전달되었어요!</span>
      </div>
    );
  }

  return (
    <div onClick={e => e.stopPropagation()}>
      <div className="ml-1 flex gap-2">
        <button onClick={() => onFeedbackClick(msg.id, "like")} className="p-1 transition-transform active:scale-90">
          <img src={msg.feedbackStatus === "like" ? iconLikeBlue : iconLike} alt="좋아요" className="size-5" />
        </button>
        <button onClick={() => onFeedbackClick(msg.id, "dislike")} className="p-1 transition-transform active:scale-90">
          <img src={msg.feedbackStatus === "dislike" ? iconDislikeRed : iconDislike} alt="싫어요" className="size-5" />
        </button>
      </div>
      {msg.isFeedbackOpen && (
        <div className="mt-3 w-full animate-in fade-in zoom-in-95 rounded-[22px] border border-[#e2eef1] bg-[#f0f7f9] p-5 shadow-xl">
          <div className="rounded-[16px] border border-[#e2eef1] bg-white p-3.5 shadow-sm">
            <textarea
              value={msg.feedbackText ?? ""}
              onChange={e => onFeedbackTextChange(msg.id, e.target.value)}
              placeholder="답변에 대한 피드백을 남겨주세요"
              className="h-20 w-full resize-none border-none bg-transparent text-[14px] font-medium text-[#3e5b6a] outline-none placeholder:text-[#adb5bd]"
            />
          </div>
          <button onClick={() => onFeedbackSubmit(msg.id)} className="mt-4 w-full rounded-[16px] bg-[#5eb9ca] py-3.5 text-[14px] font-bold text-white shadow-lg transition-all active:scale-[0.97]">
            피드백 보내기
          </button>
        </div>
      )}
    </div>
  );
});

// ─── 메인 컴포넌트 ─────────────────────────────────────────

export default function Chatbot() {
  const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSuggestOpen, setIsSuggestOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 초기 메시지 및 기록 복구
  useEffect(() => {
    const initialMsg: Message = {
      id: "initial",
      text: isLoggedIn
        ? "안녕하세요! 가온이입니다. 무엇을 도와드릴까요?"
        : "안녕하세요! 가온이입니다.\n(비로그인 상태로 이용 중이며 대화 기록은 저장되지 않습니다.)",
      sender: "bot",
      timestamp: formatTime(),
      isInitial: true,
    };

    if (isLoggedIn) {
      const saved = localStorage.getItem("chat_history");
      setMessages(saved ? JSON.parse(saved) : [initialMsg]);
    } else {
      setMessages([initialMsg]);
    }
  }, [isLoggedIn]);

  // 스크롤 자동 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleContainerClick = useCallback(() => {
    setMessages(prev => prev.map(msg => 
      msg.isFeedbackOpen && !msg.isFeedbackSubmitted ? { ...msg, isFeedbackOpen: false, feedbackStatus: null } : msg
    ));
  }, []);

  const handleFeedbackClick = useCallback((id: string, status: FeedbackStatus) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id !== id) return msg;
      const isToggle = msg.feedbackStatus === status && msg.isFeedbackOpen;
      return isToggle ? { ...msg, feedbackStatus: null, isFeedbackOpen: false } : { ...msg, feedbackStatus: status, isFeedbackOpen: true };
    }));
  }, []);

  const handleFeedbackTextChange = useCallback((id: string, text: string) => {
    setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, feedbackText: text } : msg));
  }, []);

  const handleFeedbackSubmit = useCallback(async (id: string) => {
    const targetMsg = messages.find(m => m.id === id);
    if (!targetMsg) return;

    try {
      // TODO: 명세서에는 없지만 피드백 API가 있다면 여기서 호출
      // await api.post("/chatbot/feedback", { chatLogId: targetMsg.chatLogId, status: targetMsg.feedbackStatus, comment: targetMsg.feedbackText });
      
      setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, isFeedbackOpen: false, isFeedbackSubmitted: true } : msg));
    } catch (error) {
      console.error("Feedback error:", error);
    }
  }, [messages]);

  // 메시지 전송 로직 (API 연동)
  const handleSend = useCallback(async (text?: string) => {
    const textToSend = (text ?? inputValue).trim();
    if (!textToSend || isTyping) return;

    const userMsg: Message = { id: Date.now().toString(), text: textToSend, sender: "user", timestamp: formatTime() };
    
    setMessages(prev => {
      const updated = [...prev, userMsg];
      if (isLoggedIn) localStorage.setItem("chat_history", JSON.stringify(updated));
      return updated;
    });

    setInputValue("");
    setIsTyping(true);

    try {
      const response = await api.post<ApiResponse>("/chatbot/questions", {
        question: textToSend,
        sessionId: getOrGenerateSessionId()
      });

      if (response.data.code === 200 && response.data.data) {
        const result = response.data.data;
        
        // 새로운 세션 ID가 오면 업데이트
        if (result.sessionId) sessionStorage.setItem("chat_sessionId", result.sessionId);

        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          chatLogId: result.chatLogId,
          text: result.answer,
          sender: "bot",
          timestamp: formatTime(),
          feedbackStatus: null,
          isFeedbackOpen: false,
          isFeedbackSubmitted: false,
        };

        setMessages(prev => {
          const updated = [...prev, botMsg];
          if (isLoggedIn) localStorage.setItem("chat_history", JSON.stringify(updated));
          return updated;
        });
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        text: error.response?.data?.message || "죄송합니다. 서버와 통신 중 오류가 발생했습니다.",
        sender: "bot",
        timestamp: formatTime(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, isTyping, isLoggedIn]);

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[448px] flex-col overflow-x-hidden bg-[#f0f9ff] shadow-2xl" onClick={handleContainerClick}>
      {/* 헤더 */}
      <div className="z-10 shrink-0 px-7 pb-6 pt-16 bg-[#f0f9ff]">
        <h1 className="text-[28px] font-bold tracking-tight text-[#054a57]">챗봇</h1>
        <p className="mt-1 text-[13px] font-bold tracking-tight text-[#607d8b]">기숙사 관련 질문을 해보세요</p>
      </div>

      {/* 메시지 리스트 */}
      <div className={`flex-1 space-y-8 overflow-y-auto px-6 py-4 transition-all ${isSuggestOpen ? "pb-[320px]" : "pb-52"}`}>
        {messages.map(msg => (
          <div key={msg.id} className={`flex items-start gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`} onClick={e => e.stopPropagation()}>
            {msg.sender === "bot" && <BotAvatar />}
            <div className={`flex max-w-[75%] flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
              <div className={`flex items-end gap-2 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`rounded-[18px] px-5 py-4 text-[14.5px] font-semibold leading-[1.65] shadow-md whitespace-pre-wrap border ${
                  msg.sender === "user" ? "rounded-tr-none border-transparent bg-[#5eb9ca] text-white shadow-[#5eb9ca]/20" : "rounded-tl-none border-[#eef6f7] bg-white text-[#3e5b6a]"
                }`}>
                  {msg.text}
                </div>
                <span className="mb-1 shrink-0 text-[10px] font-bold text-[#adb5bd]">{msg.timestamp}</span>
              </div>
              {msg.sender === "bot" && !msg.isInitial && (
                <div className="mt-2 w-full">
                  <FeedbackSection msg={msg} onFeedbackClick={handleFeedbackClick} onFeedbackTextChange={handleFeedbackTextChange} onFeedbackSubmit={handleFeedbackSubmit} />
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* 하단 입력 UI */}
      <div className="fixed bottom-[90px] z-20 w-full max-w-[448px] border-t border-[#eef6f7] bg-white/90 pt-5 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] backdrop-blur-xl">
        <div className="relative z-10 px-6">
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="text-[11px] font-black uppercase tracking-wider text-[#b0bdc8]">추천 질문</p>
            <button onClick={() => setIsSuggestOpen(v => !v)} className="rounded-full p-1 text-[#b0bdc8] transition-colors hover:bg-[#f1f5f9]">
              {isSuggestOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
          <div className={`grid grid-cols-2 gap-2 overflow-hidden transition-all duration-300 ${isSuggestOpen ? "mb-2 max-h-[200px] opacity-100" : "mb-0 max-h-0 opacity-0"}`}>
            {SUGGESTED_QUESTIONS.map(q => (
              <button key={q} onClick={() => handleSend(q)} className="min-h-[35px] w-full rounded-[18px] border border-[#eef6f7] bg-white px-3 py-2.5 shadow-sm active:scale-95">
                <span className="break-keep text-center text-[11.5px] font-extrabold leading-[1.3] text-[#5a7685]">{q}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-3 px-6 pb-5 pt-2">
          <input
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); handleSend(); } }}
            placeholder="메시지를 입력하세요..."
            className="flex-1 rounded-[22px] border border-transparent bg-[#f1f5f9] px-5 py-3.5 text-[14.5px] font-bold text-[#3e5b6a] outline-none transition-all focus:border-[#5eb9ca]/30 focus:bg-white"
          />
          <button onClick={() => handleSend()} className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#5eb9ca] shadow-lg active:scale-90 transition-all">
            <img src={iconShortcut} alt="전송" className="size-5 brightness-0 invert" />
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}