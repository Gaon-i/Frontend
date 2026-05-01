import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { AlertCircle } from "lucide-react";

import iconHome from "../icons/Home.svg";
import iconComplaints from "../icons/Complaints.svg";
import iconChatbot from "../icons/Chatbot.svg";
import iconNotice from "../icons/Notices.svg";
import iconProfile from "../icons/Profile.svg";

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // --- 모달 상태 관리 ---
  const [modalConfig, setModalConfig] = useState({
    show: false,
    message: "",
    path: ""
  });

  const isActive = (path: string) => location.pathname === path;

  // 인증 체크 로직
  const checkAuth = () => {
    const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true" || document.cookie.includes("JSESSIONID");
    return isLoggedIn;
  };

  // 클릭 핸들러: 민원과 내정보만 제한
  const handleNavClick = (e: React.MouseEvent, path: string) => {
    if ((path === "/complaints" || path === "/users/me") && !checkAuth()) {
      e.preventDefault();
      // 페이지 이동 방지
      setModalConfig({
        show: true,
        message: "로그인이 필요한 서비스입니다.\n로그인 페이지로 이동하시겠습니까?",
        path: path
      });
    }
  };

  const handleConfirm = () => {
    setModalConfig({ ...modalConfig, show: false });
    navigate("/auth/login");
  };

  const handleCancel = () => {
    setModalConfig({ ...modalConfig, show: false });
  };

  // 아이콘 스타일
  const iconClass = "size-[26px] transition-all duration-300 z-10";
  const activeFilter = {
    filter: "invert(70%) sepia(22%) saturate(1190%) hue-rotate(157deg) brightness(47%) contrast(96%)"
  };
  const inactiveFilter = { opacity: 0.4, filter: "grayscale(20%)" };

  // 활성 배경 애니메이션
  const ActiveBg = ({ path }: { path: string }) => (
    <div className={`absolute -top-1.5 left-1/2 -translate-x-1/2 size-[48px] 
      bg-gradient-to-tr from-[#eef9fa] to-[#dcf2f5] 
      rounded-[14px] -z-10 
      shadow-[0_4px_12px_rgba(94,185,202,0.15)] 
      ring-1 ring-white/60 
      backdrop-blur-[1px]
      transition-all duration-300 ease-out
      ${isActive(path)
        ? "opacity-100 scale-100 animate-in fade-in zoom-in-90"
        : "opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100"
      }`}
    />
  );

  return (
    <>
      {/* 1. 커스텀 모달: 화면 전체를 덮도록 fixed 속성 강화 */}
      {modalConfig.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-[4px]">
          <div className="bg-white/95 backdrop-blur-xl p-7 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/50 w-[85%] max-w-[320px] animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center gap-5">
              <div className="size-14 rounded-full bg-[#f0f9ff] flex items-center justify-center text-[#5eb9ca]">
                <AlertCircle size={32} />
              </div>
              <p className="font-bold text-[#054a57] leading-relaxed whitespace-pre-line text-[16px]">
                {modalConfig.message}
              </p>
              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-4 bg-[#e6eef1] rounded-2xl text-[14px] font-bold text-[#607d8b] active:scale-95 transition-all"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-4 bg-[#5eb9ca] rounded-2xl text-[14px] font-bold text-white active:scale-95 shadow-lg shadow-[#5eb9ca]/30 transition-all"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. 하단 네비게이션 바 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 bg-[#f6fbff]/95 backdrop-blur-md h-[90px] w-full max-w-[448px] border-t border-[#99ABAD]/20 flex items-center justify-around px-4 z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        
        {/* 홈 (로그인 체크 X) */}
        <Link to="/" className="group flex flex-col items-center gap-1 relative min-w-[60px]">
          <ActiveBg path="/" />
          <img src={iconHome} alt="홈" className={iconClass} style={isActive("/") ? activeFilter : inactiveFilter} />
          <span className={`text-[11px] transition-colors duration-300 ${isActive("/") ? "font-bold text-[#054a57]" : "text-[#92a4a6] group-hover:text-[#054a57]"}`}>홈</span>
        </Link>

        {/* 민원 (로그인 체크 O) */}
        <Link to="/complaints" onClick={(e) => handleNavClick(e, "/complaints")} className="group flex flex-col items-center gap-1 relative min-w-[60px]">
          <ActiveBg path="/complaints" />
          <img src={iconComplaints} alt="민원" className={iconClass} style={isActive("/complaints") ? activeFilter : inactiveFilter} />
          <span className={`text-[11px] transition-colors duration-300 ${isActive("/complaints") ? "font-bold text-[#054a57]" : "text-[#92a4a6] group-hover:text-[#054a57]"}`}>민원</span>
        </Link>

        {/* 챗봇 (로그인 체크 X) */}
        <Link to="/chatbot" className="flex flex-col items-center -mt-8 relative transition-transform hover:scale-105 active:scale-95">
          <div className={`size-[64px] bg-gradient-to-br from-[#dcf7fa] to-[#88d5e2] rounded-full flex items-center justify-center relative overflow-hidden transition-all duration-200 ${isActive("/chatbot") ? "border-[6px] border-white shadow-[0_10px_20px_rgba(94,185,202,0.5)] scale-105" : "border-4 border-white/80 shadow-[0_8px_15px_rgba(94,185,202,0.3)]"}`}>
            <div className="absolute inset-0 bg-white/20 opacity-50" />
            <img src={iconChatbot} alt="챗봇" className={`z-10 transition-all duration-200 ${isActive("/chatbot") ? "size-[47px] drop-shadow-md" : "size-[42px]"}`} />
          </div>
          <span className={`text-[11px] mt-2 tracking-tight transition-all ${isActive("/chatbot") ? "font-black text-[#054a57]" : "font-bold text-[#46a3b5]"}`}>챗봇</span>
        </Link>

        {/* 공지 (로그인 체크 X) */}
        <Link to="/notices" className="group flex flex-col items-center gap-1 relative min-w-[60px]">
          <ActiveBg path="/notices" />
          <img src={iconNotice} alt="공지" className={iconClass} style={isActive("/notices") ? activeFilter : inactiveFilter} />
          <span className={`text-[11px] transition-colors duration-300 ${isActive("/notices") ? "font-bold text-[#054a57]" : "text-[#92a4a6] group-hover:text-[#054a57]"}`}>공지</span>
        </Link>

        {/* 내정보 (로그인 체크 O) */}
        <Link to="/users/me" onClick={(e) => handleNavClick(e, "/users/me")} className="group flex flex-col items-center gap-1 relative min-w-[60px]">
          <ActiveBg path="/users/me" />
          <img src={iconProfile} alt="내정보" className={iconClass} style={isActive("/users/me") ? activeFilter : inactiveFilter} />
          <span className={`text-[11px] transition-colors duration-300 ${isActive("/users/me") ? "font-bold text-[#054a57]" : "text-[#92a4a6] group-hover:text-[#054a57]"}`}>내정보</span>
        </Link>
      </div>
    </>
  );
}
