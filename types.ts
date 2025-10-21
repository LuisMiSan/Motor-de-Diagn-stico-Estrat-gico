export interface DiagnosisResult {
  symptom: string;
  questions: string[];
  answers: string[];
  rootCause: string;
  requirements: string[];
}

export enum SolutionCategory {
  PROCESS = 'Rediseño de Proceso Puro',
  ORGANIZATION = 'Cambios Organizacionales',
  TECHNOLOGY = 'Implementación Tecnológica',
}

export interface Solution {
  category: SolutionCategory;
  description: string;
}

export interface RedesignResult {
  asIsSVG: string;
  toBeSVG: string;
  solutions: Solution[];
  review: string;
}

export interface ROIData {
  metric: string;
  value: number;
  description: string;
}

export interface ImpactResult {
  tier: number;
  roi: ROIData;
  communication: string;
}

export enum AppStep {
  DIAGNOSIS = 'DIAGNÓSTICO',
  REDESIGN = 'REDISEÑO',
  IMPACT = 'IMPACTO',
}

export interface Case {
  id: string;
  timestamp: string;
  symptom: string;
  rootCause: string;
  solutions: Solution[];
  tier: number;
  roi: ROIData;
}

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
}
