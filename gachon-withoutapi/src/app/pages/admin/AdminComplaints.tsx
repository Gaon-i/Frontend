import { useState } from "react";
import { Search, Filter, Clock, CheckCircle, XCircle, AlertCircle, Building2, User, Info } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";

interface Complaint {
  id: number;
  title: string;
  student: string;
  studentId: string;
  building: string;
  room: string;
  category: string;
  status: "대기중" | "완료";
  content: string;
  date: string;
  time: string;
  response?: string;
}

export default function AdminComplaints() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("전체");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [response, setResponse] = useState("");
  const [isEditingResponse, setIsEditingResponse] = useState(false);
  
  // 커스텀 알림창 상태
  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean; message: string } | null>(null);

  const [complaints, setComplaints] = useState<Complaint[]>([
    {
      id: 1,
      title: "세탁기 고장",
      student: "홍길동",
      studentId: "202012345",
      building: "제1학생생활관",
      room: "523호",
      category: "시설",
      status: "대기중",
      content: "3층 세탁실의 2번 세탁기가 작동하지 않습니다. 전원은 들어오는데 세탁이 시작되지 않습니다.",
      date: "2026.03.18",
      time: "10분 전",
    },
    {
      id: 2,
      title: "에어컨 작동 불량",
      student: "김철수",
      studentId: "202011234",
      building: "제2학생생활관",
      room: "412호",
      category: "시설",
      status: "대기중",
      content: "방 에어컨이 시원하지 않고 소음이 심합니다. 확인 부탁드립니다.",
      date: "2026.03.18",
      time: "1시간 전",
    },
    {
      id: 3,
      title: "냉장고 소음",
      student: "이영희",
      studentId: "202013456",
      building: "제1학생생활관",
      room: "621호",
      category: "시설",
      status: "완료",
      content: "냉장고에서 이상한 소음이 계속 발생합니다.",
      date: "2026.03.17",
      time: "2시간 전",
      response: "냉장고를 점검하였으며, 소음 문제를 해결하였습니다. 추가 문제 발생시 다시 민원을 접수해 주세요.",
    },
    {
      id: 4,
      title: "인터넷 연결 불가",
      student: "박민수",
      studentId: "202014567",
      building: "제3학생생활관",
      room: "315호",
      category: "네트워크",
      status: "대기중",
      content: "방에서 인터넷이 전혀 연결되지 않습니다. 급하게 과제를 해야 하는데 도움 부탁드립니다.",
      date: "2026.03.17",
      time: "3시간 전",
    },
    {
      id: 5,
      title: "소음 문제",
      student: "정수진",
      studentId: "202015678",
      building: "제2학생생활관",
      room: "518호",
      category: "생활",
      status: "대기중",
      content: "옆방에서 밤늦게까지 소음이 심합니다.",
      date: "2026.03.17",
      time: "5시간 전",
    },
    {
      id: 6,
      title: "전등 고장",
      student: "최지원",
      studentId: "202016789",
      building: "제1학생생활관",
      room: "234호",
      category: "시설",
      status: "완료",
      content: "방 전등이 깜빡거립니다.",
      date: "2026.03.16",
      time: "1일 전",
      response: "전등을 새것으로 교체하였습니다.",
    },
  ]);

  const showAlert = (message: string) => {
    setAlertConfig({ isOpen: true, message });
  };

  const filteredComplaints = complaints.filter((complaint) => {
    const matchesSearch =
      complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.studentId.includes(searchQuery);
    const matchesFilter = filterStatus === "전체" || complaint.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const statusCounts = {
    전체: complaints.length,
    대기중: complaints.filter((c) => c.status === "대기중").length,
    완료: complaints.filter((c) => c.status === "완료").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "대기중": return "bg-[#ff9f43]/10 text-[#ff9f43]";
      case "완료": return "bg-[#28c76f]/10 text-[#28c76f]";
      default: return "";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "대기중": return Clock;
      case "완료": return CheckCircle;
      default: return Clock;
    }
  };

  const handleSaveResponse = () => {
    if (!selectedComplaint) return;
    if (!response.trim()) {
      showAlert("답변 내용을 입력해주세요.");
      return;
    }

    setComplaints(prevComplaints =>
      prevComplaints.map(c =>
        c.id === selectedComplaint.id
          ? { ...c, status: "완료" as const, response: response }
          : c
      )
    );

    showAlert(isEditingResponse 
      ? `민원 #${selectedComplaint.id}의 답변이 수정되었습니다.` 
      : `민원 #${selectedComplaint.id}의 답변이 저장되고 완료 처리되었습니다.`
    );
    
    setResponse("");
    setIsEditingResponse(false);
    setSelectedComplaint(null);
  };

  const handleEditResponse = () => {
    if (selectedComplaint?.response) {
      setResponse(selectedComplaint.response);
      setIsEditingResponse(true);
    }
  };

  return (
    <AdminLayout>
      <div className="bg-[#f6fbff] min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-[#e5f4f5] px-8 py-6">
          <h1 className="font-['Pretendard:Bold',sans-serif] text-[32px] text-[#054a57]">
            민원 관리
          </h1>
          <p className="font-['Pretendard:Medium',sans-serif] text-[14px] text-[#92a4a6] mt-1">
            학생들의 민원을 확인하고 처리하세요
          </p>
        </div>

        <div className="p-8">
          {/* Search and Filter */}
          <div className="bg-white rounded-[16px] p-6 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#92a4a6]" />
                <input
                  type="text"
                  placeholder="민원 제목, 학생 이름 또는 학번으로 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[#f6fbff] border-2 border-transparent rounded-[12px] font-['Pretendard:Medium',sans-serif] text-[14px] text-[#054a57] placeholder:text-[#c7d4d5] focus:border-[#5eb9ca] focus:bg-white focus:outline-none"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-[12px] whitespace-nowrap transition-all ${
                      filterStatus === status
                        ? "bg-[#5eb9ca] text-white shadow-lg shadow-[#5eb9ca]/30"
                        : "bg-[#f6fbff] text-[#92a4a6] hover:bg-[#e5f4f5]"
                    }`}
                  >
                    <Filter className="size-4" />
                    <span className="font-['Pretendard:SemiBold',sans-serif] text-[14px]">
                      {status}
                    </span>
                    <span className={`font-['Pretendard:Bold',sans-serif] text-[12px] px-2 py-0.5 rounded-[6px] ${
                      filterStatus === status ? "bg-white/20" : "bg-white"
                    }`}>
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Complaints Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredComplaints.map((complaint) => {
              const StatusIcon = getStatusIcon(complaint.status);
              return (
                <div
                  key={complaint.id}
                  onClick={() => setSelectedComplaint(complaint)}
                  className="bg-white rounded-[16px] p-6 shadow-sm hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`font-['Pretendard:Medium',sans-serif] text-[12px] px-3 py-1.5 rounded-[8px] ${getStatusColor(complaint.status)}`}>
                        {complaint.status}
                      </span>
                    </div>
                    <div className={`size-8 rounded-[8px] flex items-center justify-center ${getStatusColor(complaint.status)}`}>
                      <StatusIcon className="size-4" />
                    </div>
                  </div>

                  <h3 className="font-['Pretendard:Bold',sans-serif] text-[18px] text-[#054a57] mb-3">
                    {complaint.title}
                  </h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <User className="size-4 text-[#92a4a6]" />
                      <p className="font-['Pretendard:Medium',sans-serif] text-[13px] text-[#92a4a6]">
                        {complaint.student} ({complaint.studentId})
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="size-4 text-[#92a4a6]" />
                      <p className="font-['Pretendard:Medium',sans-serif] text-[13px] text-[#92a4a6]">
                        {complaint.building} {complaint.room}
                      </p>
                    </div>
                  </div>

                  <p className="font-['Pretendard:Medium',sans-serif] text-[13px] text-[#054a57] line-clamp-2 mb-4">
                    {complaint.content}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-[#e5f4f5]">
                    <span className="font-['Pretendard:Medium',sans-serif] text-[12px] text-[#92a4a6]">
                      {complaint.date}
                    </span>
                    <span className="font-['Pretendard:SemiBold',sans-serif] text-[12px] text-[#5eb9ca]">
                      {complaint.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredComplaints.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-[16px] border-2 border-dashed border-[#e5f4f5]">
              <AlertCircle className="size-12 text-[#c7d4d5] mb-4" />
              <p className="text-[#92a4a6] font-medium">해당하는 민원 내역이 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedComplaint && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => {
            setSelectedComplaint(null);
            setIsEditingResponse(false);
            setResponse("");
          }}
        >
          <div 
            className="bg-white rounded-[20px] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`font-['Pretendard:Medium',sans-serif] text-[12px] px-3 py-1.5 rounded-[8px] ${getStatusColor(selectedComplaint.status)}`}>
                      {selectedComplaint.status}
                    </span>
                    <span className="font-['Pretendard:Medium',sans-serif] text-[12px] px-3 py-1.5 rounded-[8px] bg-[#e5f4f5] text-[#5eb9ca]">
                      {selectedComplaint.category}
                    </span>
                  </div>
                  <h2 className="font-['Pretendard:Bold',sans-serif] text-[24px] text-[#054a57]">
                    {selectedComplaint.title}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setSelectedComplaint(null);
                    setIsEditingResponse(false);
                    setResponse("");
                  }}
                  className="text-[#92a4a6] hover:text-[#054a57] text-[24px] transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-[#f6fbff] rounded-[12px] p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <User className="size-5 text-[#5eb9ca]" />
                    <div>
                      <p className="font-['Pretendard:Medium',sans-serif] text-[11px] text-[#92a4a6]">신청 학생</p>
                      <p className="font-['Pretendard:SemiBold',sans-serif] text-[14px] text-[#054a57]">
                        {selectedComplaint.student} ({selectedComplaint.studentId})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building2 className="size-5 text-[#5eb9ca]" />
                    <div>
                      <p className="font-['Pretendard:Medium',sans-serif] text-[11px] text-[#92a4a6]">위치</p>
                      <p className="font-['Pretendard:SemiBold',sans-serif] text-[14px] text-[#054a57]">
                        {selectedComplaint.building} {selectedComplaint.room}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="font-['Pretendard:SemiBold',sans-serif] text-[13px] text-[#92a4a6] mb-2">민원 내용</p>
                  <p className="font-['Pretendard:Medium',sans-serif] text-[14px] text-[#054a57] leading-relaxed bg-[#f6fbff] rounded-[12px] p-4">
                    {selectedComplaint.content}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-['Pretendard:Medium',sans-serif] text-[#92a4a6]">신청 일시: {selectedComplaint.date}</span>
                  <span className="font-['Pretendard:SemiBold',sans-serif] text-[#5eb9ca]">{selectedComplaint.time}</span>
                </div>
              </div>

              <div className="space-y-3">
                {selectedComplaint.status === "완료" && selectedComplaint.response && !isEditingResponse ? (
                  <div>
                    <p className="font-['Pretendard:SemiBold',sans-serif] text-[14px] text-[#054a57] mb-3">관리자 답변</p>
                    <div className="bg-[#f0fdf4] border-2 border-[#28c76f]/30 rounded-[12px] p-4 mb-3">
                      <p className="font-['Pretendard:Medium',sans-serif] text-[14px] text-[#054a57] leading-relaxed">
                        {selectedComplaint.response}
                      </p>
                    </div>
                    <button
                      onClick={handleEditResponse}
                      className="w-full py-3 rounded-[12px] bg-[#5eb9ca]/10 text-[#5eb9ca] border-2 border-[#5eb9ca] font-['Pretendard:SemiBold',sans-serif] text-[14px] hover:bg-[#5eb9ca] hover:text-white transition-all"
                    >
                      답변 수정
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="font-['Pretendard:SemiBold',sans-serif] text-[14px] text-[#054a57] mb-3">
                        {isEditingResponse ? "답변 수정" : "답변 작성"}
                      </p>
                      <textarea
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        placeholder="민원에 대한 답변을 작성해주세요..."
                        className="w-full h-32 px-4 py-3 bg-white border-2 border-[#e5f4f5] rounded-[12px] font-['Pretendard:Medium',sans-serif] text-[14px] text-[#054a57] placeholder:text-[#c7d4d5] focus:border-[#5eb9ca] focus:outline-none resize-none"
                      />
                    </div>

                    <div className="flex gap-3">
                      {isEditingResponse && (
                        <button
                          onClick={() => {
                            setIsEditingResponse(false);
                            setResponse("");
                          }}
                          className="flex-1 py-3 rounded-[12px] bg-[#f6fbff] text-[#92a4a6] font-['Pretendard:SemiBold',sans-serif] text-[14px] hover:bg-[#e5f4f5] transition-colors"
                        >
                          취소
                        </button>
                      )}
                      <button
                        onClick={handleSaveResponse}
                        className={`${isEditingResponse ? 'flex-1' : 'w-full'} py-3 rounded-[12px] bg-[#5eb9ca] text-white font-['Pretendard:SemiBold',sans-serif] text-[14px] hover:bg-[#4fa8b9] transition-all shadow-lg shadow-[#5eb9ca]/30`}
                      >
                        {isEditingResponse ? "수정 완료" : "저장하고 완료 처리"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal (알림창 디자인 반영) */}
      {alertConfig?.isOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4 animate-in zoom-in duration-150">
          <div className="bg-white rounded-[20px] p-6 max-w-[320px] w-full text-center shadow-2xl">
            <div className="size-14 bg-[#f6fbff] rounded-full flex items-center justify-center mx-auto mb-4">
              <Info className="size-7 text-[#5eb9ca]" />
            </div>
            <p className="font-['Pretendard:SemiBold',sans-serif] text-[16px] text-[#054a57] mb-6 leading-relaxed">
              {alertConfig.message}
            </p>
            <button
              onClick={() => setAlertConfig(null)}
              className="w-full py-3 bg-[#5eb9ca] text-white rounded-[12px] font-['Pretendard:Bold',sans-serif] text-[14px] hover:bg-[#4fa8b9] transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}