import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Mail, Lock, AlertCircle } from "lucide-react";

// ─── 상수 ─────────────────────────────────────────────────

const EMAIL_REGEX    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

// 실제 서비스 전환 시 API 호출로 교체
const MOCK_ACCOUNTS = [
  { email: "test@gachon.ac.kr",  password: "1234!@#$", name: "가온이",  role: "user"  },
  { email: "test2@gachon.ac.kr", password: "zxcv!@#$", name: "관리자", role: "admin" },
] as const;

const MOCK_DELAY_MS = 1000;

// ─── 타입 ─────────────────────────────────────────────────

interface FormState {
  email: string;
  password: string;
}

interface FormErrors {
  email: string;
  password: string;
}

// ─── 유효성 검사 유틸 ────────────────────────────────────

function validateEmail(email: string, isSubmitted: boolean): string {
  if (isSubmitted && !email.trim()) return "이메일을 입력하세요.";
  if (email && !EMAIL_REGEX.test(email)) return "이메일 형식에 맞게 입력하세요.";
  return "";
}

function validatePassword(password: string, isSubmitted: boolean): string {
  if (isSubmitted && !password.trim()) return "비밀번호를 입력하세요.";
  if (password && !PASSWORD_REGEX.test(password)) return "특수문자를 포함한 8자 이상으로 입력하세요.";
  return "";
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm]               = useState<FormState>({ email: "", password: "" });
  const [errors, setErrors]           = useState<FormErrors>({ email: "", password: "" });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading]     = useState(false);
  const [alertMsg, setAlertMsg]       = useState<string | null>(null); // null이면 모달 닫힘

  // ── 실시간 유효성 검사 ──
  useEffect(() => {
    setErrors({
      email:    validateEmail(form.email, isSubmitted),
      password: validatePassword(form.password, isSubmitted),
    });
  }, [form, isSubmitted]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    if (
      !form.email.trim() || !form.password.trim() ||
      !EMAIL_REGEX.test(form.email) || !PASSWORD_REGEX.test(form.password)
    ) return;

    setIsLoading(true);

    // TODO: setTimeout → 실제 API 호출로 교체
    setTimeout(() => {
      setIsLoading(false);

      const account = MOCK_ACCOUNTS.find(
        a => a.email === form.email && a.password === form.password
      );

      if (account) {
        sessionStorage.setItem("isLoggedIn", "true");
        sessionStorage.setItem("userName", account.name);
        sessionStorage.setItem("userRole", account.role);
        navigate(account.role === "admin" ? "/admin/complaints" : "/");
      } else {
        setAlertMsg("이메일 또는 비밀번호가 일치하지 않습니다.");
      }
    }, MOCK_DELAY_MS);
  }, [form, navigate]);

  return (
    <div className="relative flex min-h-screen w-full justify-center bg-white font-sans antialiased">

      {/* ── 알림 모달 ── */}
      {alertMsg && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-8"
          onClick={() => setAlertMsg(null)}
        >
          <div className="absolute inset-0 bg-nav-primary/20 backdrop-blur-[3px]" />
          <div
            className="relative w-full max-w-[320px] animate-in fade-in zoom-in duration-200 rounded-[28px] bg-white p-7 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-nav-active-bg-from">
                <AlertCircle className="text-nav-accent" size={28} />
              </div>
              <h2 className="mb-2 text-[17px] font-bold text-nav-primary">알림</h2>
              <p className="mb-6 whitespace-pre-line text-[14px] font-medium leading-relaxed text-nav-accent">
                {alertMsg}
              </p>
              <button
                onClick={() => setAlertMsg(null)}
                className="h-[50px] w-full rounded-[18px] bg-nav-accent font-bold text-white shadow-md active:scale-[0.96] transition-all"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 메인 레이아웃 ── */}
      <div className="relative flex w-full max-w-[448px] min-h-screen flex-col items-center bg-[#f0f9ff] px-7 shadow-sm">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#e0f2fe] via-[#f0f9ff] to-[#f8fafc]" />

        <div className="h-10 shrink-0 sm:h-16" />

        {/* ── 로고 ── */}
        <div className="mb-6 flex shrink-0 flex-col items-center sm:mb-8">
          <div className="mb-4 flex size-16 items-center justify-center rounded-[22px] bg-nav-accent shadow-lg shadow-nav-accent/20">
            <svg className="size-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h1 className="mb-1 text-[24px] font-bold tracking-tight text-nav-primary">가온이</h1>
          <p className="text-[12px] font-bold text-nav-accent">가천대 기숙사 AI 생활 지원 서비스</p>
        </div>

        {/* ── 폼 카드 ── */}
        <div className="mb-6 w-full animate-in fade-in slide-in-from-bottom-3 duration-700 rounded-[28px] border border-white bg-white/75 px-7 pb-5 pt-7 shadow-xl shadow-blue-900/5 backdrop-blur-md">
          <form onSubmit={handleLogin} className="w-full space-y-2.5" noValidate>

            {/* 이메일 */}
            <InputField
              label="이메일"
              name="email"
              type="text"
              value={form.email}
              onChange={handleChange}
              placeholder="이메일을 입력하세요"
              error={errors.email}
              icon={<Mail size={16} className="text-nav-inactive group-focus-within:text-nav-accent transition-colors" />}
            />

            {/* 비밀번호 */}
            <InputField
              label="비밀번호"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
              error={errors.password}
              icon={<Lock size={16} className="text-nav-inactive group-focus-within:text-nav-accent transition-colors" />}
            />

            {/* 버튼 */}
            <div className="space-y-2.5 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full rounded-[14px] bg-nav-accent font-bold text-[15px] text-white shadow-lg shadow-nav-accent/20 transition-all active:scale-[0.98] disabled:bg-gray-400"
              >
                {isLoading ? "로그인 중..." : "로그인"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="h-12 w-full rounded-[14px] border-2 border-nav-accent/20 bg-white font-extrabold text-[15px] text-nav-accent shadow-sm transition-all hover:bg-nav-accent/5 active:bg-nav-accent/10"
              >
                로그인 없이 시작하기
              </button>
            </div>
          </form>

          {/* 하단 링크 */}
          <div className="mt-6 flex items-center justify-center gap-5">
            <button
              type="button"
              onClick={() => navigate("/auth/password/identity")}
              className="text-[12px] font-medium text-nav-inactive hover:text-nav-accent transition-colors"
            >
              비밀번호 찾기
            </button>
            <div className="h-3 w-px bg-nav-accent-light" />
            <button
              type="button"
              onClick={() => navigate("/auth/signup")}
              className="text-[12px] font-medium text-nav-inactive hover:text-nav-accent transition-colors"
            >
              회원가입
            </button>
          </div>
        </div>

        {/* ── 푸터 ── */}
        <div className="mt-auto pb-6 text-center opacity-70">
          <p className="text-[10px] font-bold text-nav-inactive">가천대학교 학생생활관</p>
          <p className="mt-0.5 text-[8px] font-bold uppercase tracking-widest text-nav-accent-light">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}

// ─── InputField 서브 컴포넌트 (외부 선언) ────────────────

interface InputFieldProps {
  label: string;
  name: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  error: string;
  icon: React.ReactNode;
}

function InputField({ label, name, type, value, onChange, placeholder, error, icon }: InputFieldProps) {
  return (
    <div className="flex flex-col">
      <label className="mb-1 ml-1 text-[10px] font-bold uppercase tracking-wider text-nav-inactive opacity-80">
        {label}
      </label>
      <div className="group relative">
        <div className="absolute left-4 top-1/2 z-10 -translate-y-1/2">{icon}</div>
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`h-12 w-full rounded-[12px] border bg-white pl-11 pr-4 text-[14px] font-bold text-nav-primary transition-all focus:outline-none focus:border-nav-accent ${
            error ? "border-red-400" : "border-[#eef6f7]"
          }`}
        />
      </div>
      <div className="h-[18px]">
        {error && (
          <p className="ml-1 mt-0.5 animate-in fade-in text-[10px] font-bold text-red-500">
            * {error}
          </p>
        )}
      </div>
    </div>
  );
}