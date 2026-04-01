
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { PatientCase, DiagnosticResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 2000): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const isRateLimit = err.message?.includes('429') || err.status === 429 || err.message?.includes('RESOURCE_EXHAUSTED');
      if (isRateLimit && i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.warn(`Rate limit hit. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
};

export const analyzeMedicalCase = async (patientCase: PatientCase): Promise<DiagnosticResult> => {
  return withRetry(async () => {
    const model = ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              text: `Analyze this clinical case. Provide a professional medical summary, 3-5 differential diagnoses with probabilities and rationales, a risk assessment, and detailed clinical reasoning. 
              
              Additionally, provide Prognostic Analytics:
              1. Estimate the likelihood of success (successRate 0-100) for at least 3 different treatment paths (e.g., Surgery, Radiation, Chemotherapy, or conservative management) based on the case.
              2. Provide a survival estimate (e.g., "5-year: 85%") for each path.
              3. Provide a brief clinical rationale for each estimate.

              Finally, provide Lifestyle & Safety Guidance:
              1. List specific dietary recommendations or restrictions relevant to the condition.
              2. List critical clinical precautions or warning signs the patient should monitor.

              If an image is provided:
              1. Perform a computer vision analysis to identify anomalies, lesions, fractures, or areas of clinical concern.
              2. Provide visual annotations for these areas using a [0, 1000] coordinate system.
              3. Label primary concerns as 'Primary' and secondary areas that require monitoring as 'Secondary'.
              4. Provide a brief coordinate-based description for each annotation.

              Patient: ${patientCase.patient.name}, ${patientCase.patient.age}yo ${patientCase.patient.gender}.
              Medical History: ${patientCase.patient.history}
              Current Symptoms: ${patientCase.symptoms}
              `
            },
            ...(patientCase.imagingUrl ? [{
              inlineData: {
                mimeType: 'image/jpeg',
                data: patientCase.imagingUrl.split(',')[1] // remove data:image/jpeg;base64,
              }
            }] : [])
          ]
        }
      ],
      config: {
        systemInstruction: "You are a clinical decision support AI acting as an expert medical diagnostician. Provide structured, accurate, and evidence-based medical reasoning. Always include a disclaimer that this is a tool for clinicians.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            differentials: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  condition: { type: Type.STRING },
                  probability: { type: Type.NUMBER },
                  rationale: { type: Type.STRING },
                  recommendedTests: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["condition", "probability", "rationale", "recommendedTests"]
              }
            },
            riskAssessment: { type: Type.STRING, enum: ["Low", "Moderate", "High", "Critical"] },
            clinicalReasoning: { type: Type.STRING },
            dietaryRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            precautions: { type: Type.ARRAY, items: { type: Type.STRING } },
            annotations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ["Primary", "Secondary"] },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  label: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["type", "x", "y", "label", "description"]
              }
            },
            prognostics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  treatment: { type: Type.STRING },
                  successRate: { type: Type.NUMBER },
                  survivalEstimate: { type: Type.STRING },
                  rationale: { type: Type.STRING }
                },
                required: ["treatment", "successRate", "survivalEstimate", "rationale"]
              }
            }
          },
          required: ["summary", "differentials", "riskAssessment", "clinicalReasoning"]
        }
      }
    });

    const response: GenerateContentResponse = await model;
    return JSON.parse(response.text || '{}');
  });
};

export const searchMedicalLiterature = async (query: string) => {
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Find medical research and guidelines related to: ${query}`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    
    return {
      text: response.text,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.web?.title || 'Medical Source',
        uri: chunk.web?.uri || '#'
      })) || []
    };
  });
};
