import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import BottomNav from "../components/BottomNav";
import { Plus, Loader2, Check, AlertCircle } from "lucide-react";

// ─── 타입 ─────────────────────────────────────────────────

interface Complaint {
  complaintId: number;
  category: string;
  title: string;
  content: string;
  status: "RECEIVED" | "COMPLETED";
  queueNo: number | null;
  adminComment: string | null;
  createdAt: string;
}

interface EditState {
  id: number;
  title: string;
  content: string;
}

type AlertState =
  | { show: false }
  | { show: true; message: string; isConfirm: false }
  | { show: true; message: string; isConfirm: true; targetId: number };

// ─── 상수 ─────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, string> = {
  FACILITY: "시설 수리",
  RULE:     "생활 규칙",
  CLEANING: "청소",
  NOISE:    "소음",
  ETC:      "기타",
};

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  RECEIVED:  { label: "대기중", className: "bg-nav-active-bg-from text-nav-accent" },
  COMPLETED: { label: "완료",   className: "bg-[#e2f1e5] text-[#78c087]"           },
};

const TABS = ["전체", "대기중", "완료"] as const;
type Tab = typeof TABS[number];

const INITIAL_COMPLAINTS: Complaint[] = [
  {
    complaintId: 1,
    category: "FACILITY",
    title: "냉장고 고장",
    content: "3층 302호 냉장고가 작동하지 않습니다. 수리 부탁드려요.",
    status: "RECEIVED",
    queueNo: 1,
    adminComment: null,
    createdAt: "2026-03-29T10:00:00",
  },
  {
    complaintId: 2,
    category: "FACILITY",
    title: "조명 교체 요청",
    content: "복도 끝쪽 전등이 깜빡거립니다.",
    status: "COMPLETED",
    queueNo: null,
    adminComment: "전구 교체 완료했습니다. 불편을 드려 죄송합니다.",
    createdAt: "2026-03-30T14:00:00",
  },
  {
    complaintId: 3,
    category: "FACILITY",
    title: "세탁기 고장",
    content: "2층 302호 세탁기가 작동하지 않습니다. 수리 부탁드려요.",
    status: "RECEIVED",
    queueNo: 2,
    adminComment: null,
    createdAt: "2026-03-30T18:00:00",
  },
];

const STORAGE_KEY = "mock_complaints";

const formatDate = (iso: string) =>
  iso.split("T")[0].replace(/-/g, ". ") + ".";

// ─── 메인 컴포넌트 ─────────────────────────────────────────

export default function Complaints() {
  const navigate = useNavigate();

  const [isLoggedIn]    = useState(() => sessionStorage.getItem("isLoggedIn") === "true");
  const [activeTab, setActiveTab]     = useState<Tab>("전체");
  const [complaints, setComplaints]   = useState<Complaint[]>([]);
  const [loading, setLoading]         = useState(true);
  const [expandedId, setExpandedId]   = useState<number | null>(null);
  const [editState, setEditState]     = useState<EditState | null>(null);
  const [alert, setAlert]             = useState<AlertState>({ show: false });

  useEffect(() => {
    if (!isLoggedIn) navigate("/auth/login");
  }, [isLoggedIn, navigate]);

  // ── 데이터 로드 ──
  const fetchComplaints = useCallback(() => {
    if (!isLoggedIn) return;
    setLoading(true);
    // TODO: 실제 API 호출로 교체
    setTimeout(() => {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as Complaint[];
      const data = saved.length > 0 ? saved : INITIAL_COMPLAINTS;
      setComplaints(data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setLoading(false);
    }, 400);
  }, [isLoggedIn]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  // ── 탭 카운트 ──
  const counts = useMemo<Record<Tab, number>>(() => ({
    전체:  complaints.length,
    대기중: complaints.filter(c => c.status === "RECEIVED").length,
    완료:  complaints.filter(c => c.status === "COMPLETED").length,
  }), [complaints]);

  // ── 필터 + 정렬 ──
  const filteredComplaints = useMemo(() => {
    const filtered = complaints.filter(c => {
      if (activeTab === "전체")  return true;
      if (activeTab === "대기중") return c.status === "RECEIVED";
      return c.status === "COMPLETED";
    });
    return [...filtered].sort((a, b) => b.complaintId - a.complaintId);
  }, [complaints, activeTab]);

  // ── 수정 저장 ──
  const handleSave = useCallback((id: number) => {
    if (!editState) return;
    setComplaints(prev => {
      const updated = prev.map(c =>
        c.complaintId === id
          ? { ...c, title: editState.title, content: editState.content }
          : c
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    setEditState(null);
  }, [editState]);

  // ── 삭제 확인 ──
  const confirmDelete = useCallback((id: number) => {
    setAlert({ show: true, message: "정말 삭제하시겠습니까?", isConfirm: true, targetId: id });
  }, []);

  // ── 삭제 실행 ──
  const handleDelete = useCallback((targetId: number) => {
    setComplaints(prev => {
      const updated = prev.filter(c => c.complaintId !== targetId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    setAlert({ show: false });
    setExpandedId(null);
  }, []);

  if (!isLoggedIn) return null;

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[448px] flex-col overflow-x-hidden bg-[#f0f9ff] font-sans shadow-2xl antialiased">

      {/* ── 알림 모달 ── */}
      {alert.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-nav-primary/20 px-8 backdrop-blur-[3px]">
          <div className="w-full max-w-[320px] animate-in fade-in zoom-in duration-200 rounded-[28px] bg-white p-7 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-nav-active-bg-from">
                {alert.isConfirm
                  ? <AlertCircle className="text-nav-accent" size={28} />
                  : <Check       className="text-nav-accent" size={28} />
                }
              </div>
              <h2 className="mb-2 text-[17px] font-bold text-nav-primary">알림</h2>
              <p className="mb-6 whitespace-pre-line text-[14px] font-medium leading-relaxed text-nav-accent">
                {alert.message}
              </p>
              <div className="flex w-full gap-2">
                {alert.isConfirm ? (
                  <>
                    <button
                      onClick={() => setAlert({ show: false })}
                      className="h-[50px] flex-1 rounded-[18px] bg-nav-accent-light font-bold text-nav-accent transition-all active:scale-[0.96]"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => handleDelete(alert.targetId)}
                      className="h-[50px] flex-1 rounded-[18px] bg-nav-accent font-bold text-white shadow-md transition-all active:scale-[0.96]"
                    >
                      확인
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setAlert({ show: false })}
                    className="h-[50px] w-full rounded-[18px] bg-nav-accent font-bold text-white shadow-md transition-all active:scale-[0.96]"
                  >
                    확인
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 헤더 ── */}
      <div className="shrink-0 bg-[#f0f9ff] px-7 pb-6 pt-16">
        <h1 className="text-[28px] font-bold tracking-tight text-nav-primary">민원 접수</h1>
        <p className="mt-1 text-[13px] font-bold tracking-tight text-nav-inactive">
          불편사항을 접수하고 현황을 확인하세요
        </p>
      </div>

      {/* ── 탭 ── */}
      <div className="mb-6 flex shrink-0 gap-2 px-6">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`h-[44px] flex-1 rounded-[18px] text-[12px] font-bold shadow-sm transition-all ${
              activeTab === tab
                ? "bg-nav-accent text-white shadow-nav-accent/20"
                : "border border-[#eef6f7] bg-white text-nav-inactive"
            }`}
          >
            {tab} ({counts[tab]})
          </button>
        ))}
      </div>

      {/* ── 리스트 ── */}
      <div className="flex-1 space-y-4 overflow-y-auto px-6 pb-40">
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="mx-auto animate-spin text-nav-accent" />
          </div>
        ) : filteredComplaints.length > 0 ? (
          filteredComplaints.map(c => (
            <ComplaintCard
              key={c.complaintId}
              complaint={c}
              isExpanded={expandedId === c.complaintId}
              editState={editState?.id === c.complaintId ? editState : null}
              onToggle={() => {
                if (c.status !== "COMPLETED")
                  setExpandedId(prev => prev === c.complaintId ? null : c.complaintId);
              }}
              onEditStart={() => setEditState({ id: c.complaintId, title: c.title, content: c.content })}
              onEditChange={setEditState}
              onEditSave={() => handleSave(c.complaintId)}
              onEditCancel={() => setEditState(null)}
              onDeleteConfirm={() => confirmDelete(c.complaintId)}
            />
          ))
        ) : (
          <div className="py-20 text-center text-[13px] font-bold text-nav-inactive">
            건의사항이 없습니다.
          </div>
        )}
      </div>

      {/* ── 새 민원 버튼 ── */}
      <div className="pointer-events-none fixed bottom-[100px] z-30 flex w-full max-w-[448px] justify-end px-6">
        <button
          onClick={() => navigate("/complaints/submit")}
          className="pointer-events-auto flex items-center gap-2 rounded-[20px] bg-nav-accent px-6 py-4 font-bold text-white shadow-lg shadow-nav-accent/30 transition-all active:scale-95"
        >
          <Plus size={20} strokeWidth={3} />
          <span>새 민원 접수</span>
        </button>
      </div>

      <BottomNav />
    </div>
  );
}

// ─── ComplaintCard 서브 컴포넌트 ──────────────────────────

interface ComplaintCardProps {
  complaint: Complaint;
  isExpanded: boolean;
  editState: EditState | null;
  onToggle: () => void;
  onEditStart: () => void;
  onEditChange: (state: EditState) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onDeleteConfirm: () => void;
}

function ComplaintCard({
  complaint: c,
  isExpanded,
  editState,
  onToggle,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
  onDeleteConfirm,
}: ComplaintCardProps) {
  const isEditing = editState !== null;

  return (
    <div className="overflow-hidden rounded-[24px] border border-[#eef6f7] bg-white p-6 shadow-sm transition-all">
      {isEditing ? (
        // ── 수정 모드 ──
        <div className="space-y-3">
          <input
            type="text"
            value={editState.title}
            onChange={e => onEditChange({ ...editState, title: e.target.value })}
            className="w-full rounded-[12px] border border-[#eef6f7] bg-[#f8fbff] px-4 py-2 text-[15px] font-bold text-nav-primary focus:border-nav-accent focus:outline-none"
          />
          <textarea
            value={editState.content}
            onChange={e => onEditChange({ ...editState, content: e.target.value })}
            className="w-full min-h-[100px] resize-none rounded-[12px] border border-[#eef6f7] bg-[#f8fbff] px-4 py-3 text-[13px] text-nav-primary focus:border-nav-accent focus:outline-none"
          />
          <div className="flex gap-2 pt-2">
            <button
              onClick={onEditSave}
              className="flex-1 rounded-[12px] bg-nav-accent py-3 text-[13px] font-bold text-white transition-all active:scale-95"
            >
              저장
            </button>
            <button
              onClick={onEditCancel}
              className="flex-1 rounded-[12px] border border-[#eef6f7] bg-white py-3 text-[13px] font-bold text-nav-inactive transition-all active:scale-95"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        // ── 카드 뷰 ──
        <div
          onClick={onToggle}
          className={c.status !== "COMPLETED" ? "cursor-pointer" : "cursor-default"}
        >
          <h3 className="mb-1 text-[18px] font-bold text-nav-primary">{c.title}</h3>
          <p className="mb-4 line-clamp-2 text-[14px] leading-relaxed text-nav-inactive">{c.content}</p>

          {c.status === "RECEIVED" && c.queueNo && (
            <div className="mb-5 inline-block rounded-full bg-[#fff9c4] px-3 py-1.5 text-[12px] font-bold text-[#8c7b00]">
              대기 순서: {c.queueNo}번째
            </div>
          )}

          {c.status === "COMPLETED" && c.adminComment && (
            <div className="mb-5 rounded-[16px] border border-[#e3f2fd] bg-[#f4faff] p-4">
              <p className="text-[13px] font-semibold leading-relaxed text-nav-primary">
                {c.adminComment}
              </p>
            </div>
          )}

          <div className="mt-2 flex items-center justify-between border-t border-[#eef6f7] pt-3">
            <div className="flex gap-3 text-[12px] font-medium text-nav-inactive">
              <span>{CATEGORY_MAP[c.category]}</span>
              <span>{formatDate(c.createdAt)}</span>
            </div>
            <span className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${STATUS_MAP[c.status]?.className}`}>
              {STATUS_MAP[c.status]?.label}
            </span>
          </div>

          {isExpanded && c.status !== "COMPLETED" && (
            <div className="mt-4 flex animate-in fade-in zoom-in-95 gap-2 border-t border-[#f8fbff] pt-4">
              <button
                onClick={e => { e.stopPropagation(); onEditStart(); }}
                className="flex-1 rounded-[12px] border border-[#eef6f7] bg-[#f8fbff] py-2.5 text-[12px] font-bold text-nav-accent transition-all active:scale-95"
              >
                수정
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDeleteConfirm(); }}
                className="flex-1 rounded-[12px] border border-[#ffe3e3] bg-[#fff5f5] py-2.5 text-[12px] font-bold text-[#ff6b6b] transition-all active:scale-95"
              >
                삭제
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}