import { ReactNode, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { MessageSquare, BarChart3, Bell, Users, LogOut, Menu, X } from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // --- 스크롤 방지 로직 추가 ---
  useEffect(() => {
    if (isMobileMenuOpen || isLogoutModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    // 컴포넌트 언마운트 시 스타일 복구
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen, isLogoutModalOpen]);

  const menuItems = [
    { path: "/admin/complaints", icon: MessageSquare, label: "민원 관리" },
    { path: "/admin/chatlogs/stats", icon: BarChart3, label: "챗봇 통계" },
    { path: "/admin/notices", icon: Bell, label: "공지 관리" },
    { path: "/admin/users", icon: Users, label: "학생 관리" },
  ];

  const openLogoutModal = () => setIsLogoutModalOpen(true);
  const confirmLogout = () => {
    sessionStorage.clear();
    navigate("/auth/login");
  };

  const isActive = (path: string) => location.pathname === path;

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="bg-white min-h-screen w-full flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-[#e5f4f5] flex-col fixed h-screen z-30">
        <div className="px-6 py-6 border-b border-[#e5f4f5]">
          <h1 className="font-bold text-[24px] text-[#054a57]">관리자</h1>
          <p className="font-medium text-[12px] text-[#92a4a6] mt-1">가천대학교 기숙사</p>
        </div>

        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] transition-all group ${
                    active ? "bg-[#5eb9ca] text-white shadow-lg shadow-[#5eb9ca]/30" : "text-[#92a4a6] hover:bg-[#f6fbff] hover:text-[#5eb9ca]"
                  }`}
                >
                  <div className={`p-1 rounded-md transition-all ${active ? "bg-transparent" : "group-hover:bg-transparent"}`}>
                    <Icon className="size-5" />
                  </div>
                  <span className="font-semibold text-[14px]">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-[#e5f4f5]">
          <button onClick={openLogoutModal} className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-[#ea5455] hover:bg-[#fef5f5] transition-all group">
            <div className="p-1 rounded-md transition-all group-hover:bg-transparent bg-red-50">
              <LogOut className="size-5" />
            </div>
            <span className="font-semibold text-[14px]">로그아웃</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-[#e5f4f5] px-4 py-4 z-40 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-[20px] text-[#054a57]">관리자</h1>
          <p className="font-medium text-[11px] text-[#92a4a6]">가천대학교 기숙사</p>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-[8px] bg-[#f6fbff] text-[#5eb9ca]">
          {isMobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-[#054a57]/10 backdrop-blur-[6px] animate-in fade-in" />
          <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-2xl rounded-[32px] shadow-xl border border-white/60 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-8 pt-8 pb-2">
              <h2 className="font-black text-[22px] text-[#054a57]">Menu</h2>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-2xl bg-[#f6fbff] text-[#92a4a6] hover:text-[#ea5455]">
                <X className="size-6" />
              </button>
            </div>
            <nav className="px-4 py-6 space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-[22px] group transition-all ${
                    isActive(item.path) ? "bg-[#5eb9ca] text-white" : "text-[#92a4a6] hover:bg-[#f0f9fa]"
                  }`}
                >
                  <div className={`p-2.5 rounded-[14px] transition-all ${isActive(item.path) ? "bg-transparent" : "bg-[#f6fbff] group-hover:bg-transparent"}`}>
                    <item.icon className="size-5" />
                  </div>
                  <span className="font-bold text-[15px]">{item.label}</span>
                </button>
              ))}
              <div className="h-px bg-[#e5f4f5] mx-4 my-4" />
              <button onClick={openLogoutModal} className="w-full flex items-center gap-4 px-6 py-4 rounded-[22px] text-[#ea5455] hover:bg-red-50 font-bold group">
                <div className="p-2.5 rounded-[14px] bg-red-50 group-hover:bg-transparent transition-all">
                  <LogOut className="size-5" />
                </div>
                <span>로그아웃</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content 영역 */}
      <main className="flex-1 lg:ml-64 pt-[73px] lg:pt-0 pb-20 lg:pb-0 min-h-screen bg-[#f6fbff]">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5f4f5] z-40 px-2 py-2">
        <div className="flex items-center justify-around">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 p-2 transition-all ${isActive(item.path) ? "text-[#5eb9ca]" : "text-[#92a4a6]"}`}
            >
              <item.icon className="size-5" />
              <span className="text-[10px] font-bold">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* 로그아웃 확인 모달 (배경 클릭 방지 적용) */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[4px] animate-in fade-in">
          {/* 배경 클릭 방지를 위해 onClick 핸들러 제거 */}
          <div 
            className="bg-white p-8 rounded-[32px] shadow-2xl w-[85%] max-w-[340px] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center gap-6">
              <div className="size-16 rounded-full bg-red-50 flex items-center justify-center text-[#ea5455]">
                <LogOut size={32} />
              </div>
              <div>
                <h3 className="font-black text-[20px] text-[#054a57]">로그아웃</h3>
                <p className="font-bold text-[#92a4a6] text-[15px] mt-2">정말 로그아웃 하시겠습니까?</p>
              </div>
              <div className="flex gap-3 w-full">
                <button onClick={() => setIsLogoutModalOpen(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-bold text-slate-500">취소</button>
                <button onClick={confirmLogout} className="flex-1 py-4 bg-[#ea5455] rounded-2xl font-bold text-white shadow-lg shadow-red-100">확인</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}