import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Clock, CheckCircle, XCircle, AlertCircle, Building2, User, Info, Loader2, Image as ImageIcon } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import api from "../api/axios";

interface ComplaintDetail {
  complaintId: number;
  userId: number;
  userName: string;
  category: "FACILITY" | "RULE" | "CLEANING" | "NOISE" | "ETC";
  title: string;
  content: string;
  status: "RECEIVED" | "COMPLETED";
  queueNo?: number;
  dormitoryId: number;
  roomId: number;
  assignedAdminId: number | null;
  adminComment: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  images: {
    complaintImageId: number;
    fileUrl: string;
    originalName: string
  }[];
}

// 건물 이름 매핑 함수
const getDormitoryName = (id: number) => {
  const names: { [key: number]: string } = {
    1: "제1학생생활관",
    2: "제2학생생활관",
    3: "제3학생생활관",
  };
  return names[id] || `${id}생활관`;
};

// 매핑 객체
const CATEGORY_MAP = {
  FACILITY: "시설 수리",
  RULE: "생활 규칙",
  CLEANING: "청소 요청",
  NOISE: "소음 신고",
  ETC: "기타 문의",
};

// 명세서 기반 상태 매핑
const STATUS_MAP = {
  RECEIVED: { label: "대기 중", color: "bg-gray-100 text-gray-500", icon: Clock },
  COMPLETED: { label: "처리 완료", color: "bg-green-100 text-green-600", icon: CheckCircle },
  // 목록 API용 추가
};

// 필터 옵션 (서버 전송용 값)
const STATUS_OPTIONS = [
  { value: "전체", label: "전체" },
  { value: "RECEIVED", label: "대기 중" },
  { value: "COMPLETED", label: "처리 완료" },
];

// 상세 수정 시 버튼 옵션
const PATCH_STATUS_OPTIONS = [
  { value: "RECEIVED", label: "접수" },
  { value: "COMPLETED", label: "처리 완료" },
];

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState<ComplaintDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("전체");
  // 상태값

  // 상세 모달 관련
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ComplaintDetail | null>(null);
  const [adminComment, setAdminComment] = useState("");
  const [targetStatus, setTargetStatus] = useState("");

  // 알림 상태
  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [alertTitle, setAlertTitle] = useState("알림");

  // 알림창 제어 함수
  const triggerAlert = (title: string, msg: string) => {
    setAlertTitle(title);
    setAlertMsg(msg);
    setShowAlert(true);
  };

  // 전체 개수를 저장할 상태
  const [totalCounts, setTotalCounts] = useState({ ALL: 0, RECEIVED: 0, COMPLETED: 0 });

  // 1. 목록 조회 API
  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page: 0, size: 10 };

      // 서버 전송 시 영문 코드로 필터링
      if (filterStatus !== "전체") {
        params.status = filterStatus;
      }

      const response = await api.get("/admin/complaints", { params });

      if (response.data.code === 200) {
        const { content, totalElements } = response.data.data;
        setComplaints(content);

        if (filterStatus === "전체") {
          const received = content.filter((i: any) => i.status === "RECEIVED").length;
          const completed = content.filter((i: any) => i.status === "COMPLETED").length;
          setTotalCounts({
            ALL: totalElements,
            // 실제 전체 개수는 totalElements 활용
            RECEIVED: received,
            COMPLETED: completed
          });
        }
      }
    } catch (error: any) {
      const status = error.response?.status;
      const msg = status === 403 ? "민원 목록 접근 권한이 없습니다." : "목록을 불러오지 못했습니다.";
      triggerAlert("오류", msg);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // 버튼 옆 개수 표시 함수
  const getCountLabel = (value: string) => {
    if (value === "전체") return totalCounts.ALL;
    if (value === "RECEIVED") return totalCounts.RECEIVED;
    if (value === "COMPLETED") return totalCounts.COMPLETED;
    return 0;
  };

  // 2. 상세 조회 API
  const fetchDetail = async (id: number) => {
    try {
      const response = await api.get(`/admin/complaints/${id}`);
      const data = response.data.data;
      setDetail(data);
      setAdminComment(data.adminComment || "");
      setTargetStatus(data.status);
      setSelectedId(id);
    } catch (error) {
      triggerAlert("오류", "상세 정보를 불러올 수 없습니다.");
    }
  };

  // 3. 상태 및 답변 업데이트 API (PATCH)
  const handleUpdateStatus = async () => {
    if (!selectedId) return;
    try {
      await api.patch(`/admin/complaints/${selectedId}`, {
        status: targetStatus,
        adminComment: adminComment
      });
      // 성공 알림 적용
      triggerAlert("처리 완료", "민원 처리가 정상적으로 완료되었습니다.");
      setSelectedId(null);
      fetchComplaints();
    } catch (error) {
      triggerAlert("실패", "처리 중 오류가 발생했습니다.");
    }
  };

  return (
    <AdminLayout>
      <div className="bg-[#f6fbff] min-h-screen">
        <div className="bg-white border-b border-[#e5f4f5] px-8 py-6">
          <h1 className="font-bold text-[32px] text-[#054a57]">민원 관리</h1>
          <p className="text-[14px] text-[#92a4a6] mt-1">실시간 접수된 학생들의 민원을 관리하세요</p>
        </div>

        <div className="p-8">
          {/* 필터 섹션 */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilterStatus(opt.value)}
                // 클릭 시 filterStatus 변경 -> fetchComplaints 재실행
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm flex items-center gap-2 ${filterStatus === opt.value
                  ? "bg-[#5eb9ca] text-white"
                  : "bg-white text-[#92a4a6] border border-[#e5f4f5] hover:bg-[#f0f9fa]"
                  }`}
              >
                {opt.label}
                <span className={`text-[11px] px-1.5 py-0.5 rounded-md ${filterStatus === opt.value ? "bg-white/20 text-white" : "bg-[#f0f9fa] text-[#5eb9ca]"
                  }`}>
                  {getCountLabel(opt.value)}
                </span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin size-10 text-[#5eb9ca]" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {complaints.map((item) => {
                // 목록 API 응답이 RESOLVED 대신 COMPLETED로 올 수 있으므로 대응
                const statusKey = item.status as keyof typeof STATUS_MAP;
                const statusInfo = STATUS_MAP[statusKey] || STATUS_MAP.RECEIVED;
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={item.complaintId}
                    onClick={() => fetchDetail(item.complaintId)}
                    className="bg-white rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-[#5eb9ca]/30 group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-[11px] px-2.5 py-1 rounded-md font-bold ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      <StatusIcon className={`size-5 ${statusInfo.color.split(' ')[1]}`} />
                    </div>
                    <h3 className="font-bold text-[#054a57] text-lg mb-2 truncate group-hover:text-[#5eb9ca] transition-colors">
                      {item.title}
                    </h3>
                    <div className="space-y-1.5 text-[13px] text-[#92a4a6] mb-4">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-[#5eb9ca]" /> {item.userName}
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-[#5eb9ca]" />
                        {getDormitoryName(item.dormitoryId)}
                        {/* 숫자 -> 한글 변환 */}
                        <span className="mx-1 text-[#e5f4f5]">|</span>
                        {CATEGORY_MAP[item.category]}
                      </div>
                    </div>
                    <div className="pt-3 border-t border-[#f0f7f8] text-[12px] text-[#adb5bd] flex justify-between items-center">
                      <span>{item.createdAt.split('T')[0]}</span>
                      <span>{item.createdAt.split('T')[1].substring(0, 5)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 상세 모달 */}
      {selectedId && detail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] max-w-2xl w-full max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex gap-2 items-center mb-2">
                    <span className="text-[#5eb9ca] font-bold text-xs bg-[#f0f9fa] px-3 py-1 rounded-full">
                      {CATEGORY_MAP[detail.category]}
                    </span>
                    {/* 대기 순번 노출 */}
                    {detail.queueNo && (
                      <span className="text-orange-500 font-bold text-xs bg-orange-50 px-3 py-1 rounded-full">
                        대기 {detail.queueNo}번
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-[#054a57]">{detail.title}</h2>

                  {/* 호실 및 작성자 상세 정보 */}
                  <div className="flex items-center gap-4 mt-3 text-[13px] text-[#92a4a6]">
                    <span className="flex items-center gap-1">
                      <User size={14} /> {detail.userName}(ID: {detail.userId})
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 size={14} /> {getDormitoryName(detail.dormitoryId)} {detail.roomId}호
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedId(null)} className="text-2xl text-[#92a4a6] hover:text-black">×</button>
              </div>

              {/* 하단 처리 완료 시간 표시 (데이터가 있을 경우) */}
              {detail.resolvedAt && (
                <p className="text-[11px] text-[#adb5bd] mt-2">
                  최종 처리 완료: {new Date(detail.resolvedAt).toLocaleString()}
                </p>
              )}

              <div className="bg-[#f6fbff] rounded-2xl p-6 mb-8 border border-[#eef5f6]">
                <p className="text-[#054a57] leading-relaxed whitespace-pre-wrap min-h-[100px]">{detail.content}</p>

                {detail.images && detail.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-6">
                    {detail.images.map((img) => (
                      <a key={img.complaintImageId} href={img.fileUrl} target="_blank" rel="noreferrer" className="block group">
                        <div className="relative overflow-hidden rounded-xl border-2 border-white shadow-sm">
                          <img src={img.fileUrl} alt={img.originalName} className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ImageIcon className="text-white" size={20} />
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[15px] font-bold text-[#054a57] mb-3 block flex items-center gap-2">
                    <CheckCircle size={18} className="text-[#5eb9ca]" /> 처리 상태 변경
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {PATCH_STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setTargetStatus(opt.value)}
                        className={`py-2.5 text-xs font-bold rounded-xl border-2 transition-all ${targetStatus === opt.value
                          ? "border-[#5eb9ca] bg-[#5eb9ca] text-white shadow-md shadow-[#5eb9ca]/20"
                          : "border-[#eef5f6] text-[#92a4a6] bg-white hover:border-[#5eb9ca]/30"
                          }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[15px] font-bold text-[#054a57] mb-3 block flex items-center gap-2">
                    <Info size={18} className="text-[#5eb9ca]" /> 관리자 답변 / 메모
                  </label>
                  <textarea
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    className="w-full h-32 p-4 bg-[#f8fafb] border-2 border-[#eef5f6] rounded-2xl focus:border-[#5eb9ca] focus:bg-white outline-none resize-none text-sm transition-all"
                    placeholder="처리 내용을 입력하세요..."
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

      {/* 알림창 */}
      {showAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-8">
          <div className="absolute inset-0 bg-[#054a57]/20 backdrop-blur-[3px]" onClick={() => setShowAlert(false)} />
          <div className="relative bg-white w-full max-w-[320px] rounded-[28px] shadow-2xl p-7 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="size-[56px] bg-[#f0f9ff] rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="text-[#5eb9ca]" size={28} />
              </div>
              <h2 className="text-[17px] font-bold text-[#054a57] mb-2">{alertTitle}</h2>
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
    </AdminLayout>
  );
}