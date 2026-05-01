import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { 
  User, Lock, Mail, Phone, ArrowLeft, 
  KeyRound, CheckCircle, Building2, Home, ChevronDown, Check, ShieldCheck,
  Loader2
  // 로딩 아이콘 추가
} from "lucide-react";
import api from "../api/axios";
// axios 인스턴스

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
  const [alertConfig, setAlertConfig] = useState({ show: false, message: "", type: "success" as "success" | "error" });
  
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [openSelect, setOpenSelect] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 타이머 로직
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

  const formRefs = {
    studentNo: useRef<HTMLDivElement>(null),
    name: useRef<HTMLDivElement>(null),
    email: useRef<HTMLDivElement>(null),
    verificationCode: useRef<HTMLDivElement>(null),
    phone: useRef<HTMLDivElement>(null),
    password: useRef<HTMLDivElement>(null),
    confirmPassword: useRef<HTMLDivElement>(null),
    dormitoryId: useRef<HTMLDivElement>(null),
    roomId: useRef<HTMLDivElement>(null),
  };

// 실시간 유효성 검사
  useEffect(() => {
    const newErrors: Record<string, string> = {};

    // 1. 학번 검사
    const studentIdStr = formData.studentNo.trim();

    if (!studentIdStr) {
      // 아무것도 입력하지 않았을 때 (제출 버튼 눌렀을 때만 표시)
      if (isSubmitted) newErrors.studentNo = "학번을 입력하세요.";
    } else if (!/^\d+$/.test(studentIdStr)) {
      // 숫자가 아닌 문자가 하나라도 포함되면 즉시 표시
      newErrors.studentNo = "숫자만 입력하세요.";
    } else if (studentIdStr.length !== 9) {
      // 숫자는 맞지만 9글자가 아니면(1~8자 또는 10자 이상) 즉시 표시
      newErrors.studentNo = "9자리를 정확히 입력하세요.";
    }

    // 2. 이름 검사
    if (isSubmitted && !formData.name.trim()) {
      newErrors.name = "이름을 입력하세요.";
    }

    // 3. 이메일 검사 (실시간 형식 체크 포함)
    if (!formData.email.trim()) {
      if (isSubmitted) newErrors.email = "이메일을 입력하세요.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "이메일 형식에 맞게 입력하세요.";
      }
    }

    // 4. 인증코드 검사 (인증 전까지 표시)
    if (isSubmitted && !isEmailVerified && !formData.verificationCode.trim()) {
      newErrors.verificationCode = "인증코드를 입력하세요.";
    }

    // 5. 전화번호 검사
    if (!formData.phone.trim()) {
      if (isSubmitted) newErrors.phone = "전화번호를 입력하세요.";
    } else if (!/^\d+$/.test(formData.phone)) {
      // 원본 데이터에 숫자가 아닌 문자가 있는 경우
      newErrors.phone = "숫자만 입력하세요.";
    } else if (isSubmitted && !/^010\d{8}$/.test(formData.phone)) {
      newErrors.phone = "전화번호 형식에 맞게 입력하세요.";
    }

    // 6. 비밀번호 검사
    const pwdRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!formData.password.trim()) {
      if (isSubmitted) newErrors.password = "비밀번호를 입력하세요.";
    } else if (!pwdRegex.test(formData.password)) {
      newErrors.password = "특수 문자를 포함한 8자 이상으로 입력하세요.";
    }

    // 7. 비밀번호 확인 체크
    if (!formData.confirmPassword.trim()) {
      if (isSubmitted) newErrors.confirmPassword = "비밀번호를 다시 입력하세요.";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "비밀번호가 일치하지 않습니다.";
    }

    // 8. 생활관 호수 검사
    const roomStr = formData.roomId.toString().trim();

    if (!roomStr) {
      if (isSubmitted) newErrors.roomId = "호수를 입력하세요.";
    } else if (!/^\d+$/.test(roomStr)) {
      // 숫자가 아닌 문자가 포함된 경우
      newErrors.roomId = "숫자만 입력하세요.";
    } else if (roomStr.length < 3) {
      // 숫자는 맞지만 3자리 미만인 경우
      newErrors.roomId = "3자리 이상 입력하세요.";
    }

    setErrors(newErrors);
  }, [formData, isSubmitted, isEmailVerified]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = {...prev}; delete n[field]; return n; });
    if (successMsgs[field]) setSuccessMsgs(prev => { const n = {...prev}; delete n[field]; return n; });
  };

// 1. 인증코드 발송 (POST /auth/email/send)
  const sendVerificationCode = async () => {
    if (!formData.email || errors.email) {
      setErrors(prev => ({ ...prev, email: "올바른 이메일을 입력하세요." }));
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await api.post("/auth/email/send", { email: formData.email });

      if (res.data.success === true) {

        // 1. 상태값 즉시 업데이트
        setIsCodeSent(true);
        setIsEmailVerified(false);
        
        // 2. 타이머 설정 로직 보완
        const serverExpiredAt = res.data.data?.expiredAt;
        let diffInSeconds = 180;
        // 기본값 3분

        if (serverExpiredAt) {
          // T를 공백으로 치환하거나 그대로 파싱 (브라우저 호환성)
          const expiryTime = new Date(serverExpiredAt).getTime();
          const now = new Date().getTime();
          const calculatedDiff = Math.floor((expiryTime - now) / 1000);
          
          // 계산값이 합리적일 때만 사용 (예: 0보다 크고 10분 이내)
          if (calculatedDiff > 0 && calculatedDiff < 600) {
            diffInSeconds = calculatedDiff;
          }
        }
        
        setTimeLeft(diffInSeconds);

        // 3. 메시지 표시 (에러는 지우고 성공 메시지 추가)
        setErrors(prev => {
          const newErrs = { ...prev };
          delete newErrs.email;
          delete newErrs.verificationCode;
          return newErrs;
        });
      
        setSuccessMsgs(prev => ({ 
          ...prev, 
          verificationCode: res.data.message || "인증코드가 발송되었습니다." 
        }));
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || "발송 실패";
      setErrors(prev => ({ ...prev, email: msg }));
    } finally {
      setIsLoading(false);
    }
  };

  // 2. 인증코드 검증 (POST /auth/email/verify)
  const verifyCode = async () => {
    if (!formData.verificationCode) return;
    setIsLoading(true);
    try {
      const res = await api.post("/auth/email/verify", { 
        email: formData.email,
        code: formData.verificationCode
      });
      
      if (res.data.success === true && res.data.data.verified) {
        setIsEmailVerified(true);
        setTimeLeft(0);
        setSuccessMsgs(prev => ({ ...prev, verificationCode: "이메일 인증 성공" }));
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || "인증 실패";
      setErrors(prev => ({ ...prev, verificationCode: msg }));
    } finally {
      setIsLoading(false);
    }
  };

  // 3. 최종 회원가입 (POST /auth/signup)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    // 화면에 배치된 순서대로 필드 정의
    const fieldOrder: (keyof typeof formRefs)[] = [
      "studentNo", "name", "email", "verificationCode", "phone", 
      "password", "confirmPassword", "dormitoryId", "roomId"
    ];

    // 에러가 있는 첫 번째 필드 찾기
    // (errors 상태에 값이 있거나, 이메일 인증이 안 된 경우를 포함)
    const firstErrorField = fieldOrder.find(field => {
      if (field === "verificationCode" && !isEmailVerified) return true;
      return !!errors[field];
    });

    if (firstErrorField) {
      const targetRef = formRefs[firstErrorField];
      if (targetRef.current) {
        targetRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
          // 화면 중앙에 오게 해서 보기 편하게 함
        });
      }
      return;
      // 에러가 있으므로 가입 요청 중단
    }
    
    if (Object.keys(errors).length > 0 || !isEmailVerified) {
      if (!isEmailVerified) setErrors(prev => ({...prev, verificationCode: "이메일 인증이 필요합니다."}));
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await api.post("/auth/signup", {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        studentNo: formData.studentNo,
        dormitoryId: Number(formData.dormitoryId), 
        // Long 타입 대응
        roomId: Number(formData.roomId), 
        // Long 타입 대응
        phone: formData.phone
      });

      // 명세서에 성공 코드가 201로 명시되어 있음
      if (res.data.code === 201) {
        setAlertConfig({ 
          show: true, 
          message: "가온이의 가족이 되신 것을 환영합니다!", 
          type: "success" 
        });
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || "회원가입에 실패했습니다.";
      setAlertConfig({ show: true, message: msg, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (label: string, field: keyof typeof formData, IconComponent: any, placeholder: string, hasButton = false, type = "text") => (
    <div className="flex flex-col" ref={formRefs[field as keyof typeof formRefs]}>
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
            <div className="size-[64px] mx-auto rounded-2xl bg-[#f0f9ff] flex items-center justify-center mb-5">
              {alertConfig.type === 'success' ? 
                <CheckCircle className="text-[#5eb9ca]" size={32} /> : 
                <Lock className="text-red-400" size={32} />
              }
              <h2 className="text-[19px] font-bold text-[#054a57] mb-2">
                {alertConfig.type === 'success' ? "가입 완료" : "가입 실패"}
              </h2>
              <p className="text-[14px] font-medium text-[#7aaeb7] mb-8 leading-relaxed">{alertConfig.message}</p>
              <button onClick={() => {
                if(alertConfig.type === 'success') navigate("/auth/login");
                else setAlertConfig({ ...alertConfig, show: false });
              }}
                className={`w-full h-[56px] text-white font-bold rounded-[20px] active:scale-[0.96] shadow-lg transition-transform ${alertConfig.type === 'success' ? 'bg-[#5eb9ca] shadow-[#5eb9ca]/20' : 'bg-[#adc0c2] shadow-gray-200'}`}
              >
                {alertConfig.type === 'success' ? "시작하기" : "다시 시도"}
              </button>
            </div>
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

            <div className="flex flex-col" ref={formRefs.dormitoryId}>
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

            <div className="flex flex-col" ref={formRefs.roomId}>
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