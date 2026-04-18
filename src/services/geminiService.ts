import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function optimizeResumeText(text: string, type: 'summary' | 'experience' | 'skills'): Promise<string> {
  const prompt = `
    Como um especialista em RH e currículos profissionais, melhore o seguinte texto para um currículo.
    O objetivo é torná-lo mais impactante, profissional e focado em resultados.
    Use verbos de ação e linguagem corporativa moderna.
    
    Tipo de conteúdo: ${type}
    Texto original: "${text}"
    
    Retorne apenas o texto otimizado, sem introduções ou explicações.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    return response.text || text;
  } catch (error) {
    console.error("Error optimizing text with Gemini:", error);
    return text;
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
    
    Retorne apenas a carta de apresentação, formatada profissionalmente.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    return response.text || "Erro ao gerar a carta. Tente novamente.";
  } catch (error) {
    console.error("Error generating cover letter with Gemini:", error);
    return "Erro ao gerar a carta. Verifique sua conexão.";
  }
}
