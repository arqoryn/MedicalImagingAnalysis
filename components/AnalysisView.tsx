
import React from 'react';
import { PatientCase, DiagnosticStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AnalysisViewProps {
  patientCase: PatientCase;
  onBack: () => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ patientCase, onBack }) => {
  const result = patientCase.result;

  if (patientCase.status === DiagnosticStatus.ANALYZING) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-6">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-blue-100 rounded-full"></div>
          <div className="w-24 h-24 border-4 border-blue-600 rounded-full border-t-transparent animate-spin absolute top-0"></div>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800">Processing Medical Intelligence</h2>
          <p className="text-slate-500 mt-2 max-w-md">MedGemma is analyzing symptoms, medical history, and imaging against clinical guidelines and peer-reviewed literature...</p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const chartData = result.differentials.map(d => ({
    name: d.condition,
    prob: d.probability * 100
  }));

  const riskColors = {
    'Low': 'bg-emerald-500',
    'Moderate': 'bg-amber-500',
    'High': 'bg-orange-500',
    'Critical': 'bg-red-600'
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Diagnostic Analysis Report</h1>
            <p className="text-sm text-slate-500">Case ID: {patientCase.id} • {patientCase.patient.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-500 uppercase">Risk Level:</span>
          <span className={`px-3 py-1 rounded-full text-white text-xs font-bold ${riskColors[result.riskAssessment]}`}>
            {result.riskAssessment}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Summary & Differentials */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 tracking-wider">Clinical Summary</h3>
            <p className="text-slate-700 leading-relaxed text-lg italic">"{result.summary}"</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 tracking-wider">Differential Probabilities</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fontWeight: 500 }} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Probability']}
                  />
                  <Bar dataKey="prob" radius={[0, 4, 4, 0]} barSize={32}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#2563eb' : '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Condition Rationales</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {result.differentials.map((d, i) => (
                <div key={i} className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-800 text-lg">{d.condition}</h4>
                    <span className="text-blue-600 font-bold">{(d.probability * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-slate-600 text-sm mb-4 leading-relaxed">{d.rationale}</p>
                  <div className="flex flex-wrap gap-2">
                    {d.recommendedTests.map((test, j) => (
                      <span key={j} className="bg-blue-50 text-blue-700 text-[10px] font-bold uppercase px-2 py-1 rounded tracking-wide border border-blue-100">
                        {test}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Reasoning & Evidence */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-slate-300 p-6 rounded-xl shadow-lg border border-slate-800">
            <h3 className="text-xs font-bold text-blue-400 uppercase mb-4 tracking-widest flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
              AI Clinical Reasoning
            </h3>
            <div className="text-sm leading-relaxed whitespace-pre-line font-mono text-slate-200 opacity-90">
              {result.clinicalReasoning}
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-tighter">MedGemma-2-9B v4.1 Output</span>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
            <h4 className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-2 uppercase tracking-wide">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              Clinical Disclaimer
            </h4>
            <p className="text-xs text-amber-700 leading-normal">
              This report is for decision support only and does not constitute a definitive medical diagnosis. All findings must be reviewed and validated by a licensed healthcare professional.
            </p>
          </div>

          {patientCase.imagingUrl && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wide">Analyzed Media</h4>
              <img src={patientCase.imagingUrl} className="w-full rounded-lg h-40 object-cover" alt="Input Data" referrerPolicy="no-referrer" />
              <button className="w-full mt-3 py-2 text-xs font-semibold text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-50">View Full Resolution</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;
