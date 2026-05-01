import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Mail, Lock, AlertCircle } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (isSubmitted && !email.trim()) {
      setEmailError("이메일을 입력하세요.");
    } else if (email !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setEmailError(!emailRegex.test(email) ? "이메일 형식에 맞게 입력하세요." : "");
    } else {
      setEmailError("");
    }

    if (isSubmitted && !password.trim()) {
      setPasswordError("비밀번호를 입력하세요.");
    } else if (password !== "") {
      const passwordRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
      setPasswordError(!passwordRegex.test(password) ? "특수문자를 포함한 8자 이상으로 입력하세요." : "");
    } else {
      setPasswordError("");
    }
  }, [email, password, isSubmitted]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

    if (!email.trim() || !password.trim() || !emailRegex.test(email) || !passwordRegex.test(password)) {
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);

      // 1. 일반 사용자 계정
      if (email === "test@gachon.ac.kr" && password === "1234!@#$") {
        sessionStorage.setItem("isLoggedIn", "true");
        sessionStorage.setItem("userName", "가온이");
        sessionStorage.setItem("userRole", "user");
        navigate("/");
      } 
      // 2. 관리자 계정
      else if (email === "test2@gachon.ac.kr" && password === "zxcv!@#$") {
        sessionStorage.setItem("isLoggedIn", "true");
        sessionStorage.setItem("userName", "관리자");
        sessionStorage.setItem("userRole", "admin");
        navigate("/admin/complaints");
      } 
      // 3. 로그인 실패
      else {
        setAlertMsg("이메일 또는 비밀번호가 일치하지 않습니다.");
        setShowAlert(true);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full bg-white flex justify-center antialiased font-sans relative">
      {/* 알림 모달 */}
      {showAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-8">
          <div className="absolute inset-0 bg-[#054a57]/20 backdrop-blur-[3px]" onClick={() => setShowAlert(false)} />
          <div className="relative bg-white w-full max-w-[320px] rounded-[28px] shadow-2xl p-7 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="size-[56px] bg-[#f0f9ff] rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="text-[#5eb9ca]" size={28} />
              </div>
              <h2 className="text-[17px] font-bold text-[#054a57] mb-2">알림</h2>
              <p className="text-[14px] font-medium text-[#7aaeb7] leading-relaxed mb-6 whitespace-pre-line">{alertMsg}</p>
              <button onClick={() => setShowAlert(false)} className="w-full h-[50px] bg-[#5eb9ca] text-white font-bold rounded-[18px] active:scale-[0.96] shadow-md">확인</button>
            </div>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-[448px] min-h-screen bg-[#f0f9ff] shadow-sm flex flex-col px-7 items-center">
        <div className="absolute inset-0 bg-gradient-to-b from-[#e0f2fe] via-[#f0f9ff] to-[#f8fafc] -z-10" />
        
        {/* 1. 상단 여백 대폭 축소 (flex 대신 고정 px 사용) */}
        <div className="h-10 sm:h-16 shrink-0" />

        {/* 로고 섹션 (마진 축소) */}
        <div className="flex flex-col items-center shrink-0 mb-6 sm:mb-8">
          <div className="size-[64px] rounded-[22px] bg-[#5eb9ca] flex items-center justify-center shadow-lg shadow-[#5eb9ca]/20 mb-4">
             <svg className="size-[32px] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
             </svg>
          </div>
          <h1 className="font-bold text-[24px] text-[#054a57] tracking-tight mb-1">가온이</h1>
          <p className="font-bold text-[12px] text-[#7aaeb7]">가천대 기숙사 AI 생활 지원 서비스</p>
        </div>

        {/* 2. 폼 카드 (패딩 및 마진 최적화) */}
        <div className="w-full bg-white/75 backdrop-blur-md rounded-[28px] pt-7 px-7 pb-5 shadow-xl shadow-blue-900/5 border border-white mb-6 animate-in fade-in slide-in-from-bottom-3 duration-700">
          <form onSubmit={handleLogin} className="w-full space-y-2.5">
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-[#829496] ml-1 mb-1 opacity-80 uppercase tracking-wider">이메일</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                  <Mail size={16} className="text-[#adc0c2] group-focus-within:text-[#5eb9ca] transition-colors" />
                </div>
                <input 
                  type="text" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="이메일을 입력하세요" 
                  className={`w-full bg-white border ${emailError ? 'border-red-400' : 'border-[#eef6f7]'} rounded-[12px] pl-11 pr-4 h-[48px] text-[14px] font-bold text-[#054a57] focus:outline-none focus:border-[#5eb9ca] transition-all`} 
                />
              </div>
              <div className="h-[18px]"> 
                {emailError && <p className="text-[10px] text-red-500 font-bold mt-0.5 ml-1 animate-in fade-in">* {emailError}</p>}
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-[#829496] ml-1 mb-1 opacity-80 uppercase tracking-wider">비밀번호</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                  <Lock size={16} className="text-[#adc0c2] group-focus-within:text-[#5eb9ca] transition-colors" />
                </div>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="비밀번호를 입력하세요" 
                  className={`w-full bg-white border ${passwordError ? 'border-red-400' : 'border-[#eef6f7]'} rounded-[12px] pl-11 pr-4 h-[48px] text-[14px] font-bold text-[#054a57] focus:outline-none focus:border-[#5eb9ca] transition-all`} 
                />
              </div>
              <div className="h-[18px]">
                {passwordError && <p className="text-[10px] text-red-500 font-bold mt-0.5 ml-1 animate-in fade-in">* {passwordError}</p>}
              </div>
            </div>

            <div className="pt-2 space-y-2.5">
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-[48px] bg-[#5eb9ca] disabled:bg-gray-400 rounded-[14px] text-white font-bold text-[15px] active:scale-[0.98] transition-all shadow-lg shadow-[#5eb9ca]/20"
              >
                {isLoading ? "로그인 중..." : "로그인"}
              </button>
              <button type="button" onClick={() => navigate("/")} className="w-full h-[48px] bg-white border-2 border-[#5eb9ca]/20 rounded-[14px] text-[#5eb9ca] font-extrabold text-[15px] hover:bg-[#5eb9ca]/5 active:bg-[#5eb9ca]/10 transition-all shadow-sm">로그인 없이 시작하기</button>
            </div>
          </form>

          {/* 하단 메뉴 간격 조정 */}
          <div className="flex justify-center items-center gap-5 mt-6">
            <button type="button" onClick={() => navigate("/auth/password/identity")} className="text-[12px] font-medium text-[#92a4a6] hover:text-[#5eb9ca]">비밀번호 찾기</button>
            <div className="w-[1px] h-3 bg-[#d1e2e4]"></div>
            <button type="button" onClick={() => navigate("/auth/signup")} className="text-[12px] font-medium text-[#92a4a6] hover:text-[#5eb9ca]">회원가입</button>
          </div>
        </div>

        {/* 3. 푸터 여백 축소 */}
        <div className="mt-auto pb-6">
          <div className="text-center opacity-70">
            <p className="text-[10px] font-bold text-[#adc0c2]">가천대학교 학생생활관</p>
            <p className="text-[8px] text-[#c2d2d4] mt-0.5 uppercase tracking-widest font-bold">Version 1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}