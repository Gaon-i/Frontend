import { useState, useEffect, useCallback } from "react";
import {
    FileText, Loader2, ChevronRight,
    Calendar, Link as LinkIcon, Tag, Eye, EyeOff,
    AlertCircle, LayoutGrid, Info, X, Globe, Clipboard,
    DoorOpen, Coffee, Building2, ScrollText, Bell, Tv2,
    Wrench, Plug, ClipboardList, Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import AdminLayout from "../components/AdminLayout";

// ─── 타입 ─────────────────────────────────────────────────

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

interface DetailModalProps {
    doc: RegulationDocument;
    onClose: () => void;
}

interface AlertState {
    show: boolean;
    title: string;
    message: string;
}

// ─── 상수 ─────────────────────────────────────────────────

const ALL_CATEGORY = "__ALL__";

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
    "입·퇴사안내": DoorOpen,
    "입퇴사 안내": DoorOpen,
    "생활 정보": Coffee,
    "생활관 소개": Building2,
    "생활관안내": Building2,
    "생활관 수칙": ScrollText,
    "생활관 편의시설": Tv2,
    "편의시설": Plug,
    "시설안내": Wrench,
    "생활관 이용안내": ClipboardList,
    "공지": Bell,
    "안내": Bell,
};

const CATEGORY_BTN_BASE =
    "flex items-center gap-2 rounded-[16px] px-6 py-3 text-[14px] font-bold shadow-sm transition-all";

const DUMMY_CATEGORIES: CategoryItem[] = [
    { category: "입·퇴사안내", document_count: 3 },
    { category: "생활 정보", document_count: 5 },
    { category: "생활관 수칙", document_count: 4 },
    { category: "시설안내", document_count: 2 },
    { category: "공지", document_count: 6 },
];

const DUMMY_DOCUMENTS: RegulationDocument[] = [
    {
        regulation_document_id: 1,
        document_id: "DOC-001",
        document_version: "v1.0",
        category: "입·퇴사안내",
        dormitory: null,
        title: "2025년 입사 안내문",
        content: "입사 절차 및 준비물 안내입니다.\n1. 입사 신청서 제출\n2. 보증금 납부\n3. 생활관 규칙 숙지",
        source: "학생생활관 공식 홈페이지",
        source_url: "https://dorm.gachon.ac.kr",
        keywords: ["입사", "신청", "보증금"],
        source_type: "OFFICIAL",
        is_active: true,
        created_at: "2025-01-10T09:00:00",
        updated_at: "2025-03-01T09:00:00",
    },
    {
        regulation_document_id: 2,
        document_id: "DOC-002",
        document_version: "v2.1",
        category: "생활관 수칙",
        dormitory: "제1학생생활관",
        title: "생활관 공동생활 수칙",
        content: "공동생활 수칙을 준수하여 쾌적한 환경을 유지합니다.\n1. 취침 시간 준수\n2. 소음 금지\n3. 공용 공간 청결 유지",
        source: null,
        source_url: null,
        keywords: ["수칙", "소음", "청결"],
        source_type: "INTERNAL",
        is_active: true,
        created_at: "2025-02-01T10:00:00",
        updated_at: "2025-04-01T10:00:00",
    },
    {
        regulation_document_id: 3,
        document_id: "DOC-003",
        document_version: "v1.3",
        category: "시설안내",
        dormitory: null,
        title: "세탁실 이용 안내",
        content: "세탁실 운영 시간 및 이용 방법을 안내합니다.\n운영 시간: 07:00 ~ 23:00\n세탁기 1회 사용 요금: 1,000원",
        source: null,
        source_url: null,
        keywords: ["세탁", "세탁기", "이용"],
        source_type: "INTERNAL",
        is_active: false,
        created_at: "2025-01-15T11:00:00",
        updated_at: "2025-02-15T11:00:00",
    },
    {
        regulation_document_id: 4,
        document_id: "DOC-004",
        document_version: "v1.0",
        category: "공지",
        dormitory: null,
        title: "2025년 1학기 생활관비 납부 안내",
        content: "생활관비 납부 기간 및 방법을 안내합니다.\n납부 기간: 2025.02.01 ~ 2025.02.28\n납부 방법: 학교 포털 > 생활관 > 비용 납부",
        source: null,
        source_url: null,
        keywords: ["생활관비", "납부", "포털"],
        source_type: "OFFICIAL",
        is_active: true,
        created_at: "2025-01-20T12:00:00",
        updated_at: "2025-01-20T12:00:00",
    },
    {
        regulation_document_id: 5,
        document_id: "DOC-005",
        document_version: "v1.1",
        category: "생활 정보",
        dormitory: "제2학생생활관",
        title: "식당 운영 안내",
        content: "식당 운영 시간 및 메뉴 안내입니다.\n조식: 07:30 ~ 09:00\n중식: 11:30 ~ 13:30\n석식: 17:30 ~ 19:00",
        source: null,
        source_url: null,
        keywords: ["식당", "식사", "운영시간"],
        source_type: "INTERNAL",
        is_active: true,
        created_at: "2025-03-01T08:00:00",
        updated_at: "2025-05-01T08:00:00",
    },
];
// ─── 유틸 ─────────────────────────────────────────────────

function getCategoryIcon(category: string): LucideIcon {
    if (CATEGORY_ICON_MAP[category]) return CATEGORY_ICON_MAP[category];
    for (const [key, Icon] of Object.entries(CATEGORY_ICON_MAP)) {
        if (category.includes(key) || key.includes(category)) return Icon;
    }
    return LayoutGrid;
}

// ─── 커스텀 훅 ─────────────────────────────────────────────

function useAlert() {
    const [alert, setAlert] = useState<AlertState>({ show: false, title: "", message: "" });

    const triggerAlert = useCallback((title: string, message: string) => {
        setAlert({ show: true, title, message });
    }, []);

    const closeAlert = useCallback(() => {
        setAlert(prev => ({ ...prev, show: false }));
    }, []);

    return { alert, triggerAlert, closeAlert };
}

// ─── 서브 컴포넌트 ─────────────────────────────────────────

function RegulationDetailModal({ doc, onClose }: DetailModalProps) {
    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-nav-primary/40 backdrop-blur-[8px]" />
            <div
                className="animate-in fade-in zoom-in duration-300 relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* ── 헤더 ── */}
                <div className="flex shrink-0 items-center justify-between border-b border-nav-inactive/20 bg-white px-8 py-6">
                    <div>
                        <h2 className="text-[22px] font-bold text-nav-primary">규정 상세 정보</h2>
                        <p className="mt-1 text-[12px] text-nav-inactive">
                            문서 코드: {doc.document_id} • 버전: {doc.document_version}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="닫기"
                        className="rounded-full p-2 text-nav-inactive transition-all hover:bg-[#f0f9ff] hover:text-nav-primary"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* ── 바디 ── */}
                <div className="flex-1 space-y-8 overflow-y-auto p-8">
                    <section>
                        <h3 className="mb-3 flex items-center gap-2 text-[14px] font-bold text-nav-primary">
                            <Clipboard size={16} className="text-nav-accent" /> 규정 명칭
                        </h3>
                        <div className="rounded-[16px] border border-nav-inactive/20 bg-[#f0f9ff] p-4 text-[15px] font-semibold text-nav-primary">
                            {doc.title}
                        </div>
                    </section>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <section>
                            <h3 className="mb-3 text-[14px] font-bold text-nav-primary">적용 대상 / 위치</h3>
                            <div className="flex flex-wrap gap-2">
                                <span className="rounded-lg bg-nav-accent/10 px-3 py-1.5 text-[13px] font-bold text-nav-accent">
                                    {doc.category.toUpperCase()}
                                </span>
                                <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-[13px] font-bold text-gray-500">
                                    {doc.dormitory || "전체 생활관"}
                                </span>
                            </div>
                        </section>
                        <section>
                            <h3 className="mb-3 text-[14px] font-bold text-nav-primary">데이터 속성</h3>
                            <div className="flex gap-2">
                                <span className="rounded-lg bg-orange-50 px-3 py-1.5 text-[13px] font-bold text-orange-600">
                                    {doc.source_type}
                                </span>
                                <span className={`rounded-lg px-3 py-1.5 text-[13px] font-bold ${doc.is_active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-400"
                                    }`}>
                                    {doc.is_active ? "현재 활성" : "비활성 상태"}
                                </span>
                            </div>
                        </section>
                    </div>

                    <section>
                        <h3 className="mb-3 flex items-center gap-2 text-[14px] font-bold text-nav-primary">
                            <FileText size={16} className="text-nav-accent" /> 규정 본문 내용
                        </h3>
                        <div className="min-h-[200px] whitespace-pre-wrap rounded-[24px] border border-nav-inactive/20 bg-white p-6 text-[14px] leading-[1.7] text-nav-primary/70 shadow-sm">
                            {doc.content}
                        </div>
                    </section>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                        {doc.source_url && (
                            <section>
                                <h3 className="mb-3 flex items-center gap-2 text-[14px] font-bold text-nav-primary">
                                    <Globe size={16} className="text-nav-accent" /> 원문 출처
                                </h3>
                                <a
                                    href={doc.source_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex w-full items-center gap-2 rounded-[12px] bg-nav-active-bg-from p-3 text-[13px] font-medium text-nav-accent transition-all hover:bg-nav-accent hover:text-white"
                                >
                                    <LinkIcon size={14} />
                                    <span className="truncate">{doc.source || "원문 링크 바로가기"}</span>
                                </a>
                            </section>
                        )}

                        <section>
                            <h3 className="mb-3 flex items-center gap-2 text-[14px] font-bold text-nav-primary">
                                <Tag size={16} className="text-nav-accent" /> 검색 키워드
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {doc.keywords && doc.keywords.length > 0 ? (
                                    doc.keywords.map(tag => (
                                        <span
                                            key={tag}
                                            className="rounded-full border border-nav-inactive/20 bg-[#f0f9ff] px-3 py-1 text-[12px] text-nav-accent"
                                        >
                                            #{tag}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-[12px] text-nav-inactive">설정된 키워드 없음</span>
                                )}
                            </div>
                        </section>
                    </div>
                </div>

                {/* ── 푸터 ── */}
                <div className="shrink-0 border-t border-nav-inactive/20 bg-[#f0f9ff] p-6">
                    <button
                        onClick={onClose}
                        className="w-full rounded-[20px] bg-nav-accent py-4 font-bold text-white shadow-lg transition-all hover:bg-nav-accent/90 active:scale-[0.98]"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────

export default function AdminRegulations() {
    const { alert, triggerAlert, closeAlert } = useAlert();

    const [categories, setCategories] = useState<CategoryItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORY);
    const [documents, setDocuments] = useState<RegulationDocument[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<RegulationDocument | null>(null);

    const fetchCategories = useCallback(() => {
        setCategories(DUMMY_CATEGORIES);
    }, []);

    const fetchDocuments = useCallback((category: string) => {
        setLoading(true);
        const filtered = category === ALL_CATEGORY
            ? DUMMY_DOCUMENTS
            : DUMMY_DOCUMENTS.filter(d => d.category === category);
        setDocuments(filtered);
        setLoading(false);
    }, []);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);
    useEffect(() => { fetchDocuments(selectedCategory); }, [selectedCategory, fetchDocuments]);

    const totalCount = categories.reduce((sum, c) => sum + c.document_count, 0);

    return (
        <AdminLayout>
            <div className="min-h-screen w-full overflow-x-hidden bg-[#f0f9ff]">

                {/* ── 페이지 헤더 ── */}
                <div className="border-b border-nav-inactive/20 bg-white px-8 py-6">
                    <h1 className="text-[32px] font-bold text-nav-primary">규정 문서 관리</h1>
                    <p className="mt-1 text-[14px] text-nav-inactive">
                        기숙사 운영 규정 및 안내 문서를 카테고리별로 관리하세요.
                    </p>
                </div>

                <div className="min-w-0 p-8">

                    {/* ── 카테고리 선택 ── */}
                    <div className="mb-8 flex flex-wrap gap-3">
                        <button
                            onClick={() => setSelectedCategory(ALL_CATEGORY)}
                            className={`${CATEGORY_BTN_BASE} ${selectedCategory === ALL_CATEGORY
                                ? "bg-nav-accent text-white"
                                : "bg-white text-nav-inactive hover:bg-[#f0f9ff] hover:text-nav-accent"
                                }`}
                        >
                            <LayoutGrid size={15} />
                            전체
                            <span className={`rounded-full px-2 py-0.5 text-[11px] ${selectedCategory === ALL_CATEGORY ? "bg-white/20" : "bg-nav-active-bg-from"
                                }`}>
                                {totalCount}
                            </span>
                        </button>

                        {categories.map(item => {
                            const Icon = getCategoryIcon(item.category);
                            const isSelected = selectedCategory === item.category;
                            return (
                                <button
                                    key={item.category}
                                    onClick={() => setSelectedCategory(item.category)}
                                    className={`${CATEGORY_BTN_BASE} ${isSelected
                                        ? "bg-nav-accent text-white"
                                        : "bg-white text-nav-inactive hover:bg-[#f0f9ff] hover:text-nav-accent"
                                        }`}
                                >
                                    <Icon size={15} />
                                    {item.category}
                                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${isSelected ? "bg-white/20" : "bg-nav-active-bg-from"
                                        }`}>
                                        {item.document_count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* ── 문서 테이블 ── */}
                    <div className="overflow-hidden rounded-[24px] border border-[#f1f5f9] bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1100px] table-fixed">
                                <thead className="bg-[#f0f9ff]">
                                    <tr>
                                        <th className="w-[300px] px-6 py-4 text-left text-[13px] font-semibold text-nav-inactive">문서 제목</th>
                                        <th className="w-[120px] px-6 py-4 text-left text-[13px] font-semibold text-nav-inactive">버전</th>
                                        <th className="w-[150px] px-6 py-4 text-left text-[13px] font-semibold text-nav-inactive">생활관</th>
                                        <th className="w-[120px] px-6 py-4 text-left text-[13px] font-semibold text-nav-inactive">상태</th>
                                        <th className="w-[180px] px-6 py-4 text-left text-[13px] font-semibold text-nav-inactive">수정일</th>
                                        <th className="w-[100px] px-6 py-4 text-right text-[13px] font-semibold text-nav-inactive">상세</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-nav-inactive/20">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="py-20 text-center">
                                                <Loader2 className="mx-auto animate-spin text-nav-accent" />
                                            </td>
                                        </tr>
                                    ) : documents.length > 0 ? (
                                        documents.map(doc => (
                                            <tr
                                                key={doc.regulation_document_id}
                                                onClick={() => setSelectedDoc(doc)}
                                                className="group cursor-pointer transition-colors hover:bg-[#f0f9ff]"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-0.5 rounded-lg bg-nav-active-bg-from p-2 text-nav-accent transition-colors group-hover:bg-nav-accent group-hover:text-white">
                                                            <FileText size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="line-clamp-1 text-[14px] font-bold text-nav-primary">{doc.title}</p>
                                                            <p className="mt-0.5 text-[11px] text-nav-inactive">{doc.document_id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[13px] font-medium text-nav-primary">{doc.document_version}</span>
                                                        <span className="text-[11px] text-nav-inactive">{doc.source_type}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-[13px] text-nav-primary">
                                                    {doc.dormitory || "전체"}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${doc.is_active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
                                                        }`}>
                                                        {doc.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                                                        {doc.is_active ? "활성" : "비활성"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-[13px] text-nav-inactive">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={14} />
                                                        {new Date(doc.updated_at).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="rounded-lg p-2 text-nav-inactive transition-all group-hover:bg-nav-active-bg-from group-hover:text-nav-accent">
                                                        <ChevronRight size={20} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="py-20 text-center text-nav-inactive">
                                                해당 카테고리에 등록된 문서가 없습니다.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ── 안내 카드 ── */}
                    <div className="mt-6 flex items-center gap-3 rounded-[16px] border border-nav-accent/20 bg-nav-active-bg-from p-4">
                        <Info className="text-nav-accent" size={20} />
                        <p className="text-[13px] font-medium text-nav-accent">
                            현재 활성화된 문서(is_active = true)만 챗봇 상담 및 학생 페이지에 노출됩니다.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── 상세 모달 ── */}
            {selectedDoc && (
                <RegulationDetailModal
                    doc={selectedDoc}
                    onClose={() => setSelectedDoc(null)}
                />
            )}

            {/* ── 알림 모달 (다른 파일과 동일한 중앙 모달로 통일) ── */}
            {alert.show && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="alert-title"
                    className="fixed inset-0 z-[100] flex items-center justify-center px-8"
                    onClick={closeAlert}
                >
                    <div className="absolute inset-0 bg-nav-primary/20 backdrop-blur-[3px]" aria-hidden="true" />
                    <div
                        className="relative w-full max-w-[320px] animate-in fade-in zoom-in duration-200 rounded-[28px] bg-white p-7 shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-nav-active-bg-from">
                                <AlertCircle className="text-nav-accent" size={28} aria-hidden="true" />
                            </div>
                            <h2 id="alert-title" className="mb-2 text-[17px] font-bold text-nav-primary">
                                {alert.title}
                            </h2>
                            <p className="mb-6 whitespace-pre-wrap text-[14px] font-medium leading-relaxed text-nav-accent">
                                {alert.message}
                            </p>
                            <button
                                onClick={closeAlert}
                                className="h-[50px] w-full rounded-[18px] bg-nav-accent font-bold text-white shadow-md transition-all active:scale-[0.96]"
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}