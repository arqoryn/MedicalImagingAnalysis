
export enum DiagnosticStatus {
  PENDING = 'PENDING',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface PatientInfo {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodType: string;
  history: string;
}

export interface DifferentialDiagnosis {
  condition: string;
  probability: number;
  rationale: string;
  recommendedTests: string[];
}

export interface VisualAnnotation {
  type: 'Primary' | 'Secondary';
  x: number; // 0-1000
  y: number; // 0-1000
  label: string;
  description: string;
}

export interface DiagnosticResult {
  summary: string;
  differentials: DifferentialDiagnosis[];
  riskAssessment: 'Low' | 'Moderate' | 'High' | 'Critical';
  clinicalReasoning: string;
  groundingSources?: { title: string; uri: string }[];
  annotations?: VisualAnnotation[];
}

export interface PatientCase {
  id: string;
  patient: PatientInfo;
  symptoms: string;
  imagingUrl?: string;
  status: DiagnosticStatus;
  result?: DiagnosticResult;
  createdAt: string;
}
