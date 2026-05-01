import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { 
  User, Mail, Phone, Lock, ChevronLeft, 
  CheckCircle
} from "lucide-react";

export default function FindPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"verify" | "reset">("verify");
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

  /**
   * 실시간 유효성 검사 로직
   */
  useEffect(() => {
    const newErrors: Record<string, string> = {};
    
    if (step === "verify") {
      if (isSubmitted && !studentId.trim()) newErrors.studentId = "학번을 입력하세요.";
      else if (studentId && !/^[0-9]+$/.test(studentId)) newErrors.studentId = "숫자만 입력하세요.";

      if (isSubmitted && !name.trim()) newErrors.name = "이름을 입력하세요.";

      if (isSubmitted && !email.trim()) newErrors.email = "이메일을 입력하세요.";
      else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "이메일 형식에 맞게 입력하세요.";

      if (isSubmitted && !phone.trim()) newErrors.phone = "전화번호를 입력하세요.";
      else if (phone && !/^[0-9]+$/.test(phone)) newErrors.phone = "숫자만 입력하세요.";

    } else {
      const pwdRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
      if (isSubmitted && !newPassword.trim()) newErrors.newPassword = "새 비밀번호를 입력하세요.";
      else if (newPassword && !pwdRegex.test(newPassword)) {
        newErrors.newPassword = "특수문자 포함 8자 이상 입력하세요.";
      }

      if (isSubmitted && !confirmPassword.trim()) newErrors.confirmPassword = "새 비밀번호를 다시 입력하세요.";
      else if (confirmPassword && newPassword !== confirmPassword) {
        newErrors.confirmPassword = "비밀번호가 일치하지 않습니다.";
      }
    }

    setErrors(newErrors);
  }, [studentId, name, email, phone, newPassword, confirmPassword, step, isSubmitted]);

  // 본인 확인 처리
  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    // 형식 검증
    if (!studentId.trim() || !name.trim() || !email.trim() || !phone.trim() || 
        !/^[0-9]+$/.test(studentId) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^[0-9]+$/.test(phone)) {
      return;
    }

    // 성공 가정(로딩 효과 추가 가능)
    setStep("reset");
    setIsSubmitted(false);
    setErrors({}); 
  };

  // 비밀번호 재설정 처리
  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    const pwdRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!newPassword.trim() || !confirmPassword.trim() || !pwdRegex.test(newPassword) || newPassword !== confirmPassword) {
      return;
    }

    setAlertConfig({ 
      show: true, 
      message: "비밀번호가 안전하게\n변경되었습니다.", 
      type: "success" 
    });
  };

  const handleAlertConfirm = () => {
    setAlertConfig({ ...alertConfig, show: false });
    if (alertConfig.type === "success") navigate("/auth/login");
  };

  return (
    <div className="min-h-screen w-full max-w-[448px] mx-auto bg-[#f0f9ff] flex justify-center antialiased font-sans overflow-x-hidden relative shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-b from-[#e0f2fe] via-[#f0f9ff] to-[#f8fafc] -z-10" />

      {/* 성공/실패 알림 모달 */}
      {alertConfig.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-8">
          <div className="absolute inset-0 bg-[#054a57]/30 backdrop-blur-[4px]" onClick={handleAlertConfirm} />
          <div className="relative bg-white w-full max-w-[320px] rounded-[32px] shadow-2xl p-8 animate-in fade-in zoom-in duration-300 border border-white">
            <div className="flex flex-col items-center text-center">
              <div className="size-[64px] bg-[#f0f9ff] rounded-2xl flex items-center justify-center mb-5">
                <CheckCircle className="text-[#5eb9ca]" size={32} />
              </div>
              <h2 className="text-[19px] font-bold text-[#054a57] mb-2">변경 완료</h2>
              <p className="text-[15px] font-medium text-[#7aaeb7] whitespace-pre-line mb-7 leading-relaxed">{alertConfig.message}</p>
              <button onClick={handleAlertConfirm} className="w-full h-[56px] bg-[#5eb9ca] text-white font-bold rounded-[20px] active:scale-[0.96] transition-all shadow-lg shadow-[#5eb9ca]/20">로그인하기</button>
            </div>
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
          {step === "verify" ? (
            <form onSubmit={handleVerify} className="space-y-4">
              {[
                { label: "학번", key: "studentId", type: "text", value: studentId, setter: setStudentId, icon: User, ph: "학번을 입력하세요" },
                { label: "이름", key: "name", type: "text", value: name, setter: setName, icon: User, ph: "이름을 입력하세요" },
                { label: "이메일", key: "email", type: "email", value: email, setter: setEmail, icon: Mail, ph: "이메일을 입력하세요" },
                { label: "전화번호", key: "phone", type: "tel", value: phone, setter: setPhone, icon: Phone, ph: "전화번호를 입력하세요" },
              ].map((item) => (
                <div key={item.key} className="flex flex-col">
                  <label className="text-[11px] font-bold text-[#829496] ml-1 mb-1.5 uppercase tracking-widest">{item.label}</label>
                  <div className="relative group">
                    <item.icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#adc0c2] group-focus-within:text-[#5eb9ca] transition-colors" />
                    <input 
                      type={item.type} 
                      value={item.value} 
                      onChange={(e) => item.setter(e.target.value)}
                      placeholder={item.ph}
                      className={`w-full bg-white border-2 ${errors[item.key] ? 'border-red-300' : 'border-white'} rounded-[18px] pl-11 pr-4 h-[54px] text-[15px] font-bold text-[#054a57] focus:outline-none focus:border-[#5eb9ca] transition-all shadow-sm`} 
                    />
                  </div>
                  <div className="h-[18px] mt-1 ml-1">
                    {errors[item.key] && <p className="text-[11px] text-red-500 font-bold animate-in fade-in slide-in-from-left-2">* {errors[item.key]}</p>}
                  </div>
                </div>
              ))}
              <button type="submit" className="w-full h-[58px] bg-[#5eb9ca] rounded-[22px] text-[16px] font-bold text-white shadow-lg mt-2 active:scale-95 transition-all shadow-[#5eb9ca]/25">본인 확인</button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              {[
                { label: "새 비밀번호", key: "newPassword", value: newPassword, setter: setNewPassword, ph: "새 비밀번호를 입력하세요" },
                { label: "비밀번호 확인", key: "confirmPassword", value: confirmPassword, setter: setConfirmPassword, ph: "새 비밀번호를 다시 입력하세요" },
              ].map((item) => (
                <div key={item.key} className="flex flex-col">
                  <label className="text-[11px] font-bold text-[#829496] ml-1 mb-1.5 uppercase tracking-widest">{item.label}</label>
                  <div className="relative group">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#adc0c2] group-focus-within:text-[#5eb9ca] transition-colors" />
                    <input 
                      type="password" 
                      value={item.value} 
                      onChange={(e) => item.setter(e.target.value)}
                      placeholder={item.ph}
                      className={`w-full bg-white border-2 ${errors[item.key] ? 'border-red-300' : 'border-white'} rounded-[18px] pl-11 pr-4 h-[54px] text-[15px] font-bold text-[#054a57] focus:outline-none focus:border-[#5eb9ca] transition-all shadow-sm`} 
                    />
                  </div>
                  <div className="h-[18px] mt-1 ml-1">
                    {errors[item.key] && <p className="text-[10px] text-red-500 font-bold animate-in fade-in slide-in-from-left-2">* {errors[item.key]}</p>}
                  </div>
                </div>
              ))}
              <button type="submit" className="w-full h-[58px] bg-[#5eb9ca] rounded-[22px] text-[16px] font-bold text-white shadow-lg mt-2 active:scale-95 transition-all shadow-[#5eb9ca]/25">비밀번호 변경하기</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}