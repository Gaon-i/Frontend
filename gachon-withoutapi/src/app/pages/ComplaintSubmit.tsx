import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { 
  ChevronLeft, X, Loader2, Check, ChevronDown, 
  Wrench, ScrollText, Eraser, Volume2, HelpCircle, ImagePlus 
} from "lucide-react";

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

  const categoryOptions = [
    { id: "FACILITY", name: "시설 수리", icon: <Wrench size={20} className="text-orange-400" /> },
    { id: "RULE", name: "생활 규칙", icon: <ScrollText size={20} className="text-blue-400" /> },
    { id: "CLEANING", name: "청소 요청", icon: <Eraser size={20} className="text-green-400" /> },
    { id: "NOISE", name: "소음 신고", icon: <Volume2 size={20} className="text-red-400" /> },
    { id: "ETC", name: "기타 문의", icon: <HelpCircle size={20} className="text-purple-400" /> },
  ];

  useEffect(() => {
    if (!isLoggedIn) navigate("/auth/login");
  }, [isLoggedIn, navigate]);

  const handleSubmit = useCallback(async () => {
    if (!title || !content) return;
    setLoading(true);
    setTimeout(() => {
      try {
        const savedData = JSON.parse(localStorage.getItem("mock_complaints") || "[]");
        const nextId = savedData.length > 0 ? Math.max(...savedData.map((c: any) => c.complaintId)) + 1 : 1;
        const newComplaint = {
          complaintId: nextId,
          category,
          title,
          content,
          status: "RECEIVED",
          queueNo: savedData.filter((c: any) => c.status === "RECEIVED").length + 1,
          adminComment: null,
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem("mock_complaints", JSON.stringify([...savedData, newComplaint]));
        navigate(-1);
      } catch (error) {
        alert("민원 접수 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }, 800);
  }, [title, content, category, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (imageFiles.length + newFiles.length > 5) return alert("최대 5장까지 첨부 가능합니다.");
      setImageFiles([...imageFiles, ...newFiles]);
      setPreviews([...previews, ...newFiles.map(file => URL.createObjectURL(file))]);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  if (!isLoggedIn) return null;

  return (
    <div className="bg-[#f6fbff] min-h-screen w-full max-w-[448px] mx-auto flex flex-col shadow-2xl relative animate-in fade-in duration-500 antialiased font-sans">
      
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
      <div className="flex-1 px-6 pt-6 pb-40 space-y-7 overflow-y-auto">
        
        {/* 1. 카테고리 선택 */}
        <div className="space-y-2 relative">
          <label className="text-[11px] font-black text-[#829496] uppercase tracking-widest ml-1 flex items-center">
            카테고리 <span className="text-red-500 ml-1">*</span>
          </label>
          <button 
            type="button" 
            onClick={() => setOpenSelect(!openSelect)} 
            className={`w-full bg-white border border-[#eef6f7] transition-all duration-300 rounded-[22px] px-5 h-[60px] flex items-center justify-between shadow-sm ${
              openSelect ? 'border-[#5eb9ca] shadow-lg shadow-[#5eb9ca]/10' : ''
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
              onClick={() => fileInputRef.current?.click()} 
              className="aspect-square bg-white border border-[#eef6f7] rounded-[20px] flex flex-col items-center justify-center text-[#5eb9ca] hover:border-[#5eb9ca] hover:bg-[#f8fbff] transition-all group shadow-sm"
            >
              <ImagePlus size={24} />
              <span className="text-[9px] font-black mt-1.5 uppercase">추가하기</span>
            </button>
            {previews.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-[20px] overflow-hidden border border-[#eef6f7] shadow-sm animate-in zoom-in-95">
                <img src={src} className="w-full h-full object-cover" alt="preview" />
                <button onClick={() => removeImage(i)} className="absolute top-1.5 right-1.5 bg-black/40 backdrop-blur-md rounded-full p-1 text-white hover:bg-red-500 transition-colors">
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