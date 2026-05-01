import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import api from "../api/axios";
// axios 인스턴스

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

  // 이메일 및 비밀번호 유효성 검사 (사용자 전용: 이메일 형식 필수)
  useEffect(() => {
    if (isSubmitted) {
      // 이메일 실시간 검사
      if (!email.trim()) {
        // 값이 비어있을 때는 제출 버튼을 눌렀던 적이 있을 때만 에러 표시
        setEmailError(isSubmitted ? "이메일을 입력하세요." : "");
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          setEmailError("이메일 형식에 맞게 입력하세요.");
        } else {
          setEmailError("");
        }
      }
    }

    // 비밀번호 실시간 검사 (특수문자 포함 8자 이상)
      if (!password.trim()) {
      setPasswordError(isSubmitted ? "비밀번호를 입력하세요." : "");
    } else {
      // 정규식: 최소 8자 이상, 최소 하나의 특수문자 포함
      const passwordRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
      if (!passwordRegex.test(password)) {
        setPasswordError("특수 문자를 포함한 8자 이상으로 입력하세요.");
      } else {
        setPasswordError("");
      }
    }
  }, [email, password, isSubmitted]);
  // 입력값이나 제출 상태가 변할 때마다 즉시 실행

  // 사용자 로그인 처리
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    // 유효성 검사 통과 여부 확인
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email) || !password.trim()) return;

    setIsLoading(true);
    try {
      // 일반 사용자 엔드포인트만 호출
      const response = await api.post("/auth/login", {
        email: email,
        password: password
      }, { withCredentials: true });

      if (response.data.code === 200) {
        const userData = response.data.data;
        
        // 사용자 정보 세션 저장
        sessionStorage.setItem("isLoggedIn", "true");
        sessionStorage.setItem("userName", userData.name);
        sessionStorage.setItem("userRole", "USER");
        sessionStorage.setItem("userId", userData.userId);
        
        navigate("/");
        // 메인 페이지로 이동
      }
    } catch (error: any) {
      // 실패 처리 (401, 404, 500 등 서버 메시지 출력)
      const message = error.response?.data?.message || "이메일 또는 비밀번호가\n 올바르지 않습니다.";
      setAlertMsg(message);
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
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
              <p className="text-[14px] font-medium text-[#7aaeb7] leading-relaxed mb-6 whitespace-pre-wrap">{alertMsg}</p>
              <button onClick={() => setShowAlert(false)} className="w-full h-[50px] bg-[#5eb9ca] text-white font-bold rounded-[18px] active:scale-[0.96] shadow-md">확인</button>
            </div>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-[448px] min-h-screen bg-[#f0f9ff] shadow-sm flex flex-col px-7 items-center">
        <div className="absolute inset-0 bg-gradient-to-b from-[#e0f2fe] via-[#f0f9ff] to-[#f8fafc] -z-10" />
        
        <div className="h-10 sm:h-16 shrink-0" />

        {/* 로고 섹션 */}
        <div className="flex flex-col items-center shrink-0 mb-6 sm:mb-8">
          <div className="size-[64px] rounded-[22px] bg-[#5eb9ca] flex items-center justify-center shadow-lg shadow-[#5eb9ca]/20 mb-4">
             <svg className="size-[32px] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
             </svg>
          </div>
          <h1 className="font-bold text-[24px] text-[#054a57] tracking-tight mb-1">가온이</h1>
          <p className="font-bold text-[12px] text-[#7aaeb7]">가천대 기숙사 AI 생활 지원 서비스</p>
        </div>

        {/* 폼 카드 */}
        <div className="w-full bg-white/75 backdrop-blur-md rounded-[28px] pt-7 px-7 pb-5 shadow-xl shadow-blue-900/5 border border-white mb-6 animate-in fade-in slide-in-from-bottom-3 duration-700">
          <form onSubmit={handleLogin} className="w-full space-y-2.5">
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-[#829496] ml-1 mb-1 opacity-80 uppercase tracking-wider">이메일</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                  <Mail size={16} className="text-[#adc0c2] group-focus-within:text-[#5eb9ca] transition-colors" />
                </div>
                <input 
                  type="email" 
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
                className="w-full h-[48px] bg-[#5eb9ca] disabled:bg-gray-300 rounded-[14px] text-white font-bold text-[15px] active:scale-[0.98] transition-all shadow-lg shadow-[#5eb9ca]/20 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>인증 중...</span>
                  </>
                ) : "로그인"}
              </button>
              <button type="button" onClick={() => navigate("/")} className="w-full h-[48px] bg-white border-2 border-[#5eb9ca]/20 rounded-[14px] text-[#5eb9ca] font-extrabold text-[15px] hover:bg-[#5eb9ca]/5 active:bg-[#5eb9ca]/10 transition-all shadow-sm">로그인 없이 시작하기</button>
            </div>
          </form>

          <div className="flex justify-center items-center gap-5 mt-6">
            <button type="button" onClick={() => navigate("/auth/password/identity")} className="text-[12px] font-medium text-[#92a4a6] hover:text-[#5eb9ca]">비밀번호 찾기</button>
            <div className="w-[1px] h-3 bg-[#d1e2e4]"></div>
            <button type="button" onClick={() => navigate("/auth/signup")} className="text-[12px] font-medium text-[#92a4a6] hover:text-[#5eb9ca]">회원가입</button>
          </div>
        </div>

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