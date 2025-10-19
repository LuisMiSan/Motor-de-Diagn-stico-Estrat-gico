import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DiagnosisResult, RedesignResult, ImpactResult, Case } from './types';
import Module1Diagnosis from './components/Module1Diagnosis';
import Module2Redesign from './components/Module2Redesign';
import Module3Impact from './components/Module3Impact';
import Module4Repository from './components/Module4Repository';
import { exportToPDF } from './services/pdfService';
import Spinner from './components/Spinner';
import { BrainCircuitIcon, BookmarkSquareIcon, ArchiveBoxIcon, ChartBarIcon, DocumentArrowDownIcon, CheckBadgeIcon } from './components/Icons';

const LockedModule: React.FC<{ title: string; message: string; icon: React.ReactNode }> = ({ title, message, icon }) => (
    <div className="p-6 bg-dark-card rounded-lg border-2 border-dashed border-dark-border flex flex-col items-center justify-center text-center h-48">
        <div className="w-12 h-12 text-dark-text-secondary mb-3">{icon}</div>
        <h2 className="text-xl font-bold text-dark-text-secondary">{title}</h2>
        <p className="text-dark-text-secondary/70">{message}</p>
    </div>
);

const NavItem: React.FC<{ href: string; label: string; isActive: boolean; onClick: (href: string) => void; children: React.ReactNode }> = ({ href, label, isActive, onClick, children }) => (
    <a
        href={href}
        onClick={(e) => {
            e.preventDefault();
            onClick(href);
        }}
        aria-label={label}
        className={`flex flex-col items-center justify-center text-center p-2 rounded-lg transition-colors duration-200 w-24 h-20 ${
            isActive ? 'bg-brand-primary/20 text-brand-secondary' : 'text-dark-text-secondary hover:bg-dark-border/50'
        }`}
    >
        {children}
        <span className="text-xs mt-1 font-medium">{label}</span>
    </a>
);

const NavBar: React.FC<{ activeSection: string; onNavClick: (href: string) => void }> = ({ activeSection, onNavClick }) => (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 bg-dark-card/80 backdrop-blur-sm border border-dark-border rounded-xl shadow-lg z-50">
        <div className="flex items-center justify-center p-1 space-x-1">
            <NavItem href="#diagnosis" label="Diagnóstico" isActive={activeSection === 'diagnosis'} onClick={onNavClick}>
                <BrainCircuitIcon className="w-6 h-6" />
            </NavItem>
            <NavItem href="#redesign" label="Rediseño" isActive={activeSection === 'redesign'} onClick={onNavClick}>
                <BookmarkSquareIcon className="w-6 h-6" />
            </NavItem>
            <NavItem href="#impact" label="Impacto" isActive={activeSection === 'impact'} onClick={onNavClick}>
                <ChartBarIcon className="w-6 h-6" />
            </NavItem>
            <NavItem href="#repository" label="Repositorio" isActive={activeSection === 'repository'} onClick={onNavClick}>
                <ArchiveBoxIcon className="w-6 h-6" />
            </NavItem>
        </div>
    </nav>
);

const App: React.FC = () => {
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [redesignResult, setRedesignResult] = useState<RedesignResult | null>(null);
  const [impactResult, setImpactResult] = useState<ImpactResult | null>(null);
  const [repository, setRepository] = useState<Case[]>(() => {
    try {
        const savedCases = localStorage.getItem('repositoryCases');
        return savedCases ? JSON.parse(savedCases) : [];
    } catch (error) {
        console.error("Error al cargar casos desde localStorage", error);
        return [];
    }
  });
  const [isSaved, setIsSaved] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [activeSection, setActiveSection] = useState('diagnosis');
  
  const navigate = useNavigate();

  const diagnosisRef = useRef<HTMLDivElement>(null);
  const redesignRef = useRef<HTMLDivElement>(null);
  const impactRef = useRef<HTMLDivElement>(null);
  const repositoryRef = useRef<HTMLDivElement>(null);

  const handleNavClick = useCallback((hash: string) => {
    const id = hash.substring(1);
    const element = document.getElementById(id);
    
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    const sectionRefs = [
        { id: 'diagnosis', ref: diagnosisRef },
        { id: 'redesign', ref: redesignRef },
        { id: 'impact', ref: impactRef },
        { id: 'repository', ref: repositoryRef },
    ];

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    setActiveSection(sectionId);
                    navigate(`#${sectionId}`, { replace: true });
                }
            });
        },
        {
            rootMargin: '-50% 0px -50% 0px',
            threshold: 0,
        }
    );

    sectionRefs.forEach(({ ref }) => {
        if (ref.current) observer.observe(ref.current);
    });

    return () => {
        sectionRefs.forEach(({ ref }) => {
            if (ref.current) observer.unobserve(ref.current);
        });
    };
  }, [navigate]);

  useEffect(() => {
    try {
        localStorage.setItem('repositoryCases', JSON.stringify(repository));
    } catch (error) {
        console.error("Error al guardar casos en localStorage", error);
    }
  }, [repository]);

  const handleDiagnosisComplete = useCallback((result: DiagnosisResult) => {
    setDiagnosisResult(result);
    setRedesignResult(null);
    setImpactResult(null);
    setIsSaved(false);
    setTimeout(() => redesignRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);
  
  const handleDiagnosisEdit = useCallback(() => {
    setRedesignResult(null);
    setImpactResult(null);
    setIsSaved(false);
  }, []);

  const handleRedesignComplete = useCallback((result: RedesignResult) => {
    setRedesignResult(result);
    setImpactResult(null);
    setIsSaved(false);
    setTimeout(() => impactRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);
  
  const handleImpactComplete = useCallback((result: ImpactResult) => {
    setImpactResult(result);
  }, []);

  const handleSaveToRepository = () => {
    if (diagnosisResult && redesignResult && impactResult) {
        const newCase: Case = {
            id: new Date().toISOString(),
            timestamp: new Date().toLocaleString('es-ES'),
            symptom: diagnosisResult.symptom,
            rootCause: diagnosisResult.rootCause,
            solutions: redesignResult.solutions,
            tier: impactResult.tier,
            roi: impactResult.roi,
        };
        setRepository(prev => [newCase, ...prev]);
        setIsSaved(true);
        setShowSaveConfirmation(true);
        setTimeout(() => {
            setShowSaveConfirmation(false);
        }, 3000);
    }
  }

  const handleExportPDF = async () => {
    if (!diagnosisResult || !redesignResult || !impactResult) return;
    setIsExporting(true);
    try {
        await exportToPDF(diagnosisResult, redesignResult, impactResult);
    } catch (error) {
        console.error("Error al exportar a PDF:", error);
        alert("Hubo un error al generar el PDF. Por favor, intente de nuevo.");
    } finally {
        setIsExporting(false);
    }
  };

  const handleReset = () => {
    setDiagnosisResult(null);
    setRedesignResult(null);
    setImpactResult(null);
    setIsSaved(false);
    diagnosisRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text-primary font-sans p-4 sm:p-6 lg:p-8 pt-28">
      <NavBar activeSection={activeSection} onNavClick={handleNavClick} />
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-dark-border">
          <div className="flex items-center gap-3 mb-4 sm:mb-0">
            <BrainCircuitIcon className="w-10 h-10 text-brand-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold text-dark-text-primary tracking-tight">
              Motor de Diagnóstico Estratégico
            </h1>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-brand-primary/10 text-brand-secondary border border-brand-dark hover:bg-brand-dark hover:text-white rounded-lg transition-colors duration-200 text-sm font-semibold"
          >
            Comenzar de Nuevo
          </button>
        </header>

        <main className="space-y-12">
            <section id="diagnosis" ref={diagnosisRef}>
                <Module1Diagnosis onComplete={handleDiagnosisComplete} onEdit={handleDiagnosisEdit} />
            </section>
            
            <section id="redesign" ref={redesignRef}>
                {diagnosisResult ? (
                    <Module2Redesign diagnosis={diagnosisResult} onComplete={handleRedesignComplete} key={diagnosisResult.rootCause + diagnosisResult.symptom} />
                ) : (
                    <LockedModule title="Rediseño y Planificación" message="Complete el diagnóstico para desbloquear este módulo." icon={<BookmarkSquareIcon className="w-full h-full"/>}/>
                )}
            </section>

            <section id="impact" ref={impactRef}>
                {diagnosisResult && redesignResult ? (
                    <div className="space-y-12">
                        <Module3Impact diagnosis={diagnosisResult} redesign={redesignResult} onComplete={handleImpactComplete} key={redesignResult.review}/>
                        {impactResult && (
                            <div className="text-center py-4 flex flex-col justify-center items-center">
                                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                                    <button 
                                        onClick={handleSaveToRepository}
                                        disabled={isSaved}
                                        className="px-8 py-3 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center w-full sm:w-auto gap-2 text-lg disabled:bg-gray-500 disabled:cursor-not-allowed"
                                    >
                                        <BookmarkSquareIcon className="w-6 h-6"/>
                                        {isSaved ? 'Guardado en Repositorio' : 'Guardar Caso'}
                                    </button>
                                    <button 
                                        onClick={handleExportPDF}
                                        disabled={isExporting}
                                        className="px-8 py-3 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-700 transition-colors flex items-center justify-center w-full sm:w-auto gap-2 text-lg disabled:bg-gray-500 disabled:cursor-not-allowed"
                                    >
                                        {isExporting ? <Spinner/> : <DocumentArrowDownIcon className="w-6 h-6"/>}
                                        {isExporting ? 'Exportando...' : 'Exportar a PDF'}
                                    </button>
                                </div>
                                <div className="h-10 mt-4">
                                    {showSaveConfirmation && (
                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md animate-fade-in">
                                            <CheckBadgeIcon className="w-5 h-5" />
                                            <span>Caso guardado con éxito</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <LockedModule title="Asesoramiento de Impacto" message="Complete el rediseño para desbloquear este módulo." icon={<ChartBarIcon className="w-full h-full"/>}/>
                )}
            </section>

            <section id="repository" ref={repositoryRef}>
                <Module4Repository cases={repository} />
            </section>
        </main>
      </div>
    </div>
  );
};

export default App;