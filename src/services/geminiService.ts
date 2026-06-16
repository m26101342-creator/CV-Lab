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
      model: "gemini-3.5-flash",
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
      model: "gemini-3.5-flash",
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
      model: "gemini-3.5-flash",
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

function cleanAndNormalizeParsedData(parsedData: any): any {
  if (!parsedData) parsedData = {};

  const cleanId = () => Math.random().toString(36).substring(7);

  // 1. Personal Info
  const inputPI = parsedData.personalInfo || {};
  const personalInfo = {
    fullName: String(inputPI.fullName || '').trim(),
    email: String(inputPI.email || '').trim(),
    phone: String(inputPI.phone || '').trim(),
    location: String(inputPI.location || '').trim(),
    website: String(inputPI.website || '').trim(),
    title: String(inputPI.title || '').trim(),
    summary: String(inputPI.summary || '').trim(),
  };

  // 2. Experience
  const experience: any[] = [];
  if (Array.isArray(parsedData.experience)) {
    parsedData.experience.forEach((exp: any) => {
      if (exp && (exp.company || exp.position || exp.description)) {
        experience.push({
          id: exp.id || cleanId(),
          company: String(exp.company || '').trim(),
          position: String(exp.position || '').trim(),
          startDate: String(exp.startDate || '').trim(),
          endDate: String(exp.endDate || '').trim(),
          description: String(exp.description || '').trim(),
          current: !!exp.current
        });
      }
    });
  }

  // 3. Education
  const education: any[] = [];
  if (Array.isArray(parsedData.education)) {
    parsedData.education.forEach((edu: any) => {
      if (edu && (edu.institution || edu.degree)) {
        education.push({
          id: edu.id || cleanId(),
          institution: String(edu.institution || '').trim(),
          degree: String(edu.degree || '').trim(),
          field: String(edu.field || '').trim(),
          startDate: String(edu.startDate || '').trim(),
          endDate: String(edu.endDate || '').trim()
        });
      }
    });
  }

  // 4. Skills
  const skills: any[] = [];
  if (Array.isArray(parsedData.skills)) {
    parsedData.skills.forEach((sk: any) => {
      if (!sk) return;
      if (typeof sk === 'string') {
        skills.push({
          id: cleanId(),
          name: sk.trim(),
          level: 'Avançado'
        });
      } else if (typeof sk === 'object') {
        const nameVal = sk.name || sk.skill || sk.title || '';
        if (nameVal) {
          let lvl: any = sk.level || 'Avançado';
          if (!['Básico', 'Intermédio', 'Avançado', 'Especialista'].includes(lvl)) {
            lvl = 'Avançado';
          }
          skills.push({
            id: sk.id || cleanId(),
            name: String(nameVal).trim(),
            level: lvl
          });
        }
      }
    });
  }

  // 5. Languages
  const languages: any[] = [];
  if (Array.isArray(parsedData.languages)) {
    parsedData.languages.forEach((lang: any) => {
      if (!lang) return;
      if (typeof lang === 'string') {
        languages.push({
          id: cleanId(),
          name: lang.trim(),
          level: 'Fluente'
        });
      } else if (typeof lang === 'object') {
        const nameVal = lang.name || lang.language || '';
        if (nameVal) {
          let lvl: any = lang.level || 'Fluente';
          if (!['Básico', 'Intermédio', 'Avançado', 'Fluente', 'Nativo'].includes(lvl)) {
            lvl = 'Fluente';
          }
          languages.push({
            id: lang.id || cleanId(),
            name: String(nameVal).trim(),
            level: lvl
          });
        }
      }
    });
  }

  // 6. Certifications
  const certifications: any[] = [];
  if (Array.isArray(parsedData.certifications)) {
    parsedData.certifications.forEach((cert: any) => {
      if (!cert) return;
      if (typeof cert === 'string') {
        certifications.push({
          id: cleanId(),
          name: cert.trim(),
          date: ''
        });
      } else if (typeof cert === 'object') {
        const nameVal = cert.name || cert.title || '';
        if (nameVal) {
          certifications.push({
            id: cert.id || cleanId(),
            name: String(nameVal).trim(),
            date: String(cert.date || cert.year || '').trim()
          });
        }
      }
    });
  }

  // 7. Interests
  let interests: string[] = [];
  if (Array.isArray(parsedData.interests)) {
    interests = parsedData.interests.map((itm: any) => String(itm || '').trim()).filter(Boolean);
  }

  return {
    personalInfo,
    experience,
    education,
    skills,
    languages,
    certifications,
    interests
  };
}

export async function parseResumeFromText(rawText: string, imageData?: string): Promise<any> {
    console.log("parseResumeFromText: Enviando dados para processamento. Texto:", !!rawText, "Imagem:", !!imageData);
    
    const textPart = {
      text: `
        Você é o principal algoritmo de Inteligência Artificial para extração e classificação de currículos profissionais na Língua Portuguesa.
        Sua missão é ler e analisar minuciosamente o currículo, reconhecendo e classificando com precisão cirúrgica as informações de contato, resumo profissional, histórico de trabalho, formação académica, habilidades e certificações.

        INSTRUÇÕES DE CLASSIFICAÇÃO:
        1. "personalInfo": Extraia o nome completo do candidato, o seu cargo ou título desejado/atual, e-mail, telemóvel/telefone, localização e um Resumo Profissional ("summary"). Caso não exista um resumo profissional explícito, fabrique um parágrafo executivo profissional impecável focado no perfil e experiências extraídos.
        2. "experience": Mapeie todo o histórico de trabalho. Identifique rigorosamente a empresa ("company"), o cargo ("position"), as datas de início e fim ("startDate", "endDate" - ex: "10/2021" ou "2021"), e o detalhamento das funções executivas ("description").
        3. "education": Mapeie todos os estudos, escolas ou universidades ("institution"), graus académicos ("degree" - Licenciatura/Mestrado/Técnico), área de estudo ("field") e períodos.
        4. "skills": Extraia todas as competências profissionais, técnicas, operacionais ou comportamentais. Retorne uma lista de strings contendo apenas os nomes das habilidades de maneira limpa (ex: "Excel Avançado", "Liderança").
        5. "languages": Identifique todos os idiomas mencionados e mapeie os seus níveis.
        6. "certifications": Extraia certificados de cursos livres, formações rápidas com o nome e, se houver, a data ou ano.

        SINTAXE DO RETORNO JSON ESPERADO:
        {
          "personalInfo": {
            "fullName": "Nome Completo",
            "title": "Cargo ou Título Profissional",
            "email": "E-mail de contato",
            "phone": "Telemóvel/Telefone principal",
            "location": "Cidade, País (ou apenas Cidade/Província)",
            "summary": "Resumo executivo de alto impacto"
          },
          "experience": [
            {
              "company": "Nome da Empresa ou Instituição",
              "position": "Cargo ocupado",
              "startDate": "Mês/Ano ou Ano de Início",
              "endDate": "Mês/Ano, Ano de Fim ou 'Presente'/'Atual'",
              "description": "Explicação fluida e detalhada do que fez",
              "current": false
            }
          ],
          "education": [
            {
              "institution": "Universidade, Escola ou Instituto",
              "degree": "Grau obtido (Licenciatura, Técnico, etc.)",
              "field": "Área de Estudo / Curso",
              "startDate": "Ano de Início",
              "endDate": "Ano de Fim ou 'Frequentando' / 'Em curso'"
            }
          ],
          "skills": ["Habilidade 1", "Habilidade 2", "Habilidade 3", "Habilidade 4", "Habilidade 5"],
          "languages": [
            { "name": "Nome do Idioma", "level": "Nível (ex: Avançado, Fluente, Intermédio, Nativo, Básico)" }
          ],
          "certifications": [
            { "name": "Nome da Certificação ou Curso Livre", "date": "Ano ou Data" }
          ],
          "interests": ["Interesse 1", "Interesse 2"]
        }

        REGRAS RIGOROSAS:
        1. Retorne APENAS o JSON. Sem blocos ou wraps de código adicionais (\`\`\`json).
        2. Certifique-se de preencher as secções "personalInfo", "experience", "education" e "skills" com dedicação máxima.
        3. Se houver uma imagem anexa, faça OCR e leitura visual dela para garantir consistência perfeita.
        
        TEXTO ENVIADO PELO CANDIDATO:
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
            model: "gemini-3.5-flash",
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                temperature: 0.1
            }
        });
        
        const rawResult = response.text?.trim() || "{}";
        const parsed = JSON.parse(rawResult);
        
        // Normalize immediately so it is 100% compliant with React structures and types
        const normalized = cleanAndNormalizeParsedData(parsed);
        console.log("parseResumeFromText: Dados limpos e normalizados com sucesso:", normalized);
        return normalized;
    } catch (error) {
        console.error("Erro ao analisar currículo com IA (Multimodal):", error);
        throw error;
    }
}

export async function translateResumeToEnglish(resumeData: any): Promise<any> {
  const prompt = `
    Você é um tradutor especialista de currículos e consultor de recrutamento internacional de alto nível.
    Sua tarefa é traduzir o currículo estruturado abaixo COMPLETAMENTE para o Inglês Profissional (US).

    DADOS DO CURRÍCULO ORIGINAIS (JSON):
    ${JSON.stringify(resumeData, null, 2)}

    INSTRUÇÕES DE TRADUÇÃO:
    1. Traduza o cargo ("title") e o resumo profissional ("summary") de maneira sofisticada e de alto impacto no inglês de negócios corporativo.
    2. Na secção "experience", traduza os cargos ("position") e as descrições ("description"). Por exemplo: "Diretor Geral" para "General Manager" ou "Managing Director", "Estagiário" para "Intern". Traduza as atividades, conquistas e responsabilidades descritas usando verbos de ação eficientes no passado (ex: Managed, Spearheaded, Developed, Coordinates se atual).
    3. Na secção "education", traduza o grau académico ("degree") de forma equivalente (ex: "Licenciatura" para "Bachelor's Degree", "Mestrado" para "Master's Degree"). Traduza as áreas de estudo ("field") e as instituições ("institution") se estas possuírem nome internacional consolidado (como "Universidade de Luanda" para "University of Luanda"), caso contrário mantenha-as legíveis.
    4. Na secção "skills", traduza de forma inteligente os nomes das habilidades ("name") para o jargão técnico internacional correto em inglês. Certifique-se de traduzir também o nível ("level") se este estiver em português (ex: "Básico" -> "Basic", "Intermédio" -> "Intermediate", "Avançado" -> "Advanced", "Especialista" -> "Expert").
    5. Na secção "languages", traduza os nomes dos idiomas para inglês (ex: "Inglês" -> "English", "Português" -> "Portuguese", "Alemão" -> "German" etc.). Traduza os níveis deles para inglês profissional (ex: "Fluente" -> "Fluent", "Nativo" -> "Native", "Básico" -> "Conversational" ou "Basic", "Avançado" -> "Professional Working Proficiency" ou "Advanced").
    6. Na secção "certifications", se houver, traduza o nome das certificações para os seus equivalentes universais em inglês quando aplicável (ex: "Curso de Gestão de Projetos" -> "Project Management Course").
    7. Preserve TODOS os identificadores de dados ("id") e estruturas de controle ("themeColor", etc) idênticos. Não perca nenhum ID.

    SINTAXE DO RETORNO JSON ESPERADO:
    Retorne APENAS um JSON no mesmo formato que os dados originais recebidos. Sem blocos ou wraps de código adicionais (\`\`\`json).

    REGRAS RIGOROSAS:
    1. Retorne APENAS o JSON puro. Sem introduções. Sem comentários. Sem explicações ou desculpas.
    2. A tradução deve ser impecável, profissional e adequada para recrutadores internacionais.
  `;

  try {
    const engine = getEngine();
    const response = await engine.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });

    const rawResult = response.text?.trim() || "{}";
    const parsed = JSON.parse(rawResult);
    
    // Normalizar ou garantir conformidade
    return {
      ...resumeData,
      ...parsed,
      personalInfo: {
        ...resumeData.personalInfo,
        ...(parsed.personalInfo || {}),
        photo: resumeData.personalInfo?.photo,
        photoStyle: resumeData.personalInfo?.photoStyle,
        photoSize: resumeData.personalInfo?.photoSize
      },
      themeColor: resumeData.themeColor
    };
  } catch (error) {
    console.error("Erro ao traduzir currículo para o Inglês com IA:", error);
    throw error;
  }
}


