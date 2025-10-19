import React, { useState, useMemo, useEffect } from 'react';
import { Case, SolutionCategory } from '../types';
import { ArchiveBoxIcon, ArrowsRightLeftIcon, LightBulbIcon, ChartBarIcon, MagnifyingGlassIcon } from './Icons';

const getCategoryIcon = (category: string) => {
    switch (category) {
        case SolutionCategory.PROCESS:
            return <ArrowsRightLeftIcon className="w-5 h-5 text-blue-400" />;
        case SolutionCategory.ORGANIZATION:
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
        case SolutionCategory.TECHNOLOGY:
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;
        default:
            return <LightBulbIcon className="w-5 h-5 text-yellow-400" />;
    }
};

const tierColors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

const CaseCard: React.FC<{ caseData: Case }> = ({ caseData }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="relative bg-dark-bg border border-dark-border rounded-lg p-4 pl-6 transition-all duration-300">
            <div 
                className="absolute left-0 top-0 h-full w-1.5 rounded-l-lg"
                style={{ backgroundColor: tierColors[caseData.tier - 1] }}
            />
            <div className="flex justify-between items-start cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex-1 mr-4">
                    <p className="text-sm text-dark-text-secondary">{caseData.timestamp}</p>
                    <h3 className="font-bold text-dark-text-primary mt-1">{caseData.symptom}</h3>
                </div>
                <div className="flex items-center gap-4">
                     <div className="text-center">
                        <p className="text-xs text-dark-text-secondary">Tier</p>
                        <p className="font-bold text-lg" style={{ color: tierColors[caseData.tier - 1] }}>{caseData.tier}</p>
                    </div>
                     <button className="text-dark-text-secondary hover:text-white transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'}}>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                </div>
            </div>
            
            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-dark-border animate-fade-in space-y-4">
                    <div>
                        <h4 className="font-semibold text-sm text-dark-text-secondary mb-1">Causa Raíz</h4>
                        <p className="text-dark-text-primary">{caseData.rootCause}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm text-dark-text-secondary mb-2">Soluciones</h4>
                        <ul className="space-y-2">
                            {caseData.solutions.map((sol, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <div className="flex-shrink-0 mt-1">{getCategoryIcon(sol.category)}</div>
                                    <p className="text-dark-text-primary text-sm">{sol.description}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                     <div>
                        <h4 className="font-semibold text-sm text-dark-text-secondary mb-1">Impacto (ROI)</h4>
                        <div className="flex items-center gap-2">
                           <ChartBarIcon className="w-5 h-5 text-green-400"/>
                           <p className="text-dark-text-primary font-semibold">${caseData.roi.value.toLocaleString('es-ES')}</p>
                           <p className="text-dark-text-secondary text-sm">({caseData.roi.metric})</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

interface SearchHistoryItem {
  query: string;
  tier: number | null;
  category: SolutionCategory | null;
}

interface Props {
  cases: Case[];
}

const Module4Repository: React.FC<Props> = ({ cases }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<SolutionCategory | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>(() => {
    try {
      const savedHistory = localStorage.getItem('repositorySearchHistory');
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (error) {
      console.error("Error al cargar historial de búsqueda desde localStorage", error);
      return [];
    }
  });

  const ITEMS_PER_PAGE = 5;

  const categoryLabels: { [key in SolutionCategory]: string } = {
      [SolutionCategory.PROCESS]: 'Proceso',
      [SolutionCategory.ORGANIZATION]: 'Organización',
      [SolutionCategory.TECHNOLOGY]: 'Tecnología'
  };

  useEffect(() => {
    // No guardar el estado inicial vacío
    if (!searchQuery && !tierFilter && !categoryFilter) {
      return;
    }
  
    const handler = setTimeout(() => {
      const newHistoryItem: SearchHistoryItem = {
        query: searchQuery,
        tier: tierFilter,
        category: categoryFilter,
      };
  
      setSearchHistory(prevHistory => {
        // Eliminar duplicados para mover la búsqueda repetida al frente
        const filteredPrevHistory = prevHistory.filter(
          item => !(item.query === newHistoryItem.query && item.tier === newHistoryItem.tier && item.category === newHistoryItem.category)
        );
        const updatedHistory = [newHistoryItem, ...filteredPrevHistory];
        return updatedHistory.slice(0, 5); // Mantener solo los últimos 5
      });
    }, 500); // Debounce para no guardar en cada pulsación de tecla
  
    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, tierFilter, categoryFilter]);
  
  useEffect(() => {
    try {
      localStorage.setItem('repositorySearchHistory', JSON.stringify(searchHistory));
    } catch (error) {
      console.error("Error al guardar historial de búsqueda en localStorage", error);
    }
  }, [searchHistory]);


  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      const query = searchQuery.toLowerCase();
      
      const searchMatch = query === '' || c.symptom.toLowerCase().includes(query) || c.rootCause.toLowerCase().includes(query);
      const tierMatch = !tierFilter || c.tier === tierFilter;
      const categoryMatch = !categoryFilter || c.solutions.some(s => s.category === categoryFilter);
      
      return searchMatch && tierMatch && categoryMatch;
    });
  }, [cases, searchQuery, tierFilter, categoryFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, tierFilter, categoryFilter]);

  const handleHistoryClick = (item: SearchHistoryItem) => {
    setSearchQuery(item.query);
    setTierFilter(item.tier);
    setCategoryFilter(item.category);
  };

  const totalPages = Math.ceil(filteredCases.length / ITEMS_PER_PAGE);
  const paginatedCases = filteredCases.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="p-6 bg-dark-card rounded-lg border border-dark-border">
      <h2 className="text-xl font-bold text-brand-secondary mb-4 flex items-center gap-3">
        <ArchiveBoxIcon className="w-8 h-8"/>
        Repositorio de Casos
      </h2>

      {cases.length > 0 && (
        <div className="space-y-4 mb-6">
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <MagnifyingGlassIcon className="w-5 h-5 text-dark-text-secondary" />
                </span>
                <input
                    type="text"
                    placeholder="Buscar por síntoma o causa raíz..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-3 pl-10 bg-dark-bg border border-dark-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition"
                />
            </div>
             <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-6 gap-y-3">
                <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-dark-text-secondary flex-shrink-0">Tier:</p>
                    <div className="flex gap-1 bg-dark-bg p-1 rounded-md">
                        <button onClick={() => setTierFilter(null)} className={`px-3 py-1 text-xs rounded transition-colors ${!tierFilter ? 'bg-brand-primary text-white font-semibold' : 'text-dark-text-secondary hover:bg-dark-border'}`}>Todos</button>
                        {[1, 2, 3, 4].map(tier => (
                            <button key={tier} onClick={() => setTierFilter(tier)} className={`px-3 py-1 text-xs rounded transition-colors ${tierFilter === tier ? 'bg-brand-primary text-white font-semibold' : 'text-dark-text-secondary hover:bg-dark-border'}`}>{tier}</button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-dark-text-secondary flex-shrink-0">Categoría:</p>
                    <div className="flex flex-wrap gap-1 bg-dark-bg p-1 rounded-md">
                         <button onClick={() => setCategoryFilter(null)} className={`px-3 py-1 text-xs rounded transition-colors ${!categoryFilter ? 'bg-brand-primary text-white font-semibold' : 'text-dark-text-secondary hover:bg-dark-border'}`}>Todas</button>
                         {Object.values(SolutionCategory).map(cat => (
                            <button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-3 py-1 text-xs rounded transition-colors ${categoryFilter === cat ? 'bg-brand-primary text-white font-semibold' : 'text-dark-text-secondary hover:bg-dark-border'}`}>{categoryLabels[cat]}</button>
                         ))}
                    </div>
                </div>
            </div>
            {searchHistory.length > 0 && (
                <div className="pt-3">
                    <h4 className="text-xs font-semibold text-dark-text-secondary mb-2">Búsquedas Recientes:</h4>
                    <div className="flex flex-wrap gap-2">
                        {searchHistory.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => handleHistoryClick(item)}
                                className="flex items-center gap-2 text-xs bg-dark-bg p-1.5 rounded-lg border border-dark-border hover:border-brand-primary hover:bg-brand-primary/10 transition-colors"
                                aria-label={`Buscar: ${item.query}, Tier ${item.tier}, Categoría ${item.category}`}
                            >
                                {item.query && <span className="font-semibold pl-1">"{item.query}"</span>}
                                {!item.query && !item.tier && !item.category && <span className="italic text-dark-text-secondary/70">Filtros sin texto</span>}
                                {item.tier && <span className="bg-dark-border px-2 py-0.5 rounded-full">Tier: {item.tier}</span>}
                                {item.category && <span className="bg-dark-border px-2 py-0.5 rounded-full">Cat: {categoryLabels[item.category]}</span>}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
      )}
      
      {cases.length === 0 ? (
        <div className="text-center py-12 px-6 bg-dark-bg rounded-lg border-2 border-dashed border-dark-border">
          <ArchiveBoxIcon className="w-16 h-16 mx-auto text-dark-text-secondary/50" />
          <h3 className="mt-4 text-lg font-semibold text-dark-text-secondary">El repositorio está vacío.</h3>
          <p className="mt-1 text-dark-text-secondary/70">Complete un análisis y guarde el caso para verlo aquí.</p>
        </div>
      ) : paginatedCases.length > 0 ? (
        <div className="space-y-4">
          {paginatedCases.map(c => <CaseCard key={c.id} caseData={c} />)}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6 pt-4 border-t border-dark-border">
                <button 
                    onClick={() => setCurrentPage(p => p - 1)} 
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-semibold bg-dark-bg border border-dark-border rounded-md hover:bg-dark-border disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    &larr; Anterior
                </button>
                <span className="text-sm font-medium text-dark-text-secondary">
                    Página {currentPage} de {totalPages}
                </span>
                <button 
                    onClick={() => setCurrentPage(p => p + 1)} 
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-semibold bg-dark-bg border border-dark-border rounded-md hover:bg-dark-border disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Siguiente &rarr;
                </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 px-6 bg-dark-bg rounded-lg border-2 border-dashed border-dark-border">
            <MagnifyingGlassIcon className="w-16 h-16 mx-auto text-dark-text-secondary/50" />
            <h3 className="mt-4 text-lg font-semibold text-dark-text-secondary">No se encontraron casos.</h3>
            <p className="mt-1 text-dark-text-secondary/70">Intente ajustar los filtros o su término de búsqueda.</p>
        </div>
      )}
    </div>
  );
};

export default Module4Repository;