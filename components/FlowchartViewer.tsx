import React, { useState } from 'react';
import { PlusIcon, MinusIcon, ArrowsPointingInIcon } from './Icons';
import Spinner from './Spinner';

interface Props {
  title: string;
  svgContent?: string;
  isLoading?: boolean;
}

const FlowchartViewer: React.FC<Props> = ({ title, svgContent, isLoading }) => {
  const [scale, setScale] = useState(1);
    
  const handleZoomIn = () => setScale(s => Math.min(s * 1.2, 3));
  const handleZoomOut = () => setScale(s => Math.max(s / 1.2, 0.2));
  const handleReset = () => setScale(1);

  return (
    <div className="p-4 bg-dark-bg rounded-lg border border-dark-border flex flex-col h-full">
      <h3 className="font-semibold text-center text-dark-text-primary mb-4">{title}</h3>
      <div className="relative flex-grow min-h-[300px] overflow-hidden rounded-md bg-dark-bg/50">
        {isLoading ? (
           <div className="w-full h-full bg-dark-card/50 animate-pulse rounded-md flex flex-col items-center justify-center p-4 text-dark-text-secondary">
               <Spinner />
               <p className="mt-2 text-sm">Generando diagrama...</p>
            </div>
        ) : (
          <div 
              className="w-full h-full flex items-center justify-center transition-transform duration-200 ease-in-out"
              style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
          >
              <div
                  dangerouslySetInnerHTML={{ __html: svgContent || '' }}
              />
          </div>
        )}

        {/* Controls */}
        {!isLoading && svgContent && (
             <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-dark-card/80 backdrop-blur-sm border border-dark-border p-1 rounded-lg">
                <button 
                    onClick={handleZoomIn} 
                    className="p-1.5 text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-border/50 rounded-md transition-colors"
                    aria-label="Acercar"
                >
                    <PlusIcon className="w-5 h-5"/>
                </button>
                <button 
                    onClick={handleZoomOut} 
                    className="p-1.5 text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-border/50 rounded-md transition-colors"
                    aria-label="Alejar"
                >
                    <MinusIcon className="w-5 h-5"/>
                </button>
                <div className="w-px h-5 bg-dark-border mx-1"></div>
                <button 
                    onClick={handleReset} 
                    className="p-1.5 text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-border/50 rounded-md transition-colors"
                    aria-label="Ajustar a la vista"
                >
                    <ArrowsPointingInIcon className="w-5 h-5"/>
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default FlowchartViewer;
