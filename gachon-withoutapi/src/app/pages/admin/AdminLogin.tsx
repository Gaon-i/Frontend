import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Mail, Lock, AlertCircle, Loader2, ShieldCheck } from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const MOCK_ADMIN = {
    email: "test2@gachon.ac.kr",
    password: "zxcv!@#$",
    name: "Admin"
  };
  
  // 실시간 유효성 검사 로직
  useEffect(() => {
    if (isSubmitted) {
      if (!email.trim()) {
        setEmailError("이메일을 입력하세요.");
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          setEmailError("이메일 형식에 맞게 입력하세요.");
        } else {
          setEmailError("");
        }
      }

      if (!password.trim()) {
        setPasswordError("비밀번호를 입력하세요.");
      } else {
        const passwordRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
        if (!passwordRegex.test(password)) {
          setPasswordError("특수 문자를 포함한 8자 이상으로 입력하세요.");
        } else {
          setPasswordError("");
        }
      }
    }
  }, [email, password, isSubmitted]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    // 유효성 검사 (입력값 확인)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email) || !password.trim() || password.length < 8) return;

    setIsLoading(true);

    // API 호출 대신 1초 뒤에 로그인 성공 처리 (시뮬레이션)
    setTimeout(() => {
      setIsLoading(false);
      
      // 세션 스토리지에 관리자 정보 저장
      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("userName", "관리자님");
      sessionStorage.setItem("userRole", "ADMIN");
      
      // 관리자 대시보드로 이동
      navigate("/admin/complaints");
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full bg-[#f6fbff] flex items-center justify-center p-4 antialiased font-sans">
      {/* 배경 장식 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] size-[40%] bg-[#5eb9ca]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] size-[40%] bg-[#054a57]/5 rounded-full blur-[120px]" />
      </div>

      {/* 로그인 카드 */}
      <div className="relative w-full max-w-[1000px] grid lg:grid-cols-2 bg-white rounded-[40px] shadow-[0_32px_64px_-16px_rgba(5,74,87,0.15)] border border-white overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* 왼쪽 안내 섹션 (PC) */}
        <div className="hidden lg:flex flex-col justify-center p-12 bg-[#054a57] text-white relative">
          <div className="relative z-10">
            <div className="size-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-8">
              <ShieldCheck className="size-8 text-[#5eb9ca]" />
            </div>
            <h1 className="text-4xl font-black mb-4 tracking-tight">Admin Portal</h1>
            <p className="text-[#7aaeb7] text-lg font-bold leading-relaxed mb-8">
              가천대학교 학생생활관 관리자 전용 시스템입니다.<br />
              보안을 위해 인가된 계정으로 접속해주세요.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm font-semibold text-[#5eb9ca]">
                <div className="size-1.5 bg-[#5eb9ca] rounded-full" />
                대시보드 실시간 통계
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-[#5eb9ca]">
                <div className="size-1.5 bg-[#5eb9ca] rounded-full" />
                사용자 및 민원 통합 관리
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽 로그인 폼 */}
        <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
          <div className="mb-10 lg:hidden">
            <div className="size-12 rounded-xl bg-[#5eb9ca] flex items-center justify-center shadow-lg mb-4">
               <ShieldCheck className="size-6 text-white" />
            </div>
            <h1 className="text-2xl font-black text-[#054a57]">Admin Login</h1>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-black text-[#829496] uppercase tracking-widest ml-1">Administrator ID</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#adc0c2] group-focus-within:text-[#5eb9ca] transition-colors" />
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="admin@gachon.ac.kr"
                  className={`w-full bg-[#f8fafc] border ${emailError ? 'border-red-400' : 'border-[#eef6f7]'} rounded-2xl pl-12 pr-4 h-[56px] text-[15px] font-bold text-[#054a57] focus:outline-none focus:bg-white focus:border-[#5eb9ca] focus:ring-4 focus:ring-[#5eb9ca]/5 transition-all`}
                />
              </div>
              {emailError && <p className="text-[11px] text-red-500 font-bold ml-1">! {emailError}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-[#829496] uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#adc0c2] group-focus-within:text-[#5eb9ca] transition-colors" />
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••"
                  className={`w-full bg-[#f8fafc] border ${passwordError ? 'border-red-400' : 'border-[#eef6f7]'} rounded-2xl pl-12 pr-4 h-[56px] text-[15px] font-bold text-[#054a57] focus:outline-none focus:bg-white focus:border-[#5eb9ca] focus:ring-4 focus:ring-[#5eb9ca]/5 transition-all`}
                />
              </div>
              {passwordError && <p className="text-[11px] text-red-500 font-bold ml-1">! {passwordError}</p>}
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-[56px] bg-[#054a57] disabled:bg-slate-300 rounded-2xl text-white font-black text-[16px] active:scale-[0.98] transition-all shadow-xl shadow-[#054a57]/20 flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <span>관리자 시스템 접속</span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <button 
              type="button" 
              onClick={() => navigate("/")}
              className="text-sm font-bold text-[#92a4a6] hover:text-[#5eb9ca] transition-colors"
            >
              사용자 페이지로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}