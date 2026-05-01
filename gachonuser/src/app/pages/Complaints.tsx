import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import BottomNav from "../components/BottomNav";
import { Plus, Loader2, Check, AlertCircle } from "lucide-react";
import api from "../api/axios";

const CATEGORY_MAP: Record<string, string> = {
  FACILITY: "시설 수리",
  RULE: "생활 규칙",
  CLEANING: "청소",
  NOISE: "소음",
  ETC: "기타",
};

const STATUS_MAP: Record<string, { label: string; color: string; apiValue: string | null }> = {
  전체: { label: "전체", color: "", apiValue: null },
  대기중: { label: "대기중", color: "bg-[#d1eff5] text-[#5eb9ca]", apiValue: "RECEIVED" },
  완료: { label: "완료", color: "bg-[#e2f1e5] text-[#78c087]", apiValue: "COMPLETED" },
};

export default function Complaints() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("전체");
  const [complaints, setComplaints] = useState<any[]>([]);
  const [details, setDetails] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [alertConfig, setAlertConfig] = useState<{
    show: boolean;
    message: string;
    isConfirm: boolean;
    targetId: number | null;
  }>({ show: false, message: "", isConfirm: false, targetId: null });

  const [isSaving, setIsSaving] = useState(false);

  const [editId, setEditId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("FACILITY");
  const [idsToDelete, setIdsToDelete] = useState<number[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);

  const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";

  // 1. 민원 목록 조회 (GET /api/complaints)
  const fetchComplaints = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const params: any = { page: 0, size: 20 };
      const statusFilter = STATUS_MAP[activeTab].apiValue;
      if (statusFilter) params.status = statusFilter;

      const response = await api.get("/complaints", { params });
      if (response.data.code === 200) {
        setComplaints(response.data.data);
      }
    } catch (error) {
      console.error("민원 목록 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, activeTab]);

  useEffect(() => {
    if (!isLoggedIn) navigate("/auth/login");
    else fetchComplaints();
  }, [isLoggedIn, navigate, fetchComplaints]);

  // 2. 민원 상세 조회 (GET /api/complaints/{complaintid})
  const handleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(id);
    // 즉시 펼치기

    if (!details[id]) {
      try {
        const response = await api.get(`/complaints/${id}`);
        if (response.data.code === 200) {
          setDetails(prev => ({ ...prev, [id]: response.data.data }));
        }
      } catch (error) {
        setAlertConfig({
          show: true,
          message: "접근 권한이 없거나 삭제된 게시물입니다.",
          isConfirm: false,
          targetId: null
        });
        setExpandedId(null);
      }
    }
  };

  // 3. 민원 수정 (PATCH /api/complaints/{id})
  const handleSave = async (id: number) => {
    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append("title", editTitle);
      formData.append("content", editContent);
      formData.append("category", editCategory);

      idsToDelete.forEach(id => formData.append("deleteImageIds", id.toString()));

      newImageFiles.forEach((file) => {
        formData.append("images", file);
      });

      const response = await api.patch(`/complaints/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (response.data.code === 200) {
        setAlertConfig({ show: true, message: "수정되었습니다.", isConfirm: false, targetId: null });
        setEditId(null);

        // 상태 초기화
        setNewImageFiles([]);
        setIdsToDelete([]);

        // 목록 새로고침
        fetchComplaints();

        // 캐시된 상세 데이터 삭제
        const newDetails = { ...details };
        delete newDetails[id];
        setDetails(newDetails);
      }
    } catch (error) {
      setAlertConfig({ show: true, message: "수정에 실패했습니다.", isConfirm: false, targetId: null });
    } finally {
      setIsSaving(false);
      // 요청 완료 시 false
    }
  };

  // 4. 민원 삭제 (DELETE /api/complaints/{id})
  const handleDelete = async () => {
    if (alertConfig.targetId !== null) {
      try {
        const response = await api.delete(`/complaints/${alertConfig.targetId}`);
        if (response.data.code === 200) {
          setAlertConfig({ show: false, message: "", isConfirm: false, targetId: null });
          setExpandedId(null);
          fetchComplaints();
          // 목록 새로고침
        }
      } catch (error) {
        setAlertConfig({ show: true, message: "삭제할 수 없는 상태이거나 오류가 발생했습니다.", isConfirm: false, targetId: null });
      }
    }
  };

  const confirmDelete = (id: number) => {
    setAlertConfig({
      show: true,
      message: "정말 삭제하시겠습니까?",
      isConfirm: true,
      targetId: id
    });
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
            {tab}
          </button>
        ))}
      </div>

      {/* 리스트 영역 */}
      <div className="px-6 flex-1 pb-40 space-y-4 overflow-y-auto">
        {loading ? (
          <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-[#5eb9ca]" /></div>
        ) : complaints.length > 0 ? (
          complaints.map((c) => {
            const detail = details[c.complaintId];
            const isExpanded = expandedId === c.complaintId;

            return (
              <div key={c.complaintId} className="bg-white rounded-[24px] border border-[#eef6f7] shadow-sm overflow-hidden transition-all p-6">

                {editId === c.complaintId ? (
                  /* --- 수정 모드 --- */
                  <div className="space-y-3">
                    <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-4 py-2 bg-[#f8fbff] border border-[#eef6f7] rounded-[12px] text-[15px] font-bold focus:outline-none focus:border-[#5eb9ca]" />
                    <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
                      className="w-full px-4 py-3 bg-[#f8fbff] border border-[#eef6f7] rounded-[12px] text-[13px] min-h-[100px] resize-none focus:outline-none focus:border-[#5eb9ca]" />

                    {detail?.images && detail.images.length > 0 && (
                      <div>
                        <p className="text-[12px] font-bold text-[#5eb9ca] mb-2">등록한 사진</p>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {detail.images
                            .filter((img: any) => !idsToDelete.includes(img.complaintImageId))
                            .map((img: any) => (
                              <div key={img.complaintImageId} className="relative group">
                                <img src={img.fileUrl} className="w-16 h-16 object-cover rounded-lg border border-[#eef6f7]" />
                                <button
                                  onClick={() => setIdsToDelete([...idsToDelete, img.complaintImageId])}
                                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-sm"
                                >X</button>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    )}

                    <div className="pt-2">
                      <label className="block text-[12px] font-bold text-[#5eb9ca] mb-2">사진 추가</label>
                      <input type="file" multiple accept="image/*"
                        onChange={(e) => {
                          if (e.target.files) {
                            setNewImageFiles(Array.from(e.target.files));
                          }
                        }}
                        className="w-full text-[12px] text-[#054a57] file:mr-4 file:py-2 file:px-4 file:rounded-[12px] file:border-0 file:text-[11px] file:font-bold file:bg-[#eef6f7] file:text-[#5eb9ca] hover:file:bg-[#e0f0f2]"
                      />
                      {newImageFiles.length > 0 && (
                        <p className="text-[11px] text-[#adb5bd] mt-1 font-medium">{newImageFiles.length}개의 파일 선택됨</p>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button onClick={() => handleSave(c.complaintId)} disabled={isSaving} className={`flex-1 py-3 bg-[#5eb9ca] text-white rounded-[12px] font-bold text-[13px] active:scale-95 transition-all" ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {isSaving ? "저장 중..." : "저장"}
                        </button>
                      <button onClick={() => setEditId(null)} className="flex-1 py-3 bg-white border border-[#eef6f7] text-[#adb5bd] rounded-[12px] font-bold text-[13px] active:scale-95 transition-all">취소</button>
                    </div>
                  </div>
                ) : (
                  /* --- 카드 UI --- */
                  <div onClick={() => handleExpand(c.complaintId)} className="cursor-pointer">
                    <h3 className="font-bold text-[18px] text-[#054a57] mb-1">{c.title}</h3>

                    {/* 상세 내용 표시 (펼쳐졌을 때만) */}
                    <p className={`text-[14px] text-[#607d8b] mb-4 leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>
                      {isExpanded
                        ? (detail ? detail.content : "내용을 불러오는 중...")
                        : ""}
                    </p>

                    {/* 이미지 렌더링 */}
                    {isExpanded && detail?.images && detail.images.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
                        {detail.images.map((img: any) => (
                          <img
                            key={img.complaintImageId}
                            src={img.fileUrl}
                            className="w-20 h-20 object-cover rounded-xl border border-[#eef6f7]"
                            alt="첨부이미지"
                            loading="lazy"
                          />
                        ))}
                      </div>
                    )}

                    {/* 대기 순번 (상세 데이터에 있을 때) */}
                    {isExpanded && detail?.queueNo && detail.status === "RECEIVED" && (
                      <div className="inline-block bg-[#fff9c4] text-[#8c7b00] text-[12px] font-bold px-3 py-1.5 rounded-full mb-5">
                        대기 순서: {detail.queueNo}번째
                      </div>
                    )}

                    {/* 관리자 답변 (상세 데이터에 있을 때) */}
                    {isExpanded && detail?.adminComment && (
                      <div className="bg-[#f4faff] p-4 rounded-[16px] mb-5 border border-[#e3f2fd]">
                        <p className="text-[11px] font-bold text-[#5eb9ca] mb-1">관리자 답변</p>
                        <p className="text-[13px] text-[#054a57] font-semibold leading-relaxed">
                          {detail.adminComment}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-2 border-t border-[#fcfdfe] pt-3">
                      <div className="flex gap-3 text-[12px] text-[#adb5bd] font-medium">
                        <span>{CATEGORY_MAP[c.category] || c.category}</span>
                        <span>{c.createdAt?.split('T')[0].replace(/-/g, '. ')}.</span>
                      </div>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${c.status === 'COMPLETED' ? 'bg-[#e2f1e5] text-[#78c087]' : 'bg-[#d1eff5] text-[#5eb9ca]'}`}>
                        {c.status === 'COMPLETED' ? '완료' : '대기중'}
                      </span>
                    </div>

                    {/* 수정/삭제 버튼 (대기중 상태일 때만) */}
                    {isExpanded && c.status === "RECEIVED" && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-[#f8fbff] animate-in fade-in zoom-in-95">
                        <button onClick={(e) => {
                          setEditId(c.complaintId);
                          setEditTitle(detail?.title || c.title);
                          setEditContent(detail?.content || "");
                          setEditCategory(detail?.category || c.category);
                          setIdsToDelete([]);
                          setNewImageFiles([]);
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
            );
          })
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