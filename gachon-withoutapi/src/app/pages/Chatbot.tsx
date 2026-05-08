import { useState, useRef, useEffect, memo, useCallback } from "react";
import BottomNav from "../components/BottomNav";
import { ChevronDown, ChevronUp } from "lucide-react";
<<<<<<< HEAD
import iconShortcut  from "../icons/Togo.svg";
import iconLogo      from "../icons/GAONI.svg";
import iconLike      from "../icons/Like.svg";
import iconLikeBlue  from "../icons/LikeBlue.svg";
import iconDislike   from "../icons/Dislike.svg";
import iconDislikeRed from "../icons/DislikeRed.svg";

// ─── 타입 ─────────────────────────────────────────────────

type FeedbackStatus = "like" | "dislike" | null;
=======
import iconShortcut from "../icons/arrow.svg";
import iconLike from "../icons/like.svg";
import iconLikeSelected from "../icons/like_select.svg";
import iconDislike from "../icons/dislike.svg";
import iconDislikeSelected from "../icons/dislike_select.svg";
import iconGaonLogo from "../icons/gaon-logo.svg";
>>>>>>> 2f20c5a7bacd26848300aeb90cf88fcdfa09dec7

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: string;
  isInitial?: boolean;
  feedbackStatus?: FeedbackStatus;
  feedbackText?: string;         // 메시지별 피드백 텍스트
  isFeedbackOpen?: boolean;
  isFeedbackSubmitted?: boolean;
}

<<<<<<< HEAD
// ─── 상수 ─────────────────────────────────────────────────
=======
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
>>>>>>> 2f20c5a7bacd26848300aeb90cf88fcdfa09dec7

const SUGGESTED_QUESTIONS: readonly string[] = [
  "입실 시간이 언제인가요?",
  "세탁실 이용 방법을 알려주세요",
  "식당 운영 시간이 궁금해요",
  "외박 신청은 어떻게 하나요?",
];

const BOT_DELAY_MS = 1000;

const formatTime = () =>
  new Date().toLocaleTimeString("ko-KR", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

const makeId = () => Date.now().toString();

// ─── 서브 컴포넌트 ─────────────────────────────────────────

const BotAvatar = memo(() => (
  <div className="mt-0.5 flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-transparent">
    <img src={iconLogo} className="h-full w-full scale-[1.6] object-contain" alt="가온이" />
  </div>
));
BotAvatar.displayName = "BotAvatar";

const TypingIndicator = memo(() => (
  <div className="flex items-start gap-2.5">
    <BotAvatar />
    <div className="flex w-fit space-x-1.5 rounded-[18px] rounded-tl-none border border-[#eef6f7] bg-white px-5 py-4 shadow-md">
      {["-0.3s", "-0.15s", "0s"].map(delay => (
        <div
          key={delay}
          style={{ animationDelay: delay }}
          className="size-1.5 animate-bounce rounded-full bg-nav-accent"
        />
      ))}
    </div>
  </div>
));
TypingIndicator.displayName = "TypingIndicator";

// ─── FeedbackSection 서브 컴포넌트 ────────────────────────

interface FeedbackSectionProps {
  msg: Message;
  onFeedbackClick: (id: string, status: FeedbackStatus) => void;
  onFeedbackTextChange: (id: string, text: string) => void;
  onFeedbackSubmit: (id: string) => void;
}

const FeedbackSection = memo(function FeedbackSection({
  msg, onFeedbackClick, onFeedbackTextChange, onFeedbackSubmit,
}: FeedbackSectionProps) {
  if (msg.isFeedbackSubmitted) {
    return (
      <div className="ml-1 mt-1 flex animate-in fade-in slide-in-from-left-2 items-center gap-2 text-[11px] font-bold text-nav-accent">
        <img
          src={msg.feedbackStatus === "like" ? iconLikeBlue : iconDislikeRed}
          alt="선택한 피드백"
          className="size-5 opacity-90"
        />
        <span>소중한 의견이 전달되었어요!</span>
      </div>
    );
  }

  return (
    <div onClick={e => e.stopPropagation()}>
      {/* 좋아요 / 싫어요 버튼 */}
      <div className="ml-1 flex gap-2">
        <button
          onClick={() => onFeedbackClick(msg.id, "like")}
          className="p-1 transition-transform active:scale-90"
        >
          <img
            src={msg.feedbackStatus === "like" ? iconLikeBlue : iconLike}
            alt="좋아요"
            className="size-5"
          />
        </button>
        <button
          onClick={() => onFeedbackClick(msg.id, "dislike")}
          className="p-1 transition-transform active:scale-90"
        >
          <img
            src={msg.feedbackStatus === "dislike" ? iconDislikeRed : iconDislike}
            alt="싫어요"
            className="size-5"
          />
        </button>
      </div>

      {/* 피드백 입력창 */}
      {msg.isFeedbackOpen && (
        <div className="mt-3 w-full animate-in fade-in zoom-in-95 duration-200 rounded-[22px] border border-[#e2eef1] bg-[#f0f7f9] p-5 shadow-xl">
          <div className="rounded-[16px] border border-[#e2eef1] bg-white p-3.5 shadow-sm">
            <textarea
              value={msg.feedbackText ?? ""}
              onChange={e => onFeedbackTextChange(msg.id, e.target.value)}
              placeholder="답변에 대한 피드백을 남겨주세요"
              className="h-20 w-full resize-none border-none bg-transparent text-[14px] font-medium text-nav-primary outline-none placeholder:text-nav-inactive"
            />
          </div>
          <button
            onClick={() => onFeedbackSubmit(msg.id)}
            className="mt-4 w-full rounded-[16px] bg-nav-accent py-3.5 text-[14px] font-bold text-white shadow-lg shadow-nav-accent/20 transition-all hover:bg-nav-accent/90 active:scale-[0.97]"
          >
            피드백 보내기
          </button>
        </div>
      )}
    </div>
  );
});

// ─── 메인 컴포넌트 ─────────────────────────────────────────

export default function Chatbot() {
  const [isLoggedIn]   = useState(() => sessionStorage.getItem("isLoggedIn") === "true");
  const [messages, setMessages]         = useState<Message[]>([]);
  const [inputValue, setInputValue]     = useState("");
  const [isTyping, setIsTyping]         = useState(false);
  const [isSuggestOpen, setIsSuggestOpen] = useState(true);
<<<<<<< HEAD

=======
  const [feedbacks, setFeedbacks] = useState<Record<string, FeedbackState>>({});
>>>>>>> 2f20c5a7bacd26848300aeb90cf88fcdfa09dec7
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── 초기 메시지 ──
  useEffect(() => {
    const initialMsg: Message = {
      id:        makeId(),
      text:      isLoggedIn
        ? "안녕하세요! 가온이입니다. 무엇을 도와드릴까요?"
        : "안녕하세요! 가온이입니다.\n(비로그인 상태로 이용 중이며 대화 기록은 저장되지 않습니다.)",
      sender:    "bot",
      timestamp: formatTime(),
      isInitial: true,
    };
    setMessages([initialMsg]);
  }, [isLoggedIn]);

  // ── 스크롤 ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── 배경 클릭 시 피드백 창 닫기 ──
  const handleContainerClick = useCallback(() => {
    setMessages(prev => prev.map(msg =>
      msg.isFeedbackOpen && !msg.isFeedbackSubmitted
        ? { ...msg, isFeedbackOpen: false, feedbackStatus: null, feedbackText: "" }
        : msg
    ));
  }, []);

  // ── 피드백 좋아요/싫어요 클릭 ──
  const handleFeedbackClick = useCallback((id: string, status: FeedbackStatus) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id !== id) return msg;
      const isToggle = msg.feedbackStatus === status && msg.isFeedbackOpen;
      return isToggle
        ? { ...msg, feedbackStatus: null, isFeedbackOpen: false }
        : { ...msg, feedbackStatus: status, isFeedbackOpen: true };
    }));
  }, []);

  // ── 피드백 텍스트 변경 (메시지별) ──
  const handleFeedbackTextChange = useCallback((id: string, text: string) => {
    setMessages(prev => prev.map(msg =>
      msg.id === id ? { ...msg, feedbackText: text } : msg
    ));
  }, []);

  // ── 피드백 제출 ──
  const handleFeedbackSubmit = useCallback((id: string) => {
    setMessages(prev => prev.map(msg =>
      msg.id === id
        ? { ...msg, isFeedbackOpen: false, isFeedbackSubmitted: true }
        : msg
    ));
  }, []);

  // ── 메시지 전송 ──
  const handleSend = useCallback((text?: string) => {
    const textToSend = (text ?? inputValue).trim();
    if (!textToSend || isTyping) return;

    const userMsg: Message = {
      id: makeId(), text: textToSend, sender: "user", timestamp: formatTime(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    // TODO: 실제 API 호출로 교체
    setTimeout(() => {
      const botMsg: Message = {
        id:                  makeId(),
        text:                `문의하신 '${textToSend}'에 대한 답변입니다. 상세 정보는 기숙사 홈페이지를 참고해 주세요.`,
        sender:              "bot",
        timestamp:           formatTime(),
        feedbackStatus:      null,
        isFeedbackOpen:      false,
        isFeedbackSubmitted: false,
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, BOT_DELAY_MS);
  }, [inputValue, isTyping]);

  // ── 키보드 전송 ──
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

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
    <div
      className="relative mx-auto flex min-h-screen w-full max-w-[448px] flex-col overflow-x-hidden bg-[#f0f9ff] shadow-2xl"
      onClick={handleContainerClick}
    >
      {/* ── 헤더 ── */}
      <div className="z-10 shrink-0 px-7 pb-6 pt-16 bg-[#f0f9ff]">
        <h1 className="text-[28px] font-bold tracking-tight text-nav-primary">챗봇</h1>
        <p className="mt-1 text-[13px] font-bold tracking-tight text-nav-inactive">
          기숙사 관련 질문을 해보세요
        </p>
      </div>

<<<<<<< HEAD
      {/* ── 메시지 영역 ── */}
      <div className={`flex-1 space-y-8 overflow-y-auto px-6 py-4 transition-all ${isSuggestOpen ? "pb-[320px]" : "pb-52"}`}>
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            onClick={e => e.stopPropagation()}
          >
            {msg.sender === "bot" && <BotAvatar />}

            <div className={`flex max-w-[75%] flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
              {/* 말풍선 + 타임스탬프 */}
              <div className={`flex items-end gap-2 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`rounded-[18px] px-5 py-4 text-[14.5px] font-semibold leading-[1.65] shadow-md whitespace-pre-wrap border ${
                  msg.sender === "user"
                    ? "rounded-tr-none border-transparent bg-nav-accent text-white shadow-nav-accent/20"
                    : "rounded-tl-none border-[#eef6f7] bg-white text-nav-primary"
                }`}>
                  {msg.text}
                </div>
                <span className="mb-1 shrink-0 text-[10px] font-bold text-nav-inactive">
                  {msg.timestamp}
                </span>
              </div>

              {/* 피드백 영역: 봇 메시지 + 초기 메시지 제외 */}
              {msg.sender === "bot" && !msg.isInitial && (
                <div className="mt-2 w-full">
                  <FeedbackSection
                    msg={msg}
                    onFeedbackClick={handleFeedbackClick}
                    onFeedbackTextChange={handleFeedbackTextChange}
                    onFeedbackSubmit={handleFeedbackSubmit}
                  />
                </div>
=======
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
>>>>>>> 2f20c5a7bacd26848300aeb90cf88fcdfa09dec7
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
<<<<<<< HEAD

        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
=======
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
>>>>>>> 2f20c5a7bacd26848300aeb90cf88fcdfa09dec7
      </div>

      {/* ── 하단 인터페이스 ── */}
      <div className="fixed bottom-[90px] z-20 w-full max-w-[448px] border-t border-[#eef6f7] bg-white/90 pt-5 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] backdrop-blur-xl">
        <div className="relative z-10 px-6">
          {/* 추천 질문 헤더 */}
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="text-[11px] font-black uppercase tracking-wider text-nav-inactive">
              추천 질문
            </p>
            <button
              onClick={() => setIsSuggestOpen(v => !v)}
              className="rounded-full p-1 text-nav-inactive transition-colors hover:bg-[#f1f5f9]"
            >
              {isSuggestOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
<<<<<<< HEAD

          {/* 추천 질문 목록 */}
          <div className={`grid grid-cols-2 gap-2 overflow-hidden transition-all duration-300 ease-in-out ${
            isSuggestOpen ? "mb-2 max-h-[200px] opacity-100" : "mb-0 max-h-0 opacity-0"
          }`}>
            {SUGGESTED_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="min-h-[35px] w-full rounded-[18px] border border-[#eef6f7] bg-white px-3 py-2.5 shadow-sm transition-all active:scale-95"
              >
                <span className="break-keep text-center text-[11.5px] font-extrabold leading-[1.3] text-nav-primary/70 whitespace-normal">
                  {q}
                </span>
=======
          <div className={`grid grid-cols-2 gap-2 transition-all duration-300 ease-in-out ${isSuggestOpen ? "max-h-[200px] opacity-100 mb-2" : "max-h-0 opacity-0 mb-0"} overflow-visible`}>
            {suggestedQuestions.map((q, i) => (
              <button key={i} onClick={() => handleSend(q)} className="w-full relative px-3 py-2.5 bg-white border border-[#eef6f7] rounded-[18px] shadow-sm active:scale-95 transition-all min-h-[35px]">
                <span className="text-[11.5px] text-[#5a7685] font-bold text-center leading-[1.3] whitespace-normal break-keep">{q}</span>
>>>>>>> 2f20c5a7bacd26848300aeb90cf88fcdfa09dec7
              </button>
            ))}
          </div>
        </div>
<<<<<<< HEAD

        {/* 입력창 */}
        <div className="relative z-10 flex items-center gap-3 px-6 pb-5 pt-2">
          <input
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            className="flex-1 rounded-[22px] border border-transparent bg-[#f1f5f9] px-5 py-3.5 text-[14.5px] font-bold text-nav-primary outline-none transition-all focus:border-nav-accent/30 focus:bg-white"
          />
          <button
            onClick={() => handleSend()}
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-nav-accent shadow-lg transition-all active:scale-90"
          >
            <img src={iconShortcut} alt="전송" className="size-5 brightness-0 invert" />
=======
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
>>>>>>> 2f20c5a7bacd26848300aeb90cf88fcdfa09dec7
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
