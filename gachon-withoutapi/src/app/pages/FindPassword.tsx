import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { User, Mail, Phone, Lock, ChevronLeft, CheckCircle } from "lucide-react";

// ─── 상수 ─────────────────────────────────────────────────

const STUDENT_ID_REGEX = /^[0-9]+$/;
const EMAIL_REGEX      = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX      = /^[0-9]+$/;
const PASSWORD_REGEX   = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

// ─── 타입 ─────────────────────────────────────────────────

type Step = "verify" | "reset";

interface VerifyForm {
  studentId: string;
  name: string;
  email: string;
  phone: string;
}

interface ResetForm {
  newPassword: string;
  confirmPassword: string;
}

type FormErrors<T> = Partial<Record<keyof T, string>>;

// ─── 유효성 검사 유틸 ─────────────────────────────────────

function validateVerify(form: VerifyForm, isSubmitted: boolean): FormErrors<VerifyForm> {
  const errors: FormErrors<VerifyForm> = {};

  if (isSubmitted && !form.studentId.trim())       errors.studentId = "학번을 입력하세요.";
  else if (form.studentId && !STUDENT_ID_REGEX.test(form.studentId)) errors.studentId = "숫자만 입력하세요.";

  if (isSubmitted && !form.name.trim())            errors.name = "이름을 입력하세요.";

  if (isSubmitted && !form.email.trim())           errors.email = "이메일을 입력하세요.";
  else if (form.email && !EMAIL_REGEX.test(form.email)) errors.email = "이메일 형식에 맞게 입력하세요.";

  if (isSubmitted && !form.phone.trim())           errors.phone = "전화번호를 입력하세요.";
  else if (form.phone && !PHONE_REGEX.test(form.phone)) errors.phone = "숫자만 입력하세요.";

  return errors;
}

function validateReset(form: ResetForm, isSubmitted: boolean): FormErrors<ResetForm> {
  const errors: FormErrors<ResetForm> = {};

  if (isSubmitted && !form.newPassword.trim())          errors.newPassword = "새 비밀번호를 입력하세요.";
  else if (form.newPassword && !PASSWORD_REGEX.test(form.newPassword)) errors.newPassword = "특수문자 포함 8자 이상 입력하세요.";

  if (isSubmitted && !form.confirmPassword.trim())      errors.confirmPassword = "새 비밀번호를 다시 입력하세요.";
  else if (form.confirmPassword && form.newPassword !== form.confirmPassword) errors.confirmPassword = "비밀번호가 일치하지 않습니다.";

  return errors;
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────

export default function FindPassword() {
  const navigate = useNavigate();

  const [step, setStep]               = useState<Step>("verify");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [alertMsg, setAlertMsg]       = useState<string | null>(null);

  const [verifyForm, setVerifyForm] = useState<VerifyForm>({
    studentId: "", name: "", email: "", phone: "",
  });
  const [resetForm, setResetForm] = useState<ResetForm>({
    newPassword: "", confirmPassword: "",
  });

  const [verifyErrors, setVerifyErrors] = useState<FormErrors<VerifyForm>>({});
  const [resetErrors, setResetErrors]   = useState<FormErrors<ResetForm>>({});

  // ── 실시간 유효성 검사 ──
  useEffect(() => {
    if (step === "verify") {
      setVerifyErrors(validateVerify(verifyForm, isSubmitted));
    } else {
      setResetErrors(validateReset(resetForm, isSubmitted));
    }
  }, [verifyForm, resetForm, step, isSubmitted]);

  const handleVerifyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVerifyForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleResetChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setResetForm(prev => ({ ...prev, [name]: value }));
  }, []);

  // ── 본인 확인 제출 ──
  const handleVerify = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    const errs = validateVerify(verifyForm, true);
    if (Object.keys(errs).length > 0) return;

    // TODO: 실제 API 호출로 교체
    setStep("reset");
    setIsSubmitted(false);
    setVerifyForm({ studentId: "", name: "", email: "", phone: "" }); // step 전환 시 초기화
  }, [verifyForm]);

  // ── 비밀번호 재설정 제출 ──
  const handleReset = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    const errs = validateReset(resetForm, true);
    if (Object.keys(errs).length > 0) return;

    // TODO: 실제 API 호출로 교체
    setAlertMsg("비밀번호가 안전하게\n변경되었습니다.");
  }, [resetForm]);

  // ── 뒤로가기 ──
  const handleBack = useCallback(() => {
    if (step === "reset") {
      setStep("verify");
      setIsSubmitted(false);
      setResetForm({ newPassword: "", confirmPassword: "" }); // reset step 초기화
    } else {
      navigate("/auth/login");
    }
  }, [step, navigate]);

  const handleAlertConfirm = useCallback(() => {
    setAlertMsg(null);
    navigate("/auth/login");
  }, [navigate]);

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-[448px] overflow-x-hidden bg-[#f0f9ff] font-sans shadow-2xl antialiased">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#e0f2fe] via-[#f0f9ff] to-[#f8fafc]" />

      {/* ── 성공 모달 ── */}
      {alertMsg && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-8"
          onClick={handleAlertConfirm}
        >
          <div className="absolute inset-0 bg-nav-primary/30 backdrop-blur-[4px]" />
          <div
            className="relative w-full max-w-[320px] animate-in fade-in zoom-in duration-300 rounded-[32px] border border-white bg-white p-8 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-nav-active-bg-from">
                <CheckCircle className="text-nav-accent" size={32} />
              </div>
              <h2 className="mb-2 text-[19px] font-bold text-nav-primary">변경 완료</h2>
              <p className="mb-7 whitespace-pre-line text-[15px] font-medium leading-relaxed text-nav-accent">
                {alertMsg}
              </p>
              <button
                onClick={handleAlertConfirm}
                className="h-12 w-full rounded-[20px] bg-nav-accent font-bold text-white shadow-lg shadow-nav-accent/20 transition-all active:scale-[0.96]"
              >
                로그인하기
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex w-full flex-col px-6 pb-16">

        {/* ── 헤더 ── */}
        <div className="flex items-center gap-4 pb-8 pt-16">
          <button
            onClick={handleBack}
            className="-ml-2 rounded-full p-2 text-nav-primary transition-all hover:bg-white"
          >
            <ChevronLeft className="size-6" />
          </button>
          <div>
            <h1 className="text-[26px] font-bold tracking-tight text-nav-primary">비밀번호 찾기</h1>
            <p className="mt-0.5 text-[13px] font-bold text-nav-inactive">
              {step === "verify" ? "본인 확인을 위해 정보를 입력해주세요" : "새로운 비밀번호를 입력해주세요"}
            </p>
          </div>
        </div>

        {/* ── 폼 카드 ── */}
        <div className="rounded-[32px] border border-white bg-white/70 p-7 shadow-xl shadow-blue-900/5 backdrop-blur-lg">
          {step === "verify" ? (
            <form onSubmit={handleVerify} className="space-y-4" noValidate>
              <InputField label="학번"    name="studentId" type="text"  value={verifyForm.studentId} onChange={handleVerifyChange} placeholder="학번을 입력하세요"    error={verifyErrors.studentId} icon={<User  size={18} className="text-nav-inactive group-focus-within:text-nav-accent transition-colors" />} />
              <InputField label="이름"    name="name"      type="text"  value={verifyForm.name}      onChange={handleVerifyChange} placeholder="이름을 입력하세요"    error={verifyErrors.name}      icon={<User  size={18} className="text-nav-inactive group-focus-within:text-nav-accent transition-colors" />} />
              <InputField label="이메일"  name="email"     type="email" value={verifyForm.email}     onChange={handleVerifyChange} placeholder="이메일을 입력하세요"  error={verifyErrors.email}     icon={<Mail  size={18} className="text-nav-inactive group-focus-within:text-nav-accent transition-colors" />} />
              <InputField label="전화번호" name="phone"    type="tel"   value={verifyForm.phone}     onChange={handleVerifyChange} placeholder="전화번호를 입력하세요" error={verifyErrors.phone}     icon={<Phone size={18} className="text-nav-inactive group-focus-within:text-nav-accent transition-colors" />} />
              <SubmitButton>본인 확인</SubmitButton>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4" noValidate>
              <InputField label="새 비밀번호"    name="newPassword"     type="password" value={resetForm.newPassword}     onChange={handleResetChange} placeholder="새 비밀번호를 입력하세요"      error={resetErrors.newPassword}     icon={<Lock size={18} className="text-nav-inactive group-focus-within:text-nav-accent transition-colors" />} />
              <InputField label="비밀번호 확인"  name="confirmPassword" type="password" value={resetForm.confirmPassword} onChange={handleResetChange} placeholder="새 비밀번호를 다시 입력하세요" error={resetErrors.confirmPassword} icon={<Lock size={18} className="text-nav-inactive group-focus-within:text-nav-accent transition-colors" />} />
              <SubmitButton>비밀번호 변경하기</SubmitButton>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── 서브 컴포넌트 ─────────────────────────────────────────

interface InputFieldProps {
  label: string;
  name: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  error?: string;
  icon: React.ReactNode;
}

function InputField({ label, name, type, value, onChange, placeholder, error, icon }: InputFieldProps) {
  return (
    <div className="flex flex-col">
      <label className="mb-1.5 ml-1 text-[11px] font-bold uppercase tracking-widest text-nav-inactive">
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
          className={`h-[54px] w-full rounded-[18px] border-2 bg-white pl-11 pr-4 text-[15px] font-bold text-nav-primary shadow-sm transition-all focus:outline-none focus:border-nav-accent ${
            error ? "border-red-300" : "border-white"
          }`}
        />
      </div>
      <div className="ml-1 mt-1 h-[18px]">
        {error && (
          <p className="animate-in fade-in slide-in-from-left-2 text-[11px] font-bold text-red-500">
            * {error}
          </p>
        )}
      </div>
    </div>
  );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="submit"
      className="mt-2 h-[58px] w-full rounded-[22px] bg-nav-accent text-[16px] font-bold text-white shadow-lg shadow-nav-accent/25 transition-all active:scale-95"
    >
      {children}
    </button>
  );
}