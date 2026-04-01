
import React, { useState } from 'react';
import { searchMedicalLiterature } from '../services/geminiService';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ResearchView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string, sources: any[] } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    try {
      const data = await searchMedicalLiterature(query);
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Medical Knowledge Base</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">Access real-time medical literature, clinical trials, and healthcare guidelines through Clinical Intelligence Grounding.</p>
        
        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
          <input 
            type="text" 
            placeholder="e.g., Latest treatment protocols for Multiple Sclerosis..."
            className="w-full pl-12 pr-24 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 outline-none transition-all dark:text-white dark:placeholder:text-slate-500"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <svg className="w-6 h-6 text-slate-400 dark:text-slate-600 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <button 
            type="submit"
            disabled={loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-600/20"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </header>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-4 tracking-widest">Synthesis</h3>
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <Markdown remarkPlugins={[remarkGfm]}>{result.text}</Markdown>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.sources.map((source, i) => (
              <a 
                key={i} 
                href={source.uri} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                    {i + 1}
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{source.title}</span>
                </div>
                <svg className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchView;
