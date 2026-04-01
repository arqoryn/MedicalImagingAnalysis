
import React, { useMemo } from 'react';
import { PatientCase, DiagnosticStatus } from '../types';
import { 
  Activity, 
  AlertTriangle, 
  Users, 
  Clock, 
  ArrowRight, 
  Search, 
  Filter, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

interface DashboardProps {
  cases: PatientCase[];
  onSelectCase: (c: PatientCase) => void;
  onViewAll: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ cases, onSelectCase, onViewAll }) => {
  // Statistics calculations
  const summaryStats = useMemo(() => {
    const total = cases.length;
    const completed = cases.filter(c => c.status === DiagnosticStatus.COMPLETED).length;
    const inProgress = cases.filter(c => c.status === DiagnosticStatus.ANALYZING || c.status === DiagnosticStatus.PENDING).length;
    
    const critical = cases.filter(c => c.result?.riskAssessment === 'Critical').length;
    const high = cases.filter(c => c.result?.riskAssessment === 'High').length;
    const medium = cases.filter(c => c.result?.riskAssessment === 'Moderate').length;
    const low = cases.filter(c => c.result?.riskAssessment === 'Low').length;

    return {
      row1: [
        { label: 'Total Cases', value: total, icon: Users, color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-50 dark:bg-slate-800/50' },
        { label: 'Completed', value: completed, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        { label: 'In Progress', value: inProgress, icon: Clock, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
      ],
      row2: [
        { label: 'Critical', value: critical, icon: AlertCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
        { label: 'High', value: high, icon: AlertTriangle, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
        { label: 'Medium', value: medium, icon: Activity, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
        { label: 'Low', value: low, icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
      ]
    };
  }, [cases]);

  // Risk distribution data for chart
  const riskData = useMemo(() => {
    const counts = {
      Critical: 0,
      High: 0,
      Moderate: 0,
      Low: 0,
      'No Result': 0
    };

    cases.forEach(c => {
      if (c.result?.riskAssessment) {
        counts[c.result.riskAssessment]++;
      } else {
        counts['No Result']++;
      }
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [cases]);

  const COLORS = {
    Critical: '#ef4444',
    High: '#f97316',
    Moderate: '#eab308',
    Low: '#10b981',
    'No Result': '#94a3b8'
  };

  // Urgent cases (Critical or High risk)
  const urgentCases = useMemo(() => {
    return cases
      .filter(c => c.result?.riskAssessment === 'Critical' || c.result?.riskAssessment === 'High')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  }, [cases]);

  // Case Type Distribution (Top Condition)
  const caseTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    cases.forEach(c => {
      const topCondition = c.result?.differentials[0]?.condition || 'Undiagnosed';
      counts[topCondition] = (counts[topCondition] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [cases]);

  // Diagnostic Volume (Last 7 Days)
  const volumeData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const counts: Record<string, number> = {};
    days.forEach(day => counts[day] = 0);

    cases.forEach(c => {
      const day = c.createdAt.split('T')[0];
      if (counts[day] !== undefined) {
        counts[day]++;
      }
    });

    return days.map(day => ({
      date: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: counts[day]
    }));
  }, [cases]);

  const PIE_COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a'];

  return (
    <div className="space-y-8 pb-12 transition-colors duration-300">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Clinical Command Center</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-semibold border border-emerald-100 dark:border-emerald-800">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            System Online: AI Core v4.2
          </div>
          <button 
            onClick={onViewAll}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-blue-700 transition-all shadow-sm"
          >
            <Users className="w-4 h-4" />
            Patient Database
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="space-y-6">
        {/* Row 1: Case Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {summaryStats.row1.map((stat, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                  <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg} dark:bg-opacity-10`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Row 2: Risk Levels */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {summaryStats.row2.map((stat, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${stat.bg} dark:bg-opacity-10`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* New Analytics Grid: Case Type & Volume */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Case Type Distribution */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-500" />
                  Case Type Distribution
                </h3>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={caseTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {caseTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        backgroundColor: '#1e293b',
                        color: '#f8fafc',
                        fontSize: '10px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {caseTypeData.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}></div>
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Diagnostic Volume (Last 7 Days) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Diagnostic Volume (7D)
                </h3>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:opacity-5" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 600 }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 600 }} 
                    />
                    <RechartsTooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        backgroundColor: '#1e293b',
                        color: '#f8fafc',
                        fontSize: '10px'
                      }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#10b981" fillOpacity={1} fill="url(#colorVolume)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Risk Distribution Analytics (Now at Top) */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-500" />
                Risk Distribution Analytics
              </h3>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Population Summary</div>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:opacity-5" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} 
                  />
                  <RechartsTooltip 
                    cursor={{ fill: '#f8fafc', opacity: 0.05 }}
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      backgroundColor: '#1e293b',
                      color: '#f8fafc'
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Diagnostic Queue (Now below Risk Distribution) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="font-bold text-slate-800 dark:text-slate-200">Recent Diagnostic Queue</h2>
              </div>
              <button 
                onClick={onViewAll}
                className="text-blue-600 dark:text-blue-400 text-sm font-bold hover:text-blue-700 flex items-center gap-1 group"
              >
                View Full Queue
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-bold">Patient / Case ID</th>
                    <th className="px-6 py-4 font-bold">Clinical Status</th>
                    <th className="px-6 py-4 font-bold">Risk Level</th>
                    <th className="px-6 py-4 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {cases.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <FileText className="w-12 h-12 opacity-20" />
                          <p className="text-sm font-medium">No active diagnostics in queue.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    cases.slice(0, 6).map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-xs border border-slate-200 dark:border-slate-700">
                              {c.patient.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-slate-200 text-sm">{c.patient.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">ID: {c.id.slice(0, 8).toUpperCase()}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {c.status === DiagnosticStatus.COMPLETED ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : c.status === DiagnosticStatus.ANALYZING ? (
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            ) : (
                              <Clock className="w-4 h-4 text-amber-500" />
                            )}
                            <span className={`text-xs font-bold ${
                              c.status === DiagnosticStatus.COMPLETED ? 'text-emerald-600 dark:text-emerald-400' :
                              c.status === DiagnosticStatus.ANALYZING ? 'text-blue-600 dark:text-blue-400' :
                              'text-amber-600 dark:text-amber-400'
                            }`}>
                              {c.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {c.result ? (
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                              c.result.riskAssessment === 'Critical' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30' :
                              c.result.riskAssessment === 'High' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/30' :
                              c.result.riskAssessment === 'Moderate' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/30' :
                              'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                            }`}>
                              {c.result.riskAssessment}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-300 dark:text-slate-600 font-bold italic">PENDING</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => onSelectCase(c)}
                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                            title="View Detailed Analysis"
                          >
                            <ArrowRight className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar: Clinical Alerts & Insights */}
        <div className="space-y-8">
          {/* Clinical Alerts */}
          <div className="bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Clinical Alerts
              </h3>
              <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                {urgentCases.length} URGENT
              </span>
            </div>
            
            <div className="space-y-4">
              {urgentCases.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm italic">
                  No critical alerts at this time.
                </div>
              ) : (
                urgentCases.map((c) => (
                  <div 
                    key={c.id} 
                    onClick={() => onSelectCase(c)}
                    className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-red-500/50 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-white group-hover:text-red-400 transition-colors">{c.patient.name}</span>
                      <span className="text-[10px] font-black text-red-500 uppercase tracking-tighter">{c.result?.riskAssessment}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
                      {c.symptoms}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-500 font-mono">{new Date(c.createdAt).toLocaleTimeString()}</span>
                      <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <button 
              onClick={onViewAll}
              className="w-full mt-6 py-3 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors border border-slate-700"
            >
              Review All High-Risk Cases
            </button>
          </div>

          {/* AI Performance Insight */}
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              AI Insight Engine
            </h3>
            <p className="text-sm text-indigo-100 leading-relaxed mb-6">
              Diagnostic accuracy has improved by <span className="font-bold text-white">4.2%</span> this month following the latest medical literature update.
            </p>
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-indigo-200">
                <span>Confidence Score</span>
                <span>98.4%</span>
              </div>
              <div className="w-full h-1.5 bg-indigo-900/30 rounded-full overflow-hidden">
                <div className="w-[98%] h-full bg-white rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 text-sm">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center gap-2 transition-colors">
                <Search className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Search</span>
              </button>
              <button className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center gap-2 transition-colors">
                <Filter className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Filter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
