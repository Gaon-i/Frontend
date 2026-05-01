import { useState, useEffect, useMemo, useCallback } from "react";
import { Calendar, ChevronDown, ExternalLink, Loader2, AlertCircle, Plus } from "lucide-react";
import BottomNav from "../components/BottomNav";
import api from "../api/axios";

interface NoticeItem {
  noticeId: number;
  title: string;
  summaryText: string;
  postedAt: string;
}

interface NoticeDetail extends NoticeItem {
  content: string;
  sourceUrl: string;
  targetInfo?: string;
  scheduleInfo?: string;
  cautionInfo?: string;
}

export default function Notices() {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [details, setDetails] = useState<Record<number, NoticeDetail>>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  // 더 가져올 데이터가 있는지 확인

  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");

  // 1. 공지사항 목록 로드 (GET /api/notices)
  const fetchNotices = useCallback(async (targetPage: number) => {
    try {
      setIsLoading(true);
      const response = await api.get("/notices", {
        params: { page: targetPage, size: 10 }
      });

      if (response.data.code === 200) {
        const newData = response.data.data;

        if (newData.length < 10) {
          setHasMore(false);
          // 가져온 데이터가 10개 미만이면 다음 페이지가 없음
        }

        // 기존 데이터 뒤에 새로운 데이터를 붙임
        setNotices(prev => [...prev, ...newData]);
      }
    } catch (error) {
      console.error("공지 목록 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchNoticeDetail = async (id: number) => {
    try {
      const response = await api.get(`/notices/${id}`);
      // 성공 시 처리 로직
    } catch (error) {
      // 에러 발생 시 알림창 띄우기
      setAlertMsg("게시글을 불러오는 중 오류가 발생했습니다.\n다시 시도해주세요.");
      setShowAlert(true);
    }
  };

  // 첫 렌더링 시 로드
  useEffect(() => {
    fetchNotices(0);
  }, [fetchNotices]);

  // 2. 더보기 버튼 클릭 핸들러
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotices(nextPage);
  };

  // 2. 공지 상세 정보 토글 및 로드 (GET /api/notices/{noticeId})
  const toggleNotice = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }

    // 펼치는 것과 동시에 해당 ID를 설정
    setExpandedId(id);

    // 이미 불러온 데이터가 없다면 서버에 요청
    if (!details[id]) {
      try {
        setIsDetailLoading(true);
        // 로딩 시작
        const response = await api.get(`/notices/${id}`);

        if (response.data.code === 200) {
          setDetails(prev => ({ ...prev, [id]: response.data.data }));
        }
      } catch (error) {
        setAlertMsg("상세 내용을 불러오지 못했습니다.\n잠시 후 다시 시도해주세요.");
        setShowAlert(true);

        setExpandedId(null);
        // 실패 시 다시 닫음
      } finally {
        setIsDetailLoading(false);
        // 로딩 종료
      }
    }
  };

  // 3. 통계 계산 (현재 로드된 목록 기준)
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);

    const weeklyCount = notices.filter(item => new Date(item.postedAt) >= oneWeekAgo).length;
    const monthlyCount = notices.filter(item => {
      const d = new Date(item.postedAt);
      return d.getFullYear() === now.getFullYear() && (d.getMonth() + 1) === currentMonth;
    }).length;

    return { currentMonth, weeklyCount, monthlyCount };
  }, [notices]);

  return (
    <div className="min-h-screen w-full max-w-[448px] mx-auto bg-[#f0f9ff] relative shadow-2xl flex flex-col antialiased font-sans">
      <div className="fixed inset-0 max-w-[448px] mx-auto bg-gradient-to-b from-[#e0f2fe] via-[#f0f9ff] to-[#f8fafc] -z-10" />

      <div className="pt-14 px-8 pb-5 shrink-0">
        <h1 className="font-bold text-[28px] text-[#054a57] tracking-tight">학생생활관 공지</h1>
        <p className="text-[#607d8b] text-[13px] font-bold mt-1 tracking-tight">공지사항의 핵심만 알려드려요</p>
      </div>

      {/* 요약 카드 */}
      <div className="px-6 mb-6 shrink-0 relative z-10">
        <div className="w-full bg-[#79b6c4] rounded-[28px] px-8 py-6 shadow-lg transition-all">
          <p className="text-white/90 text-[14px] font-bold mb-1 tracking-tight">최근 7일 공지</p>
          <h2 className="text-white text-[32px] font-bold mb-1">{stats.weeklyCount}건</h2>
          <p className="text-white/80 text-[13px] font-bold tracking-tight">{stats.currentMonth}월 총 {stats.monthlyCount}건의 공지사항</p>
        </div>
      </div>

      {/* 리스트 영역 */}
      <div className="flex-1 px-6 pb-28 space-y-4 overflow-y-auto scrollbar-hide">
        {/* 초기 로딩 시 (데이터가 아예 없을 때만 전면 로더) */}
        {isLoading && notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 text-[#5eb9ca]">
            <Loader2 className="animate-spin mb-2" size={32} />
            <p className="font-bold text-[14px]">공지사항을 가져오는 중...</p>
          </div>
        ) : (
          <>
            {notices.map((item) => {
              const isExpanded = expandedId === item.noticeId;
              const detail = details[item.noticeId];

              return (
                <div
                  key={item.noticeId}
                  onClick={() => toggleNotice(item.noticeId)}
                  className={`group bg-white/80 backdrop-blur-md rounded-[24px] p-6 shadow-sm border transition-all duration-300 ${isExpanded ? 'border-[#5eb9ca] shadow-md' : 'border-white'
                    }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-[16px] leading-snug text-[#054a57]">{item.title}</h3>
                      <p className="text-[13px] mt-2 text-[#4ea8b8] font-bold leading-relaxed line-clamp-2">{item.summaryText}</p>
                      <div className="flex items-center text-[#cbd5e1] text-[11px] font-bold mt-3">
                        <Calendar size={12} className="mr-1" />
                        {item.postedAt.replace(/-/g, '. ')}
                      </div>
                    </div>
                    <div className={`mt-1 text-[#cbd5e1] transition-transform duration-300 ${isExpanded ? 'rotate-180 text-[#5eb9ca]' : ''}`}>
                      <ChevronDown size={22} />
                    </div>
                  </div>

                  {/* 상세 영역 */}
                  <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[2000px] mt-4 pt-4 border-t border-[#f0f9ff]' : 'max-h-0'
                    }`}>
                    {detail ? (
                      // 데이터가 있을 때 (상세 내용 표시)
                      <div className="space-y-4 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 gap-2">
                          {detail.scheduleInfo && (
                            <div className="bg-[#f8fafc] p-3 rounded-xl border border-[#eef6f7]">
                              <p className="text-[11px] font-bold text-[#5eb9ca] mb-1">일정</p>
                              <p className="text-[13px] text-[#475569] font-bold">{detail.scheduleInfo}</p>
                            </div>
                          )}
                          {detail.targetInfo && (
                            <div className="bg-[#f8fafc] p-3 rounded-xl border border-[#eef6f7]">
                              <p className="text-[11px] font-bold text-[#5eb9ca] mb-1">대상자</p>
                              <p className="text-[13px] text-[#475569] font-bold">{detail.targetInfo}</p>
                            </div>
                          )}
                          {detail.cautionInfo && (
                            <div className="bg-[#fff5f5] p-3 rounded-xl border border-[#ffe3e3]">
                              <p className="text-[11px] font-bold text-[#ff6b6b] mb-1">유의사항</p>
                              <p className="text-[13px] text-[#475569] font-bold">{detail.cautionInfo}</p>
                            </div>
                          )}
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-[#f1f5f9]">
                          <p className="text-[13.5px] text-[#64748b] font-medium leading-[1.7] whitespace-pre-line">
                            {detail.content}
                          </p>
                        </div>

                        <a
                          href={detail.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center gap-2 w-full py-3 bg-[#f0f9ff] text-[#5eb9ca] rounded-xl text-[13px] font-bold active:scale-[0.98] transition-all"
                        >
                          <ExternalLink size={14} />
                          공지 원문 링크
                        </a>
                      </div>
                    ) : isDetailLoading && expandedId === item.noticeId ? (
                      // 로딩 중일 때 (해당 항목에만 로더 표시)
                      <div className="flex flex-col items-center justify-center py-10 text-[#5eb9ca] animate-pulse">
                        <Loader2 className="animate-spin mb-2" size={24} />
                        <p className="text-[13px] font-bold">AI가 내용을 분석하고 있습니다...</p>
                      </div>
                    ) : (
                      // 데이터도 없고 로딩 중도 아닐 때 (에러 혹은 데이터 없음 안내)
                      <div className="flex flex-col items-center justify-center py-10 text-[#94a3b8]">
                        <AlertCircle size={24} className="mb-2 opacity-50" />
                        <p className="text-[13px] font-bold">내용을 불러오지 못했습니다.</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleNotice(item.noticeId); }}
                          className="mt-2 text-[12px] text-[#5eb9ca] underline font-bold"
                        >
                          다시 시도하기
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* 더보기 버튼 */}
            {hasMore && (
              <div className="pt-2 pb-6">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="w-full py-4 bg-white/60 backdrop-blur-sm border border-[#5eb9ca]/20 rounded-[20px] text-[#5eb9ca] font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-[#5eb9ca] hover:text-white transition-all active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <Plus size={18} />
                      공지사항 더보기
                    </>
                  )}
                </button>
              </div>
            )}

            {!hasMore && notices.length > 0 && (
              <p className="text-center text-[#cbd5e1] text-[12px] font-bold py-6">
                마지막 공지사항입니다.
              </p>
            )}
          </>
        )}
      </div>

      {showAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-8">
          <div className="absolute inset-0 bg-[#054a57]/20 backdrop-blur-[3px]" onClick={() => setShowAlert(false)} />
          <div className="relative bg-white w-full max-w-[320px] rounded-[28px] shadow-2xl p-7 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="size-[56px] bg-[#f0f9ff] rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="text-[#5eb9ca]" size={28} />
              </div>
              <h2 className="text-[17px] font-bold text-[#054a57] mb-2">알림</h2>
              <p className="text-[14px] font-medium text-[#7aaeb7] leading-relaxed mb-6 whitespace-pre-wrap">{alertMsg}</p>
              <button
                onClick={() => setShowAlert(false)}
                className="w-full h-[50px] bg-[#5eb9ca] text-white font-bold rounded-[18px] active:scale-[0.96] shadow-md"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 w-full max-w-[448px] z-50">
        <BottomNav />
      </div>
    </div>
  );
}