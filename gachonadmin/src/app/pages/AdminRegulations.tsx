import { useState, useEffect, useCallback } from "react";
import {
  FileText, Search, Loader2, ChevronRight, 
  Calendar, Link as LinkIcon, Tag, Eye, EyeOff,
  AlertCircle, LayoutGrid, Info, X, Globe, Clipboard
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import api from "../api/axios";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CategoryItem {
  category: string;
  document_count: number;
}

interface RegulationDocument {
  regulation_document_id: number;
  document_id: string;
  document_version: string;
  category: string;
  dormitory: string | null;
  title: string;
  content: string;
  source: string | null;
  source_url: string | null;
  keywords: string[] | null;
  source_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  error_code: string | null;
}

// ─── RegulationDetailModal ───────────────────────────────────────────────────

interface DetailModalProps {
  doc: RegulationDocument;
  onClose: () => void;
}

function RegulationDetailModal({ doc, onClose }: DetailModalProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#054a57]/40 backdrop-blur-[8px]" />
      
      {/* Modal Content */}
      <div 
        className="relative bg-white rounded-[32px] max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-[#e5f4f5] flex items-center justify-between bg-white shrink-0">
          <div>
            <h2 className="font-bold text-[22px] text-[#054a57]">규정 상세 정보</h2>
            <p className="text-[12px] text-[#92a4a6] mt-1">
              문서 코드: {doc.document_id} • 버전: {doc.document_version}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-[#f6fbff] rounded-full transition-all text-[#adc0c2] hover:text-[#054a57]"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {/* Title Section */}
          <section>
            <h3 className="text-[14px] font-bold text-[#054a57] mb-3 flex items-center gap-2">
              <Clipboard size={16} className="text-[#5eb9ca]" /> 규정 명칭
            </h3>
            <div className="p-4 bg-[#f6fbff] rounded-[16px] text-[#054a57] font-semibold border border-[#e5f4f5] text-[15px]">
              {doc.title}
            </div>
          </section>

          {/* Meta Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section>
              <h3 className="text-[14px] font-bold text-[#054a57] mb-3">적용 대상 / 위치</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-[#5eb9ca]/10 text-[#5eb9ca] rounded-lg text-[13px] font-bold">
                  {doc.category.toUpperCase()}
                </span>
                <span className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-[13px] font-bold">
                  {doc.dormitory || "전체 생활관"}
                </span>
              </div>
            </section>
            <section>
              <h3 className="text-[14px] font-bold text-[#054a57] mb-3">데이터 속성</h3>
              <div className="flex gap-2">
                <span className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-[13px] font-bold">
                  {doc.source_type}
                </span>
                <span className={`px-3 py-1.5 rounded-lg text-[13px] font-bold ${
                  doc.is_active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-400"
                }`}>
                  {doc.is_active ? "현재 활성" : "비활성 상태"}
                </span>
              </div>
            </section>
          </div>

          {/* Content Section */}
          <section>
            <h3 className="text-[14px] font-bold text-[#054a57] mb-3 flex items-center gap-2">
              <FileText size={16} className="text-[#5eb9ca]" /> 규정 본문 내용
            </h3>
            <div className="p-6 bg-white border border-[#e5f4f5] rounded-[24px] text-[14px] text-[#475569] leading-[1.7] whitespace-pre-wrap min-h-[200px] shadow-sm">
              {doc.content}
            </div>
          </section>

          {/* Source & Keywords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {doc.source_url && (
              <section>
                <h3 className="text-[14px] font-bold text-[#054a57] mb-3 flex items-center gap-2">
                  <Globe size={16} className="text-[#5eb9ca]" /> 원문 출처
                </h3>
                <a 
                  href={doc.source_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 p-3 bg-[#f0f9fa] text-[#5eb9ca] rounded-[12px] text-[13px] font-medium hover:bg-[#5eb9ca] hover:text-white transition-all w-full"
                >
                  <LinkIcon size={14} />
                  <span className="truncate">{doc.source || "원문 링크 바로가기"}</span>
                </a>
              </section>
            )}

            <section>
              <h3 className="text-[14px] font-bold text-[#054a57] mb-3 flex items-center gap-2">
                <Tag size={16} className="text-[#5eb9ca]" /> 검색 키워드
              </h3>
              <div className="flex flex-wrap gap-2">
                {doc.keywords && doc.keywords.length > 0 ? (
                  doc.keywords.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 bg-[#f6fbff] text-[#7aaeb7] border border-[#e5f4f5] rounded-full text-[12px]">
                      #{tag}
                    </span>
                  ))
                ) : (
                  <span className="text-[12px] text-[#adc0c2]">설정된 키워드 없음</span>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-[#f6fbff] border-t border-[#e5f4f5] shrink-0">
          <button
            onClick={onClose}
            className="w-full py-4 bg-[#054a57] text-white font-bold rounded-[20px] hover:bg-[#073a44] transition-all shadow-lg active:scale-[0.98]"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AdminRegulations() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [documents, setDocuments] = useState<RegulationDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<RegulationDocument | null>(null);

  // 1. 카테고리 목록 가져오기
  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await api.get<ApiResponse<{ items: CategoryItem[] }>>(
        "/regulations/categories"
      );
      if (data.status === 200) {
        setCategories(data.data.items);
        if (data.data.items.length > 0 && !selectedCategory) {
          setSelectedCategory(data.data.items[0].category);
        }
      }
    } catch (err) {
      setError("카테고리 목록을 불러오는 중 오류가 발생했습니다.");
    }
  }, [selectedCategory]);

  // 2. 특정 카테고리의 문서 목록 가져오기
  const fetchDocuments = useCallback(async (category: string) => {
    if (!category) return;
    setLoading(true);
    try {
      const { data } = await api.get<ApiResponse<{ items: RegulationDocument[] }>>(
        "/regulations",
        { params: { category } }
      );
      if (data.status === 200) {
        setDocuments(data.data.items);
      }
    } catch (err) {
      setError("문서 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (selectedCategory) {
      fetchDocuments(selectedCategory);
    }
  }, [selectedCategory, fetchDocuments]);

  return (
    <AdminLayout>
      <div className="bg-[#f6fbff] min-h-screen w-full overflow-x-hidden">
        
        {/* ── Page Header ───────────────────────────────────────────────── */}
        <div className="bg-white border-b border-[#e5f4f5] px-8 py-6">
          <h1 className="font-bold text-[32px] text-[#054a57]">규정 문서 관리</h1>
          <p className="text-[14px] text-[#92a4a6] mt-1">
            기숙사 운영 규정 및 안내 문서를 카테고리별로 관리하세요.
          </p>
        </div>

        <div className="p-8 min-w-0">
          
          {/* ── Category Selector ────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-3 mb-8">
            {categories.map((item) => (
              <button
                key={item.category}
                onClick={() => setSelectedCategory(item.category)}
                className={`px-6 py-3 rounded-[16px] font-bold text-[14px] transition-all flex items-center gap-2 shadow-sm ${
                  selectedCategory === item.category
                    ? "bg-[#5eb9ca] text-white"
                    : "bg-white text-[#92a4a6] hover:bg-[#f0f9fa] hover:text-[#5eb9ca]"
                }`}
              >
                <LayoutGrid size={16} />
                {item.category.toUpperCase()}
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                  selectedCategory === item.category ? "bg-white/20" : "bg-[#f6fbff]"
                }`}>
                  {item.document_count}
                </span>
              </button>
            ))}
          </div>

          {/* ── Document Table ───────────────────────────────────────────── */}
          <div className="bg-white rounded-[24px] shadow-sm border border-[#f1f5f9] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] table-fixed">
                <thead className="bg-[#f6fbff]">
                  <tr>
                    <th className="px-6 py-4 text-left w-[300px] text-[#92a4a6] font-semibold text-[13px]">문서 제목 / ID</th>
                    <th className="px-6 py-4 text-left w-[120px] text-[#92a4a6] font-semibold text-[13px]">버전 / 타입</th>
                    <th className="px-6 py-4 text-left w-[150px] text-[#92a4a6] font-semibold text-[13px]">생활관</th>
                    <th className="px-6 py-4 text-left w-[120px] text-[#92a4a6] font-semibold text-[13px]">상태</th>
                    <th className="px-6 py-4 text-left w-[180px] text-[#92a4a6] font-semibold text-[13px]">최종 수정일</th>
                    <th className="px-6 py-4 text-right w-[100px] text-[#92a4a6] font-semibold text-[13px]">상세</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5f4f5]">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center">
                        <Loader2 className="animate-spin mx-auto text-[#5eb9ca]" />
                      </td>
                    </tr>
                  ) : documents.length > 0 ? (
                    documents.map((doc) => (
                      <tr 
                        key={doc.regulation_document_id} 
                        onClick={() => setSelectedDoc(doc)}
                        className="hover:bg-[#f6fbff] transition-colors group cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <div className="bg-[#f0f7f8] p-2 rounded-lg text-[#5eb9ca] mt-0.5 transition-colors group-hover:bg-[#5eb9ca] group-hover:text-white">
                              <FileText size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-[14px] text-[#054a57] line-clamp-1">{doc.title}</p>
                              <p className="text-[11px] text-[#adc0c2] mt-0.5">{doc.document_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-[13px] font-medium text-[#054a57]">{doc.document_version}</span>
                            <span className="text-[11px] text-[#92a4a6]">{doc.source_type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[13px] text-[#054a57]">
                          {doc.dormitory || "전체"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 w-fit ${
                            doc.is_active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
                          }`}>
                            {doc.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                            {doc.is_active ? "활성" : "비활성"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[13px] text-[#92a4a6]">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            {new Date(doc.updated_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-2 text-[#adc0c2] group-hover:text-[#5eb9ca] group-hover:bg-[#f0f9fa] rounded-lg transition-all">
                            <ChevronRight size={20} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-[#92a4a6]">
                        해당 카테고리에 등록된 문서가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Info Card ────────────────────────────────────────────────── */}
          <div className="mt-6 flex items-center gap-3 p-4 bg-[#f0f9ff] rounded-[16px] border border-[#5eb9ca]/20">
            <Info className="text-[#5eb9ca]" size={20} />
            <p className="text-[13px] text-[#7aaeb7] font-medium">
              현재 활성화된 문서(is_active = true)만 챗봇 상담 및 학생 페이지에 노출됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* ── Modals & Alerts ─────────────────────────────────────────────── */}
      
      {/* 상세 보기 모달 */}
      {selectedDoc && (
        <RegulationDetailModal 
          doc={selectedDoc} 
          onClose={() => setSelectedDoc(null)} 
        />
      )}

      {/* 에러 알럿 */}
      {error && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-right-10 duration-300">
          <div className="bg-white border-l-4 border-red-500 shadow-2xl rounded-[16px] p-5 flex items-center gap-4">
            <div className="bg-red-50 p-2 rounded-full text-red-500">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="font-bold text-[#054a57] text-[15px]">데이터 오류</p>
              <p className="text-[13px] text-[#92a4a6]">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-4 text-[#adc0c2] hover:text-[#054a57]">
              확인
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}