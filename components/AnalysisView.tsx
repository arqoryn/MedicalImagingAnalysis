
import React, { useRef } from 'react';
import { PatientCase, DiagnosticStatus, VisualAnnotation } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Markdown from 'react-markdown';
import { marked } from 'marked';
import remarkGfm from 'remark-gfm';
import Logo from './Logo';

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
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Processing Medical Intelligence</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">Clinical Intelligence is analyzing symptoms, medical history, and imaging against clinical guidelines and peer-reviewed literature...</p>
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
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
      alert('Please allow popups to view the formal report.');
      return;
    }

    const label = (i: number) => String.fromCharCode(65 + i);
    
    const annotationsHtml = result.annotations?.map((ann, i) => `
      <div class="absolute" style="left: ${ann.x / 10}%; top: ${ann.y / 10}%; transform: translate(-50%, -50%);">
        ${ann.type === 'Primary' ? `
          <div class="w-8 h-8 border-4 border-red-600 rounded-full bg-red-600/10 flex items-center justify-center">
            <span class="text-[10px] font-black text-red-700">${label(i)}</span>
          </div>
        ` : `
          <div class="flex flex-col items-center">
            <div class="text-yellow-500" style="font-size: 24px;">★</div>
            <span class="text-[8px] font-black text-yellow-800 bg-white/90 px-1 rounded border border-yellow-300 -mt-2">${label(i)}</span>
          </div>
        `}
      </div>
    `).join('') || '';

    const differentialsHtml = result.differentials.map(d => `
      <div class="py-4 border-b border-slate-100 last:border-0">
        <div class="flex justify-between items-start mb-1">
          <h4 class="font-bold text-slate-800">${d.condition}</h4>
          <span class="text-blue-700 font-bold text-sm">${(d.probability * 100).toFixed(0)}%</span>
        </div>
        <p class="text-slate-600 text-xs mb-2 leading-relaxed">${d.rationale}</p>
        <div class="flex flex-wrap gap-1">
          ${d.recommendedTests.map(test => `<span class="bg-slate-100 text-slate-600 text-[8px] font-bold uppercase px-2 py-0.5 rounded border border-slate-200">${test}</span>`).join('')}
        </div>
      </div>
    `).join('');

    const dietaryHtml = result.dietaryRecommendations?.map(r => `<li class="text-xs text-slate-600 mb-1">${r}</li>`).join('') || '<li class="text-xs text-slate-400 italic">No specific recommendations.</li>';
    const precautionsHtml = result.precautions?.map(p => `<li class="text-xs text-slate-600 mb-1">${p}</li>`).join('') || '<li class="text-xs text-slate-400 italic">No specific precautions.</li>';

    const prognosticsHtml = result.prognostics?.map(p => `
      <div class="py-4 border-b border-slate-100 last:border-0">
        <div class="flex justify-between items-end mb-2">
          <div>
            <h4 class="font-bold text-slate-800 text-sm">${p.treatment}</h4>
            <div class="text-[9px] font-mono font-bold text-blue-600 uppercase tracking-widest mt-0.5">Survival: ${p.survivalEstimate}</div>
          </div>
          <div class="text-right">
            <div class="text-[8px] font-bold text-slate-400 uppercase leading-none mb-1">Success Likelihood</div>
            <div class="text-xl font-black text-blue-600 leading-none">${p.successRate}%</div>
          </div>
        </div>
        <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
          <div class="h-full bg-blue-600" style="width: ${p.successRate}%"></div>
        </div>
        <p class="text-[10px] text-slate-500 leading-relaxed italic">"${p.rationale}"</p>
      </div>
    `).join('') || '<div class="text-slate-400 italic text-xs py-4">Prognostic data unavailable.</div>';

    const annotationKeyHtml = result.annotations?.map((ann, i) => `
      <div class="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 break-inside-avoid">
        <div class="w-6 h-6 shrink-0 rounded flex items-center justify-center text-xs font-bold text-white ${ann.type === 'Primary' ? 'bg-red-600' : 'bg-yellow-600'}">
          ${label(i)}
        </div>
        <div>
          <div class="text-xs font-bold text-slate-800">${ann.label}</div>
          <div class="text-[10px] text-slate-500 leading-tight">${ann.description}</div>
        </div>
      </div>
    `).join('') || '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Diagnostic Report - ${patientCase.patient.name}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Libre+Baskerville:italic&family=JetBrains+Mono&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', sans-serif; padding: 40px; background: #f1f5f9; }
          .page { background: white; width: 210mm; min-height: 297mm; margin: 0 auto; padding: 20mm; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
          @media print {
            body { padding: 0; background: white; }
            .page { box-shadow: none; margin: 0; width: 100%; }
            .no-print { display: none; }
          }
          .font-serif { font-family: 'Libre Baskerville', serif; }
          .font-mono { font-family: 'JetBrains Mono', monospace; }
          .break-inside-avoid { break-inside: avoid; }
          .prose h1 { font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; margin-top: 1.5rem; color: #0f172a; }
          .prose h2 { font-size: 1.25rem; font-weight: bold; margin-bottom: 0.75rem; margin-top: 1.25rem; color: #1e293b; }
          .prose h3 { font-size: 1.125rem; font-weight: bold; margin-bottom: 0.5rem; margin-top: 1rem; color: #1e293b; }
          .prose p { margin-bottom: 1rem; line-height: 1.6; color: #334155; }
          .prose ul { list-style-type: disc; padding-left: 1.25rem; margin-bottom: 1rem; }
          .prose ol { list-style-type: decimal; padding-left: 1.25rem; margin-bottom: 1rem; }
          .prose li { margin-bottom: 0.5rem; line-height: 1.6; color: #334155; }
          .prose strong { font-weight: bold; color: #0f172a; }
          .prose em { font-style: italic; }
        </style>
      </head>
      <body>
        <div class="no-print flex justify-center mb-8">
          <button onclick="window.print()" class="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">Confirm & Print Document</button>
        </div>
        
        <div class="page">
          <header class="border-b-4 border-slate-900 pb-8 mb-8 flex justify-between items-start">
            <div class="flex items-center gap-6">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center p-1.5">
                  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="48" fill="#0F172A" />
                    <circle cx="50" cy="50" r="44" stroke="white" stroke-width="4" />
                    <path d="M45 30C33.9543 30 25 38.9543 25 50C25 61.0457 33.9543 70 45 70" stroke="white" stroke-width="10" stroke-linecap="round" fill="none" />
                    <path d="M60 35V65M45 50H75" stroke="white" stroke-width="10" stroke-linecap="round" />
                    <circle cx="60" cy="50" r="5" fill="#0F172A" />
                    <circle cx="61" cy="49" r="1.5" fill="white" opacity="0.8" />
                  </svg>
                </div>
                <div class="text-slate-900 font-black text-[10px] uppercase tracking-tighter leading-tight">
                  Clinical Intelligence<br/>Diagnostic Suite
                </div>
              </div>
              <div class="w-px h-10 bg-slate-300"></div>
              <div>
                <h1 class="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Diagnostic Summary</h1>
                <p class="text-slate-500 font-mono text-[9px] mt-1 uppercase tracking-widest">Formal Clinical Output</p>
              </div>
            </div>
            <div class="text-right">
              <div class="text-[10px] font-bold text-slate-400 uppercase">Case Reference</div>
              <div class="text-xl font-mono font-bold text-slate-900">${patientCase.id}</div>
              <div class="text-[10px] text-slate-500 mt-1">${new Date().toLocaleDateString()}</div>
            </div>
          </header>

          <div class="grid grid-cols-2 gap-8 mb-10">
            <section>
              <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Patient Demographics</h3>
              <table class="w-full text-sm">
                <tr class="border-b border-slate-100"><td class="py-2 text-slate-500">Name</td><td class="py-2 font-bold text-right">${patientCase.patient.name}</td></tr>
                <tr class="border-b border-slate-100"><td class="py-2 text-slate-500">Age / Gender</td><td class="py-2 font-bold text-right">${patientCase.patient.age}Y / ${patientCase.patient.gender}</td></tr>
                <tr class="border-b border-slate-100"><td class="py-2 text-slate-500">Blood Group</td><td class="py-2 font-bold text-right">${patientCase.patient.bloodType}</td></tr>
              </table>
            </section>
            <section>
              <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Clinical Context</h3>
              <div class="text-xs text-slate-600 leading-relaxed">
                <strong>Symptoms:</strong> ${patientCase.symptoms}<br>
                <strong class="mt-2 block">History:</strong> ${patientCase.patient.history}
              </div>
            </section>
          </div>

          <section class="mb-10 break-inside-avoid">
            <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Executive Clinical Summary</h3>
            <p class="text-lg font-serif text-slate-800 leading-relaxed italic">"${result.summary}"</p>
          </section>

          ${patientCase.imagingUrl ? `
            <section class="mb-10 break-inside-avoid">
              <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Visual Observations & Annotations</h3>
              <div class="relative rounded-xl overflow-hidden border-2 border-slate-100 bg-slate-50 mb-6">
                <img src="${patientCase.imagingUrl}" class="w-full h-auto max-h-[400px] object-contain mx-auto" />
                <div class="absolute inset-0">${annotationsHtml}</div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                ${annotationKeyHtml}
              </div>
            </section>
          ` : ''}

          <section class="mb-10 break-inside-avoid">
            <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Differential Diagnosis & Rationales</h3>
            <div class="space-y-2">
              ${differentialsHtml}
            </div>
          </section>

          <section class="mb-10 break-inside-avoid">
            <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Lifestyle & Safety Guidance</h3>
            <div class="grid grid-cols-2 gap-8">
              <div>
                <h4 class="text-[9px] font-bold text-slate-800 uppercase mb-2">Dietary Recommendations</h4>
                <ul class="list-disc pl-4">
                  ${dietaryHtml}
                </ul>
              </div>
              <div>
                <h4 class="text-[9px] font-bold text-slate-800 uppercase mb-2">Clinical Precautions</h4>
                <ul class="list-disc pl-4">
                  ${precautionsHtml}
                </ul>
              </div>
            </div>
          </section>

          <section class="mb-10 break-inside-avoid">
            <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Prognostic Analytics & Treatment Response</h3>
            <div class="space-y-2">
              ${prognosticsHtml}
            </div>
          </section>

          <section class="mb-12 break-inside-avoid">
            <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">AI Clinical Reasoning Path</h3>
            <div class="bg-slate-50 p-6 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed prose prose-sm prose-slate">
              ${marked.parse(result.clinicalReasoning)}
            </div>
          </section>

          <footer class="mt-auto pt-12 border-t-2 border-slate-100">
            <div class="flex justify-between items-end">
              <div class="space-y-6">
                <div class="w-64 h-px bg-slate-300"></div>
                <div class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Authorized Physician Signature</div>
              </div>
              <div class="text-right">
                <div class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Risk Assessment</div>
                <div class="px-4 py-1 bg-slate-900 text-white text-xs font-black rounded uppercase">${result.riskAssessment}</div>
              </div>
            </div>
            <div class="mt-8 text-center text-[8px] text-slate-400 uppercase tracking-widest">
              This document is an AI-generated clinical decision support tool. Final diagnosis remains the responsibility of the attending physician.
            </div>
          </footer>
        </div>
      </body>
      </html>
    `;

    reportWindow.document.write(html);
    reportWindow.document.close();
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
          <button onClick={onBack} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Diagnostic Analysis Report</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Case ID: {patientCase.id} • {patientCase.patient.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-700 dark:hover:bg-slate-100 transition-all font-bold text-sm shadow-lg shadow-slate-900/20 dark:shadow-none"
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
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Logo className="w-10 h-10" />
              <div className="text-slate-900 font-black text-[10px] uppercase tracking-tighter leading-tight">
                Clinical Intelligence<br/>Diagnostic Suite
              </div>
            </div>
            <div className="w-px h-8 bg-slate-300"></div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">Diagnostic Summary Report</h1>
              <p className="text-slate-500 font-mono text-[9px] mt-1 uppercase tracking-widest">Generated on {new Date().toLocaleDateString()}</p>
            </div>
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
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm break-inside-avoid">
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-4 tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Patient Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="block text-slate-400 dark:text-slate-500 uppercase text-[9px] font-bold">Name</span>
                <span className="font-bold text-slate-900 dark:text-white">{patientCase.patient.name}</span>
              </div>
              <div>
                <span className="block text-slate-400 dark:text-slate-500 uppercase text-[9px] font-bold">Age/Gender</span>
                <span className="font-bold text-slate-900 dark:text-white">{patientCase.patient.age}Y / {patientCase.patient.gender}</span>
              </div>
              <div>
                <span className="block text-slate-400 dark:text-slate-500 uppercase text-[9px] font-bold">Blood Type</span>
                <span className="font-bold text-slate-900 dark:text-white">{patientCase.patient.bloodType}</span>
              </div>
              <div>
                <span className="block text-slate-400 dark:text-slate-500 uppercase text-[9px] font-bold">Date</span>
                <span className="font-bold text-slate-900 dark:text-white">{new Date(patientCase.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm break-inside-avoid">
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-4 tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Clinical Findings</h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg italic font-serif">"{result.summary}"</p>
          </section>

          {patientCase.imagingUrl && (
            <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm break-inside-avoid">
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-4 tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Visual Observations & Annotations</h3>
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
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
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Annotation Key</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.annotations.map((ann, i) => (
                      <div key={i} className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className={`w-6 h-6 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold text-white ${ann.type === 'Primary' ? 'bg-red-500 shadow-lg shadow-red-500/20' : 'bg-yellow-500 shadow-lg shadow-yellow-500/20'}`}>
                          {String.fromCharCode(65 + i)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">{ann.label}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{ann.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm break-inside-avoid">
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-4 tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Lifestyle & Safety Guidance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/></svg>
                  Dietary Recommendations
                </h4>
                <ul className="space-y-2">
                  {result.dietaryRecommendations?.map((rec, i) => (
                    <li key={i} className="flex gap-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      <span className="text-emerald-500 font-bold">•</span>
                      {rec}
                    </li>
                  ))}
                  {(!result.dietaryRecommendations || result.dietaryRecommendations.length === 0) && (
                    <li className="text-xs text-slate-400 italic">No specific dietary recommendations provided.</li>
                  )}
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                  <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  Clinical Precautions
                </h4>
                <ul className="space-y-2">
                  {result.precautions?.map((pre, i) => (
                    <li key={i} className="flex gap-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      <span className="text-amber-500 font-bold">•</span>
                      {pre}
                    </li>
                  ))}
                  {(!result.precautions || result.precautions.length === 0) && (
                    <li className="text-xs text-slate-400 italic">No specific precautions provided.</li>
                  )}
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm break-inside-avoid">
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-4 tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Prognostic Analytics</h3>
            <div className="space-y-8">
              {result.prognostics?.map((p, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-lg">{p.treatment}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/30">Survival Estimate</span>
                        <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">{p.survivalEstimate}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Success Likelihood</span>
                      <span className="text-2xl font-black text-blue-600 dark:text-blue-400 leading-none">{p.successRate}%</span>
                    </div>
                  </div>
                  
                  <div className="relative h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-1000 ease-out"
                      style={{ width: `${p.successRate}%` }}
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[shimmer_2s_linear_infinite]"></div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <strong className="text-slate-700 dark:text-slate-300 uppercase text-[9px] tracking-tighter mr-2">Rationale:</strong>
                    {p.rationale}
                  </p>
                </div>
              ))}
              {!result.prognostics && (
                <div className="py-8 text-center text-slate-400 dark:text-slate-600 italic text-sm">
                  Prognostic data unavailable for this specific case profile.
                </div>
              )}
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm break-inside-avoid">
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-4 tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Differential Diagnosis</h3>
            <div className="h-64 mb-6 no-print">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fontWeight: 500, fill: '#64748b' }} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
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
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {result.differentials.map((d, i) => (
                <div key={i} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-900 dark:text-white">{d.condition}</h4>
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">{(d.probability * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-xs mb-3 leading-relaxed">{d.rationale}</p>
                  <div className="flex flex-wrap gap-2">
                    {d.recommendedTests.map((test, j) => (
                      <span key={j} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] font-bold uppercase px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
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
          <section className="bg-slate-900 dark:bg-slate-950 text-slate-300 p-6 rounded-2xl shadow-lg border border-slate-800 break-inside-avoid">
            <h3 className="text-[10px] font-bold text-blue-400 uppercase mb-4 tracking-widest flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
              AI Clinical Reasoning
            </h3>
            <div className="text-sm leading-relaxed font-mono text-slate-200 opacity-90 prose prose-invert prose-sm prose-slate max-w-none">
              <Markdown remarkPlugins={[remarkGfm]}>{result.clinicalReasoning}</Markdown>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-tighter">Clinical Intelligence v4.1 Output</span>
            </div>
          </section>

          <section className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-4 rounded-xl break-inside-avoid">
            <h4 className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-sm mb-2 uppercase tracking-wide">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              Clinical Disclaimer
            </h4>
            <p className="text-xs text-amber-700 dark:text-amber-500 leading-normal">
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
