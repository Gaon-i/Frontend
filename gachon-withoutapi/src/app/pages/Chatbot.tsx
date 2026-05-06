import { useState, useRef, useEffect } from "react";
import BottomNav from "../components/BottomNav";
import { ChevronDown, ChevronUp } from "lucide-react";
import iconShortcut from "../icons/arrow.svg";
import iconLike from "../icons/like.svg";
import iconLikeSelected from "../icons/like_select.svg";
import iconDislike from "../icons/dislike.svg";
import iconDislikeSelected from "../icons/dislike_select.svg";
import iconGaonLogo from "../icons/gaon-logo.svg";

// API 파일 대신 직접 목업 응답 로직 사용
interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: string;
}

type FeedbackRating = "like" | "dislike";

interface FeedbackState {
  rating: FeedbackRating;
  comment: string;
  isFormOpen: boolean;
  isSubmitted: boolean;
}

const TypingIndicator = () => (
  <div className="flex space-x-1.5 px-5 py-4 bg-white rounded-[18px] rounded-tl-none shadow-md border border-[#eef6f7] w-fit">
    <div className="w-1.5 h-1.5 bg-[#5eb9ca] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-1.5 h-1.5 bg-[#5eb9ca] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-1.5 h-1.5 bg-[#5eb9ca] rounded-full animate-bounce"></div>
  </div>
);

const suggestedQuestions = ["입실 시간이 언제인가요?", "세탁실 이용 방법을 알려주세요", "식당 운영 시간이 궁금해요", "외박 신청은 어떻게 하나요?"];

export default function Chatbot() {
  // [수정] 로그인 상태 체크 함수 (sessionStorage 기준)
  const getIsLoggedIn = () => {
    return sessionStorage.getItem("isLoggedIn") === "true";
  };

  const initialBotMessage: Message = {
    id: "1", 
    text: "안녕하세요! 가천대 기숙사 생활 지원 AI 가온이입니다.\n무엇을 도와드릴까요?", 
    sender: "bot", 
    timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true })
  };

  // [수정] 초기 메시지 설정 로직
  const [messages, setMessages] = useState<Message[]>(() => {
    // 로그인 상태일 때만 로컬 스토리지에서 이전 기록을 불러옴
    if (getIsLoggedIn()) {
      const saved = localStorage.getItem("chat_messages_mock");
      return saved ? JSON.parse(saved) : [initialBotMessage];
    }
    // 비로그인 상태면 기록을 무시하고 초기 메시지만 보여줌
    return [initialBotMessage];
  });

  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSuggestOpen, setIsSuggestOpen] = useState(true);
  const [feedbacks, setFeedbacks] = useState<Record<string, FeedbackState>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // [추가] 컴포넌트 진입 시 비로그인 상태라면 즉시 기록 삭제 및 초기화
  useEffect(() => {
    if (!getIsLoggedIn()) {
      localStorage.removeItem("chat_messages_mock");
      setMessages([initialBotMessage]);
    }
  }, []);

  // [수정] 메시지가 변경될 때마다 로그인 상태를 확인하여 저장 여부 결정
  useEffect(() => {
    if (getIsLoggedIn()) {
      localStorage.setItem("chat_messages_mock", JSON.stringify(messages));
    } else {
      // 비로그인 상태에서 혹시라도 저장되는 것을 방지
      localStorage.removeItem("chat_messages_mock");
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 300);
    return () => clearTimeout(timer);
  }, [messages, isTyping, isSuggestOpen]);

  const handleSend = async (text?: string) => {
    const textToSend = text || inputValue;
    if (!textToSend.trim() || isTyping) return;

    const now = new Date();
    const timestamp = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });

    setMessages(prev => [...prev, { id: Date.now().toString(), text: textToSend, sender: "user", timestamp }]);
    setInputValue("");
    setIsTyping(true);

    setTimeout(() => {
      let botAnswer = "질문에 대한 답변을 준비 중입니다. 현재는 테스트 모드로 작동하고 있습니다.";

      if (textToSend.includes("입실 시간")) botAnswer = "기숙사 공식 입실 시간은 보통 오후 3시부터이며, 상세 일정은 공지사항을 확인해 주세요.";
      else if (textToSend.includes("세탁실")) botAnswer = "세탁실은 각 층 또는 지하에 위치해 있으며, 전용 카드를 충전하여 이용 가능합니다.";
      else if (textToSend.includes("식당")) botAnswer = "학생식당 운영 시간은 평일 조식 08:00~09:30, 중식 11:30~13:30, 석식 17:30~19:00입니다.";
      else if (textToSend.includes("외박")) botAnswer = "외박 신청은 가천대 기숙사 홈페이지나 앱을 통해 전일 23:59까지 신청하셔야 합니다.";

      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        text: botAnswer, 
        sender: "bot", 
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true })
      }]);
      setIsTyping(false);
    }, 1000);
  };

  const handleFeedbackSelect = (messageId: string, rating: FeedbackRating) => {
    setFeedbacks(prev => {
      const current = prev[messageId];
      if (current?.isSubmitted) return prev;

      const isRatingChanged = current?.rating && current.rating !== rating;

      return {
        ...prev,
        [messageId]: {
          rating,
          comment: isRatingChanged ? "" : current?.comment ?? "",
          isFormOpen: true,
          isSubmitted: false
        }
      };
    });
  };

  const handleFeedbackCommentChange = (messageId: string, comment: string) => {
    setFeedbacks(prev => {
      const current = prev[messageId];
      if (!current) return prev;

      return {
        ...prev,
        [messageId]: {
          ...current,
          comment
        }
      };
    });
  };

  const handleFeedbackSubmit = (messageId: string) => {
    setFeedbacks(prev => {
      const current = prev[messageId];
      if (!current || !current.comment.trim()) return prev;

      return {
        ...prev,
        [messageId]: {
          ...current,
          isFormOpen: false,
          isSubmitted: true
        }
      };
    });
  };

  const closeOpenFeedbackForms = () => {
    setFeedbacks(prev => {
      let hasOpenForm = false;
      const next = Object.fromEntries(
        Object.entries(prev).flatMap(([messageId, feedback]) => {
          if (!feedback.isFormOpen) return [[messageId, feedback]];

          hasOpenForm = true;
          if (!feedback.isSubmitted) return [];

          return [[messageId, { ...feedback, isFormOpen: false }]];
        })
      );

      return hasOpenForm ? next : prev;
    });
  };

  return (
    <div className="bg-[#f6fbff] min-h-screen w-full max-w-[448px] mx-auto relative shadow-2xl flex flex-col overflow-x-hidden">
      {/* 헤더 */}
      <div className="pt-16 px-7 pb-6 bg-[#f6fbff] shrink-0 z-10">
        <h1 className="font-bold text-[28px] text-[#054a57] tracking-tight">챗봇</h1>
        <p className="text-[#607d8b] text-[13px] font-bold mt-1 tracking-tight">기숙사 관련 질문을 해보세요</p>
      </div>

      {/* 채팅 메시지 영역 */}
      <div onClick={closeOpenFeedbackForms} className="flex-1 px-6 py-4 space-y-8 overflow-y-auto overflow-x-hidden bg-transparent">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
            <div className={`flex ${msg.sender === "user" ? "justify-end" : "items-start gap-2.5"} w-full`}>
              {msg.sender === "bot" && (
                <img
                  src={iconGaonLogo}
                  alt="가온이"
                  className="mt-1 size-9 shrink-0 object-contain"
                />
              )}
              {msg.sender === "user" && (
                <span className="self-end mb-1 mr-2 text-[10px] font-semibold tracking-tight text-[#adb5bd]">
                  {msg.timestamp}
                </span>
              )}
              <div className={`relative max-w-[66%] px-5 py-4 rounded-[18px] flex flex-col shadow-md border 
                ${msg.sender === "user" 
                  ? "bg-[#5eb9ca] text-white rounded-tr-none border-transparent shadow-[#5eb9ca]/20" 
                  : "bg-white text-[#3e5b6a] rounded-tl-none border-[#eef6f7]"
                }`}>
                <span className="text-[15px] leading-[1.6] font-medium whitespace-pre-wrap tracking-tight">
                  {msg.text}
                </span>
              </div>
              {msg.sender === "bot" && (
                <span className="self-end mb-1 ml-2 text-[10px] font-semibold tracking-tight text-[#adb5bd]">
                  {msg.timestamp}
                </span>
              )}
            </div>
            {msg.sender === "bot" && (
              <div onClick={(e) => e.stopPropagation()} className="mt-2 ml-[46px] w-[66%] max-w-[66%]">
                <div className="flex items-center gap-0.5">
                  {(["like", "dislike"] as FeedbackRating[]).map((rating) => {
                    const feedback = feedbacks[msg.id];
                    const isSelected = feedback?.rating === rating;
                    const isLocked = feedback?.isSubmitted;
                    const label = rating === "like" ? "좋아요" : "싫어요";
                    const icon = rating === "like"
                      ? (isSelected ? iconLikeSelected : iconLike)
                      : (isSelected ? iconDislikeSelected : iconDislike);

                    return (
                      <button
                        key={rating}
                        type="button"
                        aria-label={label}
                        onClick={() => handleFeedbackSelect(msg.id, rating)}
                        disabled={isLocked}
                        className={`size-7 rounded-full flex items-center justify-center transition-all ${
                          isLocked ? "cursor-default" : "hover:bg-[#eef6f7] active:scale-95"
                        }`}
                      >
                        <img src={icon} alt="" className="size-[19px]" />
                      </button>
                    );
                  })}
                  {feedbacks[msg.id]?.isSubmitted && (
                    <span className="text-[11px] font-bold text-[#054A57] ml-1 animate-in fade-in slide-in-from-bottom-1 duration-300">
                      소중한 의견이 전달되었어요!
                    </span>
                  )}
                </div>

                {feedbacks[msg.id]?.isFormOpen && (
                  <div className="mt-2 p-3 bg-white border border-[#eef6f7] rounded-[16px] shadow-sm">
                    <textarea
                      value={feedbacks[msg.id]?.comment ?? ""}
                      onChange={(e) => handleFeedbackCommentChange(msg.id, e.target.value)}
                      placeholder="답변에 대한 피드백을 남겨주세요"
                      className="w-full min-h-[74px] resize-none bg-[#f8fbff] rounded-[12px] px-3 py-2 text-[12.5px] font-semibold text-[#3e5b6a] outline-none border border-transparent focus:bg-white focus:border-[#5eb9ca]/40 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleFeedbackSubmit(msg.id)}
                      disabled={!feedbacks[msg.id]?.comment.trim()}
                      className="mt-2 w-full h-10 bg-[#054A57] disabled:bg-[#d8e3e6] disabled:text-[#8aa2aa] text-white rounded-[12px] text-[12.5px] font-extrabold active:scale-[0.98] transition-all"
                    >
                      피드백 보내기
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex items-start gap-2.5">
            <img
              src={iconGaonLogo}
              alt="가온이"
              className="mt-1 size-9 shrink-0 object-contain"
            />
            <TypingIndicator />
          </div>
        )}
        <div style={{ height: isSuggestOpen ? "320px" : "210px" }} className="transition-all duration-300 pointer-events-none" ref={messagesEndRef} />
      </div>

      {/* 하단 인터페이스 */}
      <div className="fixed bottom-[90px] w-full max-w-[448px] bg-white/90 backdrop-blur-xl border-t border-[#eef6f7] z-20 pt-5 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        <div className="px-6 relative z-10">
          <div className="flex justify-between items-center mb-3 px-1">
            <p className="text-[11px] text-[#b0bdc8] font-black uppercase tracking-wider">추천 질문</p>
            <button onClick={() => setIsSuggestOpen(!isSuggestOpen)} className="p-1 hover:bg-[#f1f5f9] rounded-full transition-colors text-[#b0bdc8]">
              {isSuggestOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          </div>
          <div className={`grid grid-cols-2 gap-2 transition-all duration-300 ease-in-out ${isSuggestOpen ? "max-h-[200px] opacity-100 mb-2" : "max-h-0 opacity-0 mb-0"} overflow-visible`}>
            {suggestedQuestions.map((q, i) => (
              <button key={i} onClick={() => handleSend(q)} className="w-full relative px-3 py-2.5 bg-white border border-[#eef6f7] rounded-[18px] shadow-sm active:scale-95 transition-all min-h-[35px]">
                <span className="text-[11.5px] text-[#5a7685] font-bold text-center leading-[1.3] whitespace-normal break-keep">{q}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="px-6 pt-2 pb-5 flex gap-3 items-center relative z-10">
          <input 
            value={inputValue} 
            onChange={(e) => setInputValue(e.target.value)} 
            onKeyDown={(e) => e.key === "Enter" && handleSend()} 
            placeholder="메시지를 입력하세요..." 
            className="flex-1 bg-[#f1f5f9] rounded-[22px] px-5 py-3 outline-none text-[14.5px] font-medium text-[#3e5b6a] border border-transparent focus:bg-white focus:border-[#5eb9ca]/30 transition-all" 
          />
          <button onClick={() => handleSend()} className="size-[50px] bg-[#5eb9ca] rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all shrink-0">
            <img src={iconShortcut} alt="send" className="w-8 h-8 brightness-0 invert" />
          </button>
        </div>
      </div>

      {/* 하단 네비게이션에 로그인 상태 전달 */}
      <div className="fixed bottom-0 w-full max-w-[448px] z-50">
        {/* <BottomNav isLoggedIn={getIsLoggedIn()} /> */}
        <BottomNav />
      </div>
    </div>
  );
}
