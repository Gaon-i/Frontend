import { Link, useNavigate } from "react-router";
import BottomNav from "../components/BottomNav";
import iconShortcut from "../icons/gaon-logo.svg";
import messageIcon from "../icons/typing.svg";
// 로그인 상태를 가져오는 훅(이미 사용 중인 context가 있다면 그것을 사용하세요)
// 예: import { useAuth } from "../contexts/AuthContext"; 

function HeaderSection() {
  return (
    <div className="flex flex-row items-center pt-[64px] w-[340px] mx-auto gap-4 text-left font-sans antialiased">
      {/* 아이콘 영역 */}
  <div className="shrink-0 flex items-center justify-center">
    <img
      src={iconShortcut}
      alt="가온이 로고"
      className="w-[100px] h-auto object-contain"
    />
  </div>

      {/* 텍스트 영역 */}
      <div className="flex flex-col items-start gap-1 flex-1">
        <p className="text-[#5eb9ca] text-[14px] font-bold tracking-wider px-0.5">
          똑똑한 기숙사 생활의 시작
        </p>

        <h1 className="font-black text-[28px] text-[#054a57] leading-[1.2] tracking-tighter px-0.5">
          가천대 기숙사 AI <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5eb9ca] to-[#21dcff]">
            가온이
          </span>
        </h1>
      </div>
    </div>
  );
}

function NoticeCard() {
  return (
    <div className="mt-[32px] w-[340px] bg-white rounded-[22px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[#f0f7f8] mx-auto transition-all">
      <p className="text-[11px] font-extrabold text-[#5eb9ca] mb-3 tracking-[0.1em] uppercase opacity-90">
        Update V1
      </p>
      <p className="text-[14px] text-slate-700 leading-[1.7] font-semibold break-keep">
        가천대 기숙사 AI 생활 지원 서비스 <br />
        <span className="text-[#054a57] font-bold">"가온이"</span>가 시작되었어요!
      </p>
    </div>
  );
}

export default function Home() {
  // 실제 환경에서는 Context나 Redux에서 가져와야 합니다.
  // 예: const { isLoggedIn } = useAuth();
  const isLoggedIn = false; // 테스트용 임시 변수

  return (
    <div className="bg-[#f6fbff] min-h-screen w-full max-w-[448px] mx-auto relative shadow-2xl flex flex-col overflow-x-hidden font-sans">
      <div className="flex-1 pb-[220px]">
        <HeaderSection />
        <NoticeCard />
      </div>

      {/* 챗봇 바로가기 버튼 */}
      <div className="fixed bottom-[130px] w-full max-w-[448px] left-1/2 -translate-x-1/2 z-30 px-6">
        {/* 로그인 상태에 따라 챗봇 경로 제어 */}
        <Link
          to={"/chatbot"}
          className="w-full h-[62px] bg-[#5eb9ca] rounded-[20px] flex items-center justify-center gap-3 shadow-lg shadow-[#5eb9ca]/25 active:scale-95 transition-transform"
        >
          <img src={messageIcon} alt="" className="size-6 brightness-0 invert" />
          <p className="text-[16px] font-bold text-white tracking-tight">
            궁금한 내용을 바로 물어보세요!
          </p>
        </Link>
      </div>

      {/* BottomNav 내부에서도 isLoggedIn 값을 사용하여 민원/내정보 접근을 막아야 합니다. */}
      {/* <BottomNav isLoggedIn={isLoggedIn} /> */}
      <BottomNav />
    </div>
  );
}
