import { ReactNode, useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import { MessageSquare, BarChart3, Users, LogOut, Menu, X, AlertCircle } from "lucide-react";
import { LucideIcon } from "lucide-react";
import api from "../api/axios";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MenuItem {
  path: string;
  icon: LucideIcon;
  label: string;
}

interface AdminLayoutProps {
  children: ReactNode;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MENU_ITEMS: MenuItem[] = [
  { path: "/admin/complaints", icon: MessageSquare, label: "민원 관리" },
  { path: "/admin/chatlogs/stats", icon: BarChart3, label: "챗봇 통계" },
  { path: "/admin/users", icon: Users, label: "학생 관리" },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useScrollLock(locked: boolean) {
  useEffect(() => {
    document.body.style.overflow = locked ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [locked]);
}

function useLogout() {
  const navigate = useNavigate();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");

  const clearAuthData = useCallback(() => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/admin/auth/login");
  }, [navigate]);

  const confirmLogout = useCallback(async () => {
    try {
      const { data } = await api.post<{
        code: number;
        data: { logout: boolean } | null;
        message: string;
      }>("/admin/auth/logout");

      if (data.code === 200 && data.data?.logout) {
        clearAuthData();
      } else {
        setAlertMsg(data.message || "로그아웃 처리 중 오류가 발생했습니다.");
        setShowAlert(true);
        setTimeout(clearAuthData, 2000);
      }
    } catch {
      clearAuthData();
    }
  }, [clearAuthData]);

  return { confirmLogout, alertMsg, showAlert, setShowAlert };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const { confirmLogout, alertMsg, showAlert, setShowAlert } = useLogout();

  useScrollLock(isMobileMenuOpen || isLogoutModalOpen);

  const isActive = (path: string) => pathname === path;

  const handleMobileNavigate = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleLogoutConfirm = async () => {
    setIsLogoutModalOpen(false);
    await confirmLogout();
  };

  return (
    <div className="bg-white min-h-screen w-full flex">

      {/* ── Desktop Sidebar ───────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-[#e5f4f5] flex-col fixed h-screen z-30">
        <div className="px-6 py-6 border-b border-[#e5f4f5]">
          <h1 className="font-bold text-[24px] text-[#054a57]">관리자</h1>
          <p className="font-medium text-[12px] text-[#92a4a6] mt-1">가천대학교 기숙사</p>
        </div>

        <nav className="flex-1 px-4 py-4 overflow-y-auto" aria-label="관리자 메뉴">
          <div className="space-y-1">
            {MENU_ITEMS.map(({ path, icon: Icon, label }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                aria-current={isActive(path) ? "page" : undefined}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] transition-all group ${
                  isActive(path)
                    ? "bg-[#5eb9ca] text-white shadow-lg shadow-[#5eb9ca]/30"
                    : "text-[#92a4a6] hover:bg-[#f6fbff] hover:text-[#5eb9ca]"
                }`}
              >
                <span className="p-1 rounded-md">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="font-semibold text-[14px]">{label}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-[#e5f4f5]">
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-[#ea5455] hover:bg-[#fef5f5] transition-all group"
          >
            <span className="p-1 rounded-md bg-red-50 group-hover:bg-transparent transition-all">
              <LogOut className="size-5" aria-hidden="true" />
            </span>
            <span className="font-semibold text-[14px]">로그아웃</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Header ─────────────────────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-[#e5f4f5] px-4 py-4 z-40 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-[20px] text-[#054a57]">관리자</h1>
          <p className="font-medium text-[11px] text-[#92a4a6]">가천대학교 기숙사</p>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          aria-label={isMobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
          className="p-2 rounded-[8px] bg-[#f6fbff] text-[#5eb9ca]"
        >
          {isMobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </header>

      {/* ── Mobile Menu Overlay ───────────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="모바일 메뉴"
          className="lg:hidden fixed inset-0 z-[60]"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div className="absolute inset-0 bg-[#054a57]/10 backdrop-blur-[6px] animate-in fade-in" aria-hidden="true" />
          <div
            className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-2xl rounded-[32px] shadow-xl border border-white/60 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-8 pt-8 pb-2">
              <h2 className="font-black text-[22px] text-[#054a57]">Menu</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="메뉴 닫기"
                className="p-3 rounded-2xl bg-[#f6fbff] text-[#92a4a6] hover:text-[#ea5455]"
              >
                <X className="size-6" />
              </button>
            </div>

            <nav className="px-4 py-6 space-y-2" aria-label="모바일 메뉴">
              {MENU_ITEMS.map(({ path, icon: Icon, label }) => (
                <button
                  key={path}
                  onClick={() => handleMobileNavigate(path)}
                  aria-current={isActive(path) ? "page" : undefined}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-[22px] group transition-all ${
                    isActive(path) ? "bg-[#5eb9ca] text-white" : "text-[#92a4a6] hover:bg-[#f0f9fa]"
                  }`}
                >
                  <span className={`p-2.5 rounded-[14px] transition-all ${
                    isActive(path) ? "bg-transparent" : "bg-[#f6fbff] group-hover:bg-transparent"
                  }`}>
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="font-bold text-[15px]">{label}</span>
                </button>
              ))}

              <div className="h-px bg-[#e5f4f5] mx-4 my-4" aria-hidden="true" />

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsLogoutModalOpen(true);
                }}
                className="w-full flex items-center gap-4 px-6 py-4 rounded-[22px] text-[#ea5455] hover:bg-red-50 font-bold group"
              >
                <span className="p-2.5 rounded-[14px] bg-red-50 group-hover:bg-transparent transition-all">
                  <LogOut className="size-5" aria-hidden="true" />
                </span>
                <span>로그아웃</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <main className="flex-1 lg:ml-64 pt-[73px] lg:pt-0 pb-20 lg:pb-0 min-h-screen bg-[#f6fbff]">
        {children}
      </main>

      {/* ── Mobile Bottom Navigation ──────────────────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5f4f5] z-40 px-2 py-2"
        aria-label="하단 탭 메뉴"
      >
        <div className="flex items-center justify-around">
          {MENU_ITEMS.map(({ path, icon: Icon, label }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              aria-current={isActive(path) ? "page" : undefined}
              aria-label={label}
              className={`flex flex-col items-center gap-1 p-2 transition-all ${
                isActive(path) ? "text-[#5eb9ca]" : "text-[#92a4a6]"
              }`}
            >
              <Icon className="size-5" aria-hidden="true" />
              <span className="text-[10px] font-bold">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ── Alert Modal ───────────────────────────────────────────────────── */}
      {showAlert && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="alert-title"
          className="fixed inset-0 z-[110] flex items-center justify-center px-8"
        >
          <div
            className="absolute inset-0 bg-[#054a57]/20 backdrop-blur-[3px]"
            onClick={() => setShowAlert(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white w-full max-w-[320px] rounded-[28px] shadow-2xl p-7 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="size-[56px] bg-[#f0f9ff] rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="text-[#5eb9ca]" size={28} aria-hidden="true" />
              </div>
              <h2 id="alert-title" className="text-[17px] font-bold text-[#054a57] mb-2">알림</h2>
              <p className="text-[14px] font-medium text-[#7aaeb7] leading-relaxed mb-6 whitespace-pre-wrap">
                {alertMsg}
              </p>
              <button
                onClick={() => setShowAlert(false)}
                className="w-full h-[50px] bg-[#5eb9ca] text-white font-bold rounded-[18px] active:scale-[0.96] shadow-md"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Logout Modal ──────────────────────────────────────────────────── */}
      {isLogoutModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-title"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[4px] animate-in fade-in"
          onClick={() => setIsLogoutModalOpen(false)}
        >
          <div
            className="bg-white p-8 rounded-[32px] shadow-2xl w-[85%] max-w-[340px] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center gap-6">
              <div className="size-16 rounded-full bg-red-50 flex items-center justify-center text-[#ea5455]">
                <LogOut size={32} aria-hidden="true" />
              </div>
              <div>
                <h3 id="logout-title" className="font-black text-[20px] text-[#054a57]">로그아웃</h3>
                <p className="font-bold text-[#92a4a6] text-[15px] mt-2">정말 로그아웃 하시겠습니까?</p>
              </div>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="flex-1 py-4 bg-slate-100 rounded-2xl font-bold text-slate-500"
                >
                  취소
                </button>
                <button
                  onClick={handleLogoutConfirm}
                  className="flex-1 py-4 bg-[#ea5455] rounded-2xl font-bold text-white shadow-lg shadow-red-100"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}