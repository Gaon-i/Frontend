import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Lock, AlertCircle, Loader2, LayoutDashboard, Database, Activity } from "lucide-react";
import api from "../api/axios";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");

  const [loginIdError, setLoginIdError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (isSubmitted) {
      if (!loginId.trim()) {
        setLoginIdError("아이디를 입력하세요.");
      } else {
        setLoginIdError("");
      }

      if (!password.trim()) {
        setPasswordError("비밀번호를 입력하세요.");
      } else {
        setPasswordError("");
      }
    }
  }, [loginId, password, isSubmitted]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    // 유효성 검사 실패 시 중단
    if (!loginId.trim() || !password.trim()) return;

    setIsLoading(true);
    try {
      const response = await api.post("/admin/auth/login", {
        loginId: loginId,
        password: password
      });

      // Result Code 200
      if (response.data.code === 200) {
        const userData = response.data.data;

        // 세션 스토리지 저장
        sessionStorage.setItem("isLoggedIn", "true");
        sessionStorage.setItem("adminId", userData.adminId.toString());
        sessionStorage.setItem("loginId", userData.loginId);
        sessionStorage.setItem("userName", userData.name);
        sessionStorage.setItem("userRole", userData.adminRole);
        navigate("/admin/complaints");
      }
    } catch (error: any) {
      const serverData = error.response?.data;
      const statusCode = error.response?.status;
      const serverMessage = serverData?.message;

      if (statusCode === 401) {
        // 아이디/비번 불일치
        setAlertMsg(serverMessage || "아이디 또는 비밀번호가 올바르지 않습니다.");
      } else if (statusCode === 403) {
        // 비활성화 계정
        setAlertMsg(serverMessage || "비활성화된 관리자 계정입니다.\n상위 관리자에게 문의하세요.");
      } else {
        // 기타 500 에러 등
        setAlertMsg(serverMessage || "서버 통신 중 오류가 발생했습니다.");
      }

      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] flex items-center justify-center p-4 sm:p-6 lg:p-12 antialiased font-sans relative overflow-auto">

      {/* 알림 모달 */}
      {showAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-8">
          <div className="absolute inset-0 bg-[#054a57]/20 backdrop-blur-[3px]" onClick={() => setShowAlert(false)} />
          <div className="relative bg-white w-full max-w-[320px] rounded-[28px] shadow-2xl p-7 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="size-[56px] bg-[#f0f9ff] rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="text-[#5eb9ca]" size={28} />
              </div>
              <h2 className="text-[17px] font-bold text-[#054a57] mb-2">로그인 실패</h2>
              <p className="text-[14px] font-medium text-[#7aaeb7] leading-relaxed mb-6 whitespace-pre-wrap">{alertMsg}</p>
              <button onClick={() => setShowAlert(false)} className="w-full h-[50px] bg-[#5eb9ca] text-white font-bold rounded-[18px] active:scale-[0.96] shadow-md">확인</button>
            </div>
          </div>
        </div>
      )}

      {/* 메인 카드 */}
      <div className="relative w-full max-w-[1000px] min-h-[600px] grid lg:grid-cols-[1.1fr_1fr] bg-white rounded-[32px] sm:rounded-[40px] shadow-[0_40px_100px_-20px_rgba(5,74,87,0.12)] border border-white/50 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 my-4 sm:my-auto isolate">

        {/* Left Section */}
        <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden text-white bg-gradient-to-br from-[#083344] via-[#0e7490] to-[#155e75]">
          {/* 장식용 패턴 */}
          <div className="absolute top-[-10%] right-[-10%] size-[500px] bg-[#22d3ee]/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-5%] left-[-5%] size-[400px] bg-black/20 rounded-full blur-[100px]" />

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-10">
              <div className="size-[64px] rounded-[22px] bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/30 mb-4">
                <svg className="size-[32px] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <span className="text-3xl font-extrabold tracking-normal">GAONI</span>
            </div>
            <h1 className="text-[40px] font-black mb-3 tracking-tight leading-[1.1]">
              Gachon<br />
              <span className="text-white/80">Dormitory</span><br />
              System
            </h1>
            <p className="text-white/70 text-sm font-medium leading-relaxed">가천대학교 학생생활관 통합 관리자 포털입니다.</p>
          </div>

          <div className="relative z-10 space-y-5 mt-8">
            {[{ icon: Activity, title: "실시간 대응" }, { icon: LayoutDashboard, title: "통합 대시보드" }, { icon: Database, title: "데이터 관리" }].map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 group cursor-default">
                <div className="size-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 text-white">
                  <item.icon size={18} />
                </div>
                <h4 className="font-bold text-white text-xs">{item.title}</h4>
              </div>
            ))}
          </div>
        </div>

        {/* Right Section: Login Form */}
        <div className="pt-10 px-10 pb-6 flex flex-col justify-center bg-white h-full">
          <div className="mb-8 shrink-0">
            <span className="text-[#5eb9ca] font-black text-[10px] tracking-widest uppercase mb-1.5 block">GAONI ADMIN PAGES</span>
            <h2 className="text-[26px] font-black text-[#0f172a] mb-2">관리자 로그인</h2>
            <div className="w-10 h-1.5 bg-[#5eb9ca] rounded-full" />
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-[#829496] ml-1 mb-1.5 uppercase tracking-wider">아이디</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                  <Lock size={18} className="text-[#adc0c2] group-focus-within:text-[#5eb9ca] transition-colors" />
                </div>
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="아이디를 입력하세요"
                  className={`w-full bg-[#f8fafc] border ${loginIdError ? 'border-red-400' : 'border-[#eef6f7]'} rounded-[16px] pl-12 pr-4 h-[56px] text-[14px] font-bold text-[#054a57] focus:outline-none focus:border-[#5eb9ca] transition-all`}
                />
              </div>
              <div className="h-[18px]">
                {loginIdError && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 animate-in fade-in">* {loginIdError}</p>}
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-[#829496] ml-1 mb-1.5 uppercase tracking-wider">비밀번호</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                  <Lock size={18} className="text-[#adc0c2] group-focus-within:text-[#5eb9ca] transition-colors" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className={`w-full bg-[#f8fafc] border ${passwordError ? 'border-red-400' : 'border-[#eef6f7]'} rounded-[16px] pl-12 pr-4 h-[56px] text-[14px] font-bold text-[#054a57] focus:outline-none focus:border-[#5eb9ca] transition-all`}
                />
              </div>
              <div className="h-[18px]">
                {passwordError && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 animate-in fade-in">* {passwordError}</p>}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[56px] bg-[#5eb9ca] hover:bg-[#4ba8b8] disabled:bg-gray-300 rounded-[16px] text-white font-black text-[15px] active:scale-[0.98] transition-all shadow-lg shadow-[#5eb9ca]/20 flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin size-5" />
                    <span>접속 중...</span>
                  </div>
                ) : (
                  <span>시스템 접속하기</span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 flex flex-col items-center shrink-0">
            <button
              type="button"
              onClick={() => window.location.href = "http://15.165.98.91:5173/auth/login"}
              className="w-full h-[52px] bg-white border-2 border-[#5eb9ca]/20 rounded-[16px] text-[#5eb9ca] font-extrabold text-[13px] hover:bg-[#5eb9ca]/5 active:bg-[#5eb9ca]/10 active:scale-[0.98] transition-all flex items-center justify-center"
            >
              일반 사용자 화면으로 이동
            </button>
            <div className="mt-6 pt-4 border-t border-slate-50 w-full text-center">
              <p className="text-[9px] font-bold text-[#cbd5e1] uppercase tracking-tighter">Infrastructure by Gachon University</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}