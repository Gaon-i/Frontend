import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import BottomNav from "../components/BottomNav";
import { Plus, Loader2, Check, AlertCircle } from "lucide-react";

const CATEGORY_MAP: Record<string, string> = {
  FACILITY: "시설 수리",
  RULE: "생활 규칙",
  CLEANING: "청소",
  NOISE: "소음",
  ETC: "기타",
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  RECEIVED: { label: "대기중", color: "bg-[#d1eff5] text-[#5eb9ca]" },
  COMPLETED: { label: "완료", color: "bg-[#e2f1e5] text-[#78c087]" },
};

export default function Complaints() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("전체");
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [alertConfig, setAlertConfig] = useState<{
    show: boolean;
    message: string;
    isConfirm: boolean;
    targetId: number | null;
  }>({ show: false, message: "", isConfirm: false, targetId: null });

  const [editId, setEditId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";

  useEffect(() => {
    if (!isLoggedIn) navigate("/auth/login");
  }, [isLoggedIn, navigate]);

  const fetchComplaints = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    setTimeout(() => {
      const savedData = JSON.parse(localStorage.getItem("mock_complaints") || "[]");
      const initialData = [
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
      const finalData = savedData.length === 0 ? initialData : savedData;
      setComplaints(finalData);
      localStorage.setItem("mock_complaints", JSON.stringify(finalData));
      setLoading(false);
    }, 400);
  }, [isLoggedIn]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const counts = useMemo(() => ({
    전체: complaints.length,
    대기중: complaints.filter(c => c.status === "RECEIVED").length,
    완료: complaints.filter(c => c.status === "COMPLETED").length,
  }), [complaints]);

  // [중요] 필터링 후 ID 기준 내림차순 정렬 (최신순)
  const filteredComplaints = useMemo(() => {
    const filtered = complaints.filter(c => {
      if (activeTab === "전체") return true;
      if (activeTab === "대기중") return c.status === "RECEIVED";
      return c.status === "COMPLETED";
    });
    return [...filtered].sort((a, b) => b.complaintId - a.complaintId);
  }, [complaints, activeTab]);

  const handleSave = (id: number) => {
    const updated = complaints.map(c => 
      c.complaintId === id ? { ...c, title: editTitle, content: editContent } : c
    );
    setComplaints(updated);
    localStorage.setItem("mock_complaints", JSON.stringify(updated));
    setEditId(null);
  };

  const confirmDelete = (id: number) => {
    setAlertConfig({
      show: true,
      message: "정말 삭제하시겠습니까?",
      isConfirm: true,
      targetId: id
    });
  };

  const handleDelete = () => {
    if (alertConfig.targetId !== null) {
      const updated = complaints.filter(c => c.complaintId !== alertConfig.targetId);
      setComplaints(updated);
      localStorage.setItem("mock_complaints", JSON.stringify(updated));
      setAlertConfig({ show: false, message: "", isConfirm: false, targetId: null });
      setExpandedId(null);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <div className="bg-[#f6fbff] min-h-screen w-full max-w-[448px] mx-auto relative shadow-2xl flex flex-col overflow-x-hidden antialiased font-sans">
      
      {/* 알림 모달 */}
      {alertConfig.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-8 bg-[#054a57]/20 backdrop-blur-[3px]">
          <div className="bg-white w-full max-w-[320px] rounded-[28px] shadow-2xl p-7 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="size-[56px] bg-[#f0f9ff] rounded-full flex items-center justify-center mb-4">
                {alertConfig.isConfirm ? <AlertCircle className="text-[#5eb9ca]" size={28} /> : <Check className="text-[#5eb9ca]" size={28} />}
              </div>
              <h2 className="text-[17px] font-bold text-[#054a57] mb-2">알림</h2>
              <p className="text-[14px] font-medium text-[#7aaeb7] leading-relaxed mb-6 whitespace-pre-line">{alertConfig.message}</p>
              <div className="flex gap-2 w-full">
                {alertConfig.isConfirm ? (
                  <>
                    <button onClick={() => setAlertConfig({ ...alertConfig, show: false })} className="flex-1 h-[50px] bg-slate-100 text-slate-500 font-bold rounded-[18px] active:scale-[0.96]">취소</button>
                    <button onClick={handleDelete} className="flex-1 h-[50px] bg-[#5eb9ca] text-white font-bold rounded-[18px] shadow-md active:scale-[0.96]">확인</button>
                  </>
                ) : (
                  <button onClick={() => setAlertConfig({ ...alertConfig, show: false })} className="w-full h-[50px] bg-[#5eb9ca] text-white font-bold rounded-[18px] shadow-md active:scale-[0.96]">확인</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="pt-16 px-7 pb-6 bg-[#f6fbff] shrink-0">
        <h1 className="font-bold text-[28px] text-[#054a57] tracking-tight">민원 접수</h1>
        <p className="text-[#607d8b] text-[13px] font-bold mt-1 tracking-tight">불편사항을 접수하고 현황을 확인하세요</p>
      </div>

      {/* 탭 메뉴 */}
      <div className="px-6 flex gap-2 mb-6 shrink-0">
        {["전체", "대기중", "완료"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 h-[44px] rounded-[18px] text-[12px] font-bold shadow-sm transition-all
              ${activeTab === tab ? "bg-[#5eb9ca] text-white shadow-[#5eb9ca]/20" : "bg-white text-[#adb5bd] border border-[#eef6f7]"}`}>
            {tab} ({counts[tab as keyof typeof counts]})
          </button>
        ))}
      </div>

      {/* 리스트 영역 */}
      <div className="px-6 flex-1 pb-40 space-y-4 overflow-y-auto">
        {loading ? (
          <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-[#5eb9ca]" /></div>
        ) : filteredComplaints.length > 0 ? (
          filteredComplaints.map((c) => (
            <div key={c.complaintId} className="bg-white rounded-[24px] border border-[#eef6f7] shadow-sm overflow-hidden transition-all p-6">
              
              {editId === c.complaintId ? (
                /* --- 수정 모드 --- */
                <div className="space-y-3">
                  <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-[#f8fbff] border border-[#eef6f7] rounded-[12px] text-[15px] font-bold focus:outline-none focus:border-[#5eb9ca]" />
                  <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-4 py-3 bg-[#f8fbff] border border-[#eef6f7] rounded-[12px] text-[13px] min-h-[100px] resize-none focus:outline-none focus:border-[#5eb9ca]" />
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => handleSave(c.complaintId)} className="flex-1 py-3 bg-[#5eb9ca] text-white rounded-[12px] font-bold text-[13px] active:scale-95 transition-all">저장</button>
                    <button onClick={() => setEditId(null)} className="flex-1 py-3 bg-white border border-[#eef6f7] text-[#adb5bd] rounded-[12px] font-bold text-[13px] active:scale-95 transition-all">취소</button>
                  </div>
                </div>
              ) : (
                /* --- 카드 UI --- */
                <div 
                  onClick={() => {
                    // [중요] 완료된 항목은 클릭해도 수정/삭제 버튼이 안 나오게 함
                    if (c.status !== "COMPLETED") {
                      setExpandedId(expandedId === c.complaintId ? null : c.complaintId);
                    }
                  }} 
                  className={`${c.status !== "COMPLETED" ? "cursor-pointer" : "cursor-default"}`}
                >
                  <h3 className="font-bold text-[18px] text-[#054a57] mb-1">{c.title}</h3>
                  <p className="text-[14px] text-[#607d8b] mb-4 leading-relaxed line-clamp-2">{c.content}</p>

                  {c.status === "RECEIVED" && c.queueNo && (
                    <div className="inline-block bg-[#fff9c4] text-[#8c7b00] text-[12px] font-bold px-3 py-1.5 rounded-full mb-5">
                      대기 순서: {c.queueNo}번째
                    </div>
                  )}

                  {c.status === "COMPLETED" && c.adminComment && (
                    <div className="bg-[#f4faff] p-4 rounded-[16px] mb-5 border border-[#e3f2fd]">
                      <p className="text-[13px] text-[#054a57] font-semibold leading-relaxed">
                        {c.adminComment}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-2 border-t border-[#fcfdfe] pt-3">
                    <div className="flex gap-3 text-[12px] text-[#adb5bd] font-medium">
                      <span>{CATEGORY_MAP[c.category]}</span>
                      <span>{c.createdAt?.split('T')[0].replace(/-/g, '. ')}.</span>
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${STATUS_MAP[c.status]?.color}`}>
                      {STATUS_MAP[c.status]?.label}
                    </span>
                  </div>

                  {/* [중요] '완료' 상태가 아닐 때만 수정/삭제 버튼 노출 */}
                  {expandedId === c.complaintId && c.status !== "COMPLETED" && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-[#f8fbff] animate-in fade-in zoom-in-95">
                      <button onClick={(e) => { 
                          e.stopPropagation(); 
                          setEditId(c.complaintId); 
                          setEditTitle(c.title); 
                          setEditContent(c.content); 
                        }} 
                        className="flex-1 py-2.5 bg-[#f8fbff] text-[#5eb9ca] rounded-[12px] text-[12px] font-bold border border-[#eef6f7] active:scale-95 transition-all">수정</button>
                      <button onClick={(e) => { 
                          e.stopPropagation(); 
                          confirmDelete(c.complaintId);
                        }} 
                        className="flex-1 py-2.5 bg-[#fff5f5] text-[#ff6b6b] rounded-[12px] text-[12px] font-bold border border-[#ffe3e3] active:scale-95 transition-all">삭제</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="py-20 text-center text-[#adb5bd] text-[13px] font-bold">건의사항이 없습니다.</div>
        )}
      </div>

      <div className="fixed bottom-[100px] w-full max-w-[448px] px-6 flex justify-end z-30 pointer-events-none">
        <button onClick={() => navigate('/complaints/submit')} 
          className="pointer-events-auto bg-[#5eb9ca] text-white px-6 py-4 rounded-[20px] shadow-lg shadow-[#5eb9ca]/30 flex items-center gap-2 font-bold active:scale-95 transition-all">
          <Plus size={20} strokeWidth={3} />
          <span>새 민원 접수</span>
        </button>
      </div>

      <div className="fixed bottom-0 w-full max-w-[448px] z-40 bg-white/95 backdrop-blur-md border-t border-[#eef6f7]">
        <BottomNav />
      </div>
    </div>
  );
}