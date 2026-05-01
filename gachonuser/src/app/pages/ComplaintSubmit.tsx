import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft, X, Loader2, Check, ChevronDown,
  Wrench, ScrollText, Eraser, Volume2, HelpCircle, ImagePlus, AlertCircle
} from "lucide-react";
import api from "../api/axios";

export default function ComplaintSubmit() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";

  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("FACILITY");
  const [categoryLabel, setCategoryLabel] = useState("시설 수리");
  const [openSelect, setOpenSelect] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // 알림 모달 상태
  const [alertConfig, setAlertConfig] = useState({
    show: false,
    message: "",
    isConfirm: false,
    // 확인만 필요할 경우 false, 선택이 필요할 경우 true
  });

  // 유효성 검사 상태
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [titleError, setTitleError] = useState("");
  const [contentError, setContentError] = useState("");

  const categoryOptions = [
    { id: "FACILITY", name: "시설 수리", icon: <Wrench size={20} className="text-orange-400" /> },
    { id: "RULE", name: "생활 규칙", icon: <ScrollText size={20} className="text-blue-400" /> },
    { id: "CLEANING", name: "청소 요청", icon: <Eraser size={20} className="text-green-400" /> },
    { id: "NOISE", name: "소음 신고", icon: <Volume2 size={20} className="text-red-400" /> },
    { id: "ETC", name: "기타 문의", icon: <HelpCircle size={20} className="text-purple-400" /> },
  ];

  // 실시간 유효성 검사
  useEffect(() => {
    if (isSubmitted) {
      setTitleError(!title.trim() ? "제목을 입력하세요." : "");
      setContentError(!content.trim() ? "민원 내용을 입력하세요." : "");
    }
  }, [title, content, isSubmitted]);

  useEffect(() => {
    if (!isLoggedIn) navigate("/auth/login");
  }, [isLoggedIn, navigate]);

  // 서버 연동 API 호출 로직
  const handleSubmit = useCallback(async () => {
    setIsSubmitted(true);

    if (!title.trim() || !content.trim()) return;

    setLoading(true);
    try {
      // 1. multipart/form-data를 위한 FormData 생성
      const formData = new FormData();
      formData.append("category", category);
      formData.append("title", title);
      formData.append("content", content);

      // 2. 이미지 파일들 추가 (배열 형태)
      imageFiles.forEach((file) => {
        formData.append("images", file);
      });

      // 3. API 요청 전송 (POST /api/complaints)
      const response = await api.post("/complaints", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.code === 201) {
        // 등록 성공 시 이전 페이지(리스트)로 이동
        navigate(-1);
      }
    } catch (error: any) {
      console.error("민원 등록 실패:", error);
      const errorMsg = error.response?.data?.message || "민원 접수 중 오류가 발생했습니다.";
      setAlertConfig({ show: true, message: errorMsg, isConfirm: false });
    } finally {
      setLoading(false);
    }
  }, [title, content, category, imageFiles, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (imageFiles.length + newFiles.length > 5) {
        return setAlertConfig({ show: true, message: "최대 5장까지 첨부 가능합니다.", isConfirm: false });
      }
      setImageFiles(prev => [...prev, ...newFiles]);

      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
    // 동일한 파일을 다시 올릴 수 있도록 초기화
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    // 메모리 누수 방지를 위해 URL 해제
    URL.revokeObjectURL(previews[index]);

    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // 컴포넌트 언마운트 시 프리뷰 URL들 해제
  useEffect(() => {
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  if (!isLoggedIn) return null;

  return (
    <div className="bg-[#f6fbff] min-h-screen w-full max-w-[448px] mx-auto flex flex-col shadow-2xl relative animate-in fade-in duration-500 antialiased font-sans">

      {/* 알림 모달 */}
      {alertConfig.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-8 bg-[#054a57]/20 backdrop-blur-[3px]">
          <div className="bg-white w-full max-w-[320px] rounded-[28px] shadow-2xl p-7 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="size-[56px] bg-[#f0f9ff] rounded-full flex items-center justify-center mb-4">
                {alertConfig.isConfirm ? <AlertCircle className="text-[#5eb9ca]" size={28} /> : <Check className="text-[#5eb9ca]" size={28} />}
              </div>
              <h2 className="text-[17px] font-bold text-[#054a57] mb-2">알림</h2>
              <p className="text-[14px] font-medium text-[#7aaeb7] leading-relaxed mb-6 whitespace-pre-line">{alertConfig.message}</p>
              <div className="flex gap-2 w-full">
                {alertConfig.isConfirm ? (
                  <>
                    <button onClick={() => setAlertConfig({ ...alertConfig, show: false })} className="flex-1 h-[50px] bg-slate-100 text-slate-500 font-bold rounded-[18px] active:scale-[0.96]">취소</button>
                    <button onClick={() => setAlertConfig({ ...alertConfig, show: false })} className="flex-1 h-[50px] bg-[#5eb9ca] text-white font-bold rounded-[18px] shadow-md active:scale-[0.96]">확인</button>
                  </>
                ) : (
                  <button onClick={() => setAlertConfig({ ...alertConfig, show: false })} className="w-full h-[50px] bg-[#5eb9ca] text-white font-bold rounded-[18px] shadow-md active:scale-[0.96]">확인</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="pt-[54px] px-6 pb-4 bg-[#f6fbff]/80 backdrop-blur-xl sticky top-0 z-50 border-b border-[#eef6f7] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-white/50 rounded-full transition-all active:scale-90">
            <ChevronLeft className="size-6 text-[#054a57]" />
          </button>
          <h1 className="font-bold text-[22px] text-[#054a57] tracking-tight">민원 작성</h1>
        </div>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 px-6 pt-6 pb-40 space-y-7 overflow-y-auto scrollbar-hide">

        {/* 1. 카테고리 선택 */}
        <div className="space-y-2 relative">
          <label className="text-[11px] font-black text-[#829496] uppercase tracking-widest ml-1 flex items-center">
            카테고리 <span className="text-red-500 ml-1">*</span>
          </label>
          <button
            type="button"
            onClick={() => setOpenSelect(!openSelect)}
            className={`w-full bg-white border border-[#eef6f7] transition-all duration-300 rounded-[22px] px-5 h-[60px] flex items-center justify-between shadow-sm ${openSelect ? 'border-[#5eb9ca] shadow-lg shadow-[#5eb9ca]/10' : ''
              }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="flex items-center justify-center">
                {categoryOptions.find(o => o.id === category)?.icon}
              </div>
              <span className="text-[15px] font-bold text-[#054a57]">{categoryLabel}</span>
            </div>
            <ChevronDown className={`size-5 text-[#94a3b8] transition-transform duration-500 ${openSelect ? 'rotate-180' : ''}`} />
          </button>

          {openSelect && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpenSelect(false)} />
              <div className="absolute z-50 w-full mt-1.5 bg-white/95 backdrop-blur-2xl border border-[#eef6f7] rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {categoryOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { setCategory(opt.id); setCategoryLabel(opt.name); setOpenSelect(false); }}
                    className="w-full px-6 py-4.5 text-left flex items-center justify-between hover:bg-[#f8fbff] transition-colors border-b border-[#fcfdfe] last:border-none"
                  >
                    <div className="flex items-center gap-4">
                      <div className="size-6 flex items-center justify-center">
                        {opt.icon}
                      </div>
                      <span className={`text-[15px] font-bold ${category === opt.id ? 'text-[#5eb9ca]' : 'text-[#475569]'}`}>{opt.name}</span>
                    </div>
                    {category === opt.id && <Check size={20} className="text-[#5eb9ca]" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 2. 제목 입력 */}
        <div className="space-y-2">
          <label className="text-[11px] font-black text-[#829496] uppercase tracking-widest ml-1 flex items-center">
            제목 <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            className="w-full h-[60px] px-6 bg-white border border-[#eef6f7] focus:border-[#5eb9ca] rounded-[22px] text-[15px] font-bold text-[#054a57] outline-none transition-all shadow-sm placeholder:text-[#adb5bd]"
          />

          <div className="h-[18px]">
            {titleError && <p className="text-[10px] text-red-500 font-bold mt-0.5 ml-1 animate-in fade-in">* {titleError}</p>}
          </div>
        </div>

        {/* 3. 본문 입력 */}
        <div className="space-y-2">
          <label className="text-[11px] font-black text-[#829496] uppercase tracking-widest ml-1 flex items-center">
            민원 내용 <span className="text-red-500 ml-1">*</span>
          </label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="민원 내용을 자세히 입력해주세요"
            className="w-full min-h-[180px] p-6 bg-white border border-[#eef6f7] focus:border-[#5eb9ca] rounded-[28px] text-[15px] font-medium text-[#054a57] outline-none transition-all shadow-sm resize-none leading-relaxed placeholder:text-[#adb5bd]"
          />

          <div className="h-[18px]">
            {contentError && <p className="text-[10px] text-red-500 font-bold mt-0.5 ml-1 animate-in fade-in">* {contentError}</p>}
          </div>
        </div>

        {/* 4. 이미지 업로드 */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <label className="text-[11px] font-black text-[#829496] uppercase tracking-widest flex items-center">
              사진 첨부 <span className="text-[10px] text-[#adb5bd] font-medium ml-2">(선택)</span>
            </label>
            <span className={`text-[11px] font-bold ${imageFiles.length >= 5 ? 'text-red-400' : 'text-[#5eb9ca]'}`}>{imageFiles.length}/5</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square bg-white border border-[#eef6f7] rounded-[20px] flex flex-col items-center justify-center text-[#5eb9ca] hover:border-[#5eb9ca] hover:bg-[#f8fbff] transition-all group shadow-sm"
            >
              <ImagePlus size={24} />
              <span className="text-[9px] font-black mt-1.5 uppercase">추가하기</span>
            </button>
            {previews.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-[20px] overflow-hidden border border-[#eef6f7] shadow-sm animate-in zoom-in-95">
                <img src={src} className="w-full h-full object-cover" alt="preview" />
                <button type="button" onClick={() => removeImage(i)} className="absolute top-1.5 right-1.5 bg-black/40 backdrop-blur-md rounded-full p-1 text-white hover:bg-red-500 transition-colors">
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
          <input type="file" ref={fileInputRef} onChange={handleImageChange} multiple accept="image/*" className="hidden" />
        </div>
      </div>

      {/* 하단 버튼 바 */}
      <div className="fixed bottom-0 w-full max-w-[448px] p-6 pb-8 bg-gradient-to-t from-[#f6fbff] via-[#f6fbff] to-transparent z-40">
        <button
          onClick={handleSubmit}
          disabled={loading || !title || !content}
          className="w-full h-[64px] bg-[#054a57] disabled:bg-[#adb5bd] text-white rounded-[24px] font-bold text-[16px] shadow-xl shadow-[#054a57]/10 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <span className="tracking-tight">민원 접수하기</span>
          )}
        </button>
      </div>
    </div>
  );
}