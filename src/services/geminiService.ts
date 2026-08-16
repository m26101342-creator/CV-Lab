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

const PRIMARY_MODEL = "gemini-2.5-flash";
const FALLBACK_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-2.5-pro"
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

  const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS];
  let lastError: any = null;

  for (const model of modelsToTry) {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`${geminiUrl}?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errObj = await response.json().catch(() => ({}));
          const errMsg = errObj?.error?.message || `HTTP Error: ${response.status}`;
          
          const isTransient = 
            response.status === 429 || 
            response.status >= 500 || 
            errMsg.toLowerCase().includes("demand") || 
            errMsg.toLowerCase().includes("busy") || 
            errMsg.toLowerCase().includes("quota") || 
            errMsg.toLowerCase().includes("limit") || 
            errMsg.toLowerCase().includes("temporary");

          if (isTransient && attempt < maxRetries) {
            const backoffTime = 2000;
            console.warn(`[Gemini API] Model ${model} is busy/limited. Attempt ${attempt}/${maxRetries} failed with: "${errMsg}". Retrying in 2 seconds...`);
            await sleep(backoffTime);
            continue;
          }
          
          throw new Error(errMsg);
        }

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!rawText) {
          throw new Error("Empty response from AI engine");
        }

        return rawText;

      } catch (error: any) {
        lastError = error;
        const errorMsg = error?.message || String(error);
        
        console.warn(`[Gemini API] Failed call to ${model} on attempt ${attempt}: ${errorMsg}`);
        
        const isTransientErr = 
          errorMsg.toLowerCase().includes("demand") || 
          errorMsg.toLowerCase().includes("temporary") || 
          errorMsg.toLowerCase().includes("limit") ||
          errorMsg.toLowerCase().includes("busy") ||
          errorMsg.toLowerCase().includes("fetch");

        if (attempt < maxRetries && isTransientErr) {
          const backoffTime = 2000;
          await sleep(backoffTime);
          continue;
        }
        
        break; 
      }
    }
  }

  throw new Error(lastError?.message || "Todas as tentativas de comunicação com o modelo Gemini falharam devido a alta demanda.");
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

  // Helper to test if something is a short course/training rather than formal academic degree
  const isCourseOrTraining = (degree: string, institution: string) => {
    const combined = `${degree} ${institution}`.toLowerCase();
    const courseKeywords = ['curso', 'workshop', 'treinamento', 'capacitação', 'capacitacao', 'certificação', 'certificacao', 'bootcamp', 'intensivo', 'formação profissional', 'formacao profissional', 'seminário', 'seminario'];
    const academicKeywords = ['licenciatura', 'bacharel', 'mestrado', 'doutorado', 'doutoramento', 'pós-graduação', 'pos-graduacao', 'ensino secundário', 'ensino secundario', 'ensino médio', 'ensino medio', 'ensino básico', 'ensino basico', 'ensino fundamental', 'instituto médio', 'instituto medio', 'instituto superior', 'universidade', 'faculdade', 'colégio', 'colegio', '12ª classe', '13ª classe', '9ª classe'];
    
    const hasAcademic = academicKeywords.some(k => combined.includes(k));
    const hasCourse = courseKeywords.some(k => combined.includes(k));

    return hasCourse && !hasAcademic;
  };

  const education: any[] = [];
  const extractedCoursesFromEdu: any[] = [];

  if (Array.isArray(parsedData.education)) {
    parsedData.education.forEach((edu: any) => {
      if (edu && (edu.institution || edu.degree || edu.field)) {
        const inst = String(edu.institution || '').trim();
        const deg = String(edu.degree || edu.field || '').trim();
        const start = String(edu.startDate || '').trim();
        const end = String(edu.endDate || '').trim();
        const desc = String(edu.description || '').trim();

        // Check if this item is actually a short course / training rather than formal schooling
        if (isCourseOrTraining(deg, inst)) {
          extractedCoursesFromEdu.push({
            id: edu.id || cleanId(),
            name: deg || inst,
            issuer: inst !== deg ? inst : '',
            date: end || start,
            description: desc
          });
        } else {
          education.push({
            id: edu.id || cleanId(),
            institution: inst,
            degree: deg,
            field: String(edu.field || '').trim(),
            startDate: start,
            endDate: end,
            description: desc
          });
        }
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

  // Certifications / Courses / Formações
  const certifications: any[] = [...extractedCoursesFromEdu];
  const possibleCourseArrays = [
    parsedData.certifications,
    parsedData.courses,
    parsedData.formacoes,
    parsedData.cursos,
    parsedData.certificados,
    parsedData.formacao,
    parsedData.training,
    parsedData.trainings
  ];

  possibleCourseArrays.forEach(arr => {
    if (Array.isArray(arr)) {
      arr.forEach((cert: any) => {
        if (!cert) return;
        if (typeof cert === 'string') {
          if (!certifications.some(c => c.name.toLowerCase() === cert.trim().toLowerCase())) {
            certifications.push({ id: cleanId(), name: cert.trim(), date: '', issuer: '', description: '' });
          }
        } else if (typeof cert === 'object') {
          const nameStr = String(cert.name || cert.title || cert.course || '').trim();
          if (nameStr && !certifications.some(c => c.name.toLowerCase() === nameStr.toLowerCase())) {
            certifications.push({
              id: cert.id || cleanId(),
              name: nameStr,
              date: String(cert.date || cert.year || cert.period || '').trim(),
              issuer: String(cert.issuer || cert.institution || cert.school || cert.entidade || '').trim(),
              description: String(cert.description || cert.details || cert.hours || '').trim()
            });
          }
        }
      });
    }
  });

  // Dynamic Custom Sections - Ensuring NO DATA is ever left behind or lost
  const customSections: any[] = [];
  const processedTitles = new Set<string>();

  if (Array.isArray(parsedData.customSections)) {
    parsedData.customSections.forEach((cs: any) => {
      if (cs && cs.title) {
        const titleStr = String(cs.title).trim();
        const items: any[] = [];
        if (Array.isArray(cs.items)) {
          cs.items.forEach((item: any) => {
            if (item) {
              const nameVal = typeof item === 'string' ? item : (item.name || item.text || item.title || '');
              if (nameVal) {
                items.push({
                  id: item.id || cleanId(),
                  name: String(nameVal).trim(),
                  description: String(item.description || item.details || '').trim()
                });
              }
            }
          });
        }
        if (items.length > 0 || titleStr) {
          processedTitles.add(titleStr.toLowerCase());
          customSections.push({
            id: cs.id || cleanId(),
            title: titleStr,
            items
          });
        }
      }
    });
  }

  // Scan root object for any unhandled categories or custom fields to avoid losing any data
  const standardKeys = new Set([
    'personalInfo', 'experience', 'education', 'skills', 'languages', 
    'certifications', 'customSections', 'interests', 'courses', 'cursos', 
    'formacoes', 'formacao', 'certificados', 'training', 'trainings',
    'sectionTitles', 'themeColor', 'styleConfig', 'language'
  ]);

  Object.keys(parsedData).forEach(key => {
    if (!standardKeys.has(key) && !processedTitles.has(key.toLowerCase())) {
      const val = parsedData[key];
      if (Array.isArray(val) && val.length > 0) {
        // Format key to a neat Title
        const formattedTitle = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/_/g, ' ')
          .replace(/^\w/, c => c.toUpperCase())
          .trim();

        const items: any[] = [];
        val.forEach((item: any) => {
          if (typeof item === 'string' && item.trim()) {
            items.push({ id: cleanId(), name: item.trim(), description: '' });
          } else if (typeof item === 'object' && item) {
            const nameVal = item.name || item.title || item.label || item.text || Object.values(item)[0] || '';
            const descVal = item.description || item.detail || item.value || '';
            if (nameVal) {
              items.push({
                id: item.id || cleanId(),
                name: String(nameVal).trim(),
                description: String(descVal !== nameVal ? descVal : '').trim()
              });
            }
          }
        });

        if (items.length > 0) {
          processedTitles.add(key.toLowerCase());
          customSections.push({
            id: cleanId(),
            title: formattedTitle,
            items
          });
        }
      }
    }
  });

  return { 
    personalInfo, 
    experience, 
    education, 
    skills, 
    languages, 
    certifications, 
    customSections, 
    interests: Array.isArray(parsedData.interests) ? parsedData.interests : [] 
  };
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
      Sua missão é ler, analisar minuciosamente e ENRIQUECER o currículo obtido a partir de texto cru ou OCR de imagem. Reconheça e classifique com precisão cirúrgica as informações estruturadas.

      REGRAS CRÍTICAS DE CLASSIFICAÇÃO (SIGA COM RIGOR ABSOLUTO):

      1. "personalInfo": Extraia o nome completo do candidato, cargo desejado, e-mail, telefone, localização e um Resumo.
         - Se o resumo profissional for curto ou ausente, elabore um resumo de alto impacto (2 a 4 linhas) baseado nas competências e foco no cargo.

      2. "experience": Mapeie cada experiência profissional detalhadamente com verbos de ação poderosos.

      3. "education" (EXCLUSIVAMENTE EDUCAÇÃO / ESCOLARIDADE FORMAL):
         - ATENÇÃO: "Educação" refere-se APENAS à escolaridade formal e percurso académico (Ensino Primário/Básico, Ensino Secundário/Médio, Instituto Médio Técnico, Bacharelato, Licenciatura, Pós-Graduação, Mestrado, Doutoramento, Universidade, Faculdade, Colégio).
         - NUNCA coloque cursos livres, workshops ou treinamentos em "education".
         - Identifique instituição, grau (ex: Ensino Médio, Licenciatura), curso/campo, ano de início e fim.
         - Se houver tópicos de destaque (ex: distinções, monitorias, comissões), salve-os no campo "description".

      4. "certifications" (FORMAÇÕES PROFISSIONAIS, CURSOS E TREINAMENTOS):
         - ATENÇÃO: "Formação" e "Cursos" são a mesma coisa! Qualquer formação profissional, curso livre, workshop, treinamento técnico ou certificado (ex: "Curso de Manobrador de Empilhador", "Formação de Atendimento ao Cliente", "Curso de Informática na Óptica do Utilizador", "Gestão de Stock", "Primeiros Socorros", etc.) DEVE ser extraído para o array "certifications".
         - Para cada curso/formação, extraia:
           * "name": Nome do curso ou formação profissional
           * "issuer": Entidade formadora ou instituição onde realizou o curso (ex: INEFOP, Toyota Angola, etc.)
           * "date": Ano ou período de realização
           * "description": Carga horária, detalhes ou competências desenvolvidas no curso.

      5. "skills": Extraia competências profissionais gerais ou palavras-chave (Ex: Excel, Vendas, Resolução de Problemas) na forma de array de strings simples.

      6. "languages": Identifique idiomas e níveis de proficiência (Básico, Intermédio, Avançado, Fluente, Nativo).

      7. "customSections" (CATEGORIAS PERSONALIZADAS DINÂMICAS - NENHUM DADO PODE FICAR DE FORA):
         - ATENÇÃO CRÍTICA: Você DEVE ser inteligente para não deixar nenhum dado de fora nem confundi-los. Crie categorias personalizadas com base em tudo o que está no currículo!
         - Se o candidato listar blocos ou categorias como "Competências de Comunicação", "Competências Organizacionais", "Competências Técnicas", "Carta de Condução / Habilitações", "Projetos Relevantes", "Publicações", "Referências Pessoais / Profissionais", "Atividades Extracurriculares", "Disponibilidade e Outros", crie um objeto dedicado para cada categoria em "customSections", preservando o título fiel e os itens detalhados com "name" e "description".
         - Cada item deve conter obrigatoriamente "name" (título do item) e opcionalmente "description" (detalhe, explicação ou valor associado).

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
            "company": "Empresa", "position": "Cargo", "startDate": "Ano", "endDate": "Ano ou Presente", "description": "Descrição robusta das realizações"
          }
        ],
        "education": [
          { 
            "institution": "Universidade ou Instituto Médio", 
            "degree": "Licenciatura / Ensino Médio", 
            "field": "Área de Estudo", 
            "startDate": "Ano", 
            "endDate": "Ano",
            "description": "• Distinção académica ou atividades" 
          }
        ],
        "certifications": [
          {
            "name": "Curso de Manobrador de Empilhador",
            "issuer": "INEFOP / Toyota",
            "date": "2021",
            "description": "Carga horária de 120 horas com prática de movimentação de cargas"
          }
        ],
        "skills": ["Competência Geral 1", "Competência Geral 2"],
        "languages": [ { "name": "Inglês", "level": "Intermédio" } ],
        "customSections": [
          {
            "title": "Competências de Comunicação",
            "items": [
              { "name": "Comunicação em equipe multicultural", "description": "Experiência em ambiente corporativo dinâmico" }
            ]
          },
          {
            "title": "Competências Organizacionais",
            "items": [
              { "name": "Gestão de armazém e logística" },
              { "name": "Gestão de tempo e rotas de distribuição" }
            ]
          },
          {
            "title": "Competências Técnicas",
            "items": [
              { "name": "Manuseamento de Empilhadores", "description": "Operação segura e manutenção básica" }
            ]
          },
          {
            "title": "Carta de Condução",
            "items": [
              { "name": "Carta de Condução Ligeiros e Pesados", "description": "Categoria B e C válida" }
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
  const dataToTranslate = { ...resumeData };
  if (dataToTranslate.personalInfo) {
    dataToTranslate.personalInfo = { ...dataToTranslate.personalInfo };
    delete dataToTranslate.personalInfo.photo; // Remove photo base64 to avoid huge payload
  }

  const cacheKey = JSON.stringify(dataToTranslate);
  const cachedVal = getLocalCache("translate_en", cacheKey);
  if (cachedVal) {
    try {
      const parsedCached = JSON.parse(cachedVal);
      // Restore photo
      if (parsedCached.personalInfo && resumeData.personalInfo?.photo) {
          parsedCached.personalInfo.photo = resumeData.personalInfo.photo;
      }
      return parsedCached;
    } catch (e) {}
  }

  const prompt = `
    Você é um tradutor especialista de currículos e consultor corporativo.
    Traduza o currículo estruturado abaixo EXATAMENTE no mesmo esquema JSON para Inglês Profissional (US).

    ${JSON.stringify(dataToTranslate, null, 2)}

    INSTRUÇÕES:
    1. Traduza todo o conteúdo recebido para Inglês Profissional (US). 
    2. CRIE/PREENCHA o objeto "sectionTitles" com as traduções dos títulos padrão. Use: {"experience": "Professional Experience", "education": "Education", "skills": "Skills", "languages": "Languages", "certifications": "Certifications", "interests": "Interests", "summary": "Profile"}.
    3. Retorne "language": "en" na raiz do JSON.
    4. Preserve TUDO o resto exato (arrays, ids, themeColor, etc).
    5. Retorne APENAS o JSON puro.
  `;

  try {
    const rawResult = await generateContentDirect([{ role: 'user', parts: [{ text: prompt }] }], true, 0.1);
    const parsed = extractJSON(rawResult);

    const finalData = {
      ...resumeData,
      ...parsed,
      sectionTitles: {
          ...parsed.sectionTitles
      },
      language: 'en',
      personalInfo: {
        ...resumeData.personalInfo,
        ...(parsed.personalInfo || {}),
        photo: resumeData.personalInfo?.photo,
      },
      themeColor: resumeData.themeColor
    };

    setLocalCache("translate_en", cacheKey, JSON.stringify(finalData));
    return finalData;
  } catch (error: any) {
    console.error("Translation error details:", error);
    throw new Error("Formatação/Tradução falhou no Gemini: " + (error.message || error));
  }
}

export async function translateResumeToSpanish(resumeData: any): Promise<any> {
  const dataToTranslate = { ...resumeData };
  if (dataToTranslate.personalInfo) {
    dataToTranslate.personalInfo = { ...dataToTranslate.personalInfo };
    delete dataToTranslate.personalInfo.photo; // Remove photo base64 to avoid huge payload
  }

  const cacheKey = JSON.stringify(dataToTranslate);
  const cachedVal = getLocalCache("translate_es", cacheKey);
  if (cachedVal) {
    try {
      const parsedCached = JSON.parse(cachedVal);
      // Restore photo
      if (parsedCached.personalInfo && resumeData.personalInfo?.photo) {
          parsedCached.personalInfo.photo = resumeData.personalInfo.photo;
      }
      return parsedCached;
    } catch (e) {}
  }

  const prompt = `
    Você é um tradutor especialista de currículos e consultor corporativo.
    Traduza o currículo estruturado abaixo EXATAMENTE no mesmo esquema JSON para Espanhol Profissional.

    ${JSON.stringify(dataToTranslate, null, 2)}

    INSTRUÇÕES:
    1. Traduza todo o conteúdo recebido para Espanhol Profissional. 
    2. CRIE/PREENCHA o objeto "sectionTitles" com as traduções dos títulos padrão. Use: {"experience": "Experiencia Profesional", "education": "Educación", "skills": "Habilidades", "languages": "Idiomas", "certifications": "Certificaciones", "interests": "Intereses", "summary": "Perfil"}.
    3. Retorne "language": "es" na raiz do JSON.
    4. Preserve TUDO o resto exato (arrays, ids, themeColor, etc).
    5. Retorne APENAS o JSON puro.
  `;

  try {
    const rawResult = await generateContentDirect([{ role: 'user', parts: [{ text: prompt }] }], true, 0.1);
    const parsed = extractJSON(rawResult);

    const finalData = {
      ...resumeData,
      ...parsed,
      sectionTitles: {
          ...parsed.sectionTitles
      },
      language: 'es',
      personalInfo: {
        ...resumeData.personalInfo,
        ...(parsed.personalInfo || {}),
        photo: resumeData.personalInfo?.photo,
      },
      themeColor: resumeData.themeColor
    };

    setLocalCache("translate_es", cacheKey, JSON.stringify(finalData));
    return finalData;
  } catch (error: any) {
    console.error("Translation error details:", error);
    throw new Error("Formatação/Tradução falhou no Gemini: " + (error.message || error));
  }
}

export async function translateLetterToSpanish(text: string): Promise<string> {
  if (!text || text.trim().length === 0) return "";
  const cacheKey = `letter_es_${generateHash(text)}`;
  const cachedVal = getLocalCache("translate_letter_es", cacheKey);
  if (cachedVal) return cachedVal;

  const prompt = `
    Você é um tradutor especialista de cartas de apresentação empresariais de Português para Espanhol Profissional.
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
    setLocalCache("translate_letter_es", cacheKey, result);
    return result;
  } catch (err) {
    console.error("Letter translation failed:", err);
    return text; // Fallback to original
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

export async function alterResumeInformation(
  text: string, 
  action: 'expand' | 'shorten', 
  type: string
): Promise<string> {
  if (!text || text.trim().length === 0) return text;
  
  const cacheKey = `alter_info_${action}_${type}_${generateHash(text)}`;
  const cachedVal = getLocalCache("alter_info", cacheKey);
  if (cachedVal) return cachedVal;

  let requestText = "";
  if (action === 'expand') {
    requestText = `AUMENTE as informações e detalhes de forma profissional para este segmento de currículo do tipo "${type}". Adicione realizações realistas, verbos de ação mais fortes, competências relevantes adicionadas e explique melhor os pontos para tornar o texto mais rico e completo.`;
  } else {
    requestText = `DIMINUA as informações de forma profissional para este segmento de currículo do tipo "${type}". Torne o texto o mais conciso, limpo e direto ao ponto possível, sem perder o profissionalismo. Remova repetições ou detalhes desnecessários.`;
  }

  const prompt = `
    Atuando como um consultor sênior de currículos e ATS em Angola, recalcule e reescreva o texto abaixo.
    
    TEXTO ATUAL:
    "${text}"

    INSTRUÇÕES:
    - ${requestText}
    - Mantenha o idioma em Português Profesional.
    - Se o texto atual contiver marcadores (como bullet points ou tópicos iniciados por • ou -), certifique-se de retornar os novos pontos com a mesma formatação estruturada (usando •).
    - Retorne APENAS o novo texto gerado diretamente, sem introduções ("Aqui está o seu texto reescrito:"), sem comentários e sem aspas extras ou delimitadores markdown.
  `;

  try {
    const rawText = await generateContentDirect([{ role: 'user', parts: [{ text: prompt }] }], false, 0.7);
    const result = rawText.trim();
    setLocalCache("alter_info", cacheKey, result);
    return result;
  } catch (error) {
    console.warn("Alter information error, applying local fallback:", error);
    if (action === 'expand') {
      return `${text}\n• Focado na otimização de processos e na entrega de projetos dentro dos prazos estabelecidos.`;
    } else {
      // Shorten fallback
      const lines = text.split('\n');
      if (lines.length > 1) {
        return lines.slice(0, Math.ceil(lines.length / 2)).join('\n');
      }
      return text.substring(0, Math.ceil(text.length * 0.7)) + '...';
    }
  }
}


