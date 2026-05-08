import { useState, useEffect, useMemo } from "react";
import { Calendar, ChevronDown, ExternalLink, Loader2 } from "lucide-react";
import BottomNav from "../components/BottomNav";

// ─── 타입 ─────────────────────────────────────────────────

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

// ─── 상수 ─────────────────────────────────────────────────

const MOCK_NOTICES: NoticeItem[] = [
  { noticeId: 1, title: "2026학년도 1학기 입사 안내사항",      summaryText: "신축 기숙사 입사 절차 및 준비물, 건강진단서 제출 안내입니다.",             postedAt: "2026-03-02" },
  { noticeId: 2, title: "생활관 식당 운영 시간 변경 안내",      summaryText: "학기 중 식당 운영 시간이 다음과 같이 변경되오니 이용에 참고 바랍니다.",    postedAt: "2026-03-05" },
  { noticeId: 3, title: "[필독] 기숙사 화재 예방 점검 실시",    summaryText: "각 호실별 전열기구 사용 여부 및 소방 시설 점검이 진행될 예정입니다.",      postedAt: "2026-04-01" },
];

const MOCK_DETAILS: Record<number, NoticeDetail> = {
  1: { noticeId: 1, title: "2026학년도 1학기 입사 안내사항",    summaryText: "신축 기숙사 입사 절차 및 준비물, 건강진단서 제출 안내입니다.",          postedAt: "2026-03-02", content: "안녕하세요, 학생생활관입니다.\n2026학년도 1학기 입사자분들은 반드시 정해진 기간 내에 건강진단서(결핵)를 지참하여 방문해 주시기 바랍니다.\n미지참 시 입사가 제한될 수 있습니다.", sourceUrl: "https://www.gachon.ac.kr", targetInfo: "2026-1학기 생활관 합격자 전원", scheduleInfo: "입사 기간: 2026.03.01 ~ 03.03", cautionInfo: "입사 전 3개월 이내 발급된 진단서만 유효함" },
  2: { noticeId: 2, title: "생활관 식당 운영 시간 변경 안내",   summaryText: "학기 중 식당 운영 시간이 다음과 같이 변경되오니 이용에 참고 바랍니다.", postedAt: "2026-03-05", content: "조식 이용 인원 증가로 인해 기존 운영 시간보다 30분 연장하여 운영합니다.\n변경된 시간을 확인하시어 이용에 불편함이 없으시길 바랍니다.", sourceUrl: "https://www.gachon.ac.kr", scheduleInfo: "조식: 07:30 ~ 09:30 (기존 대비 30분 연장)" },
  3: { noticeId: 3, title: "[필독] 기숙사 화재 예방 점검 실시", summaryText: "각 호실별 전열기구 사용 여부 및 소방 시설 점검이 진행될 예정입니다.",    postedAt: "2026-04-01", content: "안전한 생활관 환경을 위해 정기 소방 점검을 실시합니다.\n개인 전열기구(전기장판, 커피포트 등) 적발 시 벌점이 부과될 수 있으니 주의 바랍니다.", sourceUrl: "https://www.gachon.ac.kr", targetInfo: "제1, 2, 3 학생생활관 전 호실", scheduleInfo: "2026.04.10 ~ 04.12", cautionInfo: "부재 중에도 점검이 진행될 수 있습니다." },
};

const LOAD_DELAY = 500;

const formatDate = (date: string) => date.replace(/-/g, ". ");

// ─── 서브 컴포넌트 ─────────────────────────────────────────

interface DetailInfoRowProps {
  label: string;
  value: string;
  isWarning?: boolean;
}

function DetailInfoRow({ label, value, isWarning = false }: DetailInfoRowProps) {
  return (
    <div className={`rounded-xl border p-3 ${
      isWarning ? "border-[#ffe3e3] bg-[#fff5f5]" : "border-[#eef6f7] bg-[#f8fafc]"
    }`}>
      <p className={`mb-1 text-[11px] font-bold ${isWarning ? "text-[#ff6b6b]" : "text-nav-accent"}`}>
        {label}
      </p>
      <p className="text-[13px] font-bold text-nav-primary/70">{value}</p>
    </div>
  );
}

interface NoticeCardProps {
  item: NoticeItem;
  isExpanded: boolean;
  onToggle: () => void;
}

function NoticeCard({ item, isExpanded, onToggle }: NoticeCardProps) {
  const detail = MOCK_DETAILS[item.noticeId];

  return (
    <div
      onClick={onToggle}
      className={`cursor-pointer rounded-[24px] border bg-white/80 p-6 shadow-sm backdrop-blur-md transition-all duration-300 ${
        isExpanded ? "border-nav-accent shadow-md" : "border-white"
      }`}
    >
      {/* ── 헤더 ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-[16px] font-bold leading-snug text-nav-primary">
            {item.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-[13px] font-bold leading-relaxed text-nav-accent">
            {item.summaryText}
          </p>
          <div className="mt-3 flex items-center text-[11px] font-bold text-nav-inactive">
            <Calendar size={12} className="mr-1" />
            {formatDate(item.postedAt)}
          </div>
        </div>
        <div className={`mt-1 transition-all duration-300 ${
          isExpanded ? "rotate-180 text-nav-accent" : "text-nav-inactive"
        }`}>
          <ChevronDown size={22} />
        </div>
      </div>

      {/* ── 상세 영역 ── */}
      <div className={`overflow-hidden transition-all duration-300 ${
        isExpanded ? "mt-4 max-h-[2000px] border-t border-[#eef6f7] pt-4" : "max-h-0"
      }`}>
        {detail ? (
          <div className="space-y-4">
            {/* 메타 정보 */}
            <div className="grid grid-cols-1 gap-2">
              {detail.scheduleInfo && <DetailInfoRow label="일정"     value={detail.scheduleInfo} />}
              {detail.targetInfo   && <DetailInfoRow label="대상자"   value={detail.targetInfo}   />}
              {detail.cautionInfo  && <DetailInfoRow label="유의사항" value={detail.cautionInfo}  isWarning />}
            </div>

            {/* 본문 */}
            <div className="rounded-xl border border-[#eef6f7] bg-white p-4">
              <p className="whitespace-pre-line text-[13.5px] font-medium leading-[1.7] text-nav-primary/60">
                {detail.content}
              </p>
            </div>

            {/* 원문 링크 */}
            <a
              href={detail.sourceUrl}
              target="_blank"
              rel="noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-nav-active-bg-from py-3 text-[13px] font-bold text-nav-accent transition-all active:scale-[0.98]"
            >
              <ExternalLink size={14} />
              공지 원문 링크
            </a>
          </div>
        ) : (
          <div className="flex justify-center py-4">
            <Loader2 className="animate-spin text-nav-accent" size={20} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────

export default function Notices() {
  const [notices, setNotices]       = useState<NoticeItem[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isLoading, setIsLoading]   = useState(true);

  // ── 데이터 로드 ──
  useEffect(() => {
    setIsLoading(true);
    // TODO: 실제 API 호출로 교체
    setTimeout(() => {
      setNotices([...MOCK_NOTICES].reverse());
      setIsLoading(false);
    }, LOAD_DELAY);
  }, []);

  // ── 토글 ──
  const toggleNotice = (id: number) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  // ── 통계 ──
  const stats = useMemo(() => {
    const now          = new Date();
    const oneWeekAgo   = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // now mutate 없이
    const currentMonth = now.getMonth() + 1;

    return {
      currentMonth,
      weeklyCount:  notices.filter(n => new Date(n.postedAt) >= oneWeekAgo).length,
      monthlyCount: notices.filter(n => new Date(n.postedAt).getMonth() + 1 === currentMonth).length,
    };
  }, [notices]);

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[448px] flex-col bg-[#f0f9ff] font-sans shadow-2xl antialiased">
      <div className="fixed inset-0 mx-auto max-w-[448px] -z-10 bg-gradient-to-b from-[#e0f2fe] via-[#f0f9ff] to-[#f8fafc]" />

      {/* ── 헤더 ── */}
      <div className="shrink-0 px-8 pb-5 pt-14">
        <h1 className="text-[28px] font-bold tracking-tight text-nav-primary">학생생활관 공지</h1>
        <p className="mt-1 text-[13px] font-bold tracking-tight text-nav-inactive">
          공지사항의 핵심만 알려드려요
        </p>
      </div>

      {/* ── 요약 카드 ── */}
      <div className="relative z-10 mb-6 shrink-0 px-6">
        <div className="w-full rounded-[28px] bg-nav-accent px-8 py-6 shadow-lg transition-all">
          <p className="mb-1 text-[14px] font-bold tracking-tight text-white/90">최근 7일 공지</p>
          <h2 className="mb-1 text-[32px] font-bold text-white">{stats.weeklyCount}건</h2>
          <p className="text-[13px] font-bold tracking-tight text-white/80">
            {stats.currentMonth}월 총 {stats.monthlyCount}건의 공지사항
          </p>
        </div>
      </div>

      {/* ── 리스트 ── */}
      <div className="flex-1 space-y-4 overflow-y-auto px-6 pb-28 scrollbar-hide">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center pt-20 text-nav-accent">
            <Loader2 className="mb-2 animate-spin" size={32} />
            <p className="text-[14px] font-bold">공지사항을 가져오는 중...</p>
          </div>
        ) : (
          notices.map(item => (
            <NoticeCard
              key={item.noticeId}
              item={item}
              isExpanded={expandedId === item.noticeId}
              onToggle={() => toggleNotice(item.noticeId)}
            />
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}