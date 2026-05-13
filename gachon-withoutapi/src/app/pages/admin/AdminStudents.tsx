import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Search, MoreVertical, Loader2,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  UserCircle, AlertCircle, Building2, ChevronDown, Check, X,
  Calendar, User, Mail, Phone, Home, LucideIcon,
} from "lucide-react";
import AdminLayout from "../../components/AdminLayout";

// ─── Types ────────────────────────────────────────────────────────────────────

type AccountStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";
type ComplaintStatus = "RECEIVED" | "COMPLETED";

interface SelectOption {
  v: string | number;
  l: string;
}

interface UserRow {
  userId: number;
  name: string;
  email: string;
  dormitoryId: number;
  roomId: number;
  accountStatus: AccountStatus;
  createdAt: string;
}

interface Complaint {
  complaintId: number;
  title: string;
  status: ComplaintStatus;
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
  accountStatus: AccountStatus;
  createdAt: string;
  complaints?: Complaint[];
}

interface AlertState {
  show: boolean;
  title: string;
  message: string;
}

interface SelectBoxProps {
  label: string;
  value: string | number;
  options: SelectOption[];
  onChange: (value: string) => void;
}

interface DetailModalProps {
  userId: number;
  onClose: () => void;
}

interface InfoFieldProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const ACCOUNT_STATUS_STYLES: Record<AccountStatus, string> = {
  ACTIVE: "bg-green-100 text-green-600",
  INACTIVE: "bg-gray-100 text-gray-500",
  BLOCKED: "bg-red-100 text-red-600",
};

const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  ACTIVE: "활성",
  INACTIVE: "비활성",
  BLOCKED: "차단",
};

const COMPLAINT_STATUS_MAP: Record<ComplaintStatus, { label: string; style: string }> = {
  RECEIVED: { label: "대기 중", style: "bg-gray-100 text-gray-500" },
  COMPLETED: { label: "완료", style: "bg-green-100 text-green-600" },
};

const DORMITORY_OPTIONS: SelectOption[] = [
  { v: "전체", l: "전체 생활관" },
  { v: 1, l: "1생활관" },
  { v: 2, l: "2생활관" },
  { v: 3, l: "3생활관" },
];

const STATUS_OPTIONS: SelectOption[] = [
  { v: "전체", l: "전체 상태" },
  { v: "ACTIVE", l: "활성" },
  { v: "INACTIVE", l: "비활성" },
  { v: "BLOCKED", l: "차단" },
];

const ERROR_MESSAGES: Record<number, string> = {
  403: "사용자 데이터 접근 권한이 없습니다.\n관리자 계정인지 확인해 주세요.",
};

const FAKE_USERS: UserRow[] = [
  { userId: 1, name: "홍길동", email: "hong@gachon.ac.kr", dormitoryId: 1, roomId: 302, accountStatus: "ACTIVE", createdAt: "2025-03-01T09:00:00" },
  { userId: 2, name: "김철수", email: "kim@gachon.ac.kr", dormitoryId: 2, roomId: 405, accountStatus: "ACTIVE", createdAt: "2025-03-02T10:00:00" },
  { userId: 3, name: "이영희", email: "lee@gachon.ac.kr", dormitoryId: 1, roomId: 210, accountStatus: "INACTIVE", createdAt: "2025-03-03T11:00:00" },
  { userId: 4, name: "박민준", email: "park@gachon.ac.kr", dormitoryId: 3, roomId: 118, accountStatus: "ACTIVE", createdAt: "2025-03-04T12:00:00" },
  { userId: 5, name: "최수연", email: "choi@gachon.ac.kr", dormitoryId: 2, roomId: 312, accountStatus: "BLOCKED", createdAt: "2025-03-05T13:00:00" },
  { userId: 6, name: "정하늘", email: "jung@gachon.ac.kr", dormitoryId: 1, roomId: 401, accountStatus: "ACTIVE", createdAt: "2025-03-06T14:00:00" },
  { userId: 7, name: "강도윤", email: "kang@gachon.ac.kr", dormitoryId: 3, roomId: 205, accountStatus: "ACTIVE", createdAt: "2025-03-07T15:00:00" },
];

const FAKE_STUDENTS: Record<number, Student> = {
  1: { userId: 1, name: "홍길동", email: "hong@gachon.ac.kr", studentNo: "202112345", phone: "01012345678", dormitoryId: 1, roomId: 302, accountStatus: "ACTIVE", createdAt: "2025-03-01T09:00:00", complaints: [{ complaintId: 1, title: "화장실 수도꼭지 고장", status: "RECEIVED", createdAt: "2025-05-10T10:00:00" }] },
  2: { userId: 2, name: "김철수", email: "kim@gachon.ac.kr", studentNo: "202212346", phone: "01023456789", dormitoryId: 2, roomId: 405, accountStatus: "ACTIVE", createdAt: "2025-03-02T10:00:00", complaints: [] },
  3: { userId: 3, name: "이영희", email: "lee@gachon.ac.kr", studentNo: "202312347", phone: "01034567890", dormitoryId: 1, roomId: 210, accountStatus: "INACTIVE", createdAt: "2025-03-03T11:00:00", complaints: [{ complaintId: 3, title: "복도 청소 요청", status: "COMPLETED", createdAt: "2025-05-07T09:00:00" }] },
  4: { userId: 4, name: "박민준", email: "park@gachon.ac.kr", studentNo: "202112348", phone: "01045678901", dormitoryId: 3, roomId: 118, accountStatus: "ACTIVE", createdAt: "2025-03-04T12:00:00", complaints: [] },
  5: { userId: 5, name: "최수연", email: "choi@gachon.ac.kr", studentNo: "202212349", phone: "01056789012", dormitoryId: 2, roomId: 312, accountStatus: "BLOCKED", createdAt: "2025-03-05T13:00:00", complaints: [] },
  6: { userId: 6, name: "정하늘", email: "jung@gachon.ac.kr", studentNo: "202312350", phone: "01067890123", dormitoryId: 1, roomId: 401, accountStatus: "ACTIVE", createdAt: "2025-03-06T14:00:00", complaints: [] },
  7: { userId: 7, name: "강도윤", email: "kang@gachon.ac.kr", studentNo: "202112351", phone: "01078901234", dormitoryId: 3, roomId: 205, accountStatus: "ACTIVE", createdAt: "2025-03-07T15:00:00", complaints: [] },
};

// ─── Utils ────────────────────────────────────────────────────────────────────

function getPageRange(current: number, total: number, maxButtons = 5): number[] {
  let start = Math.max(0, current - Math.floor(maxButtons / 2));
  let end = Math.min(total, start + maxButtons);
  if (end - start < maxButtons) start = Math.max(0, end - maxButtons);
  return Array.from({ length: Math.max(0, end - start) }, (_, i) => start + i);
}

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

function useStudents(triggerAlert: (title: string, msg: string) => void) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [dormitoryId, setDormitoryId] = useState<string | number>("전체");
  const [status, setStatus] = useState("전체");

  const fetchUsers = useCallback(async (targetPage = page) => {
    setLoading(true);
    await new Promise(res => setTimeout(res, 400));

    let filtered = [...FAKE_USERS];
    if (keyword.trim()) {
      filtered = filtered.filter(u =>
        u.name.includes(keyword.trim()) || u.email.includes(keyword.trim())
      );
    }
    if (dormitoryId !== "전체") filtered = filtered.filter(u => u.dormitoryId === Number(dormitoryId));
    if (status !== "전체") filtered = filtered.filter(u => u.accountStatus === status);

    const start = targetPage * PAGE_SIZE;
    const content = filtered.slice(start, start + PAGE_SIZE);
    setUsers(content);
    setTotalElements(filtered.length);
    setTotalPages(Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
    setLoading(false);
  }, [page, keyword, dormitoryId, status, triggerAlert]);

  // 페이지·필터 변경 시 자동 조회
  useEffect(() => {
    fetchUsers(page);
  }, [page, dormitoryId, status]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchUsers(0);
  }, [fetchUsers]);

  const handleDormitoryChange = useCallback((v: string) => {
    setDormitoryId(v);
    setPage(0);
  }, []);

  const handleStatusChange = useCallback((v: string) => {
    setStatus(v);
    setPage(0);
  }, []);

  return {
    users, loading, totalElements, totalPages, page, keyword, dormitoryId, status,
    setPage, setKeyword,
    handleSearch, handleDormitoryChange, handleStatusChange,
  };
}

// ─── SelectBox ────────────────────────────────────────────────────────────────

function SelectBox({ label, value, options, onChange }: SelectBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find((opt) => String(opt.v) === String(value))?.l ?? "선택";

  return (
    <div className="w-full relative" ref={containerRef}>
      <label className="text-[12px] font-bold text-[#054a57] mb-1.5 ml-1 block">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full px-4 py-3 bg-[#f6fbff] border-2 transition-all rounded-[14px] flex items-center justify-between outline-none ${isOpen ? "border-[#5eb9ca] bg-white shadow-md" : "border-transparent"
          }`}
      >
        <span className={`text-[14px] font-medium ${isOpen ? "text-[#5eb9ca]" : "text-[#054a57]"}`}>
          {selectedLabel}
        </span>
        <ChevronDown
          size={18}
          className={`text-[#92a4a6] transition-transform duration-200 ${isOpen ? "rotate-180 text-[#5eb9ca]" : ""}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          className="absolute z-[100] w-full mt-2 bg-white border border-[#e5f4f5] rounded-[18px] shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="max-h-[200px] overflow-y-auto">
            {options.map((opt) => {
              const isSelected = String(opt.v) === String(value);
              return (
                <li
                  key={opt.v}
                  role="option"
                  aria-selected={isSelected}
                >
                  <button
                    type="button"
                    onClick={() => { onChange(String(opt.v)); setIsOpen(false); }}
                    className={`w-full px-5 py-3.5 text-left text-[14px] font-medium flex items-center justify-between transition-colors ${isSelected
                      ? "bg-[#f0f9ff] text-[#5eb9ca]"
                      : "text-[#475569] hover:bg-[#f6fbff] hover:text-[#5eb9ca]"
                      } border-b border-[#f8fafc] last:border-none`}
                  >
                    {opt.l}
                    {isSelected && <Check size={16} className="text-[#5eb9ca]" aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
          </div>
        </ul>
      )}
    </div>
  );
}

// ─── InfoField ────────────────────────────────────────────────────────────────

function InfoField({ label, value, icon }: InfoFieldProps) {
  return (
    <div className="w-full">
      <p className="text-[12px] font-semibold text-[#054a57] mb-1.5 ml-1">{label}</p>
      <div className="flex items-center px-4 py-3 bg-[#f6fbff] rounded-[14px] text-[14px] text-[#054a57] border border-transparent">
        {icon && <span className="mr-2 text-[#92a4a6]" aria-hidden="true">{icon}</span>}
        <span className="font-medium">{value || "-"}</span>
      </div>
    </div>
  );
}

// ─── StudentDetailModal ───────────────────────────────────────────────────────

function StudentDetailModal({ userId, onClose }: DetailModalProps) {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await new Promise(res => setTimeout(res, 400));
      const found = FAKE_STUDENTS[userId];
      if (found) setStudent(found);
      setLoading(false);
    })();
  }, [userId]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-detail-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-[#054a57]/40 backdrop-blur-[8px]" aria-hidden="true" />

      <div
        className="relative bg-white/95 rounded-[32px] max-w-2xl w-[90%] max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-[#e5f4f5] flex items-center justify-between bg-white/50 backdrop-blur-sm">
          <div>
            <h2 id="student-detail-title" className="font-bold text-[22px] text-[#054a57]">
              학생 상세 정보
            </h2>
            <p className="text-[12px] text-[#92a4a6]">ID: {userId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="p-3 hover:bg-gray-100 rounded-full transition-all group"
          >
            <X className="size-6 text-[#92a4a6] group-hover:text-red-500" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-[#5eb9ca] size-10" aria-label="로딩 중" />
              <p className="text-[#92a4a6] font-medium">정보를 불러오는 중입니다...</p>
            </div>
          ) : student ? (
            <>
              {/* 기본 정보 */}
              <section aria-labelledby="section-basic">
                <h3 id="section-basic" className="text-[16px] font-bold text-[#054a57] mb-4 flex items-center gap-2">
                  <User size={18} className="text-[#5eb9ca]" aria-hidden="true" /> 기본 정보
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoField label="이름" value={student.name} icon={<User size={16} />} />
                  <InfoField label="학번" value={student.studentNo} icon={<User size={16} />} />
                  <div className="md:col-span-2">
                    <InfoField label="이메일" value={student.email} icon={<Mail size={16} />} />
                  </div>
                  <div className="md:col-span-2">
                    <InfoField label="전화번호" value={student.phone} icon={<Phone size={16} />} />
                  </div>
                </div>
              </section>

              {/* 거주 및 계정 정보 */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4" aria-labelledby="section-room">
                  <h3 id="section-room" className="text-[16px] font-bold text-[#054a57] flex items-center gap-2">
                    <Building2 size={18} className="text-[#5eb9ca]" aria-hidden="true" /> 거주 정보
                  </h3>
                  <InfoField label="생활관" value={`${student.dormitoryId}동`} icon={<Building2 size={16} />} />
                  <InfoField label="호실" value={`${student.roomId}호`} icon={<Home size={16} />} />
                </div>
                <div className="space-y-4" aria-labelledby="section-account">
                  <h3 id="section-account" className="text-[16px] font-bold text-[#054a57] flex items-center gap-2">
                    <AlertCircle size={18} className="text-[#5eb9ca]" aria-hidden="true" /> 계정 상태
                  </h3>
                  <div>
                    <p className="text-[12px] font-semibold text-[#054a57] mb-1.5 ml-1">상태</p>
                    <span className={`inline-block px-4 py-1.5 rounded-full text-[13px] font-bold ${ACCOUNT_STATUS_STYLES[student.accountStatus] ?? "bg-gray-100 text-gray-500"
                      }`}>
                      {ACCOUNT_STATUS_LABELS[student.accountStatus] ?? student.accountStatus}
                    </span>
                  </div>
                  <div className="p-4 bg-[#f6fbff] rounded-[16px] border border-[#e5f4f5]">
                    <p className="text-[11px] text-[#92a4a6] mb-1">최초 가입일</p>
                    <p className="text-[13px] text-[#054a57] font-medium flex items-center gap-2">
                      <Calendar size={14} aria-hidden="true" />
                      <time dateTime={student.createdAt}>
                        {new Date(student.createdAt).toLocaleString()}
                      </time>
                    </p>
                  </div>
                </div>
              </section>

              {/* 민원 내역 */}
              <section className="border-t border-[#e5f4f5] pt-8" aria-labelledby="section-complaints">
                <h3 id="section-complaints" className="text-[16px] font-bold text-[#054a57] mb-4 flex items-center gap-2">
                  <AlertCircle size={18} className="text-[#5eb9ca]" aria-hidden="true" /> 최근 민원 내역
                </h3>
                {student.complaints?.length ? (
                  <ul className="grid gap-3">
                    {student.complaints.map((c) => {
                      const info = COMPLAINT_STATUS_MAP[c.status as ComplaintStatus]
                        ?? { label: c.status, style: "bg-gray-100 text-gray-500" };
                      return (
                        <li
                          key={c.complaintId}
                          className="flex items-center justify-between p-4 bg-[#f6fbff] rounded-[16px] border border-white hover:border-[#5eb9ca] transition-all"
                        >
                          <div>
                            <p className="text-[14px] font-semibold text-[#054a57]">{c.title}</p>
                            <time
                              dateTime={c.createdAt}
                              className="text-[11px] text-[#92a4a6]"
                            >
                              {new Date(c.createdAt).toLocaleDateString()}
                            </time>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${info.style}`}>
                            {info.label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="text-center py-10 bg-[#f6fbff] rounded-[16px] text-[#92a4a6] text-[13px] border border-dashed border-[#adc0c2]">
                    등록된 민원 내역이 없습니다.
                  </div>
                )}
              </section>
            </>
          ) : (
            <p role="alert" className="text-center py-20 text-red-400">
              데이터를 불러오지 못했습니다.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-[#e5f4f5]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-4 bg-[#5eb9ca] text-white font-bold rounded-[20px] hover:bg-[#4ba8b8] transition-all shadow-lg active:scale-[0.98]"
          >
            확인 후 닫기
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminStudents() {
  const navigate = useNavigate();
  const { alert, triggerAlert, closeAlert } = useAlert();

  const {
    users, loading, totalElements, totalPages, page, keyword, dormitoryId, status,
    setPage, setKeyword,
    handleSearch, handleDormitoryChange, handleStatusChange,
  } = useStudents(triggerAlert);

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const pageRange = getPageRange(page, totalPages);
  const isFirstPage = page === 0 || totalPages === 0;
  const isLastPage = page >= totalPages - 1 || totalPages === 0;

  return (
    <AdminLayout>
      <div className="bg-[#f6fbff] min-h-screen w-full overflow-x-hidden">

        {/* ── Page Header ───────────────────────────────────────────────── */}
        <div className="bg-white border-b border-[#e5f4f5] px-8 py-6">
          <h1 className="font-bold text-[32px] text-[#054a57]">학생 관리</h1>
          <p className="text-[14px] text-[#92a4a6] mt-1">
            가입된 학생 정보를 확인하고 계정 상태를 관리하세요. (총 {totalElements.toLocaleString()}명)
          </p>
        </div>

        <div className="p-8 w-full min-w-0">

          {/* ── Search Bar ────────────────────────────────────────────── */}
          <div className="bg-white rounded-[24px] p-4 md:p-8 shadow-sm mb-8 border border-[#f1f5f9] min-w-0">
            <form onSubmit={handleSearch} className="flex flex-col lg:flex-row items-stretch lg:items-end gap-4 lg:gap-5">
              <div className="flex-[3] flex flex-col">
                <label htmlFor="keyword" className="text-[13px] font-bold text-[#054a57] mb-2 ml-1">
                  검색어
                </label>
                <div className="relative h-[50px] md:h-[54px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#adc0c2] size-5" aria-hidden="true" />
                  <input
                    id="keyword"
                    type="search"
                    placeholder="이름 또는 이메일 검색"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="w-full h-full pl-11 pr-4 bg-[#f6fbff] rounded-[16px] border-2 border-transparent focus:border-[#5eb9ca] focus:bg-white outline-none transition-all text-[14px] md:text-[15px] font-medium text-[#054a57] placeholder:text-[#adc0c2]"
                  />
                </div>
              </div>

              <div className="flex-[2] flex flex-wrap sm:flex-nowrap items-end gap-3">
                <div className="flex-1 min-w-[120px]">
                  <SelectBox
                    label="생활관"
                    value={dormitoryId}
                    options={DORMITORY_OPTIONS}
                    onChange={handleDormitoryChange}
                  />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <SelectBox
                    label="상태"
                    value={status}
                    options={STATUS_OPTIONS}
                    onChange={handleStatusChange}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 h-[50px] md:h-[54px] bg-[#5eb9ca] text-white rounded-[14px] font-bold hover:bg-[#4fa8b9] transition-all shadow-md active:scale-[0.98] whitespace-nowrap"
                >
                  검색
                </button>
              </div>
            </form>
          </div>

          {/* ── User Table ────────────────────────────────────────────── */}
          <div className="bg-white rounded-[16px] shadow-sm mb-6 border border-[#f1f5f9] overflow-hidden">
            <div className="w-full overflow-x-auto pb-2">
              <table className="w-full min-w-[1000px] table-fixed">
                <thead className="bg-[#f6fbff]">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left w-[250px] text-[#92a4a6] font-semibold text-[13px]">사용자 정보</th>
                    <th scope="col" className="px-6 py-4 text-left w-[150px] text-[#92a4a6] font-semibold text-[13px]">배정 위치</th>
                    <th scope="col" className="px-6 py-4 text-left w-[120px] text-[#92a4a6] font-semibold text-[13px]">계정 상태</th>
                    <th scope="col" className="px-6 py-4 text-left w-[150px] text-[#92a4a6] font-semibold text-[13px]">가입일</th>
                    <th scope="col" className="px-6 py-4 text-right w-[100px] text-[#92a4a6] font-semibold text-[13px]">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5f4f5]">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <Loader2 className="animate-spin mx-auto text-[#5eb9ca]" aria-label="로딩 중" />
                      </td>
                    </tr>
                  ) : users.length > 0 ? (
                    users.map((user) => (
                      <tr
                        key={user.userId}
                        onClick={() => setSelectedUserId(user.userId)}
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && setSelectedUserId(user.userId)}
                        aria-label={`${user.name} 상세 보기`}
                        className="hover:bg-[#f6fbff] transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-[#f0f7f8] p-2 rounded-full text-[#5eb9ca]">
                              <UserCircle size={24} aria-hidden="true" />
                            </div>
                            <div>
                              <p className="font-bold text-[14px] text-[#054a57]">{user.name}</p>
                              <p className="text-[12px] text-[#92a4a6]">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[13px] text-[#054a57]">
                          {user.dormitoryId}동 {user.roomId}호
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${ACCOUNT_STATUS_STYLES[user.accountStatus] ?? "bg-gray-100 text-gray-500"
                            }`}>
                            {ACCOUNT_STATUS_LABELS[user.accountStatus] ?? user.accountStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[13px] text-[#92a4a6]">
                          <time dateTime={user.createdAt}>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </time>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/admin/users/${user.userId}`); }}
                            aria-label={`${user.name} 상세 정보 페이지로 이동`}
                            className="p-2 text-[#5eb9ca] hover:bg-[#5eb9ca]/10 rounded-lg transition-colors"
                          >
                            <MoreVertical size={18} aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-[#92a4a6]">
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Pagination ────────────────────────────────────────────── */}
          <nav className="flex justify-center items-center gap-2 pb-10" aria-label="페이지 탐색">
            <button
              disabled={isFirstPage}
              onClick={() => setPage(0)}
              aria-label="첫 페이지"
              className="p-2 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed text-[#054a57] transition-all"
            >
              <ChevronsLeft size={20} aria-hidden="true" />
            </button>
            <button
              disabled={isFirstPage}
              onClick={() => setPage(page - 1)}
              aria-label="이전 페이지"
              className="p-2 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed text-[#054a57] transition-all"
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>

            {pageRange.map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                aria-label={`${pageNum + 1}페이지`}
                aria-current={page === pageNum ? "page" : undefined}
                className={`w-10 h-10 rounded-lg font-bold text-[14px] transition-all ${page === pageNum
                  ? "bg-[#5eb9ca] text-white shadow-sm"
                  : "bg-white text-[#92a4a6] hover:bg-[#e5f4f5]"
                  }`}
              >
                {pageNum + 1}
              </button>
            ))}

            <button
              disabled={isLastPage}
              onClick={() => setPage(page + 1)}
              aria-label="다음 페이지"
              className="p-2 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed text-[#054a57] transition-all"
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
            <button
              disabled={isLastPage}
              onClick={() => setPage(totalPages - 1)}
              aria-label="마지막 페이지"
              className="p-2 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed text-[#054a57] transition-all"
            >
              <ChevronsRight size={20} aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>

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
                className="w-full h-[50px] bg-[#5eb9ca] text-white font-bold rounded-[18px] active:scale-[0.96] shadow-md transition-all"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Student Detail Modal ──────────────────────────────────────────── */}
      {selectedUserId !== null && (
        <StudentDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </AdminLayout>
  );
}