import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import api from "../api/axios";
import { Search, MoreVertical, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, UserCircle, AlertCircle, Building2, ChevronDown, Check, X, Calendar, User, Mail, Phone, Home } from "lucide-react";
import AdminLayout from "../components/AdminLayout";

interface SelectOption {
  v: string | number;
  l: string;
}

interface SelectBoxProps {
  label: string;
  value: string | number;
  options: SelectOption[];
  onChange: (value: string) => void;
}

function SelectBox({ label, value, options, onChange }: SelectBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find((opt) => String(opt.v) === String(value))?.l || "선택";

  return (
    <div className="w-full relative" ref={containerRef}>
      <label className="text-[12px] font-bold text-[#054a57] mb-1.5 ml-1 block">
        {label}
      </label>

      {/* 셀렉트 버튼 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 bg-[#f6fbff] border-2 transition-all rounded-[14px] flex items-center justify-between outline-none ${isOpen ? "border-[#5eb9ca] bg-white shadow-md" : "border-transparent"
          }`}
      >
        <span className={`text-[14px] font-medium ${isOpen ? "text-[#5eb9ca]" : "text-[#054a57]"}`}>
          {selectedLabel}
        </span>
        <ChevronDown
          size={18}
          className={`text-[#92a4a6] transition-transform duration-200 ${isOpen ? "rotate-180 text-[#5eb9ca]" : ""}`}
        />
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute z-[100] w-full mt-2 bg-white border border-[#e5f4f5] rounded-[18px] shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-[200px] overflow-y-auto">
            {options.map((opt) => {
              const isSelected = String(opt.v) === String(value);
              return (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => {
                    onChange(String(opt.v));
                    setIsOpen(false);
                  }}
                  className={`w-full px-5 py-3.5 text-left text-[14px] font-medium flex items-center justify-between transition-colors ${isSelected
                    ? "bg-[#f0f9ff] text-[#5eb9ca]"
                    : "text-[#475569] hover:bg-[#f6fbff] hover:text-[#5eb9ca]"
                    } border-b border-[#f8fafc] last:border-none`}
                >
                  {opt.l}
                  {isSelected && <Check size={16} className="text-[#5eb9ca]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface User {
  userId: number;
  name: string;
  email: string;
  dormitoryId: number;
  roomId: number;
  accountStatus: "ACTIVE" | "INACTIVE" | "BLOCKED";
  createdAt: string;
}

interface Complaint {
  complaintId: number;
  title: string;
  status: string;
  createdAt: string;
}

interface Student {
  userId: number;
  name: string;
  email: string;
  studentNo: string;
  phone: string;
  dormitoryId: number;
  roomId: number;
  accountStatus: string;
  createdAt: string;
  complaints?: Complaint[];
}

interface DetailModalProps {
  userId: number;
  onClose: () => void;
}

export default function AdminStudents() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // 검색 및 페이징 상태
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [dormitoryId, setDormitoryId] = useState<number | string>("전체");
  const [status, setStatus] = useState<string>("전체");
  // 상태 필터

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // 알림 상태
  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [alertTitle, setAlertTitle] = useState("알림");

  const navigate = useNavigate();

  // 사용자 목록 조회
  const fetchUsers = async (targetPage = page) => {
    try {
      setLoading(true);
      const params: any = {
        page: targetPage,
        size: 10
      };

      if (keyword.trim()) params.keyword = keyword;
      // "전체" 문자열이 아닐 때만 숫자형으로 변환하여 전송
      if (dormitoryId !== "전체") params.dormitoryId = Number(dormitoryId);
      // "전체" 문자열이 아닐 때만 전송
      if (status !== "전체") params.status = status;

      const response = await api.get("/admin/users", { params });

      if (response.data.code === 200) {
        const { content, totalElements, totalPages } = response.data.data;
        setUsers(content);
        setTotalElements(totalElements);
        setTotalPages(totalPages === 0 ? 1 : totalPages);
      } else {
        setAlertTitle("안내");
        setAlertMsg(response.data.message || "데이터를 불러오지 못했습니다.");
        setShowAlert(true);
      }
    } catch (error: any) {
      // 1. 상태 코드 확인
      const status = error.response?.status;
      let errorMsg = error.response?.data?.message || "서버 연결에 실패했습니다.";

      // 2. 403(Forbidden)일 경우 메시지 교체
      if (status === 403) {
        errorMsg = "사용자 데이터 접근 권한이 없습니다.\n 관리자 계정인지 확인해 주세요.";
      }

      setAlertTitle("오류");
      setAlertMsg(errorMsg);
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page, dormitoryId, status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchUsers(0);
  };

  // 계정 상태별 색상 매핑 함수
  const getAccountStatusColor = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-600",
      INACTIVE: "bg-gray-100 text-gray-500",
      BLOCKED: "bg-red-100 text-red-600",
    };
    return styles[status] || "bg-gray-100 text-gray-500";
  };

  return (
    <AdminLayout>
      <div className="bg-[#f6fbff] min-h-screen grid grid-cols-1 min-w-0 w-full overflow-hidden">
        {/* Header Area */}
        <div className="bg-white border-b border-[#e5f4f5] px-8 py-6">
          <h1 className="font-['Pretendard:Bold'] text-[32px] text-[#054a57]">학생 관리</h1>
          <p className="font-['Pretendard:Medium'] text-[14px] text-[#92a4a6] mt-1">
            가입된 학생 정보를 확인하고 계정 상태를 관리하세요. (총 {totalElements}명)
          </p>
        </div>

        <div className="p-8 w-full min-w-0 overflow-hidden">
          {/* 검색 바 영역 */}
          <div className="bg-white rounded-[24px] p-4 md:p-8 shadow-sm mb-8 border border-[#f1f5f9]">
            <form onSubmit={handleSearch} className="flex flex-col lg:flex-row items-stretch lg:items-end gap-4 lg:gap-5">
              {/* 1. 키워드 검색창 */}
              <div className="flex-[3] flex flex-col">
                <label className="text-[13px] font-bold text-[#054a57] mb-2 ml-1">검색어</label>
                <div className="relative h-[50px] md:h-[54px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#adc0c2] size-5" />
                  <input
                    type="text"
                    placeholder="이름 또는 이메일 검색"
                    className="w-full h-full pl-11 pr-4 bg-[#f6fbff] rounded-[16px] border-2 border-transparent focus:border-[#5eb9ca] focus:bg-white outline-none transition-all text-[14px] md:text-[15px] font-medium text-[#054a57] placeholder:text-[#adc0c2]"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>
              </div>

              {/* 2. 필터 및 버튼 그룹 */}
              <div className="flex-[2] flex flex-wrap sm:flex-nowrap items-end gap-3">
                {/* 생활관 필터 */}
                <div className="flex-1 min-w-[120px]">
                  <SelectBox
                    label="생활관"
                    value={dormitoryId}
                    options={[
                      { v: "전체", l: "전체 생활관" },
                      { v: 1, l: "1생활관" },
                      { v: 2, l: "2생활관" },
                      { v: 3, l: "3생활관" },
                    ]}
                    onChange={(v) => {
                      setDormitoryId(v);
                      setPage(0);
                    }}
                  />
                </div>

                {/* 계정 상태 필터 */}
                <div className="flex-1 min-w-[120px]">
                  <SelectBox
                    label="상태"
                    value={status}
                    options={[
                      { v: "전체", l: "전체 상태" },
                      { v: "ACTIVE", l: "활성" },
                      { v: "INACTIVE", l: "비활성" },
                      { v: "BLOCKED", l: "차단" },
                    ]}
                    onChange={(v) => {
                      setStatus(v);
                      setPage(0);
                    }}
                  />
                </div>

                {/* 검색 버튼 */}
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 h-[50px] md:h-[54px] bg-[#5eb9ca] text-white rounded-[14px] font-bold hover:bg-[#4fa8b9] transition-all shadow-md active:scale-[0.98] whitespace-nowrap"
                >
                  검색
                </button>
              </div>
            </form>
          </div>

          {/* 3. 테이블 영역: 여기서만 스크롤 */}
          <div className="bg-white rounded-[16px] shadow-sm mb-6 border border-[#f1f5f9] overflow-hidden">
            <div className="w-full overflow-x-auto pb-2">
              <table className="w-full min-w-[1000px] table-fixed">
                <thead className="bg-[#f6fbff]">
                  <tr>
                    <th className="px-6 py-4 text-left w-[250px] whitespace-nowrap text-[#92a4a6]">사용자 정보</th>
                    <th className="px-6 py-4 text-left w-[150px] whitespace-nowrap text-[#92a4a6]">배정 위치</th>
                    <th className="px-6 py-4 text-left w-[120px] whitespace-nowrap text-[#92a4a6]">계정 상태</th>
                    <th className="px-6 py-4 text-left w-[150px] whitespace-nowrap text-[#92a4a6]">가입일</th>
                    <th className="px-6 py-4 text-right w-[100px] whitespace-nowrap text-[#92a4a6]">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5f4f5]">
                  {loading ? (
                    <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-[#5eb9ca]" /></td></tr>
                  ) : users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user.userId}
                        onClick={() => setSelectedUserId(user.userId)}
                        // 클릭하면 ID 저장
                        className="hover:bg-[#f6fbff] transition-colors"
                      >
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className="bg-[#f0f7f8] p-2 rounded-full text-[#5eb9ca]">
                            <UserCircle size={24} />
                          </div>
                          <div>
                            <p className="font-['Pretendard:Bold'] text-[14px] text-[#054a57]">{user.name}</p>
                            <p className="text-[12px] text-[#92a4a6]">{user.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[13px] text-[#054a57] font-['Pretendard:Medium']">
                          {user.dormitoryId}동 {user.roomId}호
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-['Pretendard:Bold'] ${getAccountStatusColor(user.accountStatus)}`}>
                            {user.accountStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[13px] text-[#92a4a6]">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => navigate(`/admin/users/${user.userId}`)}
                            className="p-2 text-[#5eb9ca] hover:bg-[#5eb9ca]/10 rounded-lg transition-colors"
                            title="상세 정보 보기"
                          >
                            <MoreVertical size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-[#92a4a6] font-['Pretendard:Medium']">
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paging */}
          <div className="flex justify-center items-center gap-2 pb-10">
            {/* 1. 제일 처음으로 이동 (<<) */}
            <button
              disabled={page === 0 || totalPages === 0}
              onClick={() => setPage(0)}
              className="p-2 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed text-[#054a57] transition-all"
              title="첫 페이지로"
            >
              <ChevronsLeft size={20} />
            </button>

            {/* 2. 이전 페이지로 이동 (<) */}
            <button
              disabled={page === 0 || totalPages === 0}
              onClick={() => setPage(page - 1)}
              className="p-2 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed text-[#054a57] transition-all"
            >
              <ChevronLeft size={20} />
            </button>

            {/* 3. 숫자 페이지 버튼들 (Sliding Window 적용) */}
            {(() => {
              const maxButtons = 5;
              let startPage = Math.max(0, page - Math.floor(maxButtons / 2));
              let endPage = Math.min(totalPages, startPage + maxButtons);

              if (endPage - startPage < maxButtons) {
                startPage = Math.max(0, endPage - maxButtons);
              }

              const range = Math.max(0, endPage - startPage);

              return [...Array(range)].map((_, i) => {
                const pageNum = startPage + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-['Pretendard:Bold'] text-[14px] transition-all ${page === pageNum
                      ? "bg-[#5eb9ca] text-white shadow-sm"
                      : "bg-white text-[#92a4a6] hover:bg-[#e5f4f5]"
                      }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              });
            })()}

            {/* 4. 다음 페이지로 이동 (>) */}
            <button
              disabled={page >= totalPages - 1 || totalPages === 0}
              onClick={() => setPage(page + 1)}
              className="p-2 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed text-[#054a57] transition-all"
            >
              <ChevronRight size={20} />
            </button>

            {/* 5. 제일 마지막으로 이동 (>>) */}
            <button
              disabled={page >= totalPages - 1 || totalPages === 0}
              onClick={() => setPage(totalPages - 1)}
              className="p-2 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed text-[#054a57] transition-all"
              title="마지막 페이지로"
            >
              <ChevronsRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* 알림 모달 */}
      {showAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-8">
          <div
            className="absolute inset-0 bg-[#054a57]/20 backdrop-blur-[3px]"
            onClick={() => setShowAlert(false)}
          />
          <div className="relative bg-white w-full max-w-[320px] rounded-[28px] shadow-2xl p-7 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="size-[56px] bg-[#f0f9ff] rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="text-[#5eb9ca]" size={28} />
              </div>
              <h2 className="text-[17px] font-bold text-[#054a57] mb-2">{alertTitle}</h2>
              <p className="text-[14px] font-medium text-[#7aaeb7] leading-relaxed mb-6 whitespace-pre-wrap">
                {alertMsg}
              </p>
              <button
                onClick={() => setShowAlert(false)}
                className="w-full h-[50px] bg-[#5eb9ca] text-white font-bold rounded-[18px] active:scale-[0.96] shadow-md transition-all"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedUserId && (
        <StudentDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </AdminLayout>
  );
}

const COMPLAINT_STATUS_MAP: Record<string, { l: string; s: string }> = {
  RECEIVED: { l: "대기 중", s: "bg-gray-100 text-gray-500" },
  COMPLETED: { l: "완료", s: "bg-green-100 text-green-600" },
};

function StudentDetailModal({ userId, onClose }: DetailModalProps) {
  const [formData, setFormData] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentDetail = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/admin/users/${userId}`);
        if (response.data.code === 200) {
          setFormData(response.data.data);
        }
      } catch (error) {
        console.error("조회 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentDetail();
  }, [userId]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center isolation-auto">
      <div
        className="absolute inset-0 bg-[#054a57]/40 backdrop-blur-[8px] transition-opacity cursor-pointer"
        onClick={onClose}
      />

      <div
        className="relative bg-white/95 rounded-[32px] max-w-2xl w-[90%] max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-300 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      // 본체 클릭 시 닫히지 않게
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-[#e5f4f5] flex items-center justify-between bg-white/50 backdrop-blur-sm">
          <div>
            <h2 className="font-bold text-[22px] text-[#054a57]">학생 상세 정보</h2>
            <p className="text-[12px] text-[#92a4a6]">ID: {userId}</p>
          </div>
          {/* X 버튼 */}
          <button
            type="button"
            onClick={onClose}
            className="p-3 hover:bg-gray-100 rounded-full transition-all cursor-pointer group"
          >
            <X className="size-6 text-[#92a4a6] group-hover:text-red-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-[#5eb9ca] size-10" />
              <p className="text-[#92a4a6] font-medium">정보를 불러오는 중입니다...</p>
            </div>
          ) : formData ? (
            <>
              {/* Section 1: 기본 정보 */}
              <section>
                <h3 className="text-[16px] font-bold text-[#054a57] mb-4 flex items-center gap-2">
                  <User size={18} className="text-[#5eb9ca]" /> 기본 정보
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoField label="이름" value={formData.name} icon={<User size={16} />} />
                  <InfoField label="학번" value={formData.studentNo} icon={<User size={16} />} />
                  <div className="md:col-span-2">
                    <InfoField label="이메일" value={formData.email} icon={<Mail size={16} />} />
                  </div>
                  <div className="md:col-span-2">
                    <InfoField label="전화번호" value={formData.phone} icon={<Phone size={16} />} />
                  </div>
                </div>
              </section>

              {/* Section 2: 거주 및 계정 정보 */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-[16px] font-bold text-[#054a57] flex items-center gap-2">
                    <Building2 size={18} className="text-[#5eb9ca]" /> 거주 정보
                  </h3>
                  <InfoField label="생활관" value={`${formData.dormitoryId}동`} icon={<Building2 size={16} />} />
                  <InfoField label="호실" value={`${formData.roomId}호`} icon={<Home size={16} />} />
                </div>
                <div className="space-y-4">
                  <h3 className="text-[16px] font-bold text-[#054a57] flex items-center gap-2">
                    <AlertCircle size={18} className="text-[#5eb9ca]" /> 계정 상태
                  </h3>
                  <div className="w-full">
                    <label className="text-[12px] font-semibold text-[#054a57] mb-1.5 ml-1 block">상태</label>
                    <span className={`inline-block px-4 py-1.5 rounded-full text-[13px] font-bold ${formData.accountStatus === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                      {formData.accountStatus}
                    </span>
                  </div>
                  <div className="p-4 bg-[#f6fbff] rounded-[16px] border border-[#e5f4f5]">
                    <p className="text-[11px] text-[#92a4a6] mb-1">최초 가입일</p>
                    <p className="text-[13px] text-[#054a57] font-medium flex items-center gap-2">
                      <Calendar size={14} /> {new Date(formData.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 3: 민원 내역 */}
              <section className="border-t border-[#e5f4f5] pt-8">
                <h3 className="text-[16px] font-bold text-[#054a57] mb-4 flex items-center gap-2">
                  <AlertCircle size={18} className="text-[#5eb9ca]" /> 최근 민원 내역
                </h3>
                <div className="grid gap-3">
                  {formData.complaints && formData.complaints.length > 0 ? (
                    formData.complaints.map((c) => {
                      // 상태 값에 따른 한글 라벨과 스타일 가져오기 (없으면 기본값 설정)
                      const statusInfo = COMPLAINT_STATUS_MAP[c.status] || { l: c.status, s: "bg-gray-100 text-gray-500" };

                      return (
                        <div
                          key={c.complaintId}
                          className="flex items-center justify-between p-4 bg-[#f6fbff] rounded-[16px] border border-white hover:border-[#5eb9ca] transition-all"
                        >
                          <div>
                            <p className="text-[14px] font-semibold text-[#054a57]">{c.title}</p>
                            <p className="text-[11px] text-[#92a4a6]">
                              {new Date(c.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${statusInfo.s}`}>
                            {statusInfo.l}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-10 bg-[#f6fbff] rounded-[16px] text-[#92a4a6] text-[13px] border border-dashed border-[#adc0c2]">
                      등록된 민원 내역이 없습니다.
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : (
            <div className="text-center py-20 text-red-400">데이터를 불러오지 못했습니다.</div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-[#e5f4f5]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-4 bg-[#5eb9ca] text-white font-bold rounded-[20px] hover:bg-[#4ba8b8] transition-all shadow-lg active:scale-[0.98] cursor-pointer"
          >
            확인 후 닫기
          </button>
        </div>
      </div>
    </div>
  );
}

// 정보 표시용 컴포넌트 (수정 불가)
function InfoField({ label, value, icon }: { label: string, value: string, icon?: React.ReactNode }) {
  return (
    <div className="w-full">
      <label className="text-[12px] font-semibold text-[#054a57] mb-1.5 ml-1 block">
        {label}
      </label>
      <div className="relative flex items-center px-4 py-3 bg-[#f6fbff] rounded-[14px] text-[14px] text-[#054a57] border border-transparent">
        {icon && <span className="mr-2 text-[#92a4a6]">{icon}</span>}
        <span className="font-medium">{value || "-"}</span>
      </div>
    </div>
  );
}