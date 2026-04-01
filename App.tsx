
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import NewCase from './components/NewCase';
import AnalysisView from './components/AnalysisView';
import ResearchView from './components/ResearchView';
import { PatientCase, DiagnosticStatus } from './types';
import { analyzeMedicalCase } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [cases, setCases] = useState<PatientCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<PatientCase | null>(null);

  const handleNewCase = async (newCase: PatientCase) => {
    setCases(prev => [newCase, ...prev]);
    setActiveTab('dashboard');
    
    // Start AI analysis
    setCases(prev => prev.map(c => c.id === newCase.id ? { ...c, status: DiagnosticStatus.ANALYZING } : c));
    
    try {
      const result = await analyzeMedicalCase(newCase);
      setCases(prev => prev.map(c => c.id === newCase.id ? { 
        ...c, 
        status: DiagnosticStatus.COMPLETED,
        result 
      } : c));
    } catch (err) {
      console.error('Analysis failed:', err);
      setCases(prev => prev.map(c => c.id === newCase.id ? { ...c, status: DiagnosticStatus.ERROR } : c));
    }
  };

  const renderContent = () => {
    if (selectedCase) {
      const currentCase = cases.find(c => c.id === selectedCase.id) || selectedCase;
      return <AnalysisView patientCase={currentCase} onBack={() => setSelectedCase(null)} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard cases={cases} onSelectCase={setSelectedCase} />;
      case 'new-case':
        return <NewCase onSubmit={handleNewCase} />;
      case 'literature':
        return <ResearchView />;
      case 'settings':
        return (
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm max-w-2xl">
            <h2 className="text-xl font-bold mb-6">System Settings</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">Edge-Computing Mode</p>
                  <p className="text-sm text-slate-500">Run lightweight models locally for air-gapped environments.</p>
                </div>
                <div className="w-12 h-6 bg-slate-200 rounded-full relative">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">HIPAA Data Retention</p>
                  <p className="text-sm text-slate-500">Automatically scrub data after session termination.</p>
                </div>
                <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <Dashboard cases={cases} onSelectCase={setSelectedCase} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar activeTab={activeTab} setActiveTab={(tab) => {
        setSelectedCase(null);
        setActiveTab(tab);
      }} />
      <main className="flex-1 ml-64 p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
