
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { PatientCase, DiagnosticResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const analyzeMedicalCase = async (patientCase: PatientCase): Promise<DiagnosticResult> => {
  const model = ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: [
      {
        parts: [
          {
            text: `Analyze this clinical case. Provide a professional medical summary, 3-5 differential diagnoses with probabilities and rationales, a risk assessment, and detailed clinical reasoning. 
            
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
          clinicalReasoning: { type: Type.STRING }
        },
        required: ["summary", "differentials", "riskAssessment", "clinicalReasoning"]
      }
    }
  });

  const response: GenerateContentResponse = await model;
  return JSON.parse(response.text || '{}');
};

export const searchMedicalLiterature = async (query: string) => {
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
};
