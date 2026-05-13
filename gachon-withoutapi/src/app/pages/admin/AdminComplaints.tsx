import { useState, useEffect, useCallback } from "react";
import {
  Clock, CheckCircle, AlertCircle, Building2,
  User, Info, Loader2, Image as ImageIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";

// ─── 타입 ─────────────────────────────────────────────────

type ComplaintCategory = "FACILITY" | "RULE" | "CLEANING" | "NOISE" | "ETC";
type ComplaintStatus = "RECEIVED" | "COMPLETED";

interface ComplaintImage {
  complaintImageId: number;
  fileUrl: string;
  originalName: string;
}

interface ComplaintDetail {
  complaintId: number;
  userId: number;
  userName: string;
  category: ComplaintCategory;
  title: string;
  content: string;
  status: ComplaintStatus;
  queueNo?: number;
  dormitoryId: number;
  roomId: number;
  assignedAdminId: number | null;
  adminComment: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  images: ComplaintImage[];
}

interface StatusInfo {
  label: string;
  bgClass: string;
  textClass: string;
  icon: LucideIcon;
}

interface TotalCounts {
  ALL: number;
  RECEIVED: number;
  COMPLETED: number;
}

interface AlertState {
  show: boolean;
  title: string;
  message: string;
}

// ─── 상수 ─────────────────────────────────────────────────

const DORMITORY_NAMES: Record<number, string> = {
  1: "제1학생생활관",
  2: "제2학생생활관",
  3: "제3학생생활관",
};

const CATEGORY_MAP: Record<ComplaintCategory, string> = {
  FACILITY: "시설 수리",
  RULE: "생활 규칙",
  CLEANING: "청소 요청",
  NOISE: "소음 신고",
  ETC: "기타 문의",
};

const STATUS_MAP: Record<ComplaintStatus, StatusInfo> = {
  RECEIVED: { label: "대기 중", bgClass: "bg-gray-100", textClass: "text-gray-500", icon: Clock },
  COMPLETED: { label: "처리 완료", bgClass: "bg-green-100", textClass: "text-green-600", icon: CheckCircle },
};

const STATUS_FILTER_OPTIONS = [
  { value: "전체", label: "전체" },
  { value: "RECEIVED", label: "대기 중" },
  { value: "COMPLETED", label: "처리 완료" },
] as const;

type FilterValue = typeof STATUS_FILTER_OPTIONS[number]["value"];

const PATCH_STATUS_OPTIONS: { value: ComplaintStatus; label: string }[] = [
  { value: "RECEIVED", label: "접수" },
  { value: "COMPLETED", label: "처리 완료" },
];

const ERROR_MESSAGES: Record<number, string> = {
  403: "민원 목록 접근 권한이 없습니다.\n관리자 계정인지 확인해 주세요.",
};

const COUNT_KEY_MAP: Record<FilterValue, keyof TotalCounts> = {
  전체: "ALL",
  RECEIVED: "RECEIVED",
  COMPLETED: "COMPLETED",
};

const FAKE_COMPLAINTS: ComplaintDetail[] = [
  { complaintId: 1, userId: 1, userName: "홍길동", category: "FACILITY", title: "화장실 수도꼭지 고장", content: "3층 남자 화장실 두 번째 칸 수도꼭지가 잠기지 않습니다.", status: "RECEIVED", queueNo: 1, dormitoryId: 1, roomId: 302, assignedAdminId: null, adminComment: null, resolvedAt: null, createdAt: "2025-05-10T10:00:00", updatedAt: "2025-05-10T10:00:00", images: [] },
  { complaintId: 2, userId: 2, userName: "김철수", category: "NOISE", title: "윗층 소음 문제", content: "매일 밤 11시 이후 윗층에서 뛰는 소리가 납니다.", status: "RECEIVED", queueNo: 2, dormitoryId: 2, roomId: 405, assignedAdminId: null, adminComment: null, resolvedAt: null, createdAt: "2025-05-09T14:30:00", updatedAt: "2025-05-09T14:30:00", images: [] },
  { complaintId: 3, userId: 3, userName: "이영희", category: "CLEANING", title: "복도 청소 요청", content: "2층 복도 끝쪽에 쓰레기가 방치되어 있습니다.", status: "COMPLETED", dormitoryId: 1, roomId: 210, assignedAdminId: 1, adminComment: "확인 후 조치 완료하였습니다.", resolvedAt: "2025-05-08T16:00:00", createdAt: "2025-05-07T09:00:00", updatedAt: "2025-05-08T16:00:00", images: [] },
  { complaintId: 4, userId: 4, userName: "박민준", category: "RULE", title: "취침 시간 규칙 위반", content: "옆 호실에서 새벽 2시까지 큰 소리로 통화합니다.", status: "RECEIVED", queueNo: 3, dormitoryId: 3, roomId: 118, assignedAdminId: null, adminComment: null, resolvedAt: null, createdAt: "2025-05-06T22:10:00", updatedAt: "2025-05-06T22:10:00", images: [] },
  { complaintId: 5, userId: 5, userName: "최수연", category: "ETC", title: "택배 보관함 고장", content: "1층 택배 보관함 3번이 열리지 않습니다.", status: "COMPLETED", dormitoryId: 2, roomId: 312, assignedAdminId: 1, adminComment: "수리 업체 방문 후 수리 완료했습니다.", resolvedAt: "2025-05-05T11:00:00", createdAt: "2025-05-04T15:20:00", updatedAt: "2025-05-05T11:00:00", images: [] },
];

// ─── 유틸 ─────────────────────────────────────────────────

const getDormitoryName = (id: number) => DORMITORY_NAMES[id] ?? `${id}생활관`;
const formatDate = (iso: string) => iso.split("T")[0];
const formatTime = (iso: string) => iso.split("T")[1]?.substring(0, 5) ?? "";

function parseApiError(error: unknown, fallback: string): string {
  const status = (error as { response?: { status?: number } }).response?.status ?? 0;
  return ERROR_MESSAGES[status] ?? fallback;
}

// ─── 커스텀 훅 ─────────────────────────────────────────────

function useAlert() {
  const [alert, setAlert] = useState<AlertState>({ show: false, title: "", message: "" });

  const triggerAlert = useCallback((title: string, message: string) => {
    setAlert({ show: true, title, message });
  }, []);

  const closeAlert = useCallback(() => {
    setAlert(prev => ({ ...prev, show: false }));
  }, []);

  return { alert, triggerAlert, closeAlert };
}

function useComplaints(triggerAlert: (title: string, msg: string) => void) {
  const [complaints, setComplaints] = useState<ComplaintDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterValue>("전체");
  const [totalCounts, setTotalCounts] = useState<TotalCounts>({ ALL: 0, RECEIVED: 0, COMPLETED: 0 });

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    await new Promise(res => setTimeout(res, 500));

    const filtered = filterStatus === "전체"
      ? FAKE_COMPLAINTS
      : FAKE_COMPLAINTS.filter(c => c.status === filterStatus);

    setComplaints(filtered);

    if (filterStatus === "전체") {
      setTotalCounts({
        ALL: FAKE_COMPLAINTS.length,
        RECEIVED: FAKE_COMPLAINTS.filter(c => c.status === "RECEIVED").length,
        COMPLETED: FAKE_COMPLAINTS.filter(c => c.status === "COMPLETED").length,
      });
    }
    setLoading(false);
  }, [filterStatus, triggerAlert]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const getCountByFilter = useCallback(
    (value: FilterValue): number => totalCounts[COUNT_KEY_MAP[value]] ?? 0,
    [totalCounts]
  );

  return { complaints, loading, filterStatus, setFilterStatus, getCountByFilter, fetchComplaints };
}

function useComplaintDetail(
  fetchComplaints: () => void,
  triggerAlert: (title: string, msg: string) => void,
) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ComplaintDetail | null>(null);
  const [adminComment, setAdminComment] = useState("");
  const [targetStatus, setTargetStatus] = useState<ComplaintStatus>("RECEIVED");

  const openDetail = useCallback(async (id: number) => {
    const found = FAKE_COMPLAINTS.find(c => c.complaintId === id);
    if (found) {
      setDetail(found);
      setAdminComment(found.adminComment ?? "");
      setTargetStatus(found.status);
      setSelectedId(id);
    } else {
      triggerAlert("오류", "상세 정보를 불러올 수 없습니다.");
    }
  }, [triggerAlert]);

  const closeDetail = useCallback(() => {
    setSelectedId(null);
    setDetail(null);
  }, []);

  const handleUpdateStatus = useCallback(async () => {
    if (!selectedId) return;
    await new Promise(res => setTimeout(res, 400));

    const idx = FAKE_COMPLAINTS.findIndex(c => c.complaintId === selectedId);
    if (idx !== -1) {
      FAKE_COMPLAINTS[idx] = {
        ...FAKE_COMPLAINTS[idx],
        status: targetStatus,
        adminComment,
        resolvedAt: targetStatus === "COMPLETED" ? new Date().toISOString() : null,
      };
    }
    triggerAlert("처리 완료", "민원 처리가 정상적으로 완료되었습니다.");
    closeDetail();
    fetchComplaints();
  }, [selectedId, targetStatus, adminComment, triggerAlert, closeDetail, fetchComplaints]);

  return {
    selectedId, detail, adminComment, targetStatus,
    setAdminComment, setTargetStatus,
    openDetail, closeDetail, handleUpdateStatus,
  };
}

// ─── 서브 컴포넌트 ─────────────────────────────────────────

interface ComplaintCardProps {
  item: ComplaintDetail;
  onOpen: (id: number) => void;
}

function ComplaintCard({ item, onOpen }: ComplaintCardProps) {
  const statusInfo = STATUS_MAP[item.status] ?? STATUS_MAP.RECEIVED;
  const StatusIcon = statusInfo.icon;

  return (
    <article
      onClick={() => onOpen(item.complaintId)}
      onKeyDown={e => e.key === "Enter" && onOpen(item.complaintId)}
      role="button"
      tabIndex={0}
      aria-label={`민원: ${item.title}`}
      className="group cursor-pointer rounded-[20px] border border-transparent bg-white p-6 shadow-sm transition-all hover:border-nav-accent/30 hover:shadow-md"
    >
      <div className="mb-4 flex items-start justify-between">
        <span className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${statusInfo.bgClass} ${statusInfo.textClass}`}>
          {statusInfo.label}
        </span>
        <StatusIcon className={`size-5 ${statusInfo.textClass}`} aria-hidden="true" />
      </div>

      <h3 className="mb-2 truncate text-lg font-bold text-nav-primary transition-colors group-hover:text-nav-accent">
        {item.title}
      </h3>

      <div className="mb-4 space-y-1.5 text-[13px] text-nav-inactive">
        <div className="flex items-center gap-2">
          <User size={14} className="text-nav-accent" aria-hidden="true" />
          {item.userName}
        </div>
        <div className="flex items-center gap-2">
          <Building2 size={14} className="text-nav-accent" aria-hidden="true" />
          {getDormitoryName(item.dormitoryId)}
          <span className="mx-1 text-nav-inactive/30" aria-hidden="true">|</span>
          {CATEGORY_MAP[item.category]}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[#f0f7f8] pt-3 text-[12px] text-nav-inactive">
        <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
        <span>{formatTime(item.createdAt)}</span>
      </div>
    </article>
  );
}

interface ComplaintDetailModalProps {
  detail: ComplaintDetail;
  adminComment: string;
  targetStatus: ComplaintStatus;
  onClose: () => void;
  onCommentChange: (v: string) => void;
  onStatusChange: (v: ComplaintStatus) => void;
  onSave: () => void;
}

function ComplaintDetailModal({
  detail, adminComment, targetStatus,
  onClose, onCommentChange, onStatusChange, onSave,
}: ComplaintDetailModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-in zoom-in-95 duration-200 no-scrollbar w-full max-w-2xl overflow-y-auto rounded-[24px] bg-white shadow-2xl"
        style={{ maxHeight: "90vh" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8">
          {/* 헤더 */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-nav-active-bg-from px-3 py-1 text-xs font-bold text-nav-accent">
                  {CATEGORY_MAP[detail.category]}
                </span>
                {detail.queueNo && (
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-500">
                    대기 {detail.queueNo}번
                  </span>
                )}
              </div>
              <h2 id="detail-title" className="text-2xl font-bold text-nav-primary">
                {detail.title}
              </h2>
              <div className="mt-3 flex items-center gap-4 text-[13px] text-nav-inactive">
                <span className="flex items-center gap-1">
                  <User size={14} aria-hidden="true" />
                  {detail.userName} (ID: {detail.userId})
                </span>
                <span className="flex items-center gap-1">
                  <Building2 size={14} aria-hidden="true" />
                  {getDormitoryName(detail.dormitoryId)} {detail.roomId}호
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="상세 닫기"
              className="text-2xl text-nav-inactive transition-colors hover:text-nav-primary"
            >
              ×
            </button>
          </div>

          {detail.resolvedAt && (
            <p className="mb-4 text-[11px] text-nav-inactive">
              최종 처리 완료:{" "}
              <time dateTime={detail.resolvedAt}>
                {new Date(detail.resolvedAt).toLocaleString()}
              </time>
            </p>
          )}

          {/* 본문 */}
          <div className="mb-8 rounded-2xl border border-[#eef5f6] bg-[#f0f9ff] p-6">
            <p className="min-h-[100px] whitespace-pre-wrap leading-relaxed text-nav-primary">
              {detail.content}
            </p>

            {detail.images.length > 0 && (
              <div className="mt-6 grid grid-cols-3 gap-3">
                {detail.images.map(img => (
                  <a
                    key={img.complaintImageId}
                    href={img.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`첨부 이미지: ${img.originalName}`}
                    className="group block"
                  >
                    <div className="relative overflow-hidden rounded-xl border-2 border-white shadow-sm">
                      <img
                        src={img.fileUrl}
                        alt={img.originalName}
                        className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                        <ImageIcon className="text-white" size={20} aria-hidden="true" />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* 액션 영역 */}
          <div className="space-y-6">
            <div>
              <label className="mb-3 flex items-center gap-2 text-[15px] font-bold text-nav-primary">
                <CheckCircle size={18} className="text-nav-accent" aria-hidden="true" />
                처리 상태 변경
              </label>
              <div className="grid grid-cols-4 gap-2" role="group" aria-label="처리 상태 선택">
                {PATCH_STATUS_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => onStatusChange(value)}
                    aria-pressed={targetStatus === value}
                    className={`rounded-xl border-2 py-2.5 text-xs font-bold transition-all ${targetStatus === value
                      ? "border-nav-accent bg-nav-accent text-white shadow-md shadow-nav-accent/20"
                      : "border-[#eef5f6] bg-white text-nav-inactive hover:border-nav-accent/30"
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-comment"
                className="mb-3 flex items-center gap-2 text-[15px] font-bold text-nav-primary"
              >
                <Info size={18} className="text-nav-accent" aria-hidden="true" />
                관리자 답변 / 메모
              </label>
              <textarea
                id="admin-comment"
                value={adminComment}
                onChange={e => onCommentChange(e.target.value)}
                placeholder="처리 내용을 입력하세요..."
                className="h-32 w-full resize-none rounded-2xl border-2 border-[#eef5f6] bg-[#f8fafb] p-4 text-sm outline-none transition-all focus:border-nav-accent focus:bg-white"
              />
            </div>

            <button
              onClick={onSave}
              className="w-full rounded-2xl bg-nav-accent py-4 font-bold text-white shadow-lg shadow-nav-accent/20 transition-all hover:bg-nav-accent/90 active:scale-[0.98]"
            >
              변경사항 저장하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────

export default function AdminComplaints() {
  const { alert, triggerAlert, closeAlert } = useAlert();

  const {
    complaints, loading,
    filterStatus, setFilterStatus,
    getCountByFilter, fetchComplaints,
  } = useComplaints(triggerAlert);

  const {
    selectedId, detail, adminComment, targetStatus,
    setAdminComment, setTargetStatus,
    openDetail, closeDetail, handleUpdateStatus,
  } = useComplaintDetail(fetchComplaints, triggerAlert);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#f0f9ff]">

        {/* ── 페이지 헤더 ── */}
        <div className="border-b border-nav-inactive/20 bg-white px-8 py-6">
          <h1 className="text-[32px] font-bold text-nav-primary">민원 관리</h1>
          <p className="mt-1 text-[14px] text-nav-inactive">실시간 접수된 학생들의 민원을 관리하세요</p>
        </div>

        <div className="p-8">
          {/* ── 상태 필터 ── */}
          <div className="mb-6 flex gap-3 overflow-x-auto pb-2" role="group" aria-label="상태 필터">
            {STATUS_FILTER_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilterStatus(value)}
                aria-pressed={filterStatus === value}
                className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm transition-all ${filterStatus === value
                  ? "bg-nav-accent text-white"
                  : "border border-nav-inactive/20 bg-white text-nav-inactive hover:bg-[#f0f9ff]"
                  }`}
              >
                {label}
                <span className={`rounded-md px-1.5 py-0.5 text-[11px] ${filterStatus === value
                  ? "bg-white/20 text-white"
                  : "bg-nav-active-bg-from text-nav-accent"
                  }`}>
                  {getCountByFilter(value)}
                </span>
              </button>
            ))}
          </div>

          {/* ── 민원 목록 ── */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="size-10 animate-spin text-nav-accent" aria-label="로딩 중" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {complaints.map(item => (
                <ComplaintCard key={item.complaintId} item={item} onOpen={openDetail} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 상세 모달 ── */}
      {selectedId && detail && (
        <ComplaintDetailModal
          detail={detail}
          adminComment={adminComment}
          targetStatus={targetStatus}
          onClose={closeDetail}
          onCommentChange={setAdminComment}
          onStatusChange={setTargetStatus}
          onSave={handleUpdateStatus}
        />
      )}

      {/* ── 알림 모달 ── */}
      {alert.show && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="alert-title"
          className="fixed inset-0 z-[100] flex items-center justify-center px-8"
          onClick={closeAlert}
        >
          <div className="absolute inset-0 bg-nav-primary/20 backdrop-blur-[3px]" aria-hidden="true" />
          <div
            className="relative w-full max-w-[320px] animate-in fade-in zoom-in duration-200 rounded-[28px] bg-white p-7 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-nav-active-bg-from">
                <AlertCircle className="text-nav-accent" size={28} aria-hidden="true" />
              </div>
              <h2 id="alert-title" className="mb-2 text-[17px] font-bold text-nav-primary">
                {alert.title}
              </h2>
              <p className="mb-6 whitespace-pre-wrap text-[14px] font-medium leading-relaxed text-nav-accent">
                {alert.message}
              </p>
              <button
                onClick={closeAlert}
                className="h-[50px] w-full rounded-[18px] bg-nav-accent font-bold text-white shadow-md transition-all active:scale-[0.96]"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}