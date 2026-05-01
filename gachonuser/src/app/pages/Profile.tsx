import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { 
  User, Building2, Home, Phone, Mail,
  LogOut, ChevronLeft, ChevronDown, Settings2, Check, AlertCircle, Loader2,
  Lock, KeyRound, ShieldCheck
} from "lucide-react";
import BottomNav from "../components/BottomNav";
import api from "../api/axios";

interface UserInfo {
  name: string;
  studentNo: string;
  dormitoryId: string;
  roomId: string | number; 
  email: string;
  phone: string;
}

const DORM_OPTIONS = [
  { id: "1", name: "제1학생생활관" },
  { id: "2", name: "제2학생생활관" },
  { id: "3", name: "제3학생생활관" },
];

export default function Profile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [alertConfig, setAlertConfig] = useState({ show: false, message: "", isConfirm: false, onConfirm: () => {} });
  const [openSelect, setOpenSelect] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // 에러 상태
  const [roomError, setRoomError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [currentPwError, setCurrentPwError] = useState("");
  const [pwError, setPwError] = useState("");
  const [confirmPwError, setConfirmPwError] = useState("");

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [editedInfo, setEditedInfo] = useState<UserInfo | null>(null);
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });

  const fetchUserInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/users/me");
      if (response.data.code === 200) {
        setUserInfo(response.data.data);
        setEditedInfo(response.data.data);
      }
    } catch (error) {
      console.error("정보 조회 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

    // 유효성 검사
    useEffect(() => {
      const newErrors: Record<string, string> = {};

      // 1. 생활관 호수 검사
      if (editedInfo) {
        const roomStr = String(editedInfo.roomId).trim();
      if (!roomStr) {
        newErrors.roomId = "호수를 입력하세요.";
      } else if (!/^\d+$/.test(roomStr)) {
        newErrors.roomId = "숫자만 입력하세요.";
      } else if (roomStr.length < 3) {
        newErrors.roomId = "3자리 이상 입력하세요.";
      }
    }

    // 2. 전화번호 검사
    if (editedInfo) {
      const originalPhone = editedInfo.phone;
      // 입력된 원본 값
      const purePhone = originalPhone.replace(/-/g, "");
      // 형식 체크용 (하이픈 제거)
      
      if (!originalPhone.trim()) {
        // 1. 아예 비어있는 경우
        newErrors.phone = "전화번호를 입력하세요.";
      } else if (!/^\d+$/.test(originalPhone)) {
        // 2. 원본 데이터에 숫자가 아닌 문자(하이픈 포함)가 섞여 있는 경우 즉시 표시
        newErrors.phone = "숫자만 입력하세요.";
      } else if (!/^010\d{8}$/.test(purePhone)) {
        // 3. 숫자만 있긴 한데 010으로 시작하는 11자리가 아닌 경우
        newErrors.phone = "전화번호 형식에 맞게 입력하세요.";
      }
    }

    // 3. 비밀번호 검사 (비밀번호를 입력하기 시작했을 때만 체크)
    const pwdRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
  
    if (passwords.new) {
      // 새 비밀번호를 한 글자라도 쳤다면 형식 검사 시작
      if (!pwdRegex.test(passwords.new)) {
        newErrors.newPw = "특수 문자를 포함한 8자 이상으로 입력하세요.";
      }
    
      // 새 비밀번호를 입력했다면 현재 비밀번호도 필수
      if (!passwords.current) {
        newErrors.currentPw = "현재 비밀번호를 입력하세요.";
      }
    }

    // 4. 비밀번호 확인 체크
    if (passwords.confirm) {
      if (passwords.new !== passwords.confirm) {
        newErrors.confirmPw = "비밀번호가 일치하지 않습니다.";
      }
    }

    // Profile 페이지용 에러 상태 업데이트
    setRoomError(newErrors.roomId || "");
    setPhoneError(newErrors.phone || "");
    setCurrentPwError(newErrors.currentPw || "");
    setPwError(newErrors.newPw || "");
    setConfirmPwError(newErrors.confirmPw || "");
  }, [editedInfo, passwords, isEditing]);

  const handleSave = async () => {
    if (!editedInfo) return;

    setIsLoading(true);

    try {
      // 수정 가능 필드만 추출 (이메일 제외)
      const updateData = {
        phone: editedInfo.phone.replace(/-/g, ""),
        dormitoryId: String(editedInfo.dormitoryId),
        roomId: Number(editedInfo.roomId)
      };
      
      // 정보 수정 API
      const updateRes = await api.patch("/users/me", updateData);

      // 비밀번호 변경: /users/me/password
      if (passwords.current && passwords.new) {
        try {
          await api.put("/users/me/password", {
            currentPassword: passwords.current,
            newPassword: passwords.new
          });
        } catch (pwError: any) {
          // 정보는 수정됐지만 비밀번호만 틀린 경우
          const msg = pwError.response?.data?.message || "현재 비밀번호가 일치하지 않습니다.";
          showAlert(`정보는 수정되었으나, 비밀번호 변경에 실패했습니다: ${msg}`);
          
          // 정보를 최신화하고 함수 종료
          setUserInfo(updateRes.data.data);
          setIsEditing(false);
          setPasswords({ current: "", new: "", confirm: "" });
          return; 
        }
      }

      if (updateRes.data.code === 200) {
        setUserInfo(updateRes.data.data);
        setIsEditing(false);
        setPasswords({ current: "", new: "", confirm: "" });
        showAlert("성공적으로 수정되었습니다.");
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "수정 중 오류가 발생했습니다.";
      showAlert(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const showAlert = (message: string, isConfirm = false, onConfirm = () => {}) => {
    setAlertConfig({ show: true, message, isConfirm, onConfirm });
  };

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      const response = await api.post("/auth/logout");
      if (response.data.code === 200) {
        sessionStorage.clear();
        navigate("/auth/login", { replace: true });
      }
    } catch (error: any) {
      sessionStorage.clear();
      navigate("/auth/login", { replace: true });
    }
  };

  if (isLoading || !userInfo) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f9ff]">
      <Loader2 className="animate-spin text-[#5eb9ca] size-8" />
    </div>
  );

  return (
    <div className="min-h-screen w-full max-w-[448px] mx-auto bg-[#f0f9ff] relative shadow-2xl flex flex-col antialiased font-sans">
      
      {/* 알림 모달 */}
      {alertConfig.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-8 bg-[#054a57]/20 backdrop-blur-[3px]">
          <div className="bg-white w-full max-w-[320px] rounded-[28px] shadow-2xl p-7 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="size-[56px] bg-[#f0f9ff] rounded-full flex items-center justify-center mb-4">
                {alertConfig.isConfirm ? <AlertCircle className="text-[#5eb9ca]" size={28} /> : <Check className="text-[#5eb9ca]" size={28} />}
              </div>
              <h2 className="text-[17px] font-bold text-[#054a57] mb-2">알림</h2>
              <p className="text-[14px] font-medium text-[#7aaeb7] leading-relaxed mb-6 whitespace-pre-line">{alertConfig.message}</p>
              <div className="flex gap-2 w-full">
                {alertConfig.isConfirm ? (
                  <>
                    <button onClick={() => setAlertConfig({ ...alertConfig, show: false })} className="flex-1 h-[50px] bg-slate-100 text-slate-500 font-bold rounded-[18px]">취소</button>
                    <button onClick={alertConfig.onConfirm} className="flex-1 h-[50px] bg-[#5eb9ca] text-white font-bold rounded-[18px]">확인</button>
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
            <button onClick={() => { setIsEditing(false); setEditedInfo(userInfo); }} className="p-2 -ml-2">
              <ChevronLeft className="size-6 text-[#054a57]" />
            </button>
          )}
          <h1 className="font-bold text-[24px] text-[#054a57] tracking-tight">{isEditing ? "개인정보 수정" : "내 정보"}</h1>
        </div>
      </div>

      <div className="flex-1 px-7 overflow-y-auto pb-32">
        {!isEditing ? (
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
                <InfoRow icon={Building2} label="생활관" value={DORM_OPTIONS.find(d => d.id === String(userInfo.dormitoryId))?.name || `제${userInfo.dormitoryId}생활관`} />
                <InfoRow icon={Home} label="호수" value={`${userInfo.roomId}호`} />
                <InfoRow icon={Mail} label="이메일" value={userInfo.email} />
                <InfoRow icon={Phone} label="전화번호" value={userInfo.phone} />
              </div>
            </div>
            <button onClick={() => setIsEditing(true)} className="w-full bg-white rounded-[18px] p-5 shadow-sm flex items-center gap-4 border border-white active:scale-[0.98] transition-all">
                <Settings2 size={24} className="text-[#5eb9ca]" />
                <p className="font-bold text-[16px] text-[#054a57]">개인정보 수정</p>
            </button>
            <button 
              onClick={() => showAlert("로그아웃하시겠습니까?", true, handleLogout)} 
              className="w-full bg-white rounded-[18px] p-5 shadow-sm flex items-center gap-4 border border-white active:scale-[0.98] transition-all mt-3"
            >
              <LogOut size={24} className="text-[#5eb9ca]" />
              <p className="font-bold text-[16px] text-[#054a57]">로그아웃</p>
            </button>
          </div>
        ) : (
          /* --- 수정 모드 --- */
          <div className="w-full bg-white/75 backdrop-blur-md rounded-[28px] pt-7 px-7 pb-6 shadow-xl shadow-blue-900/5 border border-white animate-in zoom-in-95 duration-300">
            <div className="space-y-4">
              <DisabledInput label="이름" value={userInfo.name} icon={User} />
              <DisabledInput label="학번" value={userInfo.studentNo} icon={User} />
              
              <DisabledInput label="이메일" value={userInfo.email} icon={Mail} />
              
              <div className="flex flex-col relative">
                <label className="text-[10px] font-bold text-[#829496] ml-1 mb-1 uppercase tracking-wider">생활관</label>
                <button type="button" onClick={() => setOpenSelect(!openSelect)}
                  className={`w-full bg-white border-2 ${openSelect ? "border-[#5eb9ca]" : "border-white"} rounded-[18px] px-4 h-[54px] flex items-center justify-between transition-all shadow-sm`}
                >
                  <div className="flex items-center gap-3">
                    <Building2 size={18} className={openSelect ? "text-[#5eb9ca]" : "text-[#adc0c2]"} />
                    <span className="text-[14px] font-bold text-[#054a57]">
                      {DORM_OPTIONS.find(o => o.id === String(editedInfo?.dormitoryId))?.name || "선택"}
                    </span>
                  </div>
                  <ChevronDown className={`size-4 text-[#94a3b8] transition-transform ${openSelect ? "rotate-180" : ""}`} />
                </button>
                {openSelect && editedInfo && (
                  <div className="absolute z-50 w-full mt-2 top-[70px] bg-white border border-slate-100 rounded-[22px] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {DORM_OPTIONS.map((opt) => (
                      <button key={opt.id} type="button" onClick={() => { setEditedInfo({ ...editedInfo, dormitoryId: opt.id }); setOpenSelect(false); }}
                        className="w-full px-5 py-4 text-left text-[14px] font-bold text-[#475569] hover:bg-[#f0f9ff] hover:text-[#5eb9ca] flex items-center justify-between border-b border-slate-50 last:border-none"
                      >
                        {opt.name}
                        {String(editedInfo.dormitoryId) === opt.id && <Check size={16} className="text-[#5eb9ca]" />}
                      </button>
                    ))}
                  </div>
                )}
                <div className="h-[20px]" />
              </div>

              <EditInput label="호수" value={editedInfo?.roomId} error={roomError} icon={Home} onFocus={() => setFocusedField('room')} onBlur={() => setFocusedField(null)} onChange={(val: string) => setEditedInfo({...editedInfo!, roomId: val})} isFocused={focusedField === 'room'} />
              <EditInput label="전화번호" value={editedInfo?.phone} error={phoneError} icon={Phone} onFocus={() => setFocusedField('phone')} onBlur={() => setFocusedField(null)} onChange={(val: string) => setEditedInfo({...editedInfo!, phone: val})} isFocused={focusedField === 'phone'} />

              <div className="py-2 border-t border-slate-100">
                <p className="text-[11px] font-bold text-[#5eb9ca] mb-4 bg-[#f0f9ff] py-1.5 px-3 rounded-full inline-block">비밀번호 변경 (선택)</p>
                <EditInput label="현재 비밀번호" value={passwords.current} error={currentPwError} icon={Lock} type="password" placeholder="현재 비밀번호 입력" onFocus={() => setFocusedField('curPw')} onBlur={() => setFocusedField(null)} onChange={(val: string) => setPasswords({...passwords, current: val})} isFocused={focusedField === 'curPw'} />
                <EditInput label="새 비밀번호" value={passwords.new} error={pwError} icon={KeyRound} type="password" placeholder="새 비밀번호 입력" onFocus={() => setFocusedField('newPw')} onBlur={() => setFocusedField(null)} onChange={(val: string) => setPasswords({...passwords, new: val})} isFocused={focusedField === 'newPw'} />
                <EditInput label="새 비밀번호 확인" value={passwords.confirm} error={confirmPwError} icon={ShieldCheck} type="password" placeholder="다시 입력" onFocus={() => setFocusedField('confPw')} onBlur={() => setFocusedField(null)} onChange={(val: string) => setPasswords({...passwords, confirm: val})} isFocused={focusedField === 'confPw'} />
              </div>

              <button onClick={handleSave} disabled={
                !!(roomError || phoneError || pwError || confirmPwError) || (!!passwords.new && !passwords.current)
                // 새 비번은 썼는데 현재 비번이 비었을 때 버튼 막기
              }
                className="w-full h-[52px] bg-[#5eb9ca] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-[16px] font-bold text-[16px] shadow-lg active:scale-[0.98] transition-all mb-4"
              >
                저장하기
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[448px] z-50">
        <BottomNav />
      </div>
    </div>
  );
}

/* --- 하위 컴포넌트들 --- */
function EditInput({ label, value, error, icon: Icon, type = "text", placeholder, onFocus, onBlur, onChange, isFocused }: any) {
  return (
    <div className="flex flex-col">
      <label className="text-[10px] font-bold text-[#829496] ml-1 mb-1 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10"><Icon size={16} className={isFocused ? 'text-[#5eb9ca]' : 'text-[#adc0c2]'} /></div>
        <input type={type} value={value} onFocus={onFocus} onBlur={onBlur} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
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