import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DiagnosisResult, RedesignResult, ImpactResult, SolutionCategory } from '../types';

const tierLabels: { [key: number]: string } = {
    1: 'Tier 1: Eficacia',
    2: 'Tier 2: Reducción de Costos',
    3: 'Tier 3: Mejoramiento de Ingresos',
    4: 'Tier 4: Diferencia Competitiva'
};

const renderSVGToCanvas = async (svg: string): Promise<HTMLCanvasElement> => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.backgroundColor = 'white';
    container.style.padding = '20px';
    container.innerHTML = svg;
    document.body.appendChild(container);

    const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 3, // Aumentar la resolución para mejor calidad en el PDF
    });

    document.body.removeChild(container);
    return canvas;
};


export const exportToPDF = async (
    diagnosis: DiagnosisResult,
    redesign: RedesignResult,
    impact: ImpactResult
) => {
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
    });

    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = margin;

    // Helper para añadir una nueva página si es necesario
    const checkPageBreak = (spaceNeeded: number) => {
        if (y + spaceNeeded > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }
    };

    // Helper para texto con auto-wrap
    const wrappedText = (text: string, x: number, maxWidth: number, options = {}) => {
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y, options);
        y += (doc.getTextDimensions(lines).h);
    };


    // --- HEADER ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(45, 55, 72); // dark-card color
    doc.text('Reporte de Diagnóstico Estratégico', margin, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(160, 174, 192); // dark-text-secondary
    doc.text(`Generado el: ${new Date().toLocaleString('es-ES')}`, margin, y);
    y += 15;


    // --- SECCIÓN 1: DIAGNÓSTICO ---
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 169, 255); // brand-primary
    doc.text('1. Resumen del Diagnóstico', margin, y);
    y += 8;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(45, 55, 72);
    doc.text('Síntoma Inicial:', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    wrappedText(diagnosis.symptom, margin, pageWidth - margin * 2);
    y += 8;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(45, 55, 72);
    doc.text('Causa Raíz Identificada:', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    wrappedText(diagnosis.rootCause, margin, pageWidth - margin * 2);
    y += 10;
    
    checkPageBreak(20);

    // --- SECCIÓN 2: REDISEÑO ---
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 169, 255);
    doc.text('2. Plan de Rediseño de Sistemas', margin, y);
    y += 10;

    // Renderizar SVGs
    try {
        const asIsCanvas = await renderSVGToCanvas(redesign.asIsSVG);
        const toBeCanvas = await renderSVGToCanvas(redesign.toBeSVG);
        const imgWidth = (pageWidth - margin * 3) / 2;
        const asIsHeight = (asIsCanvas.height * imgWidth) / asIsCanvas.width;
        const toBeHeight = (toBeCanvas.height * imgWidth) / toBeCanvas.width;
        const maxHeight = Math.max(asIsHeight, toBeHeight);

        checkPageBreak(maxHeight + 20); // 20 para títulos

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(45, 55, 72);
        doc.text('Proceso Actual (As-Is)', margin, y);
        doc.text('Proceso Rediseñado (To-Be)', margin + imgWidth + margin, y);
        y += 6;
        
        doc.addImage(asIsCanvas.toDataURL('image/png'), 'PNG', margin, y, imgWidth, asIsHeight);
        doc.addImage(toBeCanvas.toDataURL('image/png'), 'PNG', margin + imgWidth + margin, y, imgWidth, toBeHeight);
        y += maxHeight + 10;
        
    } catch (e) {
        console.error("Error al renderizar SVGs:", e);
        doc.setTextColor(239, 68, 68); // red-500
        doc.text("Error: No se pudieron renderizar los diagramas de flujo.", margin, y);
        y += 10;
    }

    checkPageBreak(60);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(45, 55, 72);
    doc.text('Soluciones Propuestas:', margin, y);
    y += 6;

    doc.setFontSize(11);
    redesign.solutions.forEach(sol => {
        checkPageBreak(20);
        const currentY = y;

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(45, 55, 72);
        const categoryText = `• ${sol.category}:`;
        doc.text(categoryText, margin + 5, currentY);
        
        const categoryWidth = doc.getTextDimensions(categoryText).w;
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        const descriptionX = margin + 5 + categoryWidth + 2;
        const descriptionMaxWidth = pageWidth - descriptionX - margin;
        
        const descriptionLines = doc.splitTextToSize(sol.description, descriptionMaxWidth);
        doc.text(descriptionLines, descriptionX, currentY);
        
        const descriptionHeight = doc.getTextDimensions(descriptionLines).h;
        y = currentY + descriptionHeight + 4;
    });
    y += 8;

    checkPageBreak(40);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(45, 55, 72);
    doc.text('Revisión de Visibilidad y Protocolos:', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    wrappedText(redesign.review, margin, pageWidth - margin * 2);
    y += 10;

    checkPageBreak(20);

    // --- SECCIÓN 3: IMPACTO ---
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 169, 255);
    doc.text('3. Asesoramiento de Impacto de Negocio', margin, y);
    y += 8;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(45, 55, 72);
    doc.text('Clasificación de Tier:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${tierLabels[impact.tier]}`, margin + 45, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.text('Proyección de ROI:', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    wrappedText(`Métrica: ${impact.roi.metric}`, margin + 5, pageWidth - margin * 2 - 5);
    y += 1;
    wrappedText(`Valor Estimado: $${impact.roi.value.toLocaleString('es-ES')}`, margin + 5, pageWidth - margin * 2 - 5);
    y += 1;
    wrappedText(`Justificación: ${impact.roi.description}`, margin + 5, pageWidth - margin * 2 - 5);
    y += 8;

    checkPageBreak(50);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(45, 55, 72);
    doc.text('Comunicación de Valor:', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    wrappedText(impact.communication, margin, pageWidth - margin * 2);

    doc.save('Diagnostico_Estrategico.pdf');
};

export const exportToJSON = async (
    diagnosis: DiagnosisResult,
    redesign: RedesignResult,
    impact: ImpactResult
) => {
    const exportData = {
        diagnostico: diagnosis,
        rediseño: redesign,
        impacto: impact,
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'Diagnostico_Estrategico.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};