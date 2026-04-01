
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Chatbot from './components/Chatbot';
import Logo from './components/Logo';
import Dashboard from './components/Dashboard';
import CasesView from './components/CasesView';
import NewCase from './components/NewCase';
import AnalysisView from './components/AnalysisView';
import ResearchView from './components/ResearchView';
import { PatientCase, DiagnosticStatus } from './types';
import { analyzeMedicalCase } from './services/geminiService';
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  orderBy,
  getDocFromServer,
  getDocs
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const Login: React.FC = () => {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        <Logo className="w-20 h-20 mx-auto mb-6 shadow-2xl shadow-slate-900/40" />
        <h1 className="text-3xl font-black text-slate-900 mb-2 leading-tight">Clinical Intelligence Diagnostic Suite</h1>
        <p className="text-slate-500 mb-8 text-sm">Professional AI-assisted medical diagnostic support platform.</p>
        <button 
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-xl"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [cases, setCases] = useState<PatientCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<PatientCase | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system';
    }
    return 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const applyTheme = (t: 'light' | 'dark' | 'system') => {
      root.classList.remove('light', 'dark');
      
      if (t === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(t);
      }
      localStorage.setItem('theme', t);
    };

    applyTheme(theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();
  }, []);

  useEffect(() => {
    if (!user || !isAuthReady) return;

    const q = query(
      collection(db, 'cases'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const casesData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as PatientCase[];
      setCases(casesData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'cases');
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  const handleNewCase = async (newCase: PatientCase) => {
    if (!user) return;

    const { id, ...rest } = newCase;
    const caseData = {
      ...rest,
      uid: user.uid,
      status: DiagnosticStatus.ANALYZING,
      createdAt: new Date().toISOString()
    };

    // Remove undefined fields to prevent Firestore errors
    Object.keys(caseData).forEach(key => {
      if ((caseData as any)[key] === undefined) {
        delete (caseData as any)[key];
      }
    });

    let docRef;
    try {
      docRef = await addDoc(collection(db, 'cases'), caseData);
      setActiveTab('dashboard');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'cases');
      return;
    }
    
    try {
      const result = await analyzeMedicalCase(newCase);
      await updateDoc(doc(db, 'cases', docRef.id), {
        status: DiagnosticStatus.COMPLETED,
        result
      });
    } catch (err: any) {
      console.error('Analysis failed:', err);
      const errorMessage = err.message?.includes('429') || err.message?.includes('quota') 
        ? 'API Quota Exceeded. Please wait a moment and try again.' 
        : 'Analysis failed due to a system error.';
      
      await updateDoc(doc(db, 'cases', docRef.id), {
        status: DiagnosticStatus.ERROR,
        error: errorMessage
      }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `cases/${docRef.id}`));
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const seedData = async () => {
    if (!user) return;

    const demoCases: Partial<PatientCase>[] = [
      {
        patient: {
          id: 'P-101',
          name: 'Sarah Jenkins',
          age: 45,
          gender: 'Female',
          bloodType: 'A+',
          history: 'Smoker (10 years), mild asthma managed with inhaler.'
        },
        symptoms: 'Persistent productive cough for 2 weeks, high fever (102F), sharp chest pain when breathing deeply.',
        status: DiagnosticStatus.PENDING
      },
      {
        patient: {
          id: 'P-102',
          name: 'Robert Chen',
          age: 68,
          gender: 'Male',
          bloodType: 'O-',
          history: 'Hypertension, Type 2 Diabetes, sedentary lifestyle.'
        },
        symptoms: 'Sudden onset of heart palpitations, dizziness, and mild shortness of breath while resting.',
        status: DiagnosticStatus.PENDING
      },
      {
        patient: {
          id: 'P-103',
          name: 'Elena Rodriguez',
          age: 32,
          gender: 'Female',
          bloodType: 'B+',
          history: 'Chronic migraines since adolescence, family history of neurological issues.'
        },
        symptoms: 'Severe unilateral throbbing headache, extreme light sensitivity, nausea, and visual auras.',
        status: DiagnosticStatus.PENDING
      },
      {
        patient: {
          id: 'P-104',
          name: 'David Miller',
          age: 54,
          gender: 'Male',
          bloodType: 'AB+',
          history: 'Significant sun exposure due to outdoor occupation, fair skin, multiple dysplastic nevi.'
        },
        symptoms: 'Irregular mole on lower back, approximately 8mm, changing color from brown to black with asymmetrical borders.',
        status: DiagnosticStatus.PENDING
      },
      {
        patient: {
          id: 'P-105',
          name: 'Marcus Thompson',
          age: 22,
          gender: 'Male',
          bloodType: 'O+',
          history: 'Active athlete, previous minor ankle sprain 2 years ago.'
        },
        symptoms: 'Sudden "pop" in right knee during football pivot, immediate swelling, inability to bear weight, and instability.',
        status: DiagnosticStatus.PENDING
      }
    ];

    for (const demoCase of demoCases) {
      const caseData = {
        ...demoCase,
        uid: user.uid,
        status: DiagnosticStatus.ANALYZING,
        createdAt: new Date().toISOString()
      };

      // Remove undefined fields to prevent Firestore errors
      Object.keys(caseData).forEach(key => {
        if ((caseData as any)[key] === undefined) {
          delete (caseData as any)[key];
        }
      });

      try {
        const docRef = await addDoc(collection(db, 'cases'), caseData);
        // Trigger analysis in background
        analyzeMedicalCase(demoCase as PatientCase).then(async (result) => {
          await updateDoc(doc(db, 'cases', docRef.id), {
            status: DiagnosticStatus.COMPLETED,
            result
          });
        }).catch(async (err) => {
          console.error('Seed analysis failed:', err);
          await updateDoc(doc(db, 'cases', docRef.id), {
            status: DiagnosticStatus.ERROR,
            error: 'Analysis failed during seeding.'
          });
        });
      } catch (error) {
        console.error('Seeding failed:', error);
      }
    }
    setActiveTab('dashboard');
  };

  const handleDeleteCase = async (caseId: string) => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to delete this patient record? This action cannot be undone.')) return;

    try {
      await deleteDoc(doc(db, 'cases', caseId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `cases/${caseId}`);
    }
  };

  const handleDeleteAllData = async () => {
    if (!user) return;
    if (!window.confirm('CRITICAL ACTION: Are you sure you want to delete ALL patient records? This action is permanent and cannot be undone.')) return;

    try {
      const q = query(collection(db, 'cases'), where('uid', '==', user.uid));
      const snapshot = await getDocs(q);
      
      const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'cases', d.id)));
      await Promise.all(deletePromises);
      
      alert('All data has been successfully purged from the secure archive.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'cases');
    }
  };

  const renderContent = () => {
    if (selectedCase) {
      const currentCase = cases.find(c => c.id === selectedCase.id) || selectedCase;
      return <AnalysisView patientCase={currentCase} onBack={() => setSelectedCase(null)} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard cases={cases} onSelectCase={setSelectedCase} onViewAll={() => setActiveTab('cases')} />;
      case 'cases':
        return <CasesView cases={cases} onSelectCase={setSelectedCase} onDeleteCase={handleDeleteCase} />;
      case 'new-case':
        return <NewCase onSubmit={handleNewCase} />;
      case 'literature':
        return <ResearchView />;
      case 'support':
        return (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Support & Feedback</h2>
              <p className="text-slate-500 text-sm">Get in touch with our clinical and technical support teams.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Direct Contact</h3>
                  <p className="text-xs text-slate-500 mb-3">Available Mon-Fri, 9am-6pm IST</p>
                  <a href="tel:+919898989811" className="text-lg font-bold text-blue-600 hover:text-blue-700 transition-colors">
                    +91 9898989811
                  </a>
                </div>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Email Support</h3>
                  <p className="text-xs text-slate-500 mb-3">Response within 24 hours</p>
                  <div className="space-y-2">
                    <a href="mailto:contact@cids.net" className="block text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors">
                      contact@cids.net
                    </a>
                    <a href="mailto:support@cids.net" className="block text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors">
                      support@cids.net
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-600/20">
              <h3 className="font-bold text-lg mb-2">Clinical Feedback</h3>
              <p className="text-blue-100 text-sm mb-4">Your insights help us improve our diagnostic accuracy. Please share your experience or report any discrepancies.</p>
              <button className="px-6 py-2 bg-white text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors">
                Submit Feedback Form
              </button>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">System Settings</h2>
              <p className="text-slate-500 text-sm">Configure your diagnostic environment and preferences.</p>
            </div>

            <div className="space-y-8">
              {/* Theme Selection */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Appearance</h3>
                <div className="grid grid-cols-3 gap-3">
                  {(['light', 'dark', 'system'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        theme === t 
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600' 
                          : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 hover:border-slate-200'
                      }`}
                    >
                      <div className={`w-full h-12 rounded-lg mb-1 ${
                        t === 'light' ? 'bg-white shadow-sm' : 
                        t === 'dark' ? 'bg-slate-900' : 
                        'bg-gradient-to-br from-white to-slate-900'
                      }`} />
                      <span className="text-xs font-bold capitalize">{t} Mode</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">User Profile</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                  </div>
                  <button 
                    onClick={() => signOut(auth)}
                    className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                  >
                    Sign Out
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">Edge-Computing Mode</p>
                    <p className="text-sm text-slate-500">Run lightweight models locally for air-gapped environments.</p>
                  </div>
                  <button className="w-12 h-6 bg-slate-200 dark:bg-slate-700 rounded-full relative transition-colors">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform"></div>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">HIPAA Data Retention</p>
                    <p className="text-sm text-slate-500">Automatically scrub data after session termination.</p>
                  </div>
                  <button className="w-12 h-6 bg-blue-600 rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </button>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    onClick={seedData}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.58 4 8 4s8-1.79 8-4M4 7c0-2.21 3.58-4 8-4s8 1.79 8 4m0 5c0 2.21-3.58 4-8 4s-8-1.79-8-4" />
                    </svg>
                    Seed Demo Patient Data
                  </button>
                  <p className="text-[10px] text-slate-400 text-center mt-2 uppercase tracking-widest">Populates 5 diverse clinical cases for demonstration</p>
                </div>

                <div className="pt-6 border-t border-red-100 dark:border-red-900/30">
                  <h3 className="text-sm font-bold text-red-600 uppercase tracking-widest mb-4">Danger Zone</h3>
                  <button 
                    onClick={handleDeleteAllData}
                    className="w-full py-4 bg-white dark:bg-slate-900 text-red-600 border-2 border-red-100 dark:border-red-900/30 rounded-xl font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Purge All Patient Records
                  </button>
                  <p className="text-[10px] text-red-400 text-center mt-2 uppercase tracking-widest">This will permanently delete all diagnostic data associated with your account</p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <Dashboard cases={cases} onSelectCase={setSelectedCase} onViewAll={() => setActiveTab('cases')} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setSelectedCase(null);
          setActiveTab(tab);
        }} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      <main className={`flex-1 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'} p-8 transition-all duration-300`}>
        {renderContent()}
      </main>
      <Chatbot />
    </div>
  );
};

export default App;
