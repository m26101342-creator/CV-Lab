import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase limit to allow base64 images (PDF pages rendered to base64)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy init of Gemini API
let engineInstance: GoogleGenAI | null = null;
function getEngine() {
  if (!engineInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("[SERVER] Warning: GEMINI_API_KEY environment variable is not defined!");
    } else {
      console.log("[SERVER] GEMINI_API_KEY is found and configured.");
    }
    engineInstance = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return engineInstance;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function generateContentWithRetry(params: {
  contents: any;
  config?: any;
}): Promise<any> {
  const engine = getEngine();
  const models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.5-pro"];
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[GEMINI] Generating content with model: ${model}, attempt: ${attempt}/3`);
        const response = await engine.models.generateContent({
          model: model,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (error: any) {
        lastError = error;
        const msg = error.message || String(error);
        console.warn(`[GEMINI] Model ${model} (attempt ${attempt}/3) failed: ${msg}`);
        
        if (msg.includes("429") || msg.includes("503") || msg.includes("QUOTA_EXCEEDED") || msg.includes("UNAVAILABLE") || msg.includes("demand") || msg.includes("quota")) {
          await sleep(attempt * 1500);
        } else {
          break;
        }
      }
    }
  }

  throw lastError || new Error("Failed to generate content with any model");
}

// Normalized response builder
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

// API Health route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Endpoint: Optimize Resume Section Text
app.post("/api/gemini/optimize", async (req, res) => {
  const { text, type } = req.body;
  if (!text || !text.trim()) {
    return res.json({ text: "" });
  }

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
    const response = await generateContentWithRetry({
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        temperature: 0.7,
        topP: 0.95,
      }
    });
    
    const result = response.text?.trim() || "";
    const cleanResult = result.replace(/\*/g, '');
    res.json({ text: cleanResult });
  } catch (error: any) {
    console.error("[SERVER ERROR] Optimize text error:", error);
    res.status(500).json({ error: error.message || "Failed to generate optimized text" });
  }
});

// Endpoint: Generate Cover Letter
app.post("/api/gemini/cover-letter", async (req, res) => {
  const { resumeData, jobTitle } = req.body;
  if (!resumeData) {
    return res.status(400).json({ error: "resumeData is required" });
  }

  const pInfo = resumeData.personalInfo || {};
  const experiences = Array.isArray(resumeData.experience) ? resumeData.experience : [];

  const prompt = `
    Escreva uma carta de apresentação personalizada para o cargo: "${jobTitle || pInfo.title || 'Oportunidade Profissional'}".
    BASE DE DADOS DO CANDIDATO:
    - Nome: ${pInfo.fullName || "Candidato"}
    - Título: ${pInfo.title || "Profissional qualificado"}
    - Resumo: ${pInfo.summary || ""}
    - Experiências: ${JSON.stringify(experiences.map((e: any) => ({ cargo: e.position, empresa: e.company })))}
    
    ESTILO: Profissional, confiante, moderno e único.
    DURAÇÃO: Máximo 3 parágrafos curtos.
    
    REGRAS:
    1. Retorne APENAS a carta.
    2. Sem markdown. Sem asteriscos.
    3. Não use placeholders como "[Seu Telefone]". Use os dados fornecidos ou ignore se faltar.
  `;

  try {
    const response = await generateContentWithRetry({
      contents: prompt,
      config: {
        temperature: 0.8,
        topP: 0.95
      }
    });
    
    const result = response.text?.trim() || "";
    res.json({ letter: result });
  } catch (error: any) {
    console.error("[SERVER ERROR] Cover letter error:", error);
    res.status(500).json({ error: error.message || "Failed to generate cover letter" });
  }
});

// Endpoint: Generate Full Resume Draft
app.post("/api/gemini/generate-full", async (req, res) => {
  const { personalInfo } = req.body;
  if (!personalInfo) {
    return res.status(400).json({ error: "personalInfo is required" });
  }

  const prompt = `
    Você é um assistente de carreira. 
    Com base nas informações básicas do usuário abaixo, gere um rascunho completo de currículo.
    
    INFORMAÇÕES BÁSICAS:
    - Nome: ${personalInfo.fullName || "Candidato"}
    - Cargo Pretendido: ${personalInfo.title || "Profissional"}
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
    const response = await generateContentWithRetry({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.6
      }
    });
    
    const result = response.text?.trim() || "";
    const parsed = JSON.parse(result);
    res.json(parsed);
  } catch (error: any) {
    console.error("[SERVER ERROR] Generate full resume error:", error);
    res.status(500).json({ error: error.message || "Failed to generate full resume" });
  }
});

// Endpoint: Parse Paste / Multimodal PDF Resume
app.post("/api/gemini/parse", async (req, res) => {
  const { rawText, imageData } = req.body;
  if (!rawText && !imageData) {
    return res.status(400).json({ error: "rawText or imageData is required" });
  }

  console.log(`[SERVER] Parsing request received. Text length: ${rawText ? rawText.length : 0}. Has Image: ${!!imageData}`);

  const textPart = {
    text: `
      Você é o principal algoritmo de Inteligência Artificial para extração e classificação de currículos profissionais na Língua Portuguesa.
      Sua missão é ler e analisar minuciosamente o currículo, reconhecendo e classificando com precisão as informações de contato, resumo profissional, histórico de trabalho, formação académica, habilidades e certificações.

      INSTRUÇÕES DE CLASSIFICAÇÃO:
      1. "personalInfo": Extraia o nome completo do candidato, o seu cargo ou título desejado/atual, e-mail, telemóvel/telefone, localização e um Resumo Profissional ("summary"). Caso não exista um resumo profissional explícito, fabrique um parágrafo executivo profissional impecável focado no perfil e experiências extraídos.
      2. "experience": Mapeie todo o histórico de trabalho. Identifique rigorosamente a empresa ("company"), o cargo ("position"), as datas de início e fim ("startDate", "endDate" - ex: "10/2021" ou "2021"), e o detalhamento das funções executivas ("description").
      3. "education": Mapeie todos os estudos, escolas ou universidades ("institution"), graus académicos ("degree" - Licenciatura/Mestrado/Técnico/Médio), área de estudo ("field") e períodos.
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
      "${rawText || ""}"
    `
  };

  const parts: any[] = [textPart];
  
  if (imageData) {
    try {
      const isBase64WithPrefix = imageData.includes(",");
      const base64Clean = isBase64WithPrefix ? imageData.split(',')[1] : imageData;
      parts.push({
        inlineData: {
          mimeType: "image/png",
          data: base64Clean
        }
      });
      console.log("[SERVER] Multimodal Image added to Gemini payload.");
    } catch (err) {
      console.error("[SERVER] Failed to parse imageData for multimodal request:", err);
    }
  }

  try {
    const response = await generateContentWithRetry({
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });
    
    const rawResult = response.text?.trim() || "{}";
    const parsed = JSON.parse(rawResult);
    
    const normalized = cleanAndNormalizeParsedData(parsed);
    res.json(normalized);
  } catch (error: any) {
    console.error("[SERVER ERROR] PDF/Text parse error:", error);
    res.status(500).json({ error: error.message || "Failed to parse text resume with AI" });
  }
});

// Endpoint: Translate to English
app.post("/api/gemini/translate", async (req, res) => {
  const { resumeData } = req.body;
  if (!resumeData) {
    return res.status(400).json({ error: "resumeData is required" });
  }

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
    5. Na secção "languages", traduza os nomes dos idiomas para inglês (ex: "Inglês" -> "English", "Português" -> "Portuguese", "Alemão" -> "German" etc.). Traduza os níveis deles para inglês profissional (ex: "Fluente" -> "Fluent", "Nativo" -> "Native", "Básico" -> "Conversational" ou "Basic", "Avançado" -> "Professional Working Proficiency" or "Advanced").
    6. Na secção "certifications", se houver, traduza o nome das certificações para os seus equivalentes universais em inglês quando aplicável (ex: "Curso de Gestão de Projetos" -> "Project Management Course").
    7. Preserve TODOS os identificadores de dados ("id") e estruturas de controle ("themeColor", etc) idênticos. Não perca nenhum ID.

    SINTAXE DO RETORNO JSON ESPERADO:
    Retorne APENAS um JSON no mesmo formato que os dados originais recebidos. Sem blocos ou wraps de código adicionais (\`\`\`json).

    REGRAS RIGOROSAS:
    1. Retorne APENAS o JSON puro. Sem introduções. Sem comentários. Sem explicações ou desculpas.
  `;

  try {
    const response = await generateContentWithRetry({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });

    const rawResult = response.text?.trim() || "{}";
    const parsed = JSON.parse(rawResult);
    
    // Ensure critical assets like photos are preserved
    const finalData = {
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

    res.json(finalData);
  } catch (error: any) {
    console.error("[SERVER ERROR] Translate resume error:", error);
    res.status(500).json({ error: error.message || "Failed to translate resume with AI" });
  }
});

// Setup Vite Dev Middleware / Asset serving
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("[SERVER] Vite Dev Middleware integrated.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("[SERVER] Serving static production build assets.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Full-stack server actively listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("[SERVER] Failed to start server:", err);
});
