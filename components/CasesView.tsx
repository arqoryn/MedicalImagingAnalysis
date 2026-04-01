
import React, { useState, useMemo } from 'react';
import { PatientCase, DiagnosticStatus } from '../types';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  MoreVertical, 
  Download, 
  User, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  XCircle,
  ChevronRight,
  Calendar,
  RefreshCcw,
  Copy,
  Trash2
} from 'lucide-react';

interface CasesViewProps {
  cases: PatientCase[];
  onSelectCase: (c: PatientCase) => void;
  onDeleteCase: (id: string) => void;
}

type SortOption = 'recent' | 'oldest' | 'name-asc' | 'name-desc' | 'risk-high';
type RiskFilter = 'All' | 'Low' | 'Moderate' | 'High' | 'Critical';
type StatusFilter = 'All' | DiagnosticStatus;

const CasesView: React.FC<CasesViewProps> = ({ cases, onSelectCase, onDeleteCase }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Stats for the header
  const stats = useMemo(() => {
    return {
      total: cases.length,
      completed: cases.filter(c => c.status === DiagnosticStatus.COMPLETED).length,
      pending: cases.filter(c => c.status === DiagnosticStatus.PENDING || c.status === DiagnosticStatus.ANALYZING).length,
      critical: cases.filter(c => c.result?.riskAssessment === 'Critical').length,
      high: cases.filter(c => c.result?.riskAssessment === 'High').length,
      medium: cases.filter(c => c.result?.riskAssessment === 'Moderate').length,
      low: cases.filter(c => c.result?.riskAssessment === 'Low').length
    };
  }, [cases]);

  const filteredAndSortedCases = useMemo(() => {
    let result = [...cases];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.patient.name.toLowerCase().includes(term) || 
        c.symptoms.toLowerCase().includes(term) ||
        c.id.toLowerCase().includes(term)
      );
    }

    // Risk filter
    if (riskFilter !== 'All') {
      result = result.filter(c => c.result?.riskAssessment === riskFilter);
    }

    // Status filter
    if (statusFilter !== 'All') {
      result = result.filter(c => c.status === statusFilter);
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortOption) {
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name-asc':
          return a.patient.name.localeCompare(b.patient.name);
        case 'name-desc':
          return b.patient.name.localeCompare(a.patient.name);
        case 'risk-high':
          const riskWeight = { 'Critical': 4, 'High': 3, 'Moderate': 2, 'Low': 1, undefined: 0 };
          return (riskWeight[b.result?.riskAssessment as keyof typeof riskWeight] || 0) - 
                 (riskWeight[a.result?.riskAssessment as keyof typeof riskWeight] || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [cases, searchTerm, sortOption, riskFilter, statusFilter]);

  const clearFilters = () => {
    setSearchTerm('');
    setRiskFilter('All');
    setStatusFilter('All');
    setSortOption('recent');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Clinical Case Archive</h1>
          <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            Managing {cases.length} patient records in the secure diagnostic hub
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {/* Simulated export */}}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button 
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <RefreshCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </header>

      {/* Stats Summary Row */}
      <div className="space-y-4">
        {/* Row 1: Case Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Cases', value: stats.total, icon: User, color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-50 dark:bg-slate-800/50' },
            { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            { label: 'In Progress', value: stats.pending, icon: Clock, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          ].map((stat, i) => (
            <div key={i} className={`p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm ${stat.bg} flex items-center gap-4`}>
              <div className={`p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stat.label}</p>
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Row 2: Risk Levels */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Critical', value: stats.critical, icon: AlertCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
            { label: 'High', value: stats.high, icon: Activity, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
            { label: 'Medium', value: stats.medium, icon: Activity, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
            { label: 'Low', value: stats.low, icon: Activity, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          ].map((stat, i) => (
            <div key={i} className={`p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm ${stat.bg} flex items-center gap-3`}>
              <div className={`p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-sm`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stat.label}</p>
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by patient name, symptoms, or case ID..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white dark:placeholder:text-slate-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${
                isFilterOpen 
                  ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <Filter className="w-4 h-4" />
              Advanced Filters
              {(riskFilter !== 'All' || statusFilter !== 'All') && (
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              )}
            </button>

            <div className="relative group">
              <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                <ArrowUpDown className="w-4 h-4" />
                Sort: {sortOption === 'recent' ? 'Recent' : sortOption === 'oldest' ? 'Oldest' : sortOption === 'name-asc' ? 'Name A-Z' : sortOption === 'name-desc' ? 'Name Z-A' : 'Risk Level'}
              </div>
              <select 
                className="absolute inset-0 opacity-0 cursor-pointer"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
              >
                <option value="recent">Sort: Recent First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="name-asc">Sort: Name (A-Z)</option>
                <option value="name-desc">Sort: Name (Z-A)</option>
                <option value="risk-high">Sort: Highest Risk</option>
              </select>
            </div>
          </div>
        </div>

        {/* Expanded Filters */}
        {isFilterOpen && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Risk Assessment</label>
              <div className="flex flex-wrap gap-2">
                {['All', 'Low', 'Moderate', 'High', 'Critical'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRiskFilter(r as RiskFilter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      riskFilter === r 
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Diagnostic Status</label>
              <div className="flex flex-wrap gap-2">
                {['All', ...Object.values(DiagnosticStatus)].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s as StatusFilter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      statusFilter === s 
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cases Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-bold">Patient Information</th>
                <th className="px-6 py-4 font-bold">Clinical Presentation</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Risk Assessment</th>
                <th className="px-6 py-4 font-bold">Timeline</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAndSortedCases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full">
                        <Search className="w-12 h-12 text-slate-200 dark:text-slate-700" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-900 dark:text-white font-bold">No matching cases found</p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Try adjusting your filters or search terms to find what you're looking for.</p>
                      </div>
                      <button 
                        onClick={clearFilters}
                        className="text-blue-600 dark:text-blue-400 text-sm font-bold hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        Clear all filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 font-black text-sm border border-slate-200 dark:border-slate-700 shadow-sm group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                          {c.patient.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{c.patient.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{c.patient.age}y • {c.patient.gender}</span>
                            <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                            <span className="text-[10px] text-blue-500 dark:text-blue-400 font-bold">{c.patient.bloodType}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 max-w-xs leading-relaxed">
                        {c.symptoms}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          {c.status === DiagnosticStatus.COMPLETED ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          ) : c.status === DiagnosticStatus.ANALYZING ? (
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                          ) : c.status === DiagnosticStatus.ERROR ? (
                            <XCircle className="w-3.5 h-3.5 text-red-500" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                          )}
                          <span className={`text-[10px] font-black uppercase tracking-widest ${
                            c.status === DiagnosticStatus.COMPLETED ? 'text-emerald-600 dark:text-emerald-400' :
                            c.status === DiagnosticStatus.ANALYZING ? 'text-blue-600 dark:text-blue-400' :
                            c.status === DiagnosticStatus.ERROR ? 'text-red-600 dark:text-red-400' :
                            'text-amber-600 dark:text-amber-400'
                          }`}>
                            {c.status}
                          </span>
                        </div>
                        {c.error && (
                          <div className="text-[9px] text-red-500 font-medium max-w-[140px] truncate bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded border border-red-100 dark:border-red-900/30">
                            {c.error}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {c.result ? (
                        <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border ${
                          c.result.riskAssessment === 'Critical' ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400' :
                          c.result.riskAssessment === 'High' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30 text-orange-700 dark:text-orange-400' :
                          c.result.riskAssessment === 'Moderate' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400' :
                          'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            c.result.riskAssessment === 'Critical' ? 'bg-red-500' :
                            c.result.riskAssessment === 'High' ? 'bg-orange-500' :
                            c.result.riskAssessment === 'Moderate' ? 'bg-amber-500' :
                            'bg-emerald-500'
                          }`}></div>
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            {c.result.riskAssessment}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-300 dark:text-slate-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                          <span className="text-[10px] font-bold uppercase tracking-widest italic">Pending</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
                        <span className="text-xs font-medium">{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-600 mt-1 font-mono ml-5">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => copyToClipboard(c.id)}
                          className="p-2 text-slate-400 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                          title="Copy Case ID"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onDeleteCase(c.id)}
                          className="p-2 text-slate-400 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onSelectCase(c)}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:bg-blue-600 dark:hover:bg-blue-400 transition-all shadow-sm"
                        >
                          Open Case
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Placeholder */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Showing {filteredAndSortedCases.length} of {cases.length} records
          </p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-400 dark:text-slate-600 cursor-not-allowed">Previous</button>
            <button className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-400 dark:text-slate-600 cursor-not-allowed">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CasesView;
