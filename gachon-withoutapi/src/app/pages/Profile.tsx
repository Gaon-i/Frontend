import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { 
  User, Building2, Home, Phone, Mail,
  LogOut, ChevronLeft, ChevronDown, Settings2, Check, AlertCircle, Loader2,
  Lock, KeyRound, ShieldCheck
} from "lucide-react";
import BottomNav from "../components/BottomNav";

interface UserInfo {
  name: string;
  studentNo: string;
  dormitoryId: string;
  roomId: string; 
  email: string;
  phone: string;
  password?: string; 
}

const DORM_OPTIONS = [
  { id: 1, name: "제1학생생활관" },
  { id: 2, name: "제2학생생활관" },
  { id: 3, name: "제3학생생활관" },
];

export default function Profile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [alertConfig, setAlertConfig] = useState({ show: false, message: "", isConfirm: false });
  const [openSelect, setOpenSelect] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // 에러 상태
  const [currentPwError, setCurrentPwError] = useState("");
  const [roomError, setRoomError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [pwError, setPwError] = useState("");
  const [confirmPwError, setConfirmPwError] = useState("");

  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: "가온이",
    studentNo: "200035000",
    dormitoryId: "제2학생생활관",
    roomId: "203",
    email: "test@gachon.ac.kr",
    phone: "01012345678",
    password: "1234!@#$" 
  });
  
  const [editedInfo, setEditedInfo] = useState<UserInfo>(userInfo);
  const [currentPassword, setCurrentPassword] = useState(""); 
  const [passwords, setPasswords] = useState({ pw: "", confirm: "" });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // 유효성 검사 로직
  useEffect(() => {
    if (isEditing) {
      // 현재 비밀번호 인증
      if (!currentPassword) {
        setCurrentPwError("현재 비밀번호를 입력하세요.");
      } else if (currentPassword !== userInfo.password) {
        setCurrentPwError("비밀번호가 일치하지 않습니다.");
      } else {
        setCurrentPwError("");
      }

      // 호수 및 연락처
      const roomRegex = /^[0-9]+$/;
      if (!editedInfo.roomId.trim()) setRoomError("호수를 입력하세요.");
      else if (!roomRegex.test(editedInfo.roomId)) setRoomError("숫자만 입력하세요.");
      else if (editedInfo.roomId.length < 3) setRoomError("정확한 호수를 입력하세요.");
      else setRoomError("");

      const phoneRegex = /^010\d{8}$/;
      if (!editedInfo.phone.trim()) setPhoneError("전화번호를 입력하세요.");
      else if (!phoneRegex.test(editedInfo.phone)) setPhoneError("숫자만 입력하세요.");
      else setPhoneError("");

      // 새 비밀번호 (선택 사항)
      if (passwords.pw) {
        const pwRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!pwRegex.test(passwords.pw)) setPwError("특수문자를 포함한 8자 이상으로 입력하세요. ");
        else setPwError("");
      } else {
        setPwError("");
      }

      if (passwords.confirm && passwords.pw !== passwords.confirm) {
        setConfirmPwError("비밀번호가 일치하지 않습니다.");
      } else {
        setConfirmPwError("");
      }
    }
  }, [editedInfo, passwords, currentPassword, isEditing, userInfo.password]);

  const handleSave = () => {
    if (currentPwError || roomError || phoneError || pwError || confirmPwError || !currentPassword) return;
    const finalInfo = { ...editedInfo };
    if (passwords.pw) finalInfo.password = passwords.pw;
    setUserInfo(finalInfo);
    setIsEditing(false);
    setCurrentPassword("");
    setPasswords({ pw: "", confirm: "" });
    setAlertConfig({ show: true, message: "성공적으로 수정되었습니다", isConfirm: false });
    setTimeout(() => setAlertConfig(prev => ({ ...prev, show: false })), 1500);
    window.scrollTo(0, 0); // 수정 완료 후 페이지 상단으로 이동
  };

  return (
    /* h-screen을 제거하고 min-h-screen을 적용하여 전체 스크롤 활성화 */
    <div className="min-h-screen w-full max-w-[448px] mx-auto bg-[#f0f9ff] relative shadow-2xl flex flex-col antialiased font-sans">
      
      {/* 알림 모달 (고정 위치) */}
      {alertConfig.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-8 bg-[#054a57]/20 backdrop-blur-[3px]">
          <div className="bg-white w-full max-w-[320px] rounded-[28px] shadow-2xl p-7 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="size-[56px] bg-[#f0f9ff] rounded-full flex items-center justify-center mb-4">
                {alertConfig.isConfirm ? <AlertCircle className="text-[#5eb9ca]" size={28} /> : <Check className="text-[#5eb9ca]" size={28} />}
              </div>
              <h2 className="text-[17px] font-bold text-[#054a57] mb-2">알림</h2>
              <p className="text-[14px] font-medium text-[#7aaeb7] leading-relaxed mb-6">{alertConfig.message}</p>
              <div className="flex gap-2 w-full">
                {alertConfig.isConfirm ? (
                  <>
                    <button onClick={() => setAlertConfig({ ...alertConfig, show: false })} className="flex-1 h-[50px] bg-slate-100 text-slate-500 font-bold rounded-[18px]">취소</button>
                    <button onClick={() => navigate("/auth/login")} className="flex-1 h-[50px] bg-[#5eb9ca] text-white font-bold rounded-[18px]">확인</button>
                  </>
                ) : (
                  <button onClick={() => setAlertConfig({ ...alertConfig, show: false })} className="w-full h-[50px] bg-[#5eb9ca] text-white font-bold rounded-[18px]">확인</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 헤더 섹션 */}
      <div className="pt-16 px-7 pb-6 shrink-0">
        <div className="flex items-center gap-3">
          {isEditing && (
            <button onClick={() => { setIsEditing(false); setEditedInfo(userInfo); setCurrentPassword(""); }} className="p-2 -ml-2">
              <ChevronLeft className="size-6 text-[#054a57]" />
            </button>
          )}
          <h1 className="font-bold text-[24px] text-[#054a57] tracking-tight">{isEditing ? "개인정보 수정" : "내 정보"}</h1>
        </div>
      </div>

      {/* 메인 콘텐츠 - flex-1로 늘어나게 설정 */}
      <div className="flex-1 px-7">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20"><Loader2 className="animate-spin text-[#5eb9ca] size-8" /></div>
        ) : !isEditing ? (
          /* --- 조회 모드 --- */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white/75 backdrop-blur-md rounded-[28px] p-7 shadow-xl shadow-blue-900/5 border border-white mb-6">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-[#f1f5f9]">
                <div className="size-14 rounded-[22px] bg-[#5eb9ca] flex items-center justify-center text-white shadow-lg shadow-[#5eb9ca]/20">
                  <User size={28} />
                </div>
                <div>
                  <p className="font-bold text-[20px] text-[#054a57] leading-tight mb-1">{userInfo.name}</p>
                  <p className="font-bold text-[14px] text-[#adc0c2] tracking-wide">{userInfo.studentNo}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <InfoRow icon={Building2} label="생활관 동수" value={userInfo.dormitoryId} />
                <InfoRow icon={Home} label="생활관 호수" value={`${userInfo.roomId}호`} />
                <InfoRow icon={Mail} label="이메일" value={userInfo.email} />
                <InfoRow icon={Phone} label="전화번호" value={userInfo.phone} />
              </div>
            </div>
            <button onClick={() => setIsEditing(true)} className="w-full bg-white rounded-[18px] p-5 shadow-sm flex items-center gap-4 border border-white active:scale-[0.98] transition-all">
                <Settings2 size={24} className="text-[#5eb9ca]" />
                <p className="font-bold text-[16px] text-[#054a57]">개인정보 수정</p>
            </button>
            <button onClick={() => setAlertConfig({ show: true, message: "로그아웃하시겠습니까?", isConfirm: true })} className="w-full bg-white rounded-[18px] p-5 shadow-sm flex items-center gap-4 border border-white active:scale-[0.98] transition-all mt-3">
                <LogOut size={24} className="text-[#5eb9ca]" />
                <p className="font-bold text-[16px] text-[#054a57]">로그아웃</p>
            </button>
          </div>
        ) : (
          /* --- 수정 모드 --- */
          <div className="w-full bg-white/75 backdrop-blur-md rounded-[28px] pt-7 px-7 pb-6 shadow-xl shadow-blue-900/5 border border-white animate-in zoom-in-95 duration-300">
            <div className="space-y-4">
              <DisabledInput label="이름" value={editedInfo.name} icon={User} />
              <DisabledInput label="학번" value={editedInfo.studentNo} icon={User} />
              {/* 생활관 동수 Select 섹션 */}
              <div className="flex flex-col relative">
                <label className="text-[10px] font-bold text-[#829496] ml-1 mb-1 uppercase tracking-wider">
                  생활관 동수
                </label>
                <button
                  type="button"
                  onClick={() => setOpenSelect(!openSelect)}
                  className={`w-full bg-white border-2 ${
                    openSelect ? "border-[#5eb9ca]" : "border-white"
                  } rounded-[18px] px-4 h-[54px] flex items-center justify-between transition-all shadow-sm`}
                >
                  <div className="flex items-center gap-3">
                    <Building2
                      size={18}
                      className={openSelect ? "text-[#5eb9ca]" : "text-[#adc0c2]"}
                    />
                    <span className="text-[14px] font-bold text-[#054a57]">
                      {editedInfo.dormitoryId}
                    </span>
                  </div>
                  <ChevronDown
                    className={`size-4 text-[#94a3b8] transition-transform ${
                      openSelect ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openSelect && (
                  <div className="absolute z-50 w-full mt-2 top-[70px] bg-white border border-slate-100 rounded-[22px] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {DORM_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setEditedInfo({ ...editedInfo, dormitoryId: opt.name });
                        setOpenSelect(false);
                      }}
                      className="w-full px-5 py-4 text-left text-[14px] font-bold text-[#475569] hover:bg-[#f0f9ff] hover:text-[#5eb9ca] flex items-center justify-between border-b border-slate-50 last:border-none transition-colors"
                    >
                      {opt.name}
                      {editedInfo.dormitoryId === opt.name && (
                        <Check size={16} className="text-[#5eb9ca]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
              <div className="h-[20px]" />
              </div>

              <EditInput label="생활관 호수" value={editedInfo.roomId} error={roomError} icon={Home} onFocus={() => setFocusedField('room')} onBlur={() => setFocusedField(null)} onChange={(val) => setEditedInfo({...editedInfo, roomId: val})} isFocused={focusedField === 'room'} />
              <EditInput label="전화번호" value={editedInfo.phone} error={phoneError} icon={Phone} onFocus={() => setFocusedField('phone')} onBlur={() => setFocusedField(null)} onChange={(val) => setEditedInfo({...editedInfo, phone: val})} isFocused={focusedField === 'phone'} />

              <EditInput 
                  label="현재 비밀번호"
                  value={currentPassword}
                  error={currentPwError}
                  icon={Lock}
                  type="password"
                  placeholder="현재 비밀번호를 입력하세요"
                  onFocus={() => setFocusedField('currentPw')}
                  onBlur={() => setFocusedField(null)}
                  onChange={setCurrentPassword}
                  isFocused={focusedField === 'currentPw'}
                />

              <div className="py-2 border-t border-slate-100">
                <p className="text-[11px] font-bold text-[#5eb9ca] mb-4 bg-[#f0f9ff] py-1.5 px-3 rounded-full inline-block">비밀번호 변경 (선택)</p>
                <EditInput label="새 비밀번호" value={passwords.pw} error={pwError} icon={KeyRound} type="password" placeholder="새 비밀번호를 입력하세요" onFocus={() => setFocusedField('pw')} onBlur={() => setFocusedField(null)} onChange={(val) => setPasswords({...passwords, pw: val})} isFocused={focusedField === 'pw'} />
                <EditInput label="새 비밀번호 확인" value={passwords.confirm} error={confirmPwError} icon={ShieldCheck} type="password" placeholder="새 비밀번호를 다시 입력하세요" onFocus={() => setFocusedField('confirmPw')} onBlur={() => setFocusedField(null)} onChange={(val) => setPasswords({...passwords, confirm: val})} isFocused={focusedField === 'confirmPw'} />
              </div>

              <button 
                onClick={handleSave}
                disabled={!!(currentPwError || roomError || phoneError || pwError || confirmPwError || !currentPassword)}
                className="w-full h-[52px] bg-[#5eb9ca] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-[16px] font-bold text-[16px] shadow-lg active:scale-[0.98] transition-all mb-4"
              >
                수정 완료
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 푸터 영역 - 하단 바에 가려지지 않게 pb-32 유지 */}
      <div className="pt-10 pb-32 shrink-0 text-center opacity-70">
        <p className="text-[10px] font-bold text-[#adc0c2]">가천대학교 학생생활관</p>
        <p className="text-[8px] text-[#c2d2d4] mt-0.5 uppercase tracking-widest font-bold">Version 1.0.0</p>
      </div>

      {/* 하단 네비게이션 바 (고정) */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[448px] z-50">
        <BottomNav />
      </div>
    </div>
  );
}

/* --- 컴포넌트 라이브러리 --- */

function EditInput({ label, value, error, icon: Icon, type = "text", placeholder, onFocus, onBlur, onChange, isFocused }: any) {
  return (
    <div className="flex flex-col">
      <label className="text-[10px] font-bold text-[#829496] ml-1 mb-1 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
          <Icon size={16} className={isFocused ? 'text-[#5eb9ca]' : 'text-[#adc0c2]'} />
        </div>
        <input 
          type={type}
          value={value} 
          onFocus={onFocus}
          onBlur={onBlur}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-white border ${error ? 'border-red-400' : 'border-[#eef6f7]'} rounded-[12px] pl-11 pr-4 h-[48px] text-[14px] font-bold text-[#054a57] focus:outline-none focus:border-[#5eb9ca] transition-all`} 
        />
      </div>
      <div className="h-[18px]">{error && <p className="text-[10px] text-red-500 font-bold mt-0.5 ml-1">* {error}</p>}</div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-start gap-4 border-b border-[#f8fafc] pb-3 last:border-none last:pb-0">
      <div className="text-[#5eb9ca] mt-0.5"><Icon size={18} /></div>
      <div>
        <p className="text-[10px] font-bold text-[#adc0c2] uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-[15px] font-bold text-[#054a57]">{value}</p>
      </div>
    </div>
  );
}

function DisabledInput({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="flex flex-col">
      <label className="text-[10px] font-bold text-[#829496] ml-1 mb-1 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10"><Icon size={16} className="text-[#adc0c2]" /></div>
        <input disabled value={value} className="w-full bg-[#f8fafc] text-[#adc0c2] border border-[#eef6f7] rounded-[12px] pl-11 pr-4 h-[48px] text-[14px] font-bold cursor-not-allowed" />
      </div>
      <div className="h-[18px]" />
    </div>
  );
}