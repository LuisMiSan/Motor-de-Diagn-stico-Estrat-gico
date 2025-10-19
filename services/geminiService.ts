import { GoogleGenAI, Type, GenerateContentResponse, GenerateContentParameters } from "@google/genai";
import { DiagnosisResult, RedesignResult, SolutionCategory, ImpactResult } from "../types";
import { getFromCache, setInCache } from './cacheService';


const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Envuelve una llamada a la API de Gemini con lógica de reintento.
 * @param apiCall La función de la API a llamar.
 * @param params Los parámetros para la llamada a la API.
 * @param maxRetries El número máximo de reintentos.
 * @returns Una promesa que se resuelve con la respuesta de la API.
 */
const geminiApiCallWithRetry = async (
  params: GenerateContentParameters,
  maxRetries = 2
): Promise<GenerateContentResponse> => {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      const response = await ai.models.generateContent(params);
      if (!response || !response.text) {
          throw new Error("La respuesta de la IA está vacía o es inválida.");
      }
      return response;
    } catch (error) {
      attempt++;
      console.error(`Error en la llamada a la API (intento ${attempt}/${maxRetries + 1}):`, error);
      if (attempt > maxRetries) {
        if (error instanceof Error) {
            if (error.message.toLowerCase().includes('fetch') || error.message.toLowerCase().includes('network')) {
                 throw new Error("Error de red al comunicarse con la IA. Verifique su conexión a internet e inténtelo de nuevo.");
            }
             throw new Error(`Error final al contactar la IA: ${error.message}. Por favor, inténtelo de nuevo más tarde.`);
        }
        throw new Error("Ocurrió un error inesperado al comunicarse con la IA después de varios intentos.");
      }
      // Espera exponencial simple antes del siguiente reintento
      await new Promise(res => setTimeout(res, 1000 * attempt));
    }
  }
  // Este código no debería ser alcanzable, pero es necesario para la verificación de tipos de TypeScript.
  throw new Error("Se superó el número máximo de reintentos sin una respuesta válida.");
};


export const generateFollowUpQuestions = async (problem: string): Promise<string[]> => {
  const cacheKeyInputs = { problem };
  const cached = getFromCache<string[]>('generateFollowUpQuestions', cacheKeyInputs);
  if (cached) return cached;

  const params: GenerateContentParameters = {
    model: "gemini-2.5-flash",
    contents: `Basado en el siguiente problema de negocio vago: "${problem}", genera 4 preguntas de seguimiento cruciales y concisas para diagnosticar la causa raíz. Estas preguntas deben obligar al usuario a proporcionar contexto y datos específicos.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      },
    },
  };

  try {
    const response = await geminiApiCallWithRetry(params);
    const jsonStr = response.text.trim();
    const result = JSON.parse(jsonStr);
    
    setInCache('generateFollowUpQuestions', cacheKeyInputs, result.questions);
    return result.questions;
  } catch (error) {
    console.error("Error al generar preguntas de seguimiento (después de reintentos):", error);
    if (error instanceof Error && error.message.includes("JSON")) {
      throw new Error("No se pudieron generar las preguntas. La IA devolvió un formato de respuesta inesperado.");
    }
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido.';
    throw new Error(`No se pudieron generar las preguntas de seguimiento. ${errorMessage}`);
  }
};

export const analyzeRootCause = async (problem: string, answers: string[]): Promise<{ rootCause: string; requirements: string[] }> => {
  const cacheKeyInputs = { problem, answers };
  const cached = getFromCache<{ rootCause: string; requirements: string[] }>('analyzeRootCause', cacheKeyInputs);
  if (cached) return cached;

  const formattedAnswers = answers.map((a, i) => `Respuesta ${i + 1}: ${a}`).join('\n');
  
  const params: GenerateContentParameters = {
    model: "gemini-2.5-flash",
    contents: `Problema de negocio inicial: "${problem}"\n\nRespuestas a las preguntas de diagnóstico:\n${formattedAnswers}\n\nAnaliza esta información para identificar la causa raíz real, no solo el síntoma. Luego, traduce la causa raíz en un conjunto de 3 a 5 requerimientos de acción específicos y claros (procesales y técnicos).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          rootCause: {
            type: Type.STRING,
            description: "El análisis conciso de la causa raíz del problema."
          },
          requirements: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Una lista de requerimientos de acción."
          }
        }
      },
    },
  };

  try {
    const response = await geminiApiCallWithRetry(params);
    const jsonStr = response.text.trim();
    const result = JSON.parse(jsonStr);

    setInCache('analyzeRootCause', cacheKeyInputs, result);
    return result;
  } catch (error) {
    console.error("Error al analizar la causa raíz (después de reintentos):", error);
    if (error instanceof Error && error.message.includes("JSON")) {
      throw new Error("No se pudo analizar la causa raíz. La IA devolvió un formato de respuesta inesperado.");
    }
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido.';
    throw new Error(`No se pudo analizar la causa raíz. ${errorMessage}`);
  }
};

export const generateRedesign = async (diagnosis: DiagnosisResult): Promise<RedesignResult> => {
  const cacheKeyInputs = { diagnosis };
  const cached = getFromCache<RedesignResult>('generateRedesign', cacheKeyInputs);
  if (cached) return cached;

  const diagnosisContext = `
    Síntoma inicial: ${diagnosis.symptom}
    Causa raíz identificada: ${diagnosis.rootCause}
    Requerimientos: ${diagnosis.requirements.join(', ')}
  `;

  const params: GenerateContentParameters = {
    model: "gemini-2.5-flash",
    contents: `Basado en el siguiente diagnóstico de negocio:
      ${diagnosisContext}

      Realiza las siguientes tareas:
      1.  Crea un diagrama de flujo SVG simple para el proceso 'As-Is' (actual). Usa rectángulos (rx="8", fill="#4A5568", stroke="#A0AEC0"), texto (fill="#EDF2F7", font-size="14"), y flechas (path con marker-end). El SVG debe tener un fondo transparente y un padding de 20px.
      2.  Crea un diagrama de flujo SVG simple para el proceso 'To-Be' (rediseñado) que solucione la causa raíz. Usa rectángulos (rx="8", fill="#00A9FF", stroke="#A0E9FF") y el mismo estilo de texto y flechas.
      3.  Propón una combinación de 3 a 4 soluciones de transformación, clasificadas en 'Rediseño de Proceso Puro', 'Cambios Organizacionales', o 'Implementación Tecnológica'.
      4.  Escribe una breve revisión del diseño 'To-Be', verificando que se establezca visibilidad y protocolos de autoridad claros.
      `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          asIsSVG: { type: Type.STRING, description: "Código SVG del diagrama de flujo 'As-Is'." },
          toBeSVG: { type: Type.STRING, description: "Código SVG del diagrama de flujo 'To-Be'." },
          solutions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING, enum: Object.values(SolutionCategory) },
                description: { type: Type.STRING }
              }
            }
          },
          review: { type: Type.STRING, description: "Revisión de visibilidad y protocolos." }
        }
      },
    },
  };

  try {
    const response = await geminiApiCallWithRetry(params);
    const jsonStr = response.text.trim();
    const result = JSON.parse(jsonStr);

    setInCache('generateRedesign', cacheKeyInputs, result);
    return result;
  } catch (error) {
    console.error("Error al generar el rediseño (después de reintentos):", error);
    if (error instanceof Error && error.message.includes("JSON")) {
      throw new Error("No se pudo generar el rediseño. La IA devolvió un formato de respuesta inesperado.");
    }
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido.';
    throw new Error(`No se pudo generar el plan de rediseño. ${errorMessage}`);
  }
};


export const calculateImpact = async (diagnosis: DiagnosisResult, redesign: RedesignResult): Promise<ImpactResult> => {
    const cacheKeyInputs = { diagnosis, redesign };
    const cached = getFromCache<ImpactResult>('calculateImpact', cacheKeyInputs);
    if (cached) return cached;

    const context = `
    Diagnóstico: Causa raíz fue '${diagnosis.rootCause}'.
    Solución: Se propuso un rediseño con las siguientes soluciones: ${redesign.solutions.map(s => s.description).join(', ')}.
    `;

    const params: GenerateContentParameters = {
      model: "gemini-2.5-flash",
      contents: `Dado el siguiente contexto de un proyecto de transformación de negocio:
      ${context}

      Realiza un análisis de impacto:
      1.  Clasifica el proyecto en un Tier de 1 a 4 según la jerarquía de valor (1: Eficacia, 2: Reducción de Costos, 3: Mejora de Ingresos, 4: Diferencia Competitiva).
      2.  Proyecta un ROI cuantificable. Proporciona una métrica clave (ej. 'Aumento de ingresos anual'), un valor numérico estimado, y una breve descripción justificando el cálculo.
      3.  Genera un párrafo de comunicación de valor para una propuesta, enfocándose en los resultados de negocio (Beneficios, Costos Reducidos, etc.) en lugar de detalles técnicos.
      `,
      config: {
          responseMimeType: "application/json",
          responseSchema: {
              type: Type.OBJECT,
              properties: {
                  tier: { type: Type.INTEGER, description: "Tier del proyecto (1-4)." },
                  roi: {
                      type: Type.OBJECT,
                      properties: {
                          metric: { type: Type.STRING },
                          value: { type: Type.NUMBER },
                          description: { type: Type.STRING }
                      }
                  },
                  communication: { type: Type.STRING, description: "Texto de comunicación de valor." }
              }
          },
      },
    };

    try {
        const response = await geminiApiCallWithRetry(params);
        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);

        setInCache('calculateImpact', cacheKeyInputs, result);
        return result;
    } catch (error) {
        console.error("Error al calcular el impacto (después de reintentos):", error);
        if (error instanceof Error && error.message.includes("JSON")) {
          throw new Error("No se pudo calcular el impacto. La IA devolvió un formato de respuesta inesperado.");
        }
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido.';
        throw new Error(`No se pudo calcular el impacto de negocio. ${errorMessage}`);
    }
};

export const validateTranscription = async (transcript: string): Promise<{ isValid: boolean; feedback: string }> => {
  const params: GenerateContentParameters = {
    model: "gemini-2.5-flash",
    contents: `Evalúa la siguiente transcripción de voz de un contexto de negocio. ¿Es coherente y comprensible?
    Transcripción: "${transcript}"
    
    Responde SOLO con un JSON. Si es válida, responde:
    { "isValid": true, "feedback": "Transcripción clara." }
    
    Si es ininteligible, inconsistente o ruido sin sentido, responde:
    { "isValid": false, "feedback": "La transcripción no fue clara. Por favor, intente hablar más despacio y claro cerca del micrófono." }`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isValid: { type: Type.BOOLEAN },
          feedback: { type: Type.STRING }
        }
      },
    },
  };
  try {
    // Usamos menos reintentos para esta validación rápida para no retrasar al usuario.
    const response = await geminiApiCallWithRetry(params, 1);
    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error al validar la transcripción (después de reintentos):", error);
    // Devuelve un estado válido por defecto para no bloquear al usuario si el servicio de validación falla.
    return { isValid: true, feedback: "La validación falló, se aceptó la transcripción." };
  }
};