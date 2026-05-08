import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useNavigate } from "react-router";
import {
  User, Lock, Mail, Phone, ChevronLeft,
  KeyRound, CheckCircle, Building2, Home,
  ChevronDown, Check, ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─── 상수 ─────────────────────────────────────────────────

const EMAIL_REGEX    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NUM_REGEX      = /^[0-9]*$/;
const PASSWORD_REGEX = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
const VERIFY_DELAY   = 600;
const SUBMIT_DELAY   = 1200;
const TIMER_SECONDS  = 180;

const DORMITORIES = [
  { id: "1", name: "제1학생활관" },
  { id: "2", name: "제2학생활관" },
  { id: "3", name: "제3학생활관" },
] as const;

// ─── 타입 ─────────────────────────────────────────────────

interface FormData {
  studentNo: string;
  name: string;
  email: string;
  verificationCode: string;
  phone: string;
  password: string;
  confirmPassword: string;
  dormitoryId: string;
  roomId: string;
}

type FormErrors = Partial<Record<keyof FormData, string>>;
type SuccessMsgs = Partial<Record<keyof FormData, string>>;

// ─── 초기값 ───────────────────────────────────────────────

const INITIAL_FORM: FormData = {
  studentNo: "", name: "", email: "", verificationCode: "",
  phone: "", password: "", confirmPassword: "",
  dormitoryId: "1", roomId: "",
};

// ─── 유효성 검사 유틸 ─────────────────────────────────────

function validateForm(
  form: FormData,
  isSubmitted: boolean,
  isCodeSent: boolean,
  isEmailVerified: boolean,
): FormErrors {
  const errors: FormErrors = {};

  if (form.studentNo && !NUM_REGEX.test(form.studentNo))
    errors.studentNo = "숫자만 입력하세요.";

  if (form.phone && !NUM_REGEX.test(form.phone))
    errors.phone = "숫자만 입력하세요.";

  if (form.email && !EMAIL_REGEX.test(form.email))
    errors.email = "이메일 형식에 맞게 입력하세요.";

  if (form.roomId) {
    if (!NUM_REGEX.test(form.roomId))       errors.roomId = "숫자만 입력하세요.";
    else if (form.roomId.length < 3)        errors.roomId = "정확한 호수를 입력하세요.";
  }

  if (form.password && !PASSWORD_REGEX.test(form.password))
    errors.password = "특수문자를 포함한 8자 이상으로 입력하세요.";

  if (form.confirmPassword && form.password !== form.confirmPassword)
    errors.confirmPassword = "비밀번호가 일치하지 않습니다.";

  if (isSubmitted) {
    if (!form.studentNo.trim())       errors.studentNo = "학번을 입력하세요.";
    if (!form.name.trim())            errors.name = "이름을 입력하세요.";
    if (!form.email.trim())           errors.email = "이메일을 입력하세요.";
    if (!form.phone.trim())           errors.phone = "연락처를 입력하세요.";
    if (!form.password.trim())        errors.password = "비밀번호를 입력하세요.";
    if (!form.roomId.trim())          errors.roomId = "호수를 입력하세요.";
    if (isCodeSent && !isEmailVerified && !form.verificationCode.trim())
      errors.verificationCode = "인증코드를 입력하세요.";
  }

  return errors;
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────

export default function SignUp() {
  const navigate = useNavigate();

  const [formData, setFormData]           = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors]               = useState<FormErrors>({});
  const [successMsgs, setSuccessMsgs]     = useState<SuccessMsgs>({});
  const [isCodeSent, setIsCodeSent]       = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isLoading, setIsLoading]         = useState(false);
  const [openSelect, setOpenSelect]       = useState(false);
  const [isSubmitted, setIsSubmitted]     = useState(false);
  const [alertMsg, setAlertMsg]           = useState<string | null>(null);
  const [timeLeft, setTimeLeft]           = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── 타이머 ──
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current); // 중복 방지

    if (timeLeft > 0) {
      timerRef.current = setInterval(() =>
        setTimeLeft(prev => (prev <= 1 ? (clearInterval(timerRef.current!), 0) : prev - 1))
      , 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timeLeft]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ── 실시간 유효성 검사 ──
  useEffect(() => {
    setErrors(validateForm(formData, isSubmitted, isCodeSent, isEmailVerified));
  }, [formData, isSubmitted, isCodeSent, isEmailVerified]);

  // ── 입력 핸들러 ──
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSuccessMsgs(prev => {
      if (!prev[name as keyof FormData]) return prev;
      const next = { ...prev };
      delete next[name as keyof FormData];
      return next;
    });
  }, []);

  // ── 이메일 인증코드 발송 ──
  const sendVerificationCode = useCallback(() => {
    if (!EMAIL_REGEX.test(formData.email)) {
      setErrors(prev => ({ ...prev, email: "이메일 형식에 맞게 입력하세요." }));
      return;
    }
    setIsLoading(true);
    // TODO: 실제 API 호출로 교체
    setTimeout(() => {
      setIsCodeSent(true);
      setIsEmailVerified(false);
      setTimeLeft(TIMER_SECONDS);
      setSuccessMsgs(prev => ({ ...prev, email: "인증코드가 발송되었습니다." }));
      setIsLoading(false);
    }, VERIFY_DELAY);
  }, [formData.email]);

  // ── 인증코드 확인 ──
  const verifyCode = useCallback(() => {
    if (!formData.verificationCode) return;
    setIsLoading(true);
    // TODO: 실제 API 호출로 교체
    setTimeout(() => {
      setIsEmailVerified(true);
      setTimeLeft(0);
      setSuccessMsgs(prev => ({ ...prev, verificationCode: "인증이 완료되었습니다." }));
      setIsLoading(false);
    }, VERIFY_DELAY);
  }, [formData.verificationCode]);

  // ── 생활관 선택 ──
  const handleDormSelect = useCallback((id: string) => {
    setFormData(prev => ({ ...prev, dormitoryId: id }));
    setOpenSelect(false);
  }, []);

  // ── 제출 ──
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    const errs = validateForm(formData, true, isCodeSent, isEmailVerified);
    if (Object.keys(errs).length > 0 || !isEmailVerified) return;

    setIsLoading(true);
    // TODO: 실제 API 호출로 교체
    setTimeout(() => {
      setAlertMsg("가온이의 가족이 되신 것을 환영합니다!");
      setIsLoading(false);
    }, SUBMIT_DELAY);
  }, [formData, isCodeSent, isEmailVerified]);

  // 파생값: dormitoryId → dormitoryName
  const dormitoryName = DORMITORIES.find(d => d.id === formData.dormitoryId)?.name ?? "";

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[448px] flex-col overflow-hidden bg-[#f0f9ff] font-sans shadow-2xl antialiased">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#e0f2fe] via-[#f0f9ff] to-[#f8fafc]" />

      {/* ── 완료 모달 ── */}
      {alertMsg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-nav-primary/30 px-8 backdrop-blur-[4px]">
          <div className="w-full max-w-[320px] animate-in zoom-in duration-300 rounded-[32px] bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-nav-active-bg-from">
              <CheckCircle className="text-nav-accent" size={32} />
            </div>
            <h2 className="mb-2 text-[19px] font-bold text-nav-primary">가입 완료!</h2>
            <p className="mb-8 text-[14px] font-medium leading-relaxed text-nav-accent">{alertMsg}</p>
            <button
              onClick={() => navigate("/auth/login")}
              className="h-12 w-full rounded-[20px] bg-nav-accent font-bold text-white shadow-lg shadow-nav-accent/20 transition-all active:scale-[0.96]"
            >
              시작하기
            </button>
          </div>
        </div>
      )}

      {/* ── 헤더 ── */}
      <div className="flex shrink-0 items-center gap-4 px-8 pb-6 pt-16">
        <button
          onClick={() => navigate("/auth/login")}
          className="-ml-2 rounded-full p-2 text-nav-primary transition-all hover:bg-white"
        >
          <ChevronLeft className="size-6" />
        </button>
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-nav-primary">회원가입</h1>
          <p className="mt-0.5 text-[13px] font-bold text-nav-inactive">
            간편하게 가입하고 스마트하게 생활하세요
          </p>
        </div>
      </div>

      {/* ── 폼 카드 ── */}
      <div className="flex-1 overflow-y-auto px-6 pb-12">
        <div className="rounded-[32px] border border-white bg-white/70 p-7 shadow-xl shadow-blue-900/5 backdrop-blur-lg">
          <form onSubmit={handleSubmit} className="space-y-1" noValidate>

            <SignUpInput label="학번"      name="studentNo"        icon={User}       placeholder="학번을 입력하세요"         value={formData.studentNo}        onChange={handleChange} error={errors.studentNo}        successMsg={successMsgs.studentNo} />
            <SignUpInput label="이름"      name="name"             icon={User}       placeholder="이름을 입력하세요"         value={formData.name}             onChange={handleChange} error={errors.name}             successMsg={successMsgs.name} />
            <SignUpInput label="이메일"    name="email"            icon={Mail}       placeholder="이메일을 입력하세요"       value={formData.email}            onChange={handleChange} error={errors.email}            successMsg={successMsgs.email}    type="email"
              buttonLabel={isCodeSent ? "재전송" : "인증"}
              onButtonClick={sendVerificationCode}
            />
            <SignUpInput label="인증코드"  name="verificationCode" icon={KeyRound}   placeholder="인증코드를 입력하세요"     value={formData.verificationCode} onChange={handleChange} error={errors.verificationCode}  successMsg={successMsgs.verificationCode}
              disabled={isEmailVerified}
              buttonLabel="확인"
              onButtonClick={verifyCode}
              buttonDisabled={isEmailVerified}
              timer={isCodeSent && !isEmailVerified && timeLeft > 0 ? formatTime(timeLeft) : undefined}
            />
            <SignUpInput label="전화번호"  name="phone"            icon={Phone}      placeholder="전화번호를 입력하세요"     value={formData.phone}            onChange={handleChange} error={errors.phone}            successMsg={successMsgs.phone}    type="tel" />
            <SignUpInput label="비밀번호"  name="password"         icon={Lock}       placeholder="비밀번호를 입력하세요"     value={formData.password}         onChange={handleChange} error={errors.password}         successMsg={successMsgs.password} type="password" />
            <SignUpInput label="비밀번호 확인" name="confirmPassword" icon={ShieldCheck} placeholder="비밀번호를 다시 입력하세요" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} successMsg={successMsgs.confirmPassword} type="password" />

            {/* ── 생활관 선택 ── */}
            <div className="flex flex-col">
              <label className="mb-1 ml-1 text-[10px] font-bold uppercase tracking-wider text-nav-inactive">
                생활관 동수
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenSelect(v => !v)}
                  className={`flex h-[54px] w-full items-center justify-between rounded-[18px] border-2 bg-white px-4 shadow-sm transition-all ${openSelect ? "border-nav-accent" : "border-white"}`}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className={`size-[18px] transition-colors ${openSelect ? "text-nav-accent" : "text-nav-inactive"}`} />
                    <span className="text-[14px] font-bold text-nav-primary">{dormitoryName}</span>
                  </div>
                  <ChevronDown className={`size-4 text-nav-inactive transition-transform ${openSelect ? "rotate-180" : ""}`} />
                </button>

                {openSelect && (
                  <div className="absolute z-50 mt-2 w-full animate-in fade-in slide-in-from-top-2 overflow-hidden rounded-[22px] border border-slate-100 bg-white shadow-2xl">
                    {DORMITORIES.map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleDormSelect(opt.id)}
                        className="flex w-full items-center justify-between border-b border-slate-50 px-5 py-4 text-left text-[14px] font-bold text-nav-inactive transition-colors last:border-none hover:bg-nav-active-bg-from hover:text-nav-accent"
                      >
                        {opt.name}
                        {formData.dormitoryId === opt.id && <Check size={16} className="text-nav-accent" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="h-5" />
            </div>

            {/* ── 호수 ── */}
            <SignUpInput label="생활관 호수" name="roomId" icon={Home} placeholder="생활관 호수를 입력하세요" value={formData.roomId} onChange={handleChange} error={errors.roomId} />

            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 flex h-[58px] w-full items-center justify-center rounded-[22px] bg-nav-accent text-[17px] font-bold text-white shadow-xl shadow-nav-accent/30 transition-all active:scale-95 disabled:bg-slate-300"
            >
              {isLoading ? "준비 중..." : "가입하기"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── SignUpInput 서브 컴포넌트 ────────────────────────────

interface SignUpInputProps {
  label: string;
  name: string;
  icon: LucideIcon;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  successMsg?: string;
  type?: string;
  disabled?: boolean;
  buttonLabel?: string;
  onButtonClick?: () => void;
  buttonDisabled?: boolean;
  timer?: string;
}

const SignUpInput = memo(function SignUpInput({
  label, name, icon: Icon, placeholder, value, onChange,
  error, successMsg, type = "text", disabled = false,
  buttonLabel, onButtonClick, buttonDisabled = false, timer,
}: SignUpInputProps) {
  return (
    <div className="flex flex-col">
      <label className="mb-1 ml-1 text-[10px] font-bold uppercase tracking-wider text-nav-inactive">
        {label}
      </label>
      <div className="flex gap-2">
        <div className="group relative flex-1">
          <Icon
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-nav-inactive transition-colors group-focus-within:text-nav-accent"
          />
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder}
            className={`h-[54px] w-full rounded-[18px] border-2 pl-11 pr-4 text-[14px] font-bold text-nav-primary shadow-sm transition-all focus:outline-none focus:border-nav-accent ${
              disabled ? "bg-slate-100/50" : "bg-white"
            } ${error ? "border-red-400" : "border-white"}`}
          />
          {timer && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-bold text-red-500">
              {timer}
            </span>
          )}
        </div>

        {buttonLabel && (
          <button
            type="button"
            onClick={onButtonClick}
            disabled={buttonDisabled}
            className="h-[54px] shrink-0 rounded-[18px] border-2 border-white bg-white px-4 text-[13px] font-bold text-nav-accent shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {buttonLabel}
          </button>
        )}
      </div>

      <div className="ml-1 mt-0.5 h-[18px]">
        {error && (
          <p className="text-[10px] font-bold text-red-500">* {error}</p>
        )}
        {!error && successMsg && (
          <p className="flex items-center gap-1 text-[10px] font-bold text-green-500">
            <CheckCircle size={10} /> {successMsg}
          </p>
        )}
      </div>
    </div>
  );
});