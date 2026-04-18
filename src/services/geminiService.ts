import { GoogleGenAI } from "@google/genai";

// Initialize lazily to prevent app crash on load if key is missing in Cloudflare
let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    // Uses process.env.GEMINI_API_KEY (from Vite define) OR the fallback key provided
    const apiKey = process.env.GEMINI_API_KEY || "AIzaSyANw7mUcHAXUsqL2H_YDZZEtk3A7Bl7hM0";
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function optimizeResumeText(text: string, type: 'summary' | 'experience' | 'skills'): Promise<string> {
  const prompt = `
    Como um especialista em RH e currículos profissionais, melhore o seguinte texto para um currículo.
    O objetivo é torná-lo mais impactante, profissional e focado em resultados.
    Use verbos de ação e linguagem corporativa moderna.
    
    Tipo de conteúdo: ${type}
    Texto original: "${text}"
    
    IMPORTANTE: Não utilize formatação markdown como negrito (**) ou listas com marcações de asterisco (*). Retorne apenas texto puro, sem introduções ou explicações.
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    const cleanedText = (response.text || text).replace(/\*/g, '');
    return cleanedText;
  } catch (error) {
    console.error("Error optimizing text with Gemini:", error);
    return text.replace(/\*/g, '');
  }
}

export async function generateCoverLetter(resumeData: any, jobTitle: string): Promise<string> {
  const prompt = `
    Crie uma carta de apresentação profissional e única para o cargo de "${jobTitle}".
    Baseie-se nos seguintes dados do candidato:
    Nome: ${resumeData.personalInfo.fullName}
    Título: ${resumeData.personalInfo.title}
    Resumo: ${resumeData.personalInfo.summary}
    Experiência: ${JSON.stringify(resumeData.experience)}
    
    A carta deve ser persuasiva, moderna e destacar as habilidades do candidato.
    Mantenha um tom profissional mas com um toque pessoal e único.
    Não use clichês genéricos.
    IMPORTANTE: Não utilize formatação markdown como negrito (**) ou listas com marcações de asterisco (*). Retorne apenas texto puro com parágrafos.
    
    Retorne apenas a carta de apresentação, formatada profissionalmente.
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    // Sanitize output to remove any potential asterisks
    const cleanedText = (response.text || "").replace(/\*/g, '');
    return cleanedText || "Erro ao gerar a carta. Tente novamente.";
  } catch (error) {
    console.error("Error generating cover letter with Gemini:", error);
    return "Erro ao gerar a carta. Verifique sua conexão.";
  }
}
