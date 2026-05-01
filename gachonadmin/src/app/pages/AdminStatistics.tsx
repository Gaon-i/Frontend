import React from "react";
import { useState, useEffect, cloneElement, ReactElement } from "react";
import api from "../api/axios";
import { MessageSquare, Users, Clock, UserCheck, AlertCircle } from "lucide-react";
import { LucideIcon } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis } from "recharts";

// 1. API 응답 인터페이스 정의
interface StatResponse {
  totalChats: number;
  memberUserCount: number;
  guestSessionCount: number;
  avgResponseTime: number;
  dailyStats: { date: string; count: number }[];
  topQuestions: { question: string; count: number }[];
}

export default function AdminStatistics() {
  // 2. 상태 관리
  const [stats, setStats] = useState<StatResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // 알림 모달 상태
  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [alertTitle, setAlertTitle] = useState("알림");

  // 3. API 호출 함수
  const fetchStats = async () => {
    try {
      setLoading(true);

      // 조회 기간 동적 설정 (예: 최근 30일)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
      const startDate = thirtyDaysAgo.toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      const response = await api.get("/admin/chatlogs/stats", {
        params: { startDate, endDate }
      });

      if (response.data.code === 200) {
        const sortedDailyStats = response.data.data.dailyStats.sort(
          (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setStats({ ...response.data.data, dailyStats: sortedDailyStats });
      } else {
        // 응답 코드가 200이 아닐 때
        setAlertTitle("데이터 오류");
        setAlertMsg(response.data.message || "통계 데이터를 불러오지 못했습니다.");
        setShowAlert(true);
      }
    } catch (error: any) {
      console.error("통계 데이터를 가져오는 중 오류 발생:", error);

      const status = error.response?.status;
      let errorMsg = error.response?.data?.message || "서버와의 통신이 원활하지 않습니다.";

      if (status === 403) {
        errorMsg = "통계 데이터 접근 권한이 없습니다.\n 관리자 계정인지 확인해 주세요.";
      }

      setAlertTitle("오류");
      setAlertMsg(errorMsg);
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // 데이터 가드 (stats가 null일 때도 차트가 깨지지 않게 방어)
  const displayData = stats || {
    totalChats: 0,
    memberUserCount: 0,
    guestSessionCount: 0,
    avgResponseTime: 0,
    dailyStats: [],
    topQuestions: []
  };

  const userTypeData = [
    { name: "로그인 유저", value: displayData.memberUserCount, color: "#5eb9ca" },
    { name: "비로그인 세션", value: displayData.guestSessionCount, color: "#92a4a6" },
  ];

  return (
    <AdminLayout>
      <div className="bg-[#f6fbff] min-h-screen">
        {/* 1. 상단 헤더 */}
        <div className="bg-white border-b border-[#e5f4f5] px-5 py-5 flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-[22px] sm:text-[32px] text-[#054a57] truncate">챗봇 통계</h1>
            <p className="text-[12px] sm:text-[14px] text-[#92a4a6] truncate">실시간 사용 현황 분석</p>
          </div>

          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex-shrink-0 px-3 py-2 bg-[#f0f9fa] text-[#5eb9ca] rounded-xl font-bold text-[12px] sm:text-sm hover:bg-[#e5f4f5] disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Clock size={14} className={loading ? "animate-spin" : ""} />
            <span className="whitespace-nowrap">{loading ? "갱신 중" : "새로고침"}</span>
          </button>
        </div>

        <div className="p-4 sm:p-8">
          {/* 2. 요약 카드 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
            <SummaryCard title="질문 수" value={`${displayData.totalChats.toLocaleString()}건`} icon={MessageSquare} color="bg-[#5eb9ca]" />
            <SummaryCard title="활성 유저" value={`${displayData.memberUserCount.toLocaleString()}명`} icon={UserCheck} color="bg-[#28c76f]" />
            <SummaryCard title="비로그인" value={`${displayData.guestSessionCount.toLocaleString()}개`} icon={Users} color="bg-[#ff9f43]" />
            <SummaryCard title="평균 응답" value={`${displayData.avgResponseTime}ms`} icon={Clock} color="bg-[#ea5455]" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Daily Stats Chart */}
            <div className="bg-white rounded-[16px] p-6 shadow-sm">
              <h2 className="font-['Pretendard:Bold',sans-serif] text-[18px] text-[#054a57] mb-4">일별 질문 수 추이</h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={displayData.dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5f4f5" />
                    <XAxis dataKey="date" tick={{ fill: '#92a4a6', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#92a4a6', fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Line type="monotone" dataKey="count" stroke="#5eb9ca" strokeWidth={3} dot={{ r: 4, fill: '#5eb9ca' }} name="질문 수" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* User Type Pie Chart */}
            <div className="bg-white rounded-[16px] p-6 shadow-sm">
              <h2 className="font-['Pretendard:Bold',sans-serif] text-[18px] text-[#054a57] mb-4">사용자 유형 분포</h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={userTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                      {userTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top Questions Ranking */}
          <div className="bg-white rounded-[16px] p-6 shadow-sm">
            <h2 className="font-['Pretendard:Bold',sans-serif] text-[18px] text-[#054a57] mb-6">자주 입력된 질문 TOP 5</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {displayData.topQuestions.length > 0 ? (
                displayData.topQuestions.map((item, index) => {
                  const percentage = displayData.totalChats > 0
                    ? ((item.count / displayData.totalChats) * 100).toFixed(1)
                    : "0";
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
                })
              ) : (
                <p className="text-[#92a4a6] text-[14px]">데이터가 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 알림 모달 */}
      {showAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-8">
          <div className="absolute inset-0 bg-[#054a57]/20 backdrop-blur-[3px]" onClick={() => setShowAlert(false)} />
          <div className="relative bg-white w-full max-w-[320px] rounded-[28px] shadow-2xl p-7 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="size-[56px] bg-[#f0f9ff] rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="text-[#5eb9ca]" size={28} />
              </div>
              <h2 className="text-[17px] font-bold text-[#054a57] mb-2">{alertTitle}</h2>
              <p className="text-[14px] font-medium text-[#7aaeb7] leading-relaxed mb-6 whitespace-pre-wrap">{alertMsg}</p>
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
    </AdminLayout>
  );
}

function SummaryCard({ title, value, icon: Icon, color }: { title: string; value: string; icon: LucideIcon; color: string }) {
  return (
    <div className="bg-white p-4 rounded-[16px] shadow-sm flex items-center gap-3 h-full border border-white">
      <div className={`size-12 min-w-[48px] rounded-[12px] ${color} text-white flex items-center justify-center flex-shrink-0`}>
        <Icon size={24} strokeWidth={2.5} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[#92a4a6] text-[11px] sm:text-[13px] font-medium truncate leading-tight">
          {title}
        </p>
        <p className="text-[#054a57] text-[16px] sm:text-[20px] font-bold mt-0.5 truncate">
          {value}
        </p>
      </div>
    </div>
  );
}