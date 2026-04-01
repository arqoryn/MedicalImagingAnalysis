
import React, { useState } from 'react';
import { PatientCase, DiagnosticStatus, PatientInfo } from '../types';

interface NewCaseProps {
  onSubmit: (newCase: PatientCase) => void;
}

const NewCase: React.FC<NewCaseProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<Partial<PatientInfo>>({
    name: '',
    age: 0,
    gender: 'Male',
    bloodType: 'O+',
    history: ''
  });
  const [symptoms, setSymptoms] = useState('');
  const [imaging, setImaging] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImaging(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCase: PatientCase = {
      id: '', // Will be set by Firestore
      patient: {
        id: Math.random().toString(36).substr(2, 9),
        ...formData as PatientInfo
      },
      symptoms,
      status: DiagnosticStatus.PENDING,
      createdAt: new Date().toISOString()
    };

    if (imaging) {
      newCase.imagingUrl = imaging;
    }

    onSubmit(newCase);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">New Diagnostic Intake</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Provide patient details and clinical observations for Clinical Intelligence analysis.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Patient Demographics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Full Name</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white dark:placeholder:text-slate-500"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Age</label>
              <input 
                type="number" 
                required
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                value={formData.age || ''}
                onChange={e => setFormData({...formData, age: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Gender</label>
              <select 
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                value={formData.gender}
                onChange={e => setFormData({...formData, gender: e.target.value as any})}
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Blood Group</label>
              <select 
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                value={formData.bloodType}
                onChange={e => setFormData({...formData, bloodType: e.target.value})}
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Clinical Observations</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Current Symptoms & Presentation</label>
              <textarea 
                required
                rows={4}
                placeholder="Describe current symptoms, onset, and duration..."
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white dark:placeholder:text-slate-500"
                value={symptoms}
                onChange={e => setSymptoms(e.target.value)}
              ></textarea>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Relevant Medical History</label>
              <textarea 
                rows={3}
                placeholder="Chronic conditions, allergies, past procedures..."
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white dark:placeholder:text-slate-500"
                value={formData.history}
                onChange={e => setFormData({...formData, history: e.target.value})}
              ></textarea>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Imaging & Diagnostics (Optional)</h2>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-2xl cursor-pointer bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              {imaging ? (
                <div className="relative w-full h-full p-2">
                  <img src={imaging} alt="Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); setImaging(null); }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-10 h-10 mb-3 text-slate-400 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                  <p className="mb-2 text-sm text-slate-500 dark:text-slate-400 font-bold">Click to upload medical imaging</p>
                  <p className="text-xs text-slate-400 dark:text-slate-600 uppercase tracking-widest font-bold">X-Ray, MRI, Scans (Max. 5MB)</p>
                </div>
              )}
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
          </div>
        </section>

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button type="button" className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
          <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all transform active:scale-95">Initiate AI Analysis</button>
        </div>
      </form>
    </div>
  );
};

export default NewCase;
