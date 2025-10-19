import React, { useState, useRef } from 'react';
import { DiagnosisResult } from '../types';
import { generateFollowUpQuestions, analyzeRootCause, validateTranscription } from '../services/geminiService';
import Spinner from './Spinner';
import { LightBulbIcon, DocumentTextIcon, RefreshIcon, MicrophoneIcon } from './Icons';

interface Props {
  onComplete: (result: DiagnosisResult) => void;
  onEdit: () => void;
}

const Module1Diagnosis: React.FC<Props> = ({ onComplete, onEdit }) => {
  const [symptom, setSymptom] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<{ rootCause: string; requirements: string[] } | null>(null);
  
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [symptomIsLocked, setSymptomIsLocked] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ symptom: boolean; answers: boolean[] }>({ symptom: false, answers: [] });

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTarget, setRecordingTarget] = useState<'symptom' | number | null>(null);
  const [isValidating, setIsValidating] = useState<'symptom' | number | null>(null);
  const recognitionRef = useRef<any>(null);

  const handleToggleRecording = (target: 'symptom' | number) => {
    if (isRecording && recordingTarget === target) {
      recognitionRef.current?.stop();
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
    }

    // FIX: Cast `window` to `any` to access non-standard `SpeechRecognition` properties, which are not part of the standard DOM typings.
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("La API de reconocimiento de voz no es compatible con este navegador.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (!transcript) return;

      setIsValidating(target);
      setError(null);

      try {
        const validation = await validateTranscription(transcript);
        
        if (validation.isValid) {
          if (target === 'symptom') {
            setSymptom(prev => (prev ? prev.trim() + ' ' : '') + transcript);
            if (validationErrors.symptom) {
              setValidationErrors(prev => ({ ...prev, symptom: false }));
              setError(null);
            }
          } else {
            const currentAnswer = answers[target] || '';
            handleAnswerChange(target, (currentAnswer ? currentAnswer.trim() + ' ' : '') + transcript);
          }
        } else {
          setError(validation.feedback);
        }
      } catch (e: any) {
        setError("Error al validar la transcripción. Se usará el texto directamente.");
        if (target === 'symptom') {
          setSymptom(prev => (prev ? prev.trim() + ' ' : '') + transcript);
        } else {
          const currentAnswer = answers[target] || '';
          handleAnswerChange(target, (currentAnswer ? currentAnswer.trim() + ' ' : '') + transcript);
        }
      } finally {
        setIsValidating(null);
      }
    };

    recognition.onerror = (event: any) => {
      setError(`Error de reconocimiento de voz: ${event.error}`);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setRecordingTarget(null);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setRecordingTarget(target);
  };


  const handleSymptomSubmit = async () => {
    const isSymptomInvalid = !symptom.trim();
    setValidationErrors({ symptom: isSymptomInvalid, answers: [] });

    if (isSymptomInvalid) {
      setError('Por favor, describa el problema o necesidad.');
      return;
    }

    setIsLoadingQuestions(true);
    setError(null);
    setQuestions([]);
    setAnswers([]);
    setAnalysis(null);
    onEdit(); // Notify parent that we are editing
    try {
      const generatedQuestions = await generateFollowUpQuestions(symptom);
      setQuestions(generatedQuestions);
      setAnswers(new Array(generatedQuestions.length).fill(''));
      setValidationErrors(prev => ({ ...prev, answers: new Array(generatedQuestions.length).fill(false) }));
      setSymptomIsLocked(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
    
    setError(null); // Clear any error (transcription or validation) on manual input

    if (validationErrors.answers[index]) {
      const newAnswerErrors = [...validationErrors.answers];
      newAnswerErrors[index] = false;
      setValidationErrors(prev => ({ ...prev, answers: newAnswerErrors }));
    }
  };

  const handleAnalysisSubmit = async () => {
    const newAnswerErrors = answers.map(a => !a.trim());
    const hasErrors = newAnswerErrors.some(e => e);
    setValidationErrors(prev => ({ ...prev, answers: newAnswerErrors }));

    if (hasErrors) {
      setError('Por favor, responda todas las preguntas marcadas.');
      return;
    }

    setIsLoadingAnalysis(true);
    setError(null);
    try {
      const result = await analyzeRootCause(symptom, answers);
      setAnalysis(result);
      setIsLocked(true);
      onComplete({
        symptom,
        questions,
        answers,
        rootCause: result.rootCause,
        requirements: result.requirements,
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const handleEditAnswers = () => {
      setIsLocked(false);
      onEdit();
  };

  const handleEditSymptom = () => {
    setIsLocked(false);
    setSymptomIsLocked(false);
    onEdit();
  };

  return (
    <div className="space-y-8 p-6 bg-dark-card rounded-lg border border-dark-border">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-brand-secondary mb-2 flex items-center gap-3">
            Módulo 1: Descubrimiento y Diagnóstico
          </h2>
          <p className="text-dark-text-secondary">Identificar la causa raíz a partir de un problema vago.</p>
        </div>
        {isLocked && (
            <div className="flex flex-col sm:flex-row gap-2">
                <button onClick={handleEditAnswers} className="px-4 py-2 bg-yellow-600/20 text-yellow-400 border border-yellow-700 hover:bg-yellow-700 hover:text-white rounded-lg transition-colors duration-200 text-sm font-semibold flex items-center gap-2">
                    <RefreshIcon className="w-4 h-4" />
                    Editar Respuestas
                </button>
                <button onClick={handleEditSymptom} className="px-4 py-2 bg-gray-500/20 text-gray-300 border border-gray-600 hover:bg-gray-600 hover:text-white rounded-lg transition-colors duration-200 text-sm font-semibold flex items-center gap-2">
                    <RefreshIcon className="w-4 h-4" />
                    Editar Síntoma
                </button>
            </div>
        )}
      </div>

      {/* Step 1: Ingesta de Problemas */}
      <div>
        <label className="block text-dark-text-primary font-semibold mb-2">Descripción del Problema (Síntoma)</label>
        <div className="relative">
          <textarea
            value={symptom}
            onChange={(e) => {
              setSymptom(e.target.value);
              setError(null); // Clear any error (transcription or validation) on manual input
              if (validationErrors.symptom) {
                setValidationErrors(prev => ({...prev, symptom: false}));
              }
            }}
            placeholder="Ej: 'Necesitamos mejorar nuestro servicio al cliente' o 'El proceso de envío es demasiado lento'."
            className={`w-full p-3 pr-12 bg-dark-bg border rounded-md focus:ring-2 transition ${validationErrors.symptom ? 'border-red-500 ring-1 ring-red-500' : 'border-dark-border focus:border-brand-primary focus:ring-brand-primary'}`}
            rows={3}
            disabled={isLocked || symptomIsLocked}
          />
           <button
            onClick={() => handleToggleRecording('symptom')}
            disabled={isLocked || symptomIsLocked || isValidating !== null}
            className={`absolute right-3 top-3 p-2 rounded-full transition-colors ${
                isRecording && recordingTarget === 'symptom'
                ? 'bg-red-500 text-white animate-pulse'
                : isValidating === 'symptom'
                ? 'bg-blue-500 text-white'
                : 'bg-dark-bg text-dark-text-secondary hover:bg-brand-primary/20'
            }`}
            aria-label="Grabar síntoma por voz"
          >
            {isValidating === 'symptom' ? <Spinner /> : <MicrophoneIcon className="w-5 h-5" />}
          </button>
        </div>
        <button onClick={handleSymptomSubmit} disabled={isLoadingQuestions || isLocked || symptomIsLocked} className="mt-4 px-6 py-2 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors flex items-center justify-center w-full sm:w-auto disabled:bg-gray-500 disabled:cursor-not-allowed">
            {isLoadingQuestions ? <Spinner /> : 'Generar Preguntas'}
        </button>
      </div>

      {/* Step 2: Cuestionamiento Guiado */}
      {questions.length > 0 && (
        <div className="border-t border-dark-border pt-6">
          <h3 className="text-lg font-semibold text-dark-text-primary mb-4">Cuestionamiento Guiado por IA</h3>
          <div className="space-y-4">
            {questions.map((q, i) => (
              <div key={i}>
                <label className="block text-dark-text-secondary mb-1">{i + 1}. {q}</label>
                 <div className="relative flex items-center">
                    <input
                      type="text"
                      value={answers[i] || ''}
                      onChange={(e) => handleAnswerChange(i, e.target.value)}
                      className={`w-full p-2 pr-10 bg-dark-bg border rounded-md focus:ring-2 transition ${validationErrors.answers[i] ? 'border-red-500 ring-1 ring-red-500' : 'border-dark-border focus:border-brand-primary focus:ring-brand-primary'}`}
                      disabled={isLocked}
                    />
                    <button
                        onClick={() => handleToggleRecording(i)}
                        disabled={isLocked || isValidating !== null}
                        className={`absolute right-2 p-1 rounded-full transition-colors ${
                            isRecording && recordingTarget === i
                            ? 'bg-red-500 text-white animate-pulse'
                            : isValidating === i
                            ? 'bg-blue-500 text-white p-2'
                            : 'bg-dark-bg text-dark-text-secondary hover:bg-brand-primary/20'
                        }`}
                        aria-label={`Grabar respuesta ${i + 1} por voz`}
                    >
                        {isValidating === i ? <Spinner /> : <MicrophoneIcon className="w-5 h-5" />}
                    </button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={handleAnalysisSubmit} disabled={isLoadingAnalysis || isLocked} className="mt-6 px-6 py-2 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors flex items-center justify-center w-full sm:w-auto disabled:bg-gray-500 disabled:cursor-not-allowed">
              {isLoadingAnalysis ? <Spinner /> : 'Analizar Causa Raíz'}
          </button>
        </div>
      )}

      {/* Step 3: Análisis y Traducción */}
      {analysis && (
         <div className="border-t border-dark-border pt-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-dark-text-primary mb-4">Resultado del Diagnóstico</h3>
            <div className="space-y-6">
                <div>
                    <h4 className="font-semibold text-dark-text-primary mb-2 flex items-center gap-2"><LightBulbIcon className="w-6 h-6 text-yellow-400" /> Causa Raíz Identificada</h4>
                    <p className="bg-dark-bg p-4 rounded-md border border-dark-border text-dark-text-secondary">{analysis.rootCause}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-dark-text-primary mb-2 flex items-center gap-2"><DocumentTextIcon className="w-6 h-6 text-green-400" /> Requerimientos de Acción</h4>
                    <ul className="list-disc list-inside space-y-2 bg-dark-bg p-4 rounded-md border border-dark-border text-dark-text-secondary">
                        {analysis.requirements.map((req, i) => <li key={i}>{req}</li>)}
                    </ul>
                </div>
            </div>
        </div>
      )}
      
      {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
    </div>
  );
};

export default Module1Diagnosis;