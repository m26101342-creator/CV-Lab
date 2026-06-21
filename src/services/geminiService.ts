// Client-side direct Gemini API integration (Bypasses Backend for full static hosting support)

// Helper to calculate String hash quickly for caching
function generateHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function getLocalCache(apiName: string, keyString: string): string | null {
  try {
    const hash = generateHash(keyString);
    return localStorage.getItem(`cv_labs_gcache_${apiName}_${hash}`);
  } catch (e) {
    return null;
  }
}

function setLocalCache(apiName: string, keyString: string, value: string) {
  try {
    const hash = generateHash(keyString);
    localStorage.setItem(`cv_labs_gcache_${apiName}_${hash}`, value);
  } catch (e) {}
}

const getApiKey = (): string => {
  return (import.meta as any).env.VITE_GEMINI_API_KEY || "";
};

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

async function generateContentDirect(contents: any, jsonFormat: boolean = false, temperature: number = 0.6) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("ALERTA DE SISTEMA: Chave de API VITE_GEMINI_API_KEY em falta no código (ver `vite.config.ts`). Configure-a para ativar o motor inteligente.");
  }

  const payload: any = {
    contents,
    generationConfig: {
      temperature,
    }
  };

  if (jsonFormat) {
    payload.generationConfig.responseMimeType = "application/json";
  }

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errObj = await response.json().catch(() => ({}));
    throw new Error(errObj?.error?.message || `HTTP Error: ${response.status}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!rawText) {
    throw new Error("Empty response from AI engine");
  }

  return rawText;
}

// Extract JSON from text safely
function extractJSON(text: string): any {
  if (!text) return {};
  let cleaned = text.trim();
  
  const markdownRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = cleaned.match(markdownRegex);
  if (match) cleaned = match[1].trim();
  
  try {
    return JSON.parse(cleaned);
  } catch (e: any) {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
      } catch (e2) {}
    }
    throw new Error("Formato JSON retornado pela IA é inválido.");
  }
}

// Data normalizer inline port
function cleanAndNormalizeParsedData(parsedData: any): any {
  if (!parsedData) parsedData = {};

  const cleanId = () => Math.random().toString(36).substring(7);

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
          endDate: String(edu.endDate || '').trim(),
          description: String(edu.description || '').trim()
        });
      }
    });
  }

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
           skills.push({
            id: sk.id || cleanId(),
            name: String(nameVal).trim(),
            level: lvl
          });
        }
      }
    });
  }

  const languages: any[] = [];
  if (Array.isArray(parsedData.languages)) {
    parsedData.languages.forEach((lang: any) => {
      if (!lang) return;
      if (typeof lang === 'string') {
         languages.push({ id: cleanId(), name: lang.trim(), level: 'Fluente' });
      } else if (typeof lang === 'object') {
        const nameVal = lang.name || lang.language || '';
        if (nameVal) {
           languages.push({ id: lang.id || cleanId(), name: String(nameVal).trim(), level: lang.level || 'Fluente' });
        }
      }
    });
  }

  const certifications: any[] = [];
  if (Array.isArray(parsedData.certifications)) {
    parsedData.certifications.forEach((cert: any) => {
       if (!cert) return;
       if (typeof cert === 'string') {
          certifications.push({ id: cleanId(), name: cert.trim(), date: '' });
       } else if (typeof cert === 'object') {
          if (cert.name || cert.title) {
            certifications.push({ id: cert.id || cleanId(), name: String(cert.name || cert.title).trim(), date: String(cert.date || cert.year || '').trim() });
          }
       }
    });
  }

  const customSections: any[] = [];
  if (Array.isArray(parsedData.customSections)) {
    parsedData.customSections.forEach((cs: any) => {
      if (cs && cs.title) {
        const items: any[] = [];
        if (Array.isArray(cs.items)) {
          cs.items.forEach((item: any) => {
            if (item) {
              const nameVal = typeof item === 'string' ? item : (item.name || item.text || '');
              if (nameVal) {
                items.push({
                  id: item.id || cleanId(),
                  name: String(nameVal).trim(),
                  description: String(item.description || '').trim()
                });
              }
            }
          });
        }
        customSections.push({
          id: cs.id || cleanId(),
          title: String(cs.title).trim(),
          items
        });
      }
    });
  }

  return { personalInfo, experience, education, skills, languages, certifications, customSections, interests: [] };
}


export async function optimizeResumeText(text: string, type: 'summary' | 'experience' | 'skills'): Promise<string> {
  if (!text || text.trim().length === 0) return text;

  const prompt = `
    Como um escritor e recrutador corporativo experiente, REESCREVA, POLA e MELHORE O SEGUINTE TEXTO EM PORTUGUÊS (PT). 
    Aja sem rodeios, de forma incisiva.
    
    TEXTO ORIGINAL DO CANDIDATO (${type}):
    "${text}"

    INSTRUÇÕES:
    - Retorne APENAS o texto reescrito melhorado (nada de explicações).
    - Torne a estrutura fluida com verbos de ação adequados ao contexto corporativo.
    - Se for um 'summary' (resumo), seja apelativo focando resultados.
    - Se for 'experience', foque em métricas ou ações robustas de impacto.
    - O idioma tem de ser Português fluente e profissional.
  `;

  try {
    const rawText = await generateContentDirect([{ role: 'user', parts: [{ text: prompt }] }], false, 0.7);
    return rawText.trim().replace(/\*/g, '');
  } catch (error) {
    console.warn("Optimize error, fallback to professional local heuristic:", error);
    let beauty = text.trim();
    if (beauty.length > 3) {
      beauty = beauty.charAt(0).toUpperCase() + beauty.slice(1);
    }
    return beauty;
  }
}

export async function generateCoverLetter(resumeData: any, jobTitle: string): Promise<string> {
  const cacheKey = `${jobTitle}_${JSON.stringify(resumeData?.personalInfo || {})}_${resumeData?.experience?.length || 0}`;
  const cachedVal = getLocalCache("coverletter", cacheKey);
  if (cachedVal) return cachedVal;

  const pInfo = resumeData?.personalInfo || {};
  const experiences = Array.isArray(resumeData?.experience) ? resumeData.experience : [];

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
    1. Retorne APENAS a carta em PORTUGUÊS.
    2. Sem markdown. Sem asteriscos.
    3. Não use placeholders como "[Seu Telefone]". Use os dados fornecidos ou ignore se faltar.
  `;

  try {
    const rawText = await generateContentDirect([{ role: 'user', parts: [{ text: prompt }] }], false, 0.8);
    const result = rawText.trim();
    setLocalCache("coverletter", cacheKey, result);
    return result;
  } catch (error) {
    return "Ocorreu um erro ao gerar a sua carta. Verifique a consola técnica.";
  }
}

export async function generateFullResume(personalInfo: any): Promise<any> {
  const cacheKey = JSON.stringify(personalInfo);
  const cachedVal = getLocalCache("generate_full", cacheKey);
  if (cachedVal) {
    try {
      return JSON.parse(cachedVal);
    } catch (e) {}
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
    const rawResult = await generateContentDirect([{ role: 'user', parts: [{ text: prompt }] }], true, 0.6);
    const parsed = extractJSON(rawResult);
    setLocalCache("generate_full", cacheKey, JSON.stringify(parsed));
    return parsed;
  } catch (error) {
    console.error("Full resume draft error:", error);
    return null;
  }
}

export async function parseResumeFromText(rawText: string, imageData?: string): Promise<any> {
  const textPrompt = `
      Você é o principal algoritmo de Inteligência Artificial para extração, classificação e polimento de currículos profissionais na Língua Portuguesa.
      Sua missão é ler, analisar minuciosamente e ENRIQUECER o currículo obtido a partir de texto cru ou OCR de imagem. Reconheça e classifique com precisão as informações estruturadas.

      INSTRUÇÕES DE CLASSIFICAÇÃO E ENRIQUECIMENTO INTELIGENTE:
      1. "personalInfo": Extraia o nome completo do candidato, cargo desejado, e-mail, telefone, localização e um Resumo.
         - Se o resumo profissional for curto ou ausente, fabrique um resumo fantástico (2 a 4 linhas) baseado nas competências e foco no cargo.
      2. "experience": Mapeie cada de forma detalhada com verbos de ação poderosos.
      3. "education": Identifique instituição, grau, curso/campo, ano de início e fim.
         - IMPORTANTE: Se o indivíduo tiver bullet points, listas de tópicos de destaque ao longo do curso (ex: distinções, participação associativa, lideranças ou monitorias), salve-os fielmente no campo "description": "• Item 1\n• Item 2".
      4. "skills": Extraia TODAS as competências profissionais na forma de uma array de strings.
      5. "languages": Identifique idiomas. Se sem nível, assuma "Intermédio" ou "Fluente".
      6. "certifications": Extraia ano.
      7. "customSections": Se existirem no currículo ou texto secções, blocos isolados de informações que não se enquadram diretamente nos campos padrão acima mas são essenciais para o currículo do utilizador (por exemplo, "ESPECIALIZAÇÕES" com tópicos, "Conquistas", "Prémios", "Projetos Culturais", "Filiações"), extraia-as de forma flexível nesta propriedade de retorno. Retorne um array de objetos onde cada objeto representa uma seção customizada.

      SINTAXE DO RETORNO JSON ESPERADO (Formato Extremamente Restrito):
      {
        "personalInfo": {
          "fullName": "Nome Completo",
          "title": "Cargo ou Título Profissional",
          "email": "E-mail de contato",
          "phone": "Telemóvel/Telefone",
          "location": "Cidade, País",
          "summary": "Resumo executivo gerado ou polido de alto impacto"
        },
        "experience": [
          {
            "company": "Nome", "position": "Cargo", "startDate": "Ano", "endDate": "Ano ou Presente", "description": "Explicação robusta enriquecida"
          }
        ],
        "education": [
          { 
            "institution": "Escola", 
            "degree": "Grau/Nível", 
            "field": "Curso", 
            "startDate": "Ano", 
            "endDate": "Ano",
            "description": "• Vice-Lider da associação dos Estudantes\n• Monitora nas Aulas" 
          }
        ],
        "skills": ["Competência 1", "Competência 2", "Competência 3"],
        "languages": [ { "name": "Inglês", "level": "Avançado" } ],
        "certifications": [],
        "customSections": [
          {
            "title": "Especializações",
            "items": [
              { "name": "Secretaria Executiva" },
              { "name": "Contadora" },
              { "name": "Auditora contabilista" }
            ]
          }
        ]
      }

      REGRAS RIGOROSAS:
      1. Retorne **APENAS e ESTRITAMENTE** o formatação em objeto JSON válida. Não incluir markdown \`\`\`json\`\`\`.
      2. Preencha e expanda ativamente os dados descritivos de forma inteligente quando escassos.

      TEXTO DE ENTRADA DO UTILIZADOR:
      "${rawText || ""}"
  `;

  const parts: any[] = [{ text: textPrompt }];
  
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
    } catch (err) {}
  }

  try {
    const rawResult = await generateContentDirect([{ role: 'user', parts }], true, 0.1);
    const parsed = extractJSON(rawResult);
    return cleanAndNormalizeParsedData(parsed);
  } catch (error: any) {
    console.error("Parse Rescue error:", error);
    throw new Error("Falha ao comunicar via Client-side Fetch AI. Erro: " + (error.message || error));
  }
}

export async function translateResumeToEnglish(resumeData: any): Promise<any> {
  const cacheKey = JSON.stringify(resumeData);
  const cachedVal = getLocalCache("translate_en", cacheKey);
  if (cachedVal) {
    try {
      return JSON.parse(cachedVal);
    } catch (e) {}
  }

  const prompt = `
    Você é um tradutor especialista de currículos e consultor corporativo.
    Traduza o currículo estruturado abaixo EXATAMENTE no mesmo esquema JSON para Inglês Profissional (US).

    ${JSON.stringify(resumeData, null, 2)}

    INSTRUÇÕES:
    1. Traduza tudo (cargos, descrições usando verbos como Spearheaded/Managed no passado se concluído).
    2. Preserve TUDO o resto exato (arrays, ids, themeColor, etc).
    3. Retorne APENAS o JSON puro.
  `;

  try {
    const rawResult = await generateContentDirect([{ role: 'user', parts: [{ text: prompt }] }], true, 0.1);
    const parsed = extractJSON(rawResult);

    const finalData = {
      ...resumeData,
      ...parsed,
      personalInfo: {
        ...resumeData.personalInfo,
        ...(parsed.personalInfo || {}),
        photo: resumeData.personalInfo?.photo,
      },
      themeColor: resumeData.themeColor
    };

    setLocalCache("translate_en", cacheKey, JSON.stringify(finalData));
    return finalData;
  } catch (error) {
    throw new Error("Formatação/Tradução falhou no Gemini");
  }
}

export async function translateLetterToEnglish(text: string): Promise<string> {
  if (!text || text.trim().length === 0) return "";
  const cacheKey = `letter_en_${generateHash(text)}`;
  const cachedVal = getLocalCache("translate_letter_en", cacheKey);
  if (cachedVal) return cachedVal;

  const prompt = `
    Você é um tradutor especialista de cartas de apresentação empresariais de Português para Inglês Profissional (US).
    Traduza o texto abaixo mantendo o mesmo tom formal, polido e profissional.
    
    TEXTO ORIGINAL:
    "${text}"

    INSTRUÇÕES:
    1. Retorne APENAS o texto traduzido final, sem explicações, comentários adicionais ou notas de tradutor.
    2. Não inclua marcas de formatação extras.
  `;

  try {
    const rawText = await generateContentDirect([{ role: 'user', parts: [{ text: prompt }] }], false, 0.3);
    const result = rawText.trim().replace(/\*/g, '');
    setLocalCache("translate_letter_en", cacheKey, result);
    return result;
  } catch (err) {
    console.error("Letter translation failed:", err);
    return text; // Fallback to original
  }
}

