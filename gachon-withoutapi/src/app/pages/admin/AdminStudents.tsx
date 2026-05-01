import { useState } from "react";
import { Search, Filter, Building2, Phone, Mail, Calendar, MoreVertical, GraduationCap, Home } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import StudentEditModal from "./AdminStudentsEdit";

interface Student {
  id: number;
  name: string;
  studentId: string;
  building: string;
  room: string;
  phone: string;
  email: string;
  checkInDate: string;
  department: string;
  grade: string;
}

export default function AdminStudents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBuilding, setFilterBuilding] = useState<string>("전체");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    studentId: "",
    building: "",
    room: "",
    phone: "",
    email: "",
    department: "",
    grade: "",
  });

  const students: Student[] = [
    {
      id: 1,
      name: "홍길동",
      studentId: "202012345",
      building: "제1학생생활관",
      room: "523호",
      phone: "010-1234-5678",
      email: "hong@gachon.ac.kr",
      checkInDate: "2026.03.01",
      department: "컴퓨터공학과",
      grade: "3학년",
    },
    {
      id: 2,
      name: "김철수",
      studentId: "202011234",
      building: "제2학생생활관",
      room: "412호",
      phone: "010-2345-6789",
      email: "kim@gachon.ac.kr",
      checkInDate: "2026.03.01",
      department: "전자공학과",
      grade: "4학년",
    },
    {
      id: 3,
      name: "이영희",
      studentId: "202013456",
      building: "제1학생생활관",
      room: "621호",
      phone: "010-3456-7890",
      email: "lee@gachon.ac.kr",
      checkInDate: "2026.03.02",
      department: "경영학과",
      grade: "2학년",
    },
    {
      id: 4,
      name: "박민수",
      studentId: "202014567",
      building: "제3학생생활관",
      room: "315호",
      phone: "010-4567-8901",
      email: "park@gachon.ac.kr",
      checkInDate: "2026.03.01",
      department: "기계공학과",
      grade: "3학년",
    },
    {
      id: 5,
      name: "정수진",
      studentId: "202015678",
      building: "제2학생생활관",
      room: "518호",
      phone: "010-5678-9012",
      email: "jung@gachon.ac.kr",
      checkInDate: "2026.03.03",
      department: "간호학과",
      grade: "1학년",
    },
    {
      id: 6,
      name: "최지원",
      studentId: "202016789",
      building: "제1학생생활관",
      room: "234호",
      phone: "010-6789-0123",
      email: "choi@gachon.ac.kr",
      checkInDate: "2026.02.28",
      department: "영어영문학과",
      grade: "2학년",
    },
  ];

  const buildings = ["전체", "제1학생생활관", "제2학생생활관", "제3학생생활관"];

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.includes(searchQuery) ||
      student.room.includes(searchQuery);
    const matchesBuilding = filterBuilding === "전체" || student.building === filterBuilding;
    return matchesSearch && matchesBuilding;
  });

  const handleStartEdit = (student: Student) => {
    setEditFormData({
      name: student.name,
      studentId: student.studentId,
      building: student.building,
      room: student.room,
      phone: student.phone,
      email: student.email,
      department: student.department,
      grade: student.grade,
    });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!editFormData.name || !editFormData.studentId) {
      alert("이름과 학번은 필수 입력 항목입니다.");
      return;
    }
    alert(`학생 #${selectedStudent?.id}의 정보가 수정되었습니다.`);
    setIsEditing(false);
    setSelectedStudent(null);
  };

  return (
    <AdminLayout>
      <div className="bg-[#f6fbff] min-h-screen pb-20 lg:pb-0">
        {/* Header */}
        <div className="bg-white border-b border-[#e5f4f5] px-4 lg:px-8 py-4 lg:py-6">
          <h1 className="font-['Pretendard:Bold',sans-serif] text-[24px] lg:text-[32px] text-[#054a57]">
            학생 관리
          </h1>
          <p className="font-['Pretendard:Medium',sans-serif] text-[12px] lg:text-[14px] text-[#92a4a6] mt-1">
            기숙사 입주 학생 정보를 관리하세요
          </p>
        </div>

        <div className="p-4 lg:p-8">
          {/* Search and Filter */}
          <div className="bg-white rounded-[16px] p-4 lg:p-6 shadow-sm mb-4 lg:mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#92a4a6]" />
                <input
                  type="text"
                  placeholder="이름, 학번 또는 호실로 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[#f6fbff] border-2 border-transparent rounded-[12px] font-['Pretendard:Medium',sans-serif] text-[14px] text-[#054a57] placeholder:text-[#c7d4d5] focus:border-[#5eb9ca] focus:bg-white focus:outline-none"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {buildings.map((building) => (
                  <button
                    key={building}
                    onClick={() => setFilterBuilding(building)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-[12px] whitespace-nowrap transition-all ${
                      filterBuilding === building
                        ? "bg-[#5eb9ca] text-white shadow-lg shadow-[#5eb9ca]/30"
                        : "bg-[#f6fbff] text-[#92a4a6] hover:bg-[#e5f4f5]"
                    }`}
                  >
                    <Filter className="size-4" />
                    <span className="font-['Pretendard:SemiBold',sans-serif] text-[14px]">
                      {building}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-[16px] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#f6fbff]">
                  <tr>
                    <th className="px-3 lg:px-6 py-3 lg:py-4 text-left font-['Pretendard:SemiBold',sans-serif] text-[11px] lg:text-[13px] text-[#92a4a6]">
                      학생 정보
                    </th>
                    <th className="px-3 lg:px-6 py-3 lg:py-4 text-left font-['Pretendard:SemiBold',sans-serif] text-[11px] lg:text-[13px] text-[#92a4a6]">
                      호실
                    </th>
                    <th className="hidden md:table-cell px-3 lg:px-6 py-3 lg:py-4 text-left font-['Pretendard:SemiBold',sans-serif] text-[11px] lg:text-[13px] text-[#92a4a6]">
                      학과
                    </th>
                    <th className="hidden sm:table-cell px-3 lg:px-6 py-3 lg:py-4 text-left font-['Pretendard:SemiBold',sans-serif] text-[11px] lg:text-[13px] text-[#92a4a6]">
                      입사일
                    </th>
                    <th className="hidden lg:table-cell px-3 lg:px-6 py-3 lg:py-4 text-left font-['Pretendard:SemiBold',sans-serif] text-[11px] lg:text-[13px] text-[#92a4a6]">
                      이메일
                    </th>
                    <th className="px-3 lg:px-6 py-3 lg:py-4 text-right font-['Pretendard:SemiBold',sans-serif] text-[11px] lg:text-[13px] text-[#92a4a6]">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => {
                    return (
                      <tr 
                        key={student.id}
                        className="border-t border-[#e5f4f5] hover:bg-[#f6fbff] transition-colors"
                      >
                        <td className="px-3 lg:px-6 py-3 lg:py-4">
                          <div>
                            <p className="font-['Pretendard:SemiBold',sans-serif] text-[13px] lg:text-[14px] text-[#054a57]">
                              {student.name}
                            </p>
                            <p className="font-['Pretendard:Medium',sans-serif] text-[11px] lg:text-[12px] text-[#92a4a6]">
                              {student.studentId}
                            </p>
                          </div>
                        </td>
                        <td className="px-3 lg:px-6 py-3 lg:py-4">
                          <div>
                            <p className="font-['Pretendard:SemiBold',sans-serif] text-[12px] lg:text-[13px] text-[#054a57]">
                              {student.room}
                            </p>
                            <p className="font-['Pretendard:Medium',sans-serif] text-[10px] lg:text-[11px] text-[#92a4a6]">
                              {student.building}
                            </p>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-3 lg:px-6 py-3 lg:py-4">
                          <p className="font-['Pretendard:Medium',sans-serif] text-[12px] lg:text-[13px] text-[#054a57]">
                            {student.department}
                          </p>
                        </td>
                        <td className="hidden sm:table-cell px-3 lg:px-6 py-3 lg:py-4">
                          <div className="flex items-center gap-2 text-[#92a4a6]">
                            <Calendar className="size-3 lg:size-4" />
                            <span className="font-['Pretendard:Medium',sans-serif] text-[11px] lg:text-[13px]">
                              {student.checkInDate}
                            </span>
                          </div>
                        </td>
                        <td className="hidden lg:table-cell px-3 lg:px-6 py-3 lg:py-4">
                          <div className="flex items-center gap-2 text-[#5eb9ca]">
                            <Mail className="size-4" />
                            <span className="font-['Pretendard:Medium',sans-serif] text-[12px]">
                              {student.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 lg:px-6 py-3 lg:py-4">
                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => setSelectedStudent(student)}
                              className="p-2 rounded-[8px] bg-[#5eb9ca]/10 text-[#5eb9ca] hover:bg-[#5eb9ca] hover:text-white transition-colors"
                            >
                              <MoreVertical className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedStudent && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedStudent(null)}
        >
          <div 
            className="bg-white rounded-[20px] max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="font-['Pretendard:Bold',sans-serif] text-[24px] text-[#054a57]">
                    {selectedStudent.name}
                  </h2>
                  <p className="font-['Pretendard:Medium',sans-serif] text-[14px] text-[#92a4a6] mt-1">
                    {selectedStudent.studentId}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="text-[#92a4a6] hover:text-[#054a57] text-[24px]"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#f6fbff] rounded-[12px] p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Building2 className="size-5 text-[#5eb9ca]" />
                    <p className="font-['Pretendard:Medium',sans-serif] text-[11px] text-[#92a4a6]">
                      생활관 동수
                    </p>
                  </div>
                  <p className="font-['Pretendard:SemiBold',sans-serif] text-[15px] text-[#054a57]">
                    {selectedStudent.building}
                  </p>
                </div>

                <div className="bg-[#f6fbff] rounded-[12px] p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Home className="size-5 text-[#5eb9ca]" />
                    <p className="font-['Pretendard:Medium',sans-serif] text-[11px] text-[#92a4a6]">
                      생활관 호수
                    </p>
                  </div>
                  <p className="font-['Pretendard:Bold',sans-serif] text-[18px] text-[#5eb9ca]">
                    {selectedStudent.room}
                  </p>
                </div>

                <div className="bg-[#f6fbff] rounded-[12px] p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <GraduationCap className="size-5 text-[#5eb9ca]" />
                    <p className="font-['Pretendard:Medium',sans-serif] text-[11px] text-[#92a4a6]">
                      학과
                    </p>
                  </div>
                  <p className="font-['Pretendard:SemiBold',sans-serif] text-[13px] text-[#054a57]">
                    {selectedStudent.department}
                  </p>
                </div>

                <div className="bg-[#f6fbff] rounded-[12px] p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <GraduationCap className="size-5 text-[#5eb9ca]" />
                    <p className="font-['Pretendard:Medium',sans-serif] text-[11px] text-[#92a4a6]">
                      학년
                    </p>
                  </div>
                  <p className="font-['Pretendard:SemiBold',sans-serif] text-[15px] text-[#054a57]">
                    {selectedStudent.grade}
                  </p>
                </div>

                <div className="bg-[#f6fbff] rounded-[12px] p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Mail className="size-5 text-[#5eb9ca]" />
                    <p className="font-['Pretendard:Medium',sans-serif] text-[11px] text-[#92a4a6]">
                      이메일
                    </p>
                  </div>
                  <p className="font-['Pretendard:SemiBold',sans-serif] text-[12px] text-[#054a57]">
                    {selectedStudent.email}
                  </p>
                </div>

                <div className="bg-[#f6fbff] rounded-[12px] p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Phone className="size-5 text-[#5eb9ca]" />
                    <p className="font-['Pretendard:Medium',sans-serif] text-[11px] text-[#92a4a6]">
                      연락처
                    </p>
                  </div>
                  <p className="font-['Pretendard:SemiBold',sans-serif] text-[15px] text-[#054a57]">
                    {selectedStudent.phone}
                  </p>
                </div>

                <div className="bg-[#f6fbff] rounded-[12px] p-4 col-span-2">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="size-5 text-[#5eb9ca]" />
                    <p className="font-['Pretendard:Medium',sans-serif] text-[11px] text-[#92a4a6]">
                      입사일
                    </p>
                  </div>
                  <p className="font-['Pretendard:SemiBold',sans-serif] text-[15px] text-[#054a57]">
                    {selectedStudent.checkInDate}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="flex-1 py-3 rounded-[12px] bg-[#f6fbff] text-[#92a4a6] font-['Pretendard:SemiBold',sans-serif] text-[14px] hover:bg-[#e5f4f5] transition-colors"
                >
                  닫기
                </button>
                <button
                  onClick={() => handleStartEdit(selectedStudent)}
                  className="px-6 py-3 rounded-[12px] bg-[#5eb9ca] text-white font-['Pretendard:SemiBold',sans-serif] text-[14px] hover:bg-[#4fa8b9] transition-colors"
                >
                  정보 수정
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && selectedStudent && (
        <StudentEditModal
          student={selectedStudent}
          onClose={() => setIsEditing(false)}
          onSave={(formData) => {
            alert(`학생 #${selectedStudent.id}의 정보가 수정되었습니다.`);
            setIsEditing(false);
            setSelectedStudent(null);
          }}
        />
      )}
    </AdminLayout>
  );
}