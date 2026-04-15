import { useState, useRef, useEffect } from "react";
import BottomNav from "../components/BottomNav";
import { FileText, ChevronDown, ChevronUp, Calendar, Loader2, AlertCircle, Plus } from "lucide-react";
import iconShortcut from "../icons/arrow.svg";
import iconLike from "../icons/like.svg";
import iconLikeSelected from "../icons/like_select.svg";
import iconDislike from "../icons/dislike.svg";
import iconDislikeSelected from "../icons/dislike_select.svg";
import iconGaonLogo from "../icons/gaon-logo.svg";
import api from "../api/axios";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: string;
  // ?는 해당 속성이 있어도 되고 없어도 된다는 뜻 (사용자 메시지엔 없기 때문)
  retrievedChunks?: RetrievedChunk[]; 
}

interface RetrievedChunk {
  retrievalResultId: number;
  regulationChunkId: number;
  documentId: string;
  documentVersion: string;
  chunkId: string;
  content: string;
  retrievalRank: number;
  retrievalScore: number;
  rerankScore: number | null;
  retrievalMethod: string;
  usedInAnswer: boolean;
  selectedAsCitation: boolean;
  citationOrder: number | null;
}

interface ChatResponseData {
  chatLogId: number;
  sessionId: string;
  answer: string;
  retrievedChunks: RetrievedChunk[];
  responseTime: number;
}

type FeedbackRating = "like" | "dislike";

interface FeedbackState {
  rating: FeedbackRating;
  comment: string;
  isFormOpen: boolean;
  isSubmitted: boolean;
}

// API 응답 전체 구조
interface ApiResponse {
  data: ChatResponseData;
  code: number;
  message: string;
}
const suggestedQuestions = ["입실 시간이 언제인가요?", "세탁실 이용 방법을 알려주세요", "식당 운영 시간이 궁금해요", "외박 신청은 어떻게 하나요?"];

const TypingIndicator = () => (
  <div className="flex space-x-1.5 px-5 py-4 bg-white rounded-[18px] rounded-tl-none shadow-md border border-[#eef6f7] w-fit">
    <div className="w-1.5 h-1.5 bg-[#5eb9ca] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-1.5 h-1.5 bg-[#5eb9ca] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-1.5 h-1.5 bg-[#5eb9ca] rounded-full animate-bounce"></div>
  </div>
);

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSuggestOpen, setIsSuggestOpen] = useState(true);
  const [feedbacks, setFeedbacks] = useState<Record<string, FeedbackState>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [expandedSourceIds, setExpandedSourceIds] = useState<Set<string>>(new Set());

  // 토글 함수 (메시지 ID를 받아 열기/닫기)
  const toggleSource = (msgId: string) => {
    setExpandedSourceIds(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) {
        next.delete(msgId);
        // 이미 열려있으면 닫기
      } else {
        next.add(msgId);
        // 닫혀있으면 열기
      }
      return next;
    });
  };

  // 비로그인용 세션 ID 생성/관리 (guest_@@@ 형태)
  const getOrGenerateSessionId = () => {
    let sid = sessionStorage.getItem("guest_sessionId");
    if (!sid) {
      sid = `guest_${Math.random().toString(36).substring(2, 15)}`;
      sessionStorage.setItem("guest_sessionId", sid);
    }
    return sid;
  };

  const getIsLoggedIn = () => sessionStorage.getItem("isLoggedIn") === "true";

  // 초기 메시지 설정
  useEffect(() => {
    const initialMsg: Message = {
      id: "1",
      text: getIsLoggedIn()
        ? "안녕하세요! 가온이입니다. 무엇을 도와드릴까요?"
        : "안녕하세요! 가온이입니다.\n(비로그인 상태로 이용 중이며 대화 기록은 저장되지 않습니다.)",
      sender: "bot",
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true })
    };

    // 로그인 시에만 로컬스토리지에서 복구
    if (getIsLoggedIn()) {
      const saved = localStorage.getItem("chat_history");
      setMessages(saved ? JSON.parse(saved) : [initialMsg]);
    } else {
      setMessages([initialMsg]);
    }
  }, []);

  // 1. 메시지 끝으로 스크롤하는 함수
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 2. 메시지 목록이 변경될 때마다(새 메시지, 로딩 시작 등) 스크롤 실행
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isSuggestOpen]);

  // 메시지 전송 및 API 연동
  const handleSend = async (text?: string) => {
    const textToSend = text || inputValue;
    if (!textToSend.trim() || isTyping) return;

    const now = new Date();
    const timestamp = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });

    // 유저 메시지 생성
    const userMsg: Message = { id: Date.now().toString(), text: textToSend, sender: "user", timestamp };

    // 메시지 즉시 반영
    setMessages(prev => {
      const updated = [...prev, userMsg];
      if (getIsLoggedIn()) localStorage.setItem("chat_history", JSON.stringify(updated));
      return updated;
    });

    setInputValue("");
    setIsTyping(true);

    try {
      const isLoggedIn = getIsLoggedIn();
      const requestData = {
        question: textToSend,
        // 로그인 여부와 관계없이 sessionId를 보내도 되지만 
        // 비로그인 사용자인 경우에만 명시적으로 보내도록 유지
        ...(isLoggedIn ? {} : { sessionId: getOrGenerateSessionId() })
      };

      // 3. 백엔드 API 호출
      const response = await api.post<ApiResponse>("/chatbot/questions", requestData);

      if (response.data && response.data.code === 200) {
        const result = response.data.data;

        // 4. 봇 답변 추가
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: result.answer,
          sender: "bot",
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true }),
          retrievedChunks: result.retrievedChunks
        };

        // 봇 답변 추가 및 저장
        setMessages(prev => {
          const updated = [...prev, botMsg];
          if (isLoggedIn) localStorage.setItem("chat_history", JSON.stringify(updated));
          return updated;
        });
      } else {
        // 200이 아닌 경우 처리
        throw new Error(response.data.message || "알 수 없는 오류");
      }
    } catch (error: any) {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        text: error.response?.data?.message || "죄송합니다. 서버와 통신 중 오류가 발생했습니다.",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
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
        Object.entries(prev).map(([messageId, feedback]) => {
          if (feedback.isFormOpen) hasOpenForm = true;
          return [messageId, { ...feedback, isFormOpen: false }];
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

      {/* 메시지 영역 */}
      <div onClick={closeOpenFeedbackForms} className="flex-1 px-6 py-4 space-y-8 overflow-y-auto pb-40">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
            {/* 메시지 말풍선 */}
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
                ${msg.sender === "user" ? "bg-[#5eb9ca] text-white rounded-tr-none border-transparent shadow-[#5eb9ca]/20" : "bg-white text-[#3e5b6a] rounded-tl-none border-[#eef6f7]"}`}>
                <span className="text-[15px] leading-[1.6] font-medium whitespace-pre-wrap">{msg.text}</span>
              </div>
              {msg.sender === "bot" && (
                <span className="self-end mb-1 ml-2 text-[10px] font-semibold tracking-tight text-[#adb5bd]">
                  {msg.timestamp}
                </span>
              )}
            </div>

            {/* 출처 아코디언 */}
            {msg.sender === "bot" && msg.retrievedChunks && msg.retrievedChunks.length > 0 && (
              <div onClick={(e) => e.stopPropagation()} className="mt-2 ml-[46px] w-[66%] max-w-[66%]">
                <button
                  onClick={() => toggleSource(msg.id)}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-[#5eb9ca] bg-white px-3 py-1.5 rounded-full shadow-sm border border-[#eef6f7] active:scale-95 transition-all"
                >
                  <FileText size={12} />
                  참고 자료 {msg.retrievedChunks.length}개 {expandedSourceIds.has(msg.id) ? "닫기" : "보기"}
                  <ChevronDown size={12} className={`transition-transform ${expandedSourceIds.has(msg.id) ? "rotate-180" : ""}`} />
                </button>

                {expandedSourceIds.has(msg.id) && (
                  <div className="mt-2 space-y-2 bg-white p-3 rounded-[12px] border border-[#eef6f7] shadow-sm animate-in fade-in slide-in-from-top-1">
                    {msg.retrievedChunks?.map((chunk, index) => (
                      <div key={chunk.retrievalResultId} className="pb-2 border-b border-[#f8fafc] last:border-0 last:pb-0">
                        <p className="text-[11px] font-bold text-[#054a57] mb-0.5">
                          출처 {index + 1} (점수: {chunk.retrievalScore.toFixed(2)})
                        </p>
                        <p className="text-[11px] text-[#607d8b] leading-relaxed line-clamp-2">
                          {chunk.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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
        <div ref={messagesEndRef} /> {/* 스크롤 타겟 */}
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
            onKeyDown={(e) => {
              // 한글 입력 시 엔터가 두 번 입력되는 현상 방지
              if (e.key === "Enter" && !e.shiftKey && e.nativeEvent.isComposing === false) {
                e.preventDefault();
                handleSend();
              }
            }}
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
