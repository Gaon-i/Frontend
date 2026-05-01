import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { 
  User, Mail, Phone, Lock, ChevronLeft, 
  CheckCircle, Loader2, AlertCircle
} from "lucide-react";
import api from "../api/axios";
// axios 인스턴스 임포트

export default function FindPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"verify" | "reset">("verify");
  const [isLoading, setIsLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ 
    show: false, 
    message: "", 
    type: "success" as "success" | "error" 
  });

  // 입력값 상태
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 에러 메시지 상태
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 각 입력 필드에 접근하기 위한 Ref 객체
  const formRefs = {
    studentId: useRef<HTMLDivElement>(null),
    name: useRef<HTMLDivElement>(null),
    email: useRef<HTMLDivElement>(null),
    phone: useRef<HTMLDivElement>(null),
    newPassword: useRef<HTMLDivElement>(null),
    confirmPassword: useRef<HTMLDivElement>(null),
  };

  // 입력값이 변경될 때 에러를 즉시 지워주는 함수
  const handleInputChange = (field: string, value: string, setter: (v: string) => void) => {
    setter(value);
    // 값 업데이트
  
    // 에러가 있다면 즉시 제거 (실시간 반응성)
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  useEffect(() => {
    const newErrors: Record<string, string> = {};

    if (step === "verify") {

      // 학번 검사
      const studentIdStr = studentId.trim();
      if (!studentIdStr) {
        if (isSubmitted) newErrors.studentId = "학번을 입력하세요.";
      } else if (!/^\d+$/.test(studentIdStr)) {
        newErrors.studentId = "숫자만 입력하세요.";
      } else if (studentIdStr.length !== 9) {
        newErrors.studentId = "9자리를 정확히 입력하세요.";
      }

      // 이름 검사
      if (isSubmitted && !name.trim()) {
        newErrors.name = "이름을 입력하세요.";
      }

      // 이메일 검사
      if (!email.trim()) {
        if (isSubmitted) newErrors.email = "이메일을 입력하세요.";
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          newErrors.email = "이메일 형식에 맞게 입력하세요.";
        }
      }

      // 전화번호 검사
      const purePhone = phone.replace(/-/g, "");
      // 하이픈 제거 후 검사
      if (!purePhone.trim()) {
        if (isSubmitted) newErrors.phone = "전화번호를 입력하세요.";
      } else if (!/^\d+$/.test(purePhone)) {
        newErrors.phone = "숫자만 입력하세요.";
      } else if (isSubmitted && !/^010\d{8}$/.test(purePhone)) {
        newErrors.phone = "전화번호 형식에 맞게 입력하세요.";
      }

    } else {

      // 새 비밀번호 검사
      const pwdRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
      if (!newPassword.trim()) {
        if (isSubmitted) newErrors.newPassword = "새 비밀번호를 입력하세요.";
      } else if (!pwdRegex.test(newPassword)) {
        newErrors.newPassword = "특수 문자를 포함한 8자 이상으로 입력하세요.";
      }

      // 비밀번호 확인 체크
      if (!confirmPassword.trim()) {
        if (isSubmitted) newErrors.confirmPassword = "새 비밀번호를 다시 입력하세요.";
      } else if (newPassword !== confirmPassword) {
        newErrors.confirmPassword = "비밀번호가 일치하지 않습니다.";
      }
    }

    setErrors(newErrors);
  }, [studentId, name, email, phone, newPassword, confirmPassword, step, isSubmitted]);

    // 본인 확인 처리
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    // 검사할 필드 순서 정의
    const fieldOrder: (keyof typeof formRefs)[] = ["studentId", "name", "email", "phone"];
  
    // 에러가 있는 첫 번째 필드 찾기
    const firstError = fieldOrder.find(field => {
      if (field === "studentId" && !studentId.trim()) return true;
      if (field === "name" && !name.trim()) return true;
      if (field === "email" && (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return true;
      if (field === "phone" && !phone.trim()) return true;
      return !!errors[field];
    });

    // 에러 위치로 스크롤
    if (firstError) {
      formRefs[firstError].current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // 유효성 검사 (학번, 이름, 이메일, 전화번호)
    if (Object.keys(errors).length > 0 || !studentId || !name || !email || !phone) return;

    setIsLoading(true);
    try {
      const response = await api.post("/auth/password/identity", {
        studentNo: studentId,
        name: name,
        email: email,
        phone: phone.replace(/-/g, "")
        // 하이픈 제거 (01012345678 형식)
      }, { withCredentials: true });
      // 세션 쿠키 발급을 위해 필요

      if (response.data.code === 200) {
        setStep("reset");
        setIsSubmitted(false);
        setErrors({});
      }
    } catch (error: any) {
      // 404: 사용자 없음, 422: 형식 오류 등
      const msg = error.response?.data?.message || "정보가 일치하지 않습니다.";
      setAlertConfig({ show: true, message: msg, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  // [2단계] 비밀번호 재설정 처리
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    // 검사 순서
    const fieldOrder: (keyof typeof formRefs)[] = ["newPassword", "confirmPassword"];
    
    const firstError = fieldOrder.find(field => {
      if (field === "newPassword" && !newPassword.trim()) return true;
      if (field === "confirmPassword" && (!confirmPassword.trim() || newPassword !== confirmPassword)) return true;
      return !!errors[field];
    });

    if (firstError) {
      formRefs[firstError].current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    };

    if (Object.keys(errors).length > 0 || !newPassword || newPassword !== confirmPassword) return;

    setIsLoading(true);
    try {
      const response = await api.patch("/auth/password/reset", {
        newPassword: newPassword
      }, { withCredentials: true });
      // 앞에서 받은 세션 쿠키를 함께 전송

      if (response.data.code === 200) {
        setAlertConfig({ 
          show: true, 
          message: "비밀번호가 안전하게\n변경되었습니다.", 
          type: "success" 
        });
      }
    } catch (error: any) {
      // 401: 본인확인 미비, 404: 대상 없음 등
      const msg = error.response?.data?.message || "비밀번호 재설정에 실패했습니다.";
      setAlertConfig({ show: true, message: msg, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAlertConfirm = () => {
    setAlertConfig({ ...alertConfig, show: false });
    if (alertConfig.type === "success") navigate("/auth/login");
  };

  return (
    <div className="min-h-screen w-full max-w-[448px] mx-auto bg-[#f0f9ff] flex justify-center antialiased font-sans overflow-x-hidden relative shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-b from-[#e0f2fe] via-[#f0f9ff] to-[#f8fafc] -z-10" />

      {/* 알림 모달 */}
      {alertConfig.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-8">
          <div className="absolute inset-0 bg-[#054a57]/30 backdrop-blur-[4px]" onClick={handleAlertConfirm} />
          <div className="relative bg-white w-full max-w-[320px] rounded-[32px] shadow-2xl p-8 animate-in fade-in zoom-in duration-300 border border-white text-center">
            <div className="size-[64px] bg-[#f0f9ff] rounded-2xl flex items-center justify-center mb-5 mx-auto">
              {alertConfig.type === "success" ? (
                <CheckCircle className="text-[#5eb9ca]" size={32} />
              ) : (
                <AlertCircle className="text-red-400" size={32} />
              )}
            </div>
            <h2 className="text-[19px] font-bold text-[#054a57] mb-2">
              {alertConfig.type === "success" ? "알림" : "오류"}
            </h2>
            <p className="text-[15px] font-medium text-[#7aaeb7] whitespace-pre-line mb-7 leading-relaxed">{alertConfig.message}</p>
            <button onClick={handleAlertConfirm} className="w-full h-[56px] bg-[#5eb9ca] text-white font-bold rounded-[20px] active:scale-[0.96] transition-all shadow-lg shadow-[#5eb9ca]/20">확인</button>
          </div>
        </div>
      )}

      <div className="w-full flex flex-col px-6 pb-16">
        {/* 헤더 */}
        <div className="pt-16 pb-8 flex items-center gap-4">
          <button 
            onClick={() => { if(step === "reset") {setStep("verify"); setIsSubmitted(false);} else navigate("/auth/login"); }} 
            className="p-2 -ml-2 rounded-full text-[#054a57] hover:bg-white transition-all"
          >
            <ChevronLeft className="size-6" />
          </button>
          <div>
            <h1 className="font-bold text-[26px] text-[#054a57] tracking-tight">비밀번호 찾기</h1>
            <p className="text-[#607d8b] text-[13px] font-bold mt-0.5 opacity-80">
              {step === "verify" ? "본인 확인을 위해 정보를 입력해주세요" : "새로운 비밀번호를 입력해주세요"}
            </p>
          </div>
        </div>

        {/* 폼 카드 */}
        <div className="bg-white/70 backdrop-blur-lg rounded-[32px] p-7 shadow-xl shadow-blue-900/5 border border-white">
          <form onSubmit={step === "verify" ? handleVerify : handleReset} className="space-y-4">
            {step === "verify" ? (
              <>
                <InputField label="학번" name="studentId" value={studentId} setter={setStudentId} icon={User} error={errors.studentId} ph="학번을 입력하세요" inputRef={formRefs.studentId} />
                <InputField label="이름" name="name" value={name} setter={setName} icon={User} error={errors.name} ph="이름을 입력하세요" inputRef={formRefs.name} />
                <InputField label="이메일" name="email" value={email} setter={setEmail} icon={Mail} error={errors.email} ph="이메일을 입력하세요" type="email" inputRef={formRefs.email} />
                <InputField label="전화번호" name="phone" value={phone} setter={setPhone} icon={Phone} error={errors.phone} ph="전화번호를 입력하세요" type="tel" inputRef={formRefs.phone} />
              </>
            ) : (
              <>
                <InputField label="새 비밀번호" name="newPassword" value={newPassword} setter={setNewPassword} icon={Lock} error={errors.newPassword} ph="새 비밀번호를 입력하세요" type="password" inputRef={formRefs.newPassword} />
                <InputField label="비밀번호 확인" name="confirmPassword" value={confirmPassword} setter={setConfirmPassword} icon={Lock} error={errors.confirmPassword} ph="다시 입력하세요" type="password" inputRef={formRefs.confirmPassword} />
              </>
            )}
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-[58px] bg-[#5eb9ca] disabled:bg-slate-300 rounded-[22px] text-[16px] font-bold text-white shadow-lg mt-2 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin size-5" /> : (step === "verify" ? "본인 확인" : "비밀번호 변경하기")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// 재사용 가능한 입력 필드 컴포넌트
function InputField({ label, name, value, setter, icon: Icon, error, ph, type = "text", inputRef }: any) {
  return (
    <div className="flex flex-col" ref={inputRef}>
      <label className="text-[11px] font-bold text-[#829496] ml-1 mb-1.5 uppercase tracking-widest">{label}</label>
      <div className="relative group">
        <Icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#adc0c2] group-focus-within:text-[#5eb9ca] transition-colors" />
        <input 
          type={type} 
          value={value} 
          onChange={(e) => setter(e.target.value)}
          placeholder={ph}
          className={`w-full bg-white border-2 ${error ? 'border-red-300' : 'border-white'} rounded-[18px] pl-11 pr-4 h-[54px] text-[15px] font-bold text-[#054a57] focus:outline-none focus:border-[#5eb9ca] transition-all shadow-sm`} 
        />
      </div>
      <div className="h-[18px] mt-1 ml-1">
        {error && <p className="text-[11px] text-red-500 font-bold animate-in fade-in slide-in-from-left-2">* {error}</p>}
      </div>
    </div>
  );
}