import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Lock, AlertCircle, Loader2, LayoutDashboard, Database, Activity, LucideIcon } from "lucide-react";
import iconLogo from "../icons/GAONI.svg";
import api from "../api/axios";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoginForm {
  loginId: string;
  password: string;
}

interface LoginFormErrors {
  loginId: string;
  password: string;
}

interface AdminUserData {
  adminId: number;
  loginId: string;
  name: string;
  adminRole: string;
}

interface FeatureItem {
  icon: LucideIcon;
  title: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FEATURE_ITEMS: FeatureItem[] = [
  { icon: Activity, title: "실시간 대응" },
  { icon: LayoutDashboard, title: "통합 대시보드" },
  { icon: Database, title: "데이터 관리" },
];

const ERROR_MESSAGES: Record<number, string> = {
  401: "아이디 또는 비밀번호가 올바르지 않습니다.",
  403: "비활성화된 관리자 계정입니다.\n상위 관리자에게 문의하세요.",
};

const SESSION_KEYS = {
  isLoggedIn: "isLoggedIn",
  adminId: "adminId",
  loginId: "loginId",
  userName: "userName",
  userRole: "userRole",
} as const;

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useLoginForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState<LoginForm>({ loginId: "", password: "" });
  const [errors, setErrors] = useState<LoginFormErrors>({ loginId: "", password: "" });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");

  // 제출 이후부터 실시간 유효성 검사
  useEffect(() => {
    if (!isSubmitted) return;
    setErrors({
      loginId: form.loginId.trim() ? "" : "아이디를 입력하세요.",
      password: form.password.trim() ? "" : "비밀번호를 입력하세요.",
    });
  }, [form, isSubmitted]);

  const handleChange = useCallback(
    (field: keyof LoginForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    },
    []
  );

  const saveSession = useCallback((userData: AdminUserData) => {
    sessionStorage.setItem(SESSION_KEYS.isLoggedIn, "true");
    sessionStorage.setItem(SESSION_KEYS.adminId, userData.adminId.toString());
    sessionStorage.setItem(SESSION_KEYS.loginId, userData.loginId);
    sessionStorage.setItem(SESSION_KEYS.userName, userData.name);
    sessionStorage.setItem(SESSION_KEYS.userRole, userData.adminRole);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitted(true);

      if (!form.loginId.trim() || !form.password.trim()) return;

      setIsLoading(true);
      try {
        const { data } = await api.post<{
          code: number;
          data: AdminUserData;
          message: string;
        }>("/admin/auth/login", {
          loginId: form.loginId,
          password: form.password,
        });

        if (data.code === 200) {
          saveSession(data.data);
          navigate("/admin/complaints");
        }
      } catch (error: any) {
        const status: number = error.response?.status;
        const serverMsg: string = error.response?.data?.message;
        setAlertMsg(serverMsg || ERROR_MESSAGES[status] || "서버 통신 중 오류가 발생했습니다.");
        setShowAlert(true);
      } finally {
        setIsLoading(false);
      }
    },
    [form, navigate, saveSession]
  );

  return { form, errors, isLoading, showAlert, alertMsg, setShowAlert, handleChange, handleSubmit };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminLogin() {
  const {
    form, errors, isLoading,
    showAlert, alertMsg, setShowAlert,
    handleChange, handleSubmit,
  } = useLoginForm();

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] flex items-center justify-center p-4 sm:p-6 lg:p-12 antialiased font-sans relative overflow-auto">

      {/* ── Alert Modal ───────────────────────────────────────────────────── */}
      {showAlert && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="alert-title"
          className="fixed inset-0 z-[100] flex items-center justify-center px-8"
        >
          <div
            className="absolute inset-0 bg-[#054a57]/20 backdrop-blur-[3px]"
            onClick={() => setShowAlert(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white w-full max-w-[320px] rounded-[28px] shadow-2xl p-7 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="size-[56px] bg-[#f0f9ff] rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="text-[#5eb9ca]" size={28} aria-hidden="true" />
              </div>
              <h2 id="alert-title" className="text-[17px] font-bold text-[#054a57] mb-2">
                로그인 실패
              </h2>
              <p className="text-[14px] font-medium text-[#7aaeb7] leading-relaxed mb-6 whitespace-pre-wrap">
                {alertMsg}
              </p>
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

      {/* ── Main Card ─────────────────────────────────────────────────────── */}
      <div className="relative w-full max-w-[1000px] min-h-[600px] grid lg:grid-cols-[1.1fr_1fr] bg-white rounded-[32px] sm:rounded-[40px] shadow-[0_40px_100px_-20px_rgba(5,74,87,0.12)] border border-white/50 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 my-4 sm:my-auto isolate">

        {/* ── Left Section ──────────────────────────────────────────────── */}
        <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden text-white bg-gradient-to-br from-[#083344] via-[#0e7490] to-[#155e75]">
          <div className="absolute top-[-10%] right-[-10%] size-[500px] bg-[#22d3ee]/10 rounded-full blur-[120px]" aria-hidden="true" />
          <div className="absolute bottom-[-5%] left-[-5%] size-[400px] bg-black/20 rounded-full blur-[100px]" aria-hidden="true" />

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-10">
              <div className="flex items-center justify-center">
                <img
                  src={iconLogo}
                  alt="가온이 로고"
                  className="size-[144px] brightness-0 invert object-contain drop-shadow-sm -m-10"
                />
              </div>
              <span className="text-3xl font-extrabold tracking-normal">GAONI</span>
            </div>
            <h1 className="text-[40px] font-black mb-3 tracking-tight leading-[1.1]">
              Gachon<br />
              <span className="text-white/80">Dormitory</span><br />
              System
            </h1>
            <p className="text-white/70 text-sm font-medium leading-relaxed">
              가천대학교 학생생활관 통합 관리자 포털입니다.
            </p>
          </div>

          <ul className="relative z-10 space-y-5 mt-8" aria-label="주요 기능">
            {FEATURE_ITEMS.map(({ icon: Icon, title }) => (
              <li key={title} className="flex items-center gap-4">
                <div className="size-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 text-white">
                  <Icon size={18} aria-hidden="true" />
                </div>
                <span className="font-bold text-white text-xs">{title}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Right Section: Login Form ──────────────────────────────────── */}
        <div className="pt-10 px-10 pb-6 flex flex-col justify-center bg-white h-full">
          <div className="mb-8 shrink-0">
            <span className="text-[#5eb9ca] font-black text-[10px] tracking-widest uppercase mb-1.5 block">
              GAONI ADMIN PAGES
            </span>
            <h2 className="text-[26px] font-black text-[#0f172a] mb-2">관리자 로그인</h2>
            <div className="w-10 h-1.5 bg-[#5eb9ca] rounded-full" aria-hidden="true" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* 아이디 */}
            <div className="flex flex-col">
              <label
                htmlFor="loginId"
                className="text-[10px] font-bold text-[#829496] ml-1 mb-1.5 uppercase tracking-wider"
              >
                아이디
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10" aria-hidden="true">
                  <Lock size={18} className="text-[#adc0c2] group-focus-within:text-[#5eb9ca] transition-colors" />
                </div>
                <input
                  id="loginId"
                  type="text"
                  value={form.loginId}
                  onChange={handleChange("loginId")}
                  placeholder="아이디를 입력하세요"
                  autoComplete="username"
                  aria-invalid={!!errors.loginId}
                  aria-describedby={errors.loginId ? "loginId-error" : undefined}
                  className={`w-full bg-[#f8fafc] border ${errors.loginId ? "border-red-400" : "border-[#eef6f7]"
                    } rounded-[16px] pl-12 pr-4 h-[56px] text-[14px] font-bold text-[#054a57] focus:outline-none focus:border-[#5eb9ca] transition-all`}
                />
              </div>
              <div className="h-[18px]">
                {errors.loginId && (
                  <p id="loginId-error" role="alert" className="text-[10px] text-red-500 font-bold mt-1 ml-1 animate-in fade-in">
                    * {errors.loginId}
                  </p>
                )}
              </div>
            </div>

            {/* 비밀번호 */}
            <div className="flex flex-col">
              <label
                htmlFor="password"
                className="text-[10px] font-bold text-[#829496] ml-1 mb-1.5 uppercase tracking-wider"
              >
                비밀번호
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10" aria-hidden="true">
                  <Lock size={18} className="text-[#adc0c2] group-focus-within:text-[#5eb9ca] transition-colors" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange("password")}
                  placeholder="비밀번호를 입력하세요"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  className={`w-full bg-[#f8fafc] border ${errors.password ? "border-red-400" : "border-[#eef6f7]"
                    } rounded-[16px] pl-12 pr-4 h-[56px] text-[14px] font-bold text-[#054a57] focus:outline-none focus:border-[#5eb9ca] transition-all`}
                />
              </div>
              <div className="h-[18px]">
                {errors.password && (
                  <p id="password-error" role="alert" className="text-[10px] text-red-500 font-bold mt-1 ml-1 animate-in fade-in">
                    * {errors.password}
                  </p>
                )}
              </div>
            </div>

            {/* 로그인 버튼 */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                aria-busy={isLoading}
                className="w-full h-[56px] bg-[#5eb9ca] hover:bg-[#4ba8b8] disabled:bg-gray-300 rounded-[16px] text-white font-black text-[15px] active:scale-[0.98] transition-all shadow-lg shadow-[#5eb9ca]/20 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin size-5" aria-hidden="true" />
                    <span>접속 중...</span>
                  </>
                ) : (
                  <span>시스템 접속하기</span>
                )}
              </button>
            </div>
          </form>

          {/* 하단 버튼 영역 */}
          <div className="mt-6 flex flex-col items-center shrink-0">
            <a
              href="https://gaoni-user.vercel.app/api/v1/auth/login"
              rel="noopener noreferrer" // 보안 강화
              className="w-full h-[52px] bg-white border-2 border-[#5eb9ca]/20 rounded-[16px] text-[#5eb9ca] font-extrabold text-[13px] hover:bg-[#5eb9ca]/5 active:bg-[#5eb9ca]/10 active:scale-[0.98] transition-all flex items-center justify-center"
            >
              일반 사용자 화면으로 이동
            </a>
            <div className="mt-6 pt-4 border-t border-slate-50 w-full text-center">
              <p className="text-[9px] font-bold text-[#cbd5e1] uppercase tracking-tighter">
                Infrastructure by Gachon University
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}