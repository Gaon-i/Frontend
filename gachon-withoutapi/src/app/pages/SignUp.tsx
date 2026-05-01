import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { 
  User, Lock, Mail, Phone, ArrowLeft, 
  KeyRound, CheckCircle, Building2, Home, ChevronDown, Check, ShieldCheck 
} from "lucide-react";

export default function SignUp() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    studentNo: "",
    name: "",
    email: "",
    verificationCode: "",
    phone: "",
    password: "",
    confirmPassword: "",
    dormitoryId: "1", 
    roomId: "",      
  });

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [dormitoryName, setDormitoryName] = useState("제1학생활관");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsgs, setSuccessMsgs] = useState<Record<string, string>>({});
  const [alertConfig, setAlertConfig] = useState({ show: false, message: "" });
  
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [openSelect, setOpenSelect] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? `0${s}` : s}`;
  };

  // [실시간 유효성 검사 로직]
  useEffect(() => {
    const newErrors: Record<string, string> = {};
    const pwdRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const numRegex = /^[0-9]*$/; // 숫자만 포함하는지 확인하는 정규식
    
    // 1. 학번 숫자 체크
    if (formData.studentNo && !numRegex.test(formData.studentNo)) {
      newErrors.studentNo = "숫자만 입력하세요.";
    }

    // 2. 전화번호 숫자 체크
    if (formData.phone && !numRegex.test(formData.phone)) {
      newErrors.phone = "숫자만 입력하세요.";
    }

    // 3. 이메일 형식 체크
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "이메일 형식에 맞게 입력하세요.";
    }

    // 4. 호수 숫자 및 길이 체크
    if (formData.roomId) {
      if (!numRegex.test(formData.roomId)) {
        newErrors.roomId = "숫자만 입력하세요.";
      } else if (formData.roomId.length < 3) {
        newErrors.roomId = "정확한 호수를 입력하세요.";
      }
    }

    // 5. 제출 시 필수 항목 체크
    if (isSubmitted) {
      if (!formData.studentNo.trim()) newErrors.studentNo = "학번을 입력하세요.";
      if (!formData.name.trim()) newErrors.name = "이름을 입력하세요.";
      if (!formData.email.trim()) newErrors.email = "이메일을 입력하세요.";
      if (isCodeSent && !isEmailVerified && !formData.verificationCode.trim()) newErrors.verificationCode = "인증코드를 입력하세요.";
      if (!formData.phone.trim()) newErrors.phone = "연락처를 입력하세요.";
      if (!formData.password.trim()) newErrors.password = "비밀번호를 입력하세요.";
      else if (!pwdRegex.test(formData.password)) newErrors.password = "특수문자를 포함한 8자 이상으로 입력하세요";
      if (formData.confirmPassword && formData.password !== formData.confirmPassword) newErrors.confirmPassword = "비밀번호가 일치하지 않습니다.";
      if (!formData.roomId.trim()) newErrors.roomId = "호수를 입력하세요.";
    }
    
    setErrors(newErrors);
  }, [formData, isSubmitted, isCodeSent, isEmailVerified]);

  const handleInputChange = (field: string, value: string) => {
    // 필터링 없이 모든 입력 허용
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (successMsgs[field]) {
      const newMsgs = { ...successMsgs };
      delete newMsgs[field];
      setSuccessMsgs(newMsgs);
    }
  };

  const sendVerificationCode = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrors(prev => ({ ...prev, email: "이메일 형식에 맞게 입력하세요." }));
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsCodeSent(true);
      setIsEmailVerified(false);
      setTimeLeft(180); 
      setSuccessMsgs({ email: "인증코드가 발송되었습니다." });
      setIsLoading(false);
    }, 600);
  };

  const verifyCode = () => {
    if (!formData.verificationCode) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsEmailVerified(true);
      setTimeLeft(0);
      setSuccessMsgs(prev => ({ ...prev, verificationCode: "인증이 완료되었습니다." }));
      setIsLoading(false);
    }, 600);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    
    if (Object.keys(errors).length > 0 || !isEmailVerified) return;
    
    setIsLoading(true);
    setTimeout(() => {
      setAlertConfig({ show: true, message: "가온이의 가족이 되신 것을 환영합니다!" });
      setIsLoading(false);
    }, 1200);
  };

  const renderInput = (label: string, field: keyof typeof formData, IconComponent: any, placeholder: string, hasButton = false, type = "text") => (
    <div className="flex flex-col">
      <label className="text-[10px] font-bold text-[#829496] ml-1 mb-1 uppercase tracking-wider">{label}</label>
      <div className="flex gap-2">
        <div className="flex-1 relative group">
          <div className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-colors duration-200 ${focusedField === field ? 'text-[#5eb9ca]' : 'text-[#adc0c2]'}`}>
            <IconComponent size={18} />
          </div>
          <input
            type={type} 
            value={formData[field]} 
            onChange={(e) => handleInputChange(field, e.target.value)}
            onFocus={() => setFocusedField(field)}
            onBlur={() => setFocusedField(null)}
            disabled={field === 'verificationCode' && isEmailVerified}
            placeholder={placeholder}
            className={`w-full ${isEmailVerified && field === 'verificationCode' ? 'bg-slate-100/50' : 'bg-white'} border-2 ${errors[field] ? 'border-red-400' : 'border-white'} rounded-[18px] pl-11 pr-4 h-[54px] text-[14px] font-bold text-[#054a57] focus:outline-none focus:border-[#5eb9ca] transition-all shadow-sm`}
          />
          {field === 'verificationCode' && isCodeSent && !isEmailVerified && timeLeft > 0 && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-red-500 font-bold">{formatTime(timeLeft)}</span>
          )}
        </div>
        {hasButton && (
          <button 
            type="button" 
            onClick={field === 'email' ? sendVerificationCode : verifyCode} 
            disabled={isEmailVerified && field === 'verificationCode'}
            className="shrink-0 px-4 h-[54px] bg-white border-2 border-white text-[#5eb9ca] font-bold text-[13px] rounded-[18px] active:scale-95 transition-all disabled:opacity-50 shadow-sm"
          >
            {field === 'email' ? (isCodeSent ? "재전송" : "인증") : "확인"}
          </button>
        )}
      </div>
      <div className="h-[18px] mt-0.5 ml-1">
        {errors[field] && <p className="text-[10px] text-red-500 font-bold">* {errors[field]}</p>}
        {successMsgs[field] && !errors[field] && (
          <p className="text-[10px] text-green-500 font-bold flex items-center gap-1"><CheckCircle size={10}/> {successMsgs[field]}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-[#f0f9ff] min-h-screen w-full max-w-[448px] mx-auto relative antialiased flex flex-col shadow-2xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#e0f2fe] via-[#f0f9ff] to-[#f8fafc] -z-10" />
      
      {alertConfig.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-8 bg-[#054a57]/30 backdrop-blur-[4px]">
          <div className="bg-white w-full max-w-[320px] rounded-[32px] shadow-2xl p-8 text-center animate-in zoom-in duration-300">
            <div className="size-[64px] mx-auto rounded-2xl bg-[#f0f9ff] flex items-center justify-center mb-5"><CheckCircle className="text-[#5eb9ca]" size={32} /></div>
            <h2 className="text-[19px] font-bold text-[#054a57] mb-2">가입 완료!</h2>
            <p className="text-[14px] font-medium text-[#7aaeb7] mb-8 leading-relaxed">{alertConfig.message}</p>
            <button onClick={() => navigate("/auth/login")} className="w-full h-[56px] bg-[#5eb9ca] text-white font-bold rounded-[20px] active:scale-[0.96] shadow-lg shadow-[#5eb9ca]/20 transition-transform">시작하기</button>
          </div>
        </div>
      )}

      <div className="pt-16 px-8 pb-6 flex items-center gap-4 shrink-0">
        <button onClick={() => navigate("/auth/login")} className="p-2 -ml-2 rounded-full text-[#054a57] hover:bg-white transition-all">
          <ArrowLeft className="size-6" />
        </button>
        <div>
          <h1 className="font-bold text-[26px] text-[#054a57] tracking-tight">회원가입</h1>
          <p className="text-[#607d8b] text-[13px] font-bold mt-0.5 opacity-80">간편하게 가입하고 스마트하게 생활하세요</p>
        </div>
      </div>

      <div className="flex-1 px-6 pb-12 overflow-y-auto custom-scrollbar">
        <div className="bg-white/70 backdrop-blur-lg rounded-[32px] p-7 shadow-xl shadow-blue-900/5 border border-white">
          <form onSubmit={handleSubmit} className="space-y-1">
            {renderInput("학번", "studentNo", User, "학번을 입력하세요")}
            {renderInput("이름", "name", User, "이름을 입력하세요")}
            {renderInput("이메일", "email", Mail, "이메일을 입력하세요", true, "email")}
            {renderInput("인증코드", "verificationCode", KeyRound, "인증코드를 입력하세요", true)}
            {renderInput("전화번호", "phone", Phone, "전화번호를 입력하세요", false, "tel")}
            {renderInput("비밀번호", "password", Lock, "비밀번호를 입력하세요", false, "password")}
            {renderInput("비밀번호 확인", "confirmPassword", ShieldCheck, "비밀번호를 다시 입력하세요", false, "password")}

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-[#829496] ml-1 mb-1 uppercase tracking-wider">생활관 동수</label>
              <div className="relative">
                <button type="button" onClick={() => setOpenSelect(!openSelect)} 
                  className={`w-full bg-white border-2 ${openSelect ? 'border-[#5eb9ca]' : 'border-white'} rounded-[18px] px-4 h-[54px] flex items-center justify-between transition-all shadow-sm`}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className={`size-[18px] ${openSelect ? 'text-[#5eb9ca]' : 'text-[#adc0c2]'}`} />
                    <span className="text-[14px] font-bold text-[#054a57]">{dormitoryName}</span>
                  </div>
                  <ChevronDown className={`size-4 text-[#94a3b8] transition-transform ${openSelect ? 'rotate-180' : ''}`} />
                </button>
                {openSelect && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-[22px] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                    {[ { id: "1", name: "제1학생활관" }, { id: "2", name: "제2학생활관" }, { id: "3", name: "제3학생활관" } ].map((opt) => (
                      <button key={opt.id} type="button" onClick={() => { setFormData({ ...formData, dormitoryId: opt.id }); setDormitoryName(opt.name); setOpenSelect(false); }} 
                        className="w-full px-5 py-4 text-left text-[14px] font-bold text-[#475569] hover:bg-[#f0f9ff] hover:text-[#5eb9ca] flex items-center justify-between border-b border-slate-50 last:border-none"
                      >
                        {opt.name} {formData.dormitoryId === opt.id && <Check size={16} className="text-[#5eb9ca]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="h-[20px]" />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-[#829496] ml-1 mb-1 uppercase tracking-wider">생활관 호수</label>
              <div className="relative group">
                <Home className={`absolute left-4 top-1/2 -translate-y-1/2 size-[18px] transition-colors duration-200 ${focusedField === 'roomId' ? 'text-[#5eb9ca]' : 'text-[#adc0c2]'}`} />
                <input
                  type="text" value={formData.roomId} 
                  onChange={(e) => handleInputChange("roomId", e.target.value)}
                  onFocus={() => setFocusedField('roomId')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="생활관 호수를 입력하세요"
                  className={`w-full bg-white border-2 ${errors.roomId ? 'border-red-400' : 'border-white'} rounded-[18px] pl-11 pr-4 h-[54px] text-[14px] font-bold text-[#054a57] focus:outline-none focus:border-[#5eb9ca] transition-all shadow-sm`}
                />
              </div>
              <div className="h-[20px] mt-0.5 ml-1">
                {errors.roomId && <p className="text-[10px] text-red-500 font-bold">* {errors.roomId}</p>}
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full h-[60px] bg-[#5eb9ca] rounded-[22px] text-white font-bold text-[17px] shadow-xl shadow-[#5eb9ca]/30 mt-6 active:scale-95 transition-all disabled:bg-slate-300 flex items-center justify-center">
              {isLoading ? "준비 중..." : "가입하기"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}