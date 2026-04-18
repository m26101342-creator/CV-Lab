import { GoogleGenAI, ThinkingLevel } from "@google/genai";

// Initialize lazily to prevent app crash on load if key is missing
let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    // Check various sources for API key:
    // 1. process.env (Standard AI Studio environment)
    // 2. import.meta.env.VITE_GEMINI_API_KEY (Standard Vite production build)
    let apiKey = "";
    
    // @ts-ignore - process might not exist in browser
    if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
      apiKey = process.env.GEMINI_API_KEY;
    } 
    // @ts-ignore - import.meta.env is Vite specific
    else if ((import.meta as any).env && (import.meta as any).env.VITE_GEMINI_API_KEY) {
      apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
    }
    
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing. AI features may not work outside the preview environment without configuration.");
    }
    
    // Note: The fallback below is for demo purposes in safe environments. 
    // In production, the key MUST be provided via environment variables.
    aiInstance = new GoogleGenAI({ apiKey: apiKey || "" });
  }
  return aiInstance;
}

export async function optimizeResumeText(text: string, type: 'summary' | 'experience' | 'skills'): Promise<string> {
  const prompt = `
    Você é um especialista em recrutamento (RH) e redator de currículos de alto nível.
    Sua tarefa é reescrever o texto abaixo para torná-lo profissional, focado em resultados e dinâmico.
    Use verbos de ação poderosos e métricas se houver. 
    
    TIPO DE CAMPO: ${type === 'summary' ? 'Resumo Profissional' : type === 'experience' ? 'Experiência Profissional' : 'Habilidades'}
    TEXTO ORIGINAL: "${text}"
    
    REGRAS:
    1. Retorne APENAS o texto otimizado.
    2. Nunca use markdown (como **negrito**, listas com *, etc).
    3. Mantenha o idioma em Português (PT-PT ou PT-BR).
    4. Não adicione introduções como "Aqui está o texto:".
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        temperature: 0.7,
        topP: 0.95,
      }
    });
    
    const result = response.text?.trim();
    return result && result.length > 5 ? result.replace(/\*/g, '') : text;
  } catch (error) {
    console.error("Erro na otimização Gemini:", error);
    return text;
  }
}

export async function generateCoverLetter(resumeData: any, jobTitle: string): Promise<string> {
  const prompt = `
    Escreva uma carta de apresentação personalizada para o cargo: "${jobTitle}".
    BASE DE DADOS DO CANDIDATO:
    - Nome: ${resumeData.personalInfo.fullName}
    - Título: ${resumeData.personalInfo.title}
    - Resumo: ${resumeData.personalInfo.summary}
    - Experiências: ${JSON.stringify(resumeData.experience.map((e: any) => ({ cargo: e.position, empresa: e.company })))}
    
    ESTILO: Profissional, confiante, moderno e único.
    DURAÇÃO: Máximo 3 parágrafos curtos.
    
    REGRAS:
    1. Retorne APENAS a carta.
    2. Sem markdown. Sem asteriscos.
    3. Não use placeholders como "[Seu Telefone]". Use os dados fornecidos ou ignore se faltar.
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.8,
        topP: 0.95
      }
    });
    
    const result = response.text?.trim();
    return result || "Sentimos muito, não foi possível gerar a carta agora. Tente novamente em instantes.";
  } catch (error) {
    console.error("Erro ao gerar carta com Gemini:", error);
    return "Ocorreu um erro técnico ao gerar sua carta. Verifique sua conexão.";
  }
}
