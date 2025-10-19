import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { DiagnosisResult, RedesignResult, ImpactResult } from '../types';
import { calculateImpact } from '../services/geminiService';
import Spinner from './Spinner';
import { ChartBarIcon, ScaleIcon, SparklesIcon, RefreshIcon } from './Icons';

interface Props {
  diagnosis: DiagnosisResult;
  redesign: RedesignResult;
  onComplete: (result: ImpactResult) => void;
}

const tierColors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];
const tierLabels: { [key: number]: string } = {
    1: 'Tier 1: Eficacia',
    2: 'Tier 2: Reducción de Costos',
    3: 'Tier 3: Mejoramiento de Ingresos',
    4: 'Tier 4: Diferencia Competitiva'
};


const Module3Impact: React.FC<Props> = ({ diagnosis, redesign, onComplete }) => {
  const [impactData, setImpactData] = useState<ImpactResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await calculateImpact(diagnosis, redesign);
      setImpactData(result);
      onComplete(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleCalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagnosis, redesign]);

  if (isLoading && !impactData) {
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-dark-card rounded-lg border border-dark-border">
        <Spinner />
        <p className="mt-4 text-brand-secondary">Cuantificando el impacto de negocio...</p>
        <p className="text-sm text-dark-text-secondary">La IA está proyectando el ROI y el valor estratégico.</p>
      </div>
    );
  }

  if (error) {
    return <p className="text-red-400 text-center p-6 bg-dark-card rounded-lg border border-red-800">{error}</p>;
  }

  if (!impactData) {
    return null;
  }
    
  const chartData = [
      { name: 'Impacto Proyectado', value: impactData.roi.value, tier: impactData.tier },
  ];

  return (
    <div className={`p-6 bg-dark-card rounded-lg border border-dark-border transition-opacity duration-500 ${isLoading ? 'opacity-60' : 'opacity-100'}`}>
      <div className="flex justify-between items-start mb-4">
            <div>
                 <h2 className="text-xl font-bold text-brand-secondary mb-2 flex items-center gap-3">
                    Módulo 3: Asesoramiento de Impacto de Negocio
                </h2>
                <p className="text-dark-text-secondary">Cuantificar el valor del proyecto y comunicar los resultados de negocio.</p>
            </div>
            <button onClick={handleCalculate} disabled={isLoading} className="px-4 py-2 bg-yellow-600/20 text-yellow-400 border border-yellow-700 hover:bg-yellow-700 hover:text-white rounded-lg transition-colors duration-200 text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? <Spinner/> : <RefreshIcon className="w-4 h-4" />}
                Actualizar
            </button>
        </div>
      <div className="space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Tier Classifier */}
            <div className="lg:col-span-1">
                <h3 className="text-lg font-semibold text-dark-text-primary mb-4 flex items-center gap-3"><ScaleIcon className="w-6 h-6" />Clasificador de Tier</h3>
                <div className="text-center p-6 bg-dark-bg rounded-lg h-full flex flex-col justify-center">
                    <div 
                    className="text-6xl font-bold mx-auto mb-2"
                    style={{ color: tierColors[impactData.tier - 1] }}
                    >
                    {impactData.tier}
                    </div>
                    <div 
                    className="text-lg font-semibold"
                    style={{ color: tierColors[impactData.tier - 1] }}
                    >
                    {tierLabels[impactData.tier]}
                    </div>
                    <p className="text-dark-text-secondary mt-2 text-sm">
                        Este proyecto se alinea con los objetivos de Nivel {impactData.tier}.
                    </p>
                </div>
            </div>

            {/* ROI Projection */}
            <div className="lg:col-span-2">
                <h3 className="text-lg font-semibold text-dark-text-primary mb-4 flex items-center gap-3"><ChartBarIcon className="w-6 h-6" />Proyección de ROI Cuantificable</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-dark-bg p-6 rounded-lg">
                    <div>
                        <p className="text-dark-text-secondary mb-1">{impactData.roi.metric}</p>
                        <p className="text-4xl font-bold text-green-400 mb-3">
                            ${impactData.roi.value.toLocaleString('es-ES')}
                        </p>
                        <p className="text-dark-text-secondary text-sm">{impactData.roi.description}</p>
                    </div>
                    <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" hide />
                            <Tooltip 
                                cursor={{fill: 'transparent'}}
                                contentStyle={{
                                    background: '#2d3748',
                                    border: '1px solid #4a5568',
                                    borderRadius: '0.5rem',
                                }}
                                formatter={(value: number) => [`$${value.toLocaleString('es-ES')}`, impactData.roi.metric]}
                            />
                            <Bar dataKey="value" barSize={40} radius={[0, 10, 10, 0]}>
                                {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={tierColors[entry.tier - 1]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>

        {/* Value Communication */}
        <div>
            <h3 className="text-lg font-semibold text-dark-text-primary mb-4 flex items-center gap-3"><SparklesIcon className="w-6 h-6" />Generador de Comunicación de Valor</h3>
            <div className="prose prose-invert max-w-none bg-dark-bg p-6 rounded-md border border-dark-border text-dark-text-secondary">
            <p>{impactData.communication}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Module3Impact;
