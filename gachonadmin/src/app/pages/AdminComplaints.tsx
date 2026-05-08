import { useState, useEffect, useCallback } from "react";
import {
  Clock, CheckCircle, AlertCircle, Building2,
  User, Info, Loader2, Image as ImageIcon, LucideIcon,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import api from "../api/axios";

// ─── Types ────────────────────────────────────────────────────────────────────

type ComplaintCategory = "FACILITY" | "RULE" | "CLEANING" | "NOISE" | "ETC";
type ComplaintStatus   = "RECEIVED" | "COMPLETED";

interface ComplaintImage {
  complaintImageId: number;
  fileUrl: string;
  originalName: string;
}

interface ComplaintDetail {
  complaintId:      number;
  userId:           number;
  userName:         string;
  category:         ComplaintCategory;
  title:            string;
  content:          string;
  status:           ComplaintStatus;
  queueNo?:         number;
  dormitoryId:      number;
  roomId:           number;
  assignedAdminId:  number | null;
  adminComment:     string | null;
  resolvedAt:       string | null;
  createdAt:        string;
  updatedAt:        string;
  images:           ComplaintImage[];
}

interface StatusInfo {
  label: string;
  color: string;
  icon:  LucideIcon;
}

interface TotalCounts {
  ALL:       number;
  RECEIVED:  number;
  COMPLETED: number;
}

interface AlertState {
  show:    boolean;
  title:   string;
  message: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DORMITORY_NAMES: Record<number, string> = {
  1: "제1학생생활관",
  2: "제2학생생활관",
  3: "제3학생생활관",
};

const CATEGORY_MAP: Record<ComplaintCategory, string> = {
  FACILITY: "시설 수리",
  RULE:     "생활 규칙",
  CLEANING: "청소 요청",
  NOISE:    "소음 신고",
  ETC:      "기타 문의",
};

const STATUS_MAP: Record<ComplaintStatus, StatusInfo> = {
  RECEIVED:  { label: "대기 중",   color: "bg-gray-100 text-gray-500",   icon: Clock        },
  COMPLETED: { label: "처리 완료", color: "bg-green-100 text-green-600", icon: CheckCircle  },
};

const STATUS_FILTER_OPTIONS = [
  { value: "전체",     label: "전체"     },
  { value: "RECEIVED", label: "대기 중"  },
  { value: "COMPLETED",label: "처리 완료"},
] as const;

const PATCH_STATUS_OPTIONS: { value: ComplaintStatus; label: string }[] = [
  { value: "RECEIVED",  label: "접수"     },
  { value: "COMPLETED", label: "처리 완료"},
];

const ERROR_MESSAGES: Record<number, string> = {
  403: "민원 목록 접근 권한이 없습니다.\n관리자 계정인지 확인해 주세요.",
};

// ─── Utils ────────────────────────────────────────────────────────────────────

const getDormitoryName = (id: number) =>
  DORMITORY_NAMES[id] ?? `${id}생활관`;

const formatDate = (iso: string) => iso.split("T")[0];
const formatTime = (iso: string) => iso.split("T")[1]?.substring(0, 5) ?? "";

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useAlert() {
  const [alert, setAlert] = useState<AlertState>({ show: false, title: "", message: "" });

  const triggerAlert = useCallback((title: string, message: string) => {
    setAlert({ show: true, title, message });
  }, []);

  const closeAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, show: false }));
  }, []);

  return { alert, triggerAlert, closeAlert };
}

function useComplaints(triggerAlert: (title: string, msg: string) => void) {
  const [complaints,   setComplaints]   = useState<ComplaintDetail[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [filterStatus, setFilterStatus] = useState("전체");
  const [totalCounts,  setTotalCounts]  = useState<TotalCounts>({ ALL: 0, RECEIVED: 0, COMPLETED: 0 });

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page: 0, size: 10 };
      if (filterStatus !== "전체") params.status = filterStatus;

      const { data } = await api.get<{
        code: number;
        data: { content: ComplaintDetail[]; totalElements: number };
      }>("/admin/complaints", { params });

      if (data.code === 200) {
        const { content, totalElements } = data.data;
        setComplaints(content);

        if (filterStatus === "전체") {
          setTotalCounts({
            ALL:       totalElements,
            RECEIVED:  content.filter((i) => i.status === "RECEIVED").length,
            COMPLETED: content.filter((i) => i.status === "COMPLETED").length,
          });
        }
      }
    } catch (error: any) {
      const status: number = error.response?.status;
      triggerAlert("오류", ERROR_MESSAGES[status] ?? "목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, triggerAlert]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const getCountByFilter = useCallback(
    (value: string): number => {
      if (value === "전체")     return totalCounts.ALL;
      if (value === "RECEIVED") return totalCounts.RECEIVED;
      if (value === "COMPLETED")return totalCounts.COMPLETED;
      return 0;
    },
    [totalCounts]
  );

  return { complaints, loading, filterStatus, setFilterStatus, getCountByFilter, fetchComplaints };
}

function useComplaintDetail(
  fetchComplaints: () => void,
  triggerAlert: (title: string, msg: string) => void
) {
  const [selectedId,    setSelectedId]    = useState<number | null>(null);
  const [detail,        setDetail]        = useState<ComplaintDetail | null>(null);
  const [adminComment,  setAdminComment]  = useState("");
  const [targetStatus,  setTargetStatus]  = useState<ComplaintStatus>("RECEIVED");

  const openDetail = useCallback(async (id: number) => {
    try {
      const { data } = await api.get<{ code: number; data: ComplaintDetail }>(
        `/admin/complaints/${id}`
      );
      const complaint = data.data;
      setDetail(complaint);
      setAdminComment(complaint.adminComment ?? "");
      setTargetStatus(complaint.status);
      setSelectedId(id);
    } catch {
      triggerAlert("오류", "상세 정보를 불러올 수 없습니다.");
    }
  }, [triggerAlert]);

  const closeDetail = useCallback(() => {
    setSelectedId(null);
    setDetail(null);
  }, []);

  const handleUpdateStatus = useCallback(async () => {
    if (!selectedId) return;
    try {
      await api.patch(`/admin/complaints/${selectedId}`, {
        status:       targetStatus,
        adminComment: adminComment,
      });
      triggerAlert("처리 완료", "민원 처리가 정상적으로 완료되었습니다.");
      closeDetail();
      fetchComplaints();
    } catch {
      triggerAlert("실패", "처리 중 오류가 발생했습니다.");
    }
  }, [selectedId, targetStatus, adminComment, triggerAlert, closeDetail, fetchComplaints]);

  return {
    selectedId, detail, adminComment, targetStatus,
    setAdminComment, setTargetStatus,
    openDetail, closeDetail, handleUpdateStatus,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

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
      <div className="bg-[#f6fbff] min-h-screen">

        {/* ── Page Header ───────────────────────────────────────────────── */}
        <div className="bg-white border-b border-[#e5f4f5] px-8 py-6">
          <h1 className="font-bold text-[32px] text-[#054a57]">민원 관리</h1>
          <p className="text-[14px] text-[#92a4a6] mt-1">실시간 접수된 학생들의 민원을 관리하세요</p>
        </div>

        <div className="p-8">

          {/* ── Status Filter ─────────────────────────────────────────── */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2" role="group" aria-label="상태 필터">
            {STATUS_FILTER_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilterStatus(value)}
                aria-pressed={filterStatus === value}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm flex items-center gap-2 ${
                  filterStatus === value
                    ? "bg-[#5eb9ca] text-white"
                    : "bg-white text-[#92a4a6] border border-[#e5f4f5] hover:bg-[#f0f9fa]"
                }`}
              >
                {label}
                <span className={`text-[11px] px-1.5 py-0.5 rounded-md ${
                  filterStatus === value
                    ? "bg-white/20 text-white"
                    : "bg-[#f0f9fa] text-[#5eb9ca]"
                }`}>
                  {getCountByFilter(value)}
                </span>
              </button>
            ))}
          </div>

          {/* ── Complaint List ────────────────────────────────────────── */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin size-10 text-[#5eb9ca]" aria-label="로딩 중" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {complaints.map((item) => {
                const statusInfo = STATUS_MAP[item.status] ?? STATUS_MAP.RECEIVED;
                const StatusIcon = statusInfo.icon;

                return (
                  <article
                    key={item.complaintId}
                    onClick={() => openDetail(item.complaintId)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && openDetail(item.complaintId)}
                    aria-label={`민원: ${item.title}`}
                    className="bg-white rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-[#5eb9ca]/30 group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-[11px] px-2.5 py-1 rounded-md font-bold ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      <StatusIcon className={`size-5 ${statusInfo.color.split(" ")[1]}`} aria-hidden="true" />
                    </div>
                    <h3 className="font-bold text-[#054a57] text-lg mb-2 truncate group-hover:text-[#5eb9ca] transition-colors">
                      {item.title}
                    </h3>
                    <div className="space-y-1.5 text-[13px] text-[#92a4a6] mb-4">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-[#5eb9ca]" aria-hidden="true" />
                        {item.userName}
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-[#5eb9ca]" aria-hidden="true" />
                        {getDormitoryName(item.dormitoryId)}
                        <span className="mx-1 text-[#e5f4f5]" aria-hidden="true">|</span>
                        {CATEGORY_MAP[item.category]}
                      </div>
                    </div>
                    <div className="pt-3 border-t border-[#f0f7f8] text-[12px] text-[#adb5bd] flex justify-between items-center">
                      <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
                      <span>{formatTime(item.createdAt)}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Detail Modal ──────────────────────────────────────────────────── */}
      {selectedId && detail && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-title"
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeDetail}
        >
          <div
            className="bg-white rounded-[24px] max-w-2xl w-full max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">

              {/* Detail Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex gap-2 items-center mb-2">
                    <span className="text-[#5eb9ca] font-bold text-xs bg-[#f0f9fa] px-3 py-1 rounded-full">
                      {CATEGORY_MAP[detail.category]}
                    </span>
                    {detail.queueNo && (
                      <span className="text-orange-500 font-bold text-xs bg-orange-50 px-3 py-1 rounded-full">
                        대기 {detail.queueNo}번
                      </span>
                    )}
                  </div>
                  <h2 id="detail-title" className="text-2xl font-bold text-[#054a57]">
                    {detail.title}
                  </h2>
                  <div className="flex items-center gap-4 mt-3 text-[13px] text-[#92a4a6]">
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
                  onClick={closeDetail}
                  aria-label="상세 닫기"
                  className="text-2xl text-[#92a4a6] hover:text-black transition-colors"
                >
                  ×
                </button>
              </div>

              {detail.resolvedAt && (
                <p className="text-[11px] text-[#adb5bd] mb-4">
                  최종 처리 완료: <time dateTime={detail.resolvedAt}>{new Date(detail.resolvedAt).toLocaleString()}</time>
                </p>
              )}

              {/* Content */}
              <div className="bg-[#f6fbff] rounded-2xl p-6 mb-8 border border-[#eef5f6]">
                <p className="text-[#054a57] leading-relaxed whitespace-pre-wrap min-h-[100px]">
                  {detail.content}
                </p>

                {detail.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-6">
                    {detail.images.map((img) => (
                      <a
                        key={img.complaintImageId}
                        href={img.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`첨부 이미지: ${img.originalName}`}
                        className="block group"
                      >
                        <div className="relative overflow-hidden rounded-xl border-2 border-white shadow-sm">
                          <img
                            src={img.fileUrl}
                            alt={img.originalName}
                            className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ImageIcon className="text-white" size={20} aria-hidden="true" />
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-6">
                <div>
                  <label className="text-[15px] font-bold text-[#054a57] mb-3 flex items-center gap-2">
                    <CheckCircle size={18} className="text-[#5eb9ca]" aria-hidden="true" />
                    처리 상태 변경
                  </label>
                  <div className="grid grid-cols-4 gap-2" role="group" aria-label="처리 상태 선택">
                    {PATCH_STATUS_OPTIONS.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setTargetStatus(value)}
                        aria-pressed={targetStatus === value}
                        className={`py-2.5 text-xs font-bold rounded-xl border-2 transition-all ${
                          targetStatus === value
                            ? "border-[#5eb9ca] bg-[#5eb9ca] text-white shadow-md shadow-[#5eb9ca]/20"
                            : "border-[#eef5f6] text-[#92a4a6] bg-white hover:border-[#5eb9ca]/30"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="admin-comment" className="text-[15px] font-bold text-[#054a57] mb-3 flex items-center gap-2">
                    <Info size={18} className="text-[#5eb9ca]" aria-hidden="true" />
                    관리자 답변 / 메모
                  </label>
                  <textarea
                    id="admin-comment"
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    placeholder="처리 내용을 입력하세요..."
                    className="w-full h-32 p-4 bg-[#f8fafb] border-2 border-[#eef5f6] rounded-2xl focus:border-[#5eb9ca] focus:bg-white outline-none resize-none text-sm transition-all"
                  />
                </div>

                <button
                  onClick={handleUpdateStatus}
                  className="w-full py-4 bg-[#054a57] text-white rounded-2xl font-bold hover:bg-[#0a5a69] transition-all shadow-lg shadow-[#054a57]/20 active:scale-[0.98]"
                >
                  변경사항 저장하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Alert Modal ───────────────────────────────────────────────────── */}
      {alert.show && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="alert-title"
          className="fixed inset-0 z-[100] flex items-center justify-center px-8"
        >
          <div
            className="absolute inset-0 bg-[#054a57]/20 backdrop-blur-[3px]"
            onClick={closeAlert}
            aria-hidden="true"
          />
          <div className="relative bg-white w-full max-w-[320px] rounded-[28px] shadow-2xl p-7 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="size-[56px] bg-[#f0f9ff] rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="text-[#5eb9ca]" size={28} aria-hidden="true" />
              </div>
              <h2 id="alert-title" className="text-[17px] font-bold text-[#054a57] mb-2">
                {alert.title}
              </h2>
              <p className="text-[14px] font-medium text-[#7aaeb7] leading-relaxed mb-6 whitespace-pre-wrap">
                {alert.message}
              </p>
              <button
                onClick={closeAlert}
                className="w-full h-[50px] bg-[#5eb9ca] text-white font-bold rounded-[18px] active:scale-[0.96] shadow-md"
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