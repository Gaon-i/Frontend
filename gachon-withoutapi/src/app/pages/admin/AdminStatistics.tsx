import { useState } from "react";
import { MessageSquare, Users, Clock, BarChart3, TrendingUp, UserCheck } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

export default function AdminStatistics() {
  // 1. API 명세서 구조와 동일한 Mock 데이터
  const apiMockData = {
    totalChats: 1250,
    memberUserCount: 320,
    guestSessionCount: 150,
    avgResponseTime: 842,
    dailyStats: [
      { date: "2026-03-25", count: 95 },
      { date: "2026-03-26", count: 110 },
      { date: "2026-03-27", count: 88 },
      { date: "2026-03-28", count: 125 },
      { date: "2026-03-29", count: 120 },
      { date: "2026-03-30", count: 145 },
      { date: "2026-03-31", count: 160 },
    ],
    topQuestions: [
      { question: "외박 신청 어떻게 해?", count: 145 },
      { question: "벌점 기준 알려줘", count: 112 },
      { question: "세탁실 이용 시간이 언제야?", count: 98 },
      { question: "식당 메뉴 어디서 봐?", count: 85 },
      { question: "택배 보관함 위치 알려줘", count: 72 },
    ]
  };

  // 2. 사용자 비율 계산 (Pie Chart용)
  const userTypeData = [
    { name: "로그인 유저", value: apiMockData.memberUserCount, color: "#5eb9ca" },
    { name: "비로그인 세션", value: apiMockData.guestSessionCount, color: "#92a4a6" },
  ];

  return (
    <AdminLayout>
      <div className="bg-[#f6fbff] min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-[#e5f4f5] px-8 py-6">
          <h1 className="font-['Pretendard:Bold',sans-serif] text-[32px] text-[#054a57]">챗봇 통계</h1>
          <p className="font-['Pretendard:Medium',sans-serif] text-[14px] text-[#92a4a6] mt-1">
            API 기반 실시간 챗봇 사용 현황 분석
          </p>
        </div>

        <div className="p-8">
          {/* Summary Cards - API의 핵심 지표 반영 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <SummaryCard title="전체 질문 수" value={`${apiMockData.totalChats}건`} icon={<MessageSquare />} color="bg-[#5eb9ca]" />
            <SummaryCard title="활성 유저 (로그인)" value={`${apiMockData.memberUserCount}명`} icon={<UserCheck />} color="bg-[#28c76f]" />
            <SummaryCard title="비로그인 세션" value={`${apiMockData.guestSessionCount}개`} icon={<Users />} color="bg-[#ff9f43]" />
            <SummaryCard title="평균 응답 시간" value={`${apiMockData.avgResponseTime}ms`} icon={<Clock />} color="bg-[#ea5455]" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Daily Stats - 일별 질문 추이 */}
            <div className="bg-white rounded-[16px] p-6 shadow-sm">
              <h2 className="font-['Pretendard:Bold',sans-serif] text-[18px] text-[#054a57] mb-4">일별 질문 수 추이</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={apiMockData.dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5f4f5" />
                  <XAxis dataKey="date" tick={{ fill: '#92a4a6', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#92a4a6', fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="count" stroke="#5eb9ca" strokeWidth={3} dot={{ r: 4, fill: '#5eb9ca' }} name="질문 수" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* User Type Distribution - 로그인/비로그인 비율 */}
            <div className="bg-white rounded-[16px] p-6 shadow-sm">
              <h2 className="font-['Pretendard:Bold',sans-serif] text-[18px] text-[#054a57] mb-4">사용자 유형 분포</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={userTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                    {userTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Questions - 자주 묻는 질문 랭킹 */}
          <div className="bg-white rounded-[16px] p-6 shadow-sm">
            <h2 className="font-['Pretendard:Bold',sans-serif] text-[18px] text-[#054a57] mb-6">자주 입력된 질문 TOP 5</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {apiMockData.topQuestions.map((item, index) => {
                const percentage = ((item.count / apiMockData.totalChats) * 100).toFixed(1);
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-[#5eb9ca] font-['Pretendard:Bold'] text-[16px]">0{index + 1}</span>
                        <span className="text-[#054a57] font-['Pretendard:Medium'] text-[14px]">{item.question}</span>
                      </div>
                      <span className="text-[#92a4a6] text-[12px] font-['Pretendard:SemiBold']">{item.count}건 ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-[#f6fbff] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#5eb9ca] rounded-full transition-all duration-1000"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// 요약 카드 컴포넌트
function SummaryCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white p-6 rounded-[16px] shadow-sm flex items-center gap-4">
      <div className={`size-12 rounded-[12px] ${color} text-white flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-[#92a4a6] text-[13px] font-['Pretendard:Medium']">{title}</p>
        <p className="text-[#054a57] text-[20px] font-['Pretendard:Bold'] mt-0.5">{value}</p>
      </div>
    </div>
  );
}