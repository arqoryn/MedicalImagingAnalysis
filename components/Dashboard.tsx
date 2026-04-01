
import React from 'react';
import { PatientCase, DiagnosticStatus } from '../types';

interface DashboardProps {
  cases: PatientCase[];
  onSelectCase: (c: PatientCase) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ cases, onSelectCase }) => {
  const stats = [
    { label: 'Active Cases', value: cases.filter(c => c.status !== DiagnosticStatus.COMPLETED).length, color: 'text-blue-600' },
    { label: 'Critical Risks', value: cases.filter(c => c.result?.riskAssessment === 'Critical').length, color: 'text-red-600' },
    { label: 'Analyses Today', value: cases.length, color: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Clinical Dashboard</h1>
        <div className="text-sm text-slate-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-semibold text-slate-800">Recent Patient Cases</h2>
          <button className="text-blue-600 text-sm font-medium hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 font-semibold">Patient</th>
                <th className="px-6 py-3 font-semibold">Symptoms</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Risk</th>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">No active cases found. Create a new case to start analysis.</td>
                </tr>
              ) : (
                cases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{c.patient.name}</div>
                      <div className="text-xs text-slate-500">{c.patient.age}y • {c.patient.gender}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600 truncate max-w-xs">{c.symptoms}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        c.status === DiagnosticStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' :
                        c.status === DiagnosticStatus.ANALYZING ? 'bg-blue-100 text-blue-700 animate-pulse' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {c.result ? (
                        <span className={`text-xs font-bold ${
                          c.result.riskAssessment === 'Critical' ? 'text-red-600' :
                          c.result.riskAssessment === 'High' ? 'text-orange-600' :
                          'text-slate-600'
                        }`}>
                          {c.result.riskAssessment}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => onSelectCase(c)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        View Analysis
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
  );
};

export default Dashboard;
