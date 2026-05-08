import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare, Users, Clock, UserCheck,
  AlertCircle, LucideIcon,
} from "lucide-react";
import {
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
} from "recharts";
import AdminLayout from "../components/AdminLayout";
import api from "../api/axios";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DailyStat {
  date:  string;
  count: number;
}

interface TopQuestion {
  question: string;
  count:    number;
}

interface StatResponse {
  totalChats:        number;
  memberUserCount:   number;
  guestSessionCount: number;
  avgResponseTime:   number;
  dailyStats:        DailyStat[];
  topQuestions:      TopQuestion[];
}

interface SummaryCardProps {
  title: string;
  value: string;
  icon:  LucideIcon;
  color: string;
}

interface AlertState {
  show:    boolean;
  title:   string;
  message: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FALLBACK_STATS: StatResponse = {
  totalChats:        0,
  memberUserCount:   0,
  guestSessionCount: 0,
  avgResponseTime:   0,
  dailyStats:        [],
  topQuestions:      [],
};

const PIE_COLORS = {
  member: "#5eb9ca",
  guest:  "#92a4a6",
} as const;

const ERROR_MESSAGES: Record<number, string> = {
  401: "로그인 세션이 만료되었습니다.\n다시 로그인해 주세요.",
  403: "통계 데이터 접근 권한이 없습니다.\n관리자 계정인지 확인해 주세요.",
};

// ─── Utils ────────────────────────────────────────────────────────────────────

function getDateRange(): { startDate: string; endDate: string } {
  const end   = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate:   end.toISOString().split("T")[0],
  };
}

function toPercentage(count: number, total: number): string {
  if (total === 0) return "0";
  return ((count / total) * 100).toFixed(1);
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useAlert() {
  const [alert, setAlert] = useState<AlertState>({ show: false, title: "", message: "" });

  const triggerAlert = useCallback((title: string, message: string) => {
    setAlert({ show: true, title, message });
  }, []);

  const closeAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, show: false }));
  }, []);

  return { alert, triggerAlert, closeAlert };
}

function useStatistics(triggerAlert: (title: string, msg: string) => void) {
  const [stats,   setStats]   = useState<StatResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();

      const { data } = await api.get<{
        code:    number;
        message: string;
        data:    StatResponse & { dailyStats: DailyStat[] };
      }>("/admin/chatlogs/stats", { params: { startDate, endDate } });

      if (data.code === 200) {
        const sorted = [...data.data.dailyStats].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setStats({ ...data.data, dailyStats: sorted });
      } else {
        triggerAlert("데이터 오류", data.message || "통계 데이터를 불러오지 못했습니다.");
      }
    } catch (error: any) {
      const status: number  = error.response?.status;
      const serverMsg: string = error.response?.data?.message;

      if (status === 401) {
        window.location.href = "/admin/auth/login";
        return;
      }

      triggerAlert(
        "오류",
        serverMsg || ERROR_MESSAGES[status] || "서버와의 통신이 원활하지 않습니다."
      );
    } finally {
      setLoading(false);
    }
  }, [triggerAlert]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, fetchStats };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({ title, value, icon: Icon, color }: SummaryCardProps) {
  return (
    <div className="bg-white p-4 rounded-[16px] shadow-sm flex items-center gap-3 h-full border border-white">
      <div className={`size-12 min-w-[48px] rounded-[12px] ${color} text-white flex items-center justify-center flex-shrink-0`}>
        <Icon size={24} strokeWidth={2.5} aria-hidden="true" />
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

function DailyStatsChart({ data }: { data: DailyStat[] }) {
  return (
    <div className="bg-white rounded-[16px] p-6 shadow-sm">
      <h2 className="text-[18px] font-bold text-[#054a57] mb-4">일별 질문 수 추이</h2>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5f4f5" />
            <XAxis dataKey="date" tick={{ fill: "#92a4a6", fontSize: 11 }} />
            <YAxis tick={{ fill: "#92a4a6", fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#5eb9ca"
              strokeWidth={3}
              dot={{ r: 4, fill: "#5eb9ca" }}
              name="질문 수"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function UserTypePieChart({ memberCount, guestCount }: { memberCount: number; guestCount: number }) {
  const data = [
    { name: "로그인 유저",   value: memberCount, color: PIE_COLORS.member },
    { name: "비로그인 유저", value: guestCount,  color: PIE_COLORS.guest  },
  ];

  return (
    <div className="bg-white rounded-[16px] p-6 shadow-sm">
      <h2 className="text-[18px] font-bold text-[#054a57] mb-4">사용자 유형 분포</h2>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TopQuestionsTable({ questions, totalChats }: { questions: TopQuestion[]; totalChats: number }) {
  return (
    <div className="bg-white rounded-[16px] p-6 shadow-sm">
      <h2 className="text-[18px] font-bold text-[#054a57] mb-6">자주 입력된 질문 TOP 20</h2>
      {questions.length === 0 ? (
        <p className="text-[#92a4a6] text-[14px]">데이터가 없습니다.</p>
      ) : (
        <ol className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          {questions.map((item, index) => {
            const pct = toPercentage(item.count, totalChats);
            return (
              <li key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-[#5eb9ca] font-bold text-[16px]" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[#054a57] text-[14px]">{item.question}</span>
                  </div>
                  <span className="text-[#92a4a6] text-[12px] shrink-0 ml-2">
                    {item.count.toLocaleString()}건 ({pct}%)
                  </span>
                </div>
                <div
                  className="w-full h-2 bg-[#f6fbff] rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={Number(pct)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${item.question} 비율`}
                >
                  <div
                    className="h-full bg-[#5eb9ca] rounded-full transition-all duration-1000"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminStatistics() {
  const { alert, triggerAlert, closeAlert } = useAlert();
  const { stats, loading, fetchStats }      = useStatistics(triggerAlert);

  const display = stats ?? FALLBACK_STATS;

  return (
    <AdminLayout>
      <div className="bg-[#f6fbff] min-h-screen">

        {/* ── Page Header ───────────────────────────────────────────────── */}
        <div className="bg-white border-b border-[#e5f4f5] px-5 py-5 flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-[22px] sm:text-[32px] text-[#054a57] truncate">챗봇 통계</h1>
            <p className="text-[12px] sm:text-[14px] text-[#92a4a6] truncate">실시간 사용 현황 분석</p>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            aria-label={loading ? "데이터 갱신 중" : "통계 새로고침"}
            aria-busy={loading}
            className="flex-shrink-0 px-3 py-2 bg-[#f0f9fa] text-[#5eb9ca] rounded-xl font-bold text-[12px] sm:text-sm hover:bg-[#e5f4f5] disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Clock size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />
            <span className="whitespace-nowrap">{loading ? "갱신 중" : "새로고침"}</span>
          </button>
        </div>

        <div className="p-4 sm:p-8">

          {/* ── Summary Cards ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
            <SummaryCard title="질문 수"      value={`${display.totalChats.toLocaleString()}건`}        icon={MessageSquare} color="bg-[#5eb9ca]" />
            <SummaryCard title="활성 유저"    value={`${display.memberUserCount.toLocaleString()}명`}   icon={UserCheck}     color="bg-[#28c76f]" />
            <SummaryCard title="비로그인 유저 질문 수" value={`${display.guestSessionCount.toLocaleString()}개`} icon={Users}         color="bg-[#ff9f43]" />
            <SummaryCard title="평균 응답"    value={`${display.avgResponseTime}ms`}                    icon={Clock}         color="bg-[#ea5455]" />
          </div>

          {/* ── Charts ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <DailyStatsChart data={display.dailyStats} />
            <UserTypePieChart
              memberCount={display.memberUserCount}
              guestCount={display.guestSessionCount}
            />
          </div>

          {/* ── Top Questions ─────────────────────────────────────────── */}
          <TopQuestionsTable
            questions={display.topQuestions}
            totalChats={display.totalChats}
          />
        </div>
      </div>

      {/* ── Alert Modal ───────────────────────────────────────────────────── */}
      {alert.show && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="alert-title"
          className="fixed inset-0 z-[100] flex items-center justify-center px-8"
        >
          <div
            className="absolute inset-0 bg-[#054a57]/20 backdrop-blur-[3px]"
            onClick={closeAlert}
            aria-hidden="true"
          />
          <div className="relative bg-white w-full max-w-[320px] rounded-[28px] shadow-2xl p-7 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="size-[56px] bg-[#f0f9ff] rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="text-[#5eb9ca]" size={28} aria-hidden="true" />
              </div>
              <h2 id="alert-title" className="text-[17px] font-bold text-[#054a57] mb-2">
                {alert.title}
              </h2>
              <p className="text-[14px] font-medium text-[#7aaeb7] leading-relaxed mb-6 whitespace-pre-wrap">
                {alert.message}
              </p>
              <button
                onClick={closeAlert}
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