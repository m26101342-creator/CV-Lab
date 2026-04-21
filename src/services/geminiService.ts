import { GoogleGenAI, ThinkingLevel } from "@google/genai";

// Initialize lazily to prevent app crash on load if key is missing
let engineInstance: GoogleGenAI | null = null;

function getEngine() {
  if (!engineInstance) {
    // Check various sources for API key:
    // 1. process.env (Standard environment)
    // 2. import.meta.env.VITE_GEMINI_API_KEY (Standard production build)
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
      console.warn("GEMINI_API_KEY is missing. Features may not work outside the preview environment without configuration.");
    }
    
    // Note: The fallback below is for demo purposes in safe environments. 
    // In production, the key MUST be provided via environment variables.
    engineInstance = new GoogleGenAI({ apiKey: apiKey || "" });
  }
  return engineInstance;
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
    const engine = getEngine();
    const response = await engine.models.generateContent({
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
    console.error("Erro na otimização do sistema:", error);
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
    const engine = getEngine();
    const response = await engine.models.generateContent({
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
    console.error("Erro ao gerar carta com o sistema:", error);
    return "Ocorreu um erro técnico ao gerar sua carta. Verifique sua conexão.";
  }
}

export async function generateFullResume(personalInfo: any): Promise<any> {
  const prompt = `
    Você é um assistente de carreira. 
    Com base nas informações básicas do usuário abaixo, gere um rascunho completo de currículo.
    
    INFORMAÇÕES BÁSICAS:
    - Nome: ${personalInfo.fullName}
    - Cargo Pretendido: ${personalInfo.title}
    - Localização: ${personalInfo.location || 'Não especificada'}
    
    TAREFA:
    Gere um JSON com os seguintes campos:
    - summary: Um parágrafo impactante.
    - experience: Array de 2 objetos com { company, position, startDate, endDate, description }.
    - education: Array de 1 objeto com { institution, degree, field, startDate, endDate }.
    - skills: Array de 5 habilidades relevantes (apenas string).
    - languages: Array de 2 idiomas relevantes (apenas string).
    
    REGRAS:
    1. Retorne APENAS o JSON puro. Sem blocos de código (\`\`\`json).
    2. Invente dados realistas baseados no cargo: "${personalInfo.title}".
    3. Idioma: Português.
  `;

  try {
    const engine = getEngine();
    const response = await engine.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.6
      }
    });
    
    const result = response.text?.trim() || "";
    return JSON.parse(result);
  } catch (error) {
    console.error("Erro ao auto-completar currículo:", error);
    throw error;
  }
}

export async function parseResumeFromText(rawText: string, imageData?: string): Promise<any> {
    console.log("parseResumeFromText: Enviando dados. Texto:", !!rawText, "Imagem:", !!imageData);
    
    const textPart = {
      text: `
        Analise o currículo fornecido e extraia as informações no formato JSON estruturado.
        
        SINTAXE DO JSON:
        {
          "personalInfo": {
            "fullName": "Nome Completo",
            "title": "Cargo ou Título Profissional",
            "email": "E-mail",
            "phone": "Telemóvel/Telefone",
            "location": "Cidade/País",
            "summary": "Resumo Profissional extraído ou sintetizado"
          },
          "experience": [
            { "company": "Empresa", "position": "Cargo", "startDate": "Data", "endDate": "Data", "description": "Resumo das funções" }
          ],
          "education": [
            { "institution": "Escola/Universidade", "degree": "Grau", "field": "Área de Estudo", "startDate": "Data", "endDate": "Data" }
          ],
          "skills": ["Habilidade 1"],
          "languages": ["Idioma 1"],
          "certifications": ["Certificado 1"],
          "interests": ["Interesse 1"]
        }

        REGRAS:
        1. Retorne APENAS o JSON.
        2. Melhore o tom para ser profissional.
        3. Se houver imagem, use-a para OCR se o texto estiver em falta ou confuso.
        4. Texto extraído (se houver):
        "${rawText}"
      `
    };

    const parts: any[] = [textPart];
    
    if (imageData) {
      parts.push({
        inlineData: {
          mimeType: "image/png",
          data: imageData.split(',')[1] // Remove prefix data:image/png;base64,
        }
      });
    }

    try {
        const engine = getEngine();
        const response = await engine.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                temperature: 0.1
            }
        });
        
        const result = response.text?.trim() || "{}";
        return JSON.parse(result);
    } catch (error) {
        console.error("Erro ao analisar currículo com IA (Multimodal):", error);
        throw error;
    }
}
