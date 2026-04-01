
import React, { useRef } from 'react';
import { PatientCase, DiagnosticStatus, VisualAnnotation } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AnalysisViewProps {
  patientCase: PatientCase;
  onBack: () => void;
}

const AnnotationOverlay: React.FC<{ annotations: VisualAnnotation[] }> = ({ annotations }) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {annotations.map((ann, i) => {
        const label = String.fromCharCode(65 + i);
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${ann.x / 10}%`,
              top: `${ann.y / 10}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            {ann.type === 'Primary' ? (
              <div className="relative flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-red-500 rounded-full animate-pulse bg-red-500/10 flex items-center justify-center">
                  <span className="text-xs font-black text-red-600 drop-shadow-md">{label}</span>
                </div>
              </div>
            ) : (
              <div className="relative flex flex-col items-center">
                <svg className="w-8 h-8 text-yellow-400 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                <span className="text-[10px] font-black text-yellow-700 bg-white/90 px-1 rounded border border-yellow-200 -mt-1">{label}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const AnalysisView: React.FC<AnalysisViewProps> = ({ patientCase, onBack }) => {
  const result = patientCase.result;
  const printRef = useRef<HTMLDivElement>(null);

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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto report-container" ref={printRef}>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .report-container {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .grid {
            display: block !important;
          }
          .lg\\:col-span-2, .lg\\:grid-cols-3 {
            width: 100% !important;
          }
          .bg-slate-900 {
            background-color: #f8fafc !important;
            color: #1e293b !important;
            border: 1px solid #e2e8f0 !important;
          }
          .text-blue-400 {
            color: #2563eb !important;
          }
          .text-slate-200 {
            color: #334155 !important;
          }
          .break-inside-avoid {
            break-inside: avoid;
          }
        }
      `}</style>

      <header className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Diagnostic Analysis Report</h1>
            <p className="text-sm text-slate-500">Case ID: {patientCase.id} • {patientCase.patient.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all font-bold text-sm shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
            Print Report
          </button>
          <div className={`px-3 py-1 rounded-full text-white text-xs font-bold ${riskColors[result.riskAssessment]}`}>
            {result.riskAssessment} Risk
          </div>
        </div>
      </header>

      {/* Print-only Header */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-6 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Diagnostic Summary Report</h1>
            <p className="text-slate-500 font-mono text-xs mt-1">Generated by Generative Medical Diagnostic Hub • {new Date().toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-slate-400 uppercase">Case Reference</div>
            <div className="text-lg font-mono font-bold text-slate-800">{patientCase.id}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Summary & Differentials */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm break-inside-avoid">
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 tracking-wider border-b border-slate-100 pb-2">Patient Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="block text-slate-400 uppercase text-[10px] font-bold">Name</span>
                <span className="font-bold text-slate-800">{patientCase.patient.name}</span>
              </div>
              <div>
                <span className="block text-slate-400 uppercase text-[10px] font-bold">Age/Gender</span>
                <span className="font-bold text-slate-800">{patientCase.patient.age}Y / {patientCase.patient.gender}</span>
              </div>
              <div>
                <span className="block text-slate-400 uppercase text-[10px] font-bold">Blood Type</span>
                <span className="font-bold text-slate-800">{patientCase.patient.bloodType}</span>
              </div>
              <div>
                <span className="block text-slate-400 uppercase text-[10px] font-bold">Date</span>
                <span className="font-bold text-slate-800">{new Date(patientCase.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm break-inside-avoid">
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 tracking-wider border-b border-slate-100 pb-2">Clinical Findings</h3>
            <p className="text-slate-700 leading-relaxed text-lg italic font-serif">"{result.summary}"</p>
          </section>

          {patientCase.imagingUrl && (
            <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm break-inside-avoid">
              <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 tracking-wider border-b border-slate-100 pb-2">Visual Observations & Annotations</h3>
              <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                <img 
                  src={patientCase.imagingUrl} 
                  className="w-full h-auto max-h-[500px] object-contain mx-auto" 
                  alt="Medical Imaging" 
                  referrerPolicy="no-referrer" 
                />
                {result.annotations && <AnnotationOverlay annotations={result.annotations} />}
              </div>
              
              {result.annotations && result.annotations.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Annotation Key</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.annotations.map((ann, i) => (
                      <div key={i} className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className={`w-6 h-6 shrink-0 rounded flex items-center justify-center text-xs font-bold text-white ${ann.type === 'Primary' ? 'bg-red-500' : 'bg-yellow-500'}`}>
                          {String.fromCharCode(65 + i)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800">{ann.label}</div>
                          <div className="text-[10px] text-slate-500 leading-tight">{ann.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm break-inside-avoid">
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 tracking-wider border-b border-slate-100 pb-2">Differential Diagnosis</h3>
            <div className="h-64 mb-6 no-print">
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
            <div className="divide-y divide-slate-100">
              {result.differentials.map((d, i) => (
                <div key={i} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-800">{d.condition}</h4>
                    <span className="text-blue-600 font-bold text-sm">{(d.probability * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-slate-600 text-xs mb-3 leading-relaxed">{d.rationale}</p>
                  <div className="flex flex-wrap gap-2">
                    {d.recommendedTests.map((test, j) => (
                      <span key={j} className="bg-slate-100 text-slate-600 text-[9px] font-bold uppercase px-2 py-0.5 rounded border border-slate-200">
                        {test}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Reasoning & Evidence */}
        <div className="space-y-6">
          <section className="bg-slate-900 text-slate-300 p-6 rounded-xl shadow-lg border border-slate-800 break-inside-avoid">
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
          </section>

          <section className="bg-amber-50 border border-amber-200 p-4 rounded-xl break-inside-avoid">
            <h4 className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-2 uppercase tracking-wide">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              Clinical Disclaimer
            </h4>
            <p className="text-xs text-amber-700 leading-normal">
              This report is for decision support only and does not constitute a definitive medical diagnosis. All findings must be reviewed and validated by a licensed healthcare professional.
            </p>
          </section>

          <div className="hidden print:block pt-12 mt-12 border-t border-slate-200">
            <div className="flex justify-between items-end">
              <div className="space-y-4">
                <div className="w-48 h-px bg-slate-400"></div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Reviewing Physician Signature</div>
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Page 1 of 1</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;
