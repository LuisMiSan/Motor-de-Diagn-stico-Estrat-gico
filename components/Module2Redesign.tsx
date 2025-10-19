import React, { useState, useEffect } from 'react';
import { DiagnosisResult, RedesignResult } from '../types';
import { generateRedesign } from '../services/geminiService';
import Spinner from './Spinner';
import { ArrowsRightLeftIcon, LightBulbIcon, CheckBadgeIcon, RefreshIcon } from './Icons';
import FlowchartViewer from './FlowchartViewer';

interface Props {
  diagnosis: DiagnosisResult;
  onComplete: (result: RedesignResult) => void;
}

const Module2Redesign: React.FC<Props> = ({ diagnosis, onComplete }) => {
  const [redesignData, setRedesignData] = useState<RedesignResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateRedesign(diagnosis);
      setRedesignData(result);
      onComplete(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagnosis]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Rediseño de Proceso Puro':
        return <ArrowsRightLeftIcon className="w-6 h-6 text-blue-400" />;
      case 'Cambios Organizacionales':
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
      case 'Implementación Tecnológica':
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;
      default:
        return <LightBulbIcon className="w-6 h-6 text-yellow-400" />;
    }
  };

  return (
    <div className={`p-6 bg-dark-card rounded-lg border border-dark-border transition-opacity duration-500 ${isLoading && !redesignData ? 'opacity-60' : 'opacity-100'}`}>
        <div className="flex justify-between items-start mb-4">
            <div>
                 <h2 className="text-xl font-bold text-brand-secondary mb-2 flex items-center gap-3">
                    Módulo 2: Rediseño y Planificación de Sistemas
                </h2>
                <p className="text-dark-text-secondary">Diseñar un proceso optimizado y proponer soluciones de transformación.</p>
            </div>
            <button onClick={handleGenerate} disabled={isLoading} className="px-4 py-2 bg-yellow-600/20 text-yellow-400 border border-yellow-700 hover:bg-yellow-700 hover:text-white rounded-lg transition-colors duration-200 text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? <Spinner/> : <RefreshIcon className="w-4 h-4" />}
                {error && !redesignData ? 'Reintentar' : 'Actualizar'}
            </button>
        </div>
      
      {error && (
        <p className="text-red-400 text-center p-4 mb-4 bg-dark-bg rounded-lg border border-red-800">{error}</p>
      )}

      <div className="space-y-8">
        <div>
            <h3 className="text-lg font-semibold text-dark-text-primary mb-4 flex items-center gap-3"><ArrowsRightLeftIcon className="w-6 h-6" />Modelado As-Is vs. To-Be</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FlowchartViewer title="Proceso Actual (As-Is)" svgContent={redesignData?.asIsSVG} isLoading={isLoading || !redesignData} />
                <FlowchartViewer title="Proceso Rediseñado (To-Be)" svgContent={redesignData?.toBeSVG} isLoading={isLoading || !redesignData} />
            </div>
        </div>
      
        {redesignData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-dark-border animate-fade-in">
            <div>
            <h3 className="text-lg font-semibold text-dark-text-primary mb-4 flex items-center gap-3"><LightBulbIcon className="w-6 h-6" />Generador de Soluciones</h3>
            <div className="space-y-4">
                {redesignData.solutions.map((sol, i) => (
                <div key={i} className="flex items-start gap-4 p-3 bg-dark-bg rounded-md border border-dark-border">
                    <div className="flex-shrink-0 mt-1">{getCategoryIcon(sol.category)}</div>
                    <div>
                    <h4 className="font-semibold text-dark-text-primary">{sol.category}</h4>
                    <p className="text-dark-text-secondary text-sm">{sol.description}</p>
                    </div>
                </div>
                ))}
            </div>
            </div>
            
            <div>
            <h3 className="text-lg font-semibold text-dark-text-primary mb-4 flex items-center gap-3"><CheckBadgeIcon className="w-6 h-6" />Revisión de Visibilidad y Protocolos</h3>
            <p className="text-dark-text-secondary bg-dark-bg p-4 rounded-md border border-dark-border">{redesignData.review}</p>
            </div>
        </div>
        )}
        </div>
    </div>
  );
};

export default Module2Redesign;
