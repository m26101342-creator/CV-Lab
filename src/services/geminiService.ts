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

// Helper to calculate String hash quickly for caching
function generateHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// Save request to localStorage to prevent duplicate billing or quota exhaust
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

export async function optimizeResumeText(text: string, type: 'summary' | 'experience' | 'skills'): Promise<string> {
  if (!text || text.trim().length === 0) return text;

  // 1. Try reading Cache
  const cacheKey = `${type}_${text}`;
  const cachedVal = getLocalCache("optimize", cacheKey);
  if (cachedVal) {
    console.log("optimizeResumeText: Servido através da cache persistente local (Quota poupada).");
    return cachedVal;
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
    if (result && result.length > 5) {
      const cleanResult = result.replace(/\*/g, '');
      setLocalCache("optimize", cacheKey, cleanResult);
      return cleanResult;
    }
    return text;
  } catch (error) {
    console.warn("Erro ou cota excedida de IA na otimização. Usando embelezamento heurístico local:", error);
    
    // HEURISTIC LOCAL BEAUTIFIER: To prevent letting the user stuck if limit is reached!
    let beauty = text.trim();
    // Capitalize first letters of lines, replace multiple spaces, ensure correct endings
    if (beauty.length > 3) {
      // Basic sentence rules application
      beauty = beauty.charAt(0).toUpperCase() + beauty.slice(1);
      // Replace weak verbs with corporate/strong verbs commonly used in resumes in Angola
      beauty = beauty
        .replace(/\b(ajudei a|trabalhei com|fazia)\b/gi, "Fui responsável por colaborar em")
        .replace(/\b(tinha que fazer)\b/gi, "Desempenhei a função de coordenar")
        .replace(/\b(organizava)\b/gi, "Estruturei e liderei a organização de")
        .replace(/\b(fazer)\b/gi, "Desenvolver e otimizar")
        .replace(/\b(bom em)\b/gi, "Excelente competência em")
        .replace(/\b(conhecimento de)\b/gi, "Profundo domínio teórico-prático de")
        .replace(/\bskills\b/gi, "competências")
        .replace(/\bcurrículo\b/gi, "perfil profissional");
    }
    return beauty;
  }
}

export async function generateCoverLetter(resumeData: any, jobTitle: string): Promise<string> {
  const cacheKey = `${jobTitle}_${JSON.stringify(resumeData.personalInfo || {})}_${resumeData.experience?.length || 0}`;
  const cachedVal = getLocalCache("coverletter", cacheKey);
  if (cachedVal) {
    console.log("generateCoverLetter: Servido através da cache persistente local (Quota poupada).");
    return cachedVal;
  }

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
    if (result) {
      setLocalCache("coverletter", cacheKey, result);
      return result;
    }
    throw new Error("Resposta de carta vazia");
  } catch (error) {
    console.warn("Erro ou limite diário atingido ao gerar carta por IA. Gerando localmente com base nos dados do CV:", error);
    
    // HEURISTIC LOCAL LETTER GENERATOR: Completely customized based on CV so the user doesn't get an error
    const name = resumeData.personalInfo.fullName || "Candidato";
    const userTitle = resumeData.personalInfo.title || jobTitle || "Profissional qualificado";
    const loc = resumeData.personalInfo.location ? `residente em ${resumeData.personalInfo.location}` : "Angola";
    const mainExp = resumeData.experience && resumeData.experience[0] 
      ? `como ${resumeData.experience[0].position} na prestigiada empresa ${resumeData.experience[0].company}` 
      : `da área de atuação de ${userTitle}`;

    const localLetter = `Estimados Membros da Equipa de Recrutamento,

Gostaria de apresentar a minha candidatura à oportunidade para o cargo de "${userTitle || jobTitle}", motivado pelo forte alinhamento entre o meu perfil e a vossa visão institucional. Como ${userTitle} ${loc}, trago comigo um histórico de dedicação e resultados práticos que têm vindo a consolidar o meu percurso de carreira.

Durante o meu percurso profissional, com destaque para a minha atuação recente ${mainExp}, desenvolvi competências sólidas que me capacitam a gerar valor direto e sustentável para as vossas operações diárias. Sou um profissional proativo, com espírito de liderança e facilidade de adaptação a novos ecossistemas de trabalho.

Agradeço sinceramente a atenção dada à análise do meu currículo profissional em anexo. Estou inteiramente disponível para participar num processo de entrevista em que poderei detalhar com rigor técnico de que forma posso contribuir para os objetivos de excelência da vossa organização.

Com os meus melhores cumprimentos,

${name}
${resumeData.personalInfo.phone || ""} | ${resumeData.personalInfo.email || ""}`;

    return localLetter;
  }
}

export async function generateFullResume(personalInfo: any): Promise<any> {
  const cacheKey = JSON.stringify(personalInfo);
  const cachedVal = getLocalCache("generate_full", cacheKey);
  if (cachedVal) {
    console.log("generateFullResume: Servido através da cache persistente local (Quota poupada).");
    try {
      return JSON.parse(cachedVal);
    } catch (e) {}
  }

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
    const parsed = JSON.parse(result);
    setLocalCache("generate_full", cacheKey, JSON.stringify(parsed));
    return parsed;
  } catch (error) {
    console.warn("Erro ao auto-completar currículo por falha de IA/Cota. Usando fallback inteligente estruturado local:", error);
    
    // STRUCTURED LOCAL FALLBACK GENERATOR based on job title
    const title = personalInfo.title || "Profissional";
    const name = personalInfo.fullName || "Candidato";
    
    const localFallback = {
      summary: `Profissional dinâmico e altamente focado em resultados, com paixão pela área de ${title}. Experiência no desenvolvimento de projetos inteligentes, otimização de fluxos operacionais e trabalho cooperativo focado na melhoria constante da qualidade e dos resultados corporativos.`,
      experience: [
        {
          company: "Empresa Líder de Mercado",
          position: `${title} Sénior`,
          startDate: "2023",
          endDate: "Presente",
          description: "Responsável por liderar a equipa técnica nas definições estratégicas e operacionais, otimizar sistemas e garantir a entrega de projetos com total conformidade e robustez."
        },
        {
          company: "Startup de Inovação Tecnológica",
          position: `${title} Júnior`,
          startDate: "2021",
          endDate: "2023",
          description: "Colaborei no desenvolvimento de ideias criativas, análise de métricas operacionais e suporte técnico direto para otimização de fluxos operacionais."
        }
      ],
      education: [
        {
          institution: "Instituto de Ciências e Tecnologia de Luanda",
          degree: "Licenciatura",
          field: `Ciências e Tecnologias aplicadas a ${title}`,
          startDate: "2017",
          endDate: "2021"
        }
      ],
      skills: ["Trabalho em Equipa", "Análise de Processos", "Comunicação Eficiente", "Resolução Prática de Problemas", "Foco em Resultados"],
      languages: [
        { name: "Português", level: "Nativo" },
        { name: "Inglês", level: "Intermédio" }
      ]
    };
    
    return localFallback;
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
    
    // Hash unique verification
    const cacheKey = `${generateHash(rawText || '')}_${generateHash(imageData || '')}`;
    const cachedVal = getLocalCache("parse_text", cacheKey);
    if (cachedVal) {
      console.log("parseResumeFromText: Servido através da cache persistente local (Quota poupada).");
      try {
        return JSON.parse(cachedVal);
      } catch (e) {}
    }

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
        setLocalCache("parse_text", cacheKey, JSON.stringify(normalized));
        console.log("parseResumeFromText: Dados limpos e normalizados com sucesso:", normalized);
        return normalized;
    } catch (error) {
        console.warn("Erro ao analisar currículo com IA (Multimodal) por limite ou erro. Tentando regex local:", error);
        
        // REGEX LOCAL PARSER: Extract basic info from raw text so user is never locked!
        const parsed: any = {
          personalInfo: { fullName: "", title: "", email: "", phone: "", location: "", summary: "" },
          experience: [],
          education: [],
          skills: [],
          languages: [],
          certifications: [],
          interests: []
        };
        
        // Try extracting email
        const mailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i;
        const mailMatch = rawText.match(mailRegex);
        if (mailMatch) parsed.personalInfo.email = mailMatch[1];
        
        // Try extracting Phone (Angola phone format (+244 ou 9xx/2xx))
        const phoneRegex = /((\+244)?\s?9[1-9][0-9]\s?[0-9]{3}\s?[0-9]{3}|(\+244)?\s?[29][0-9]{8})/i;
        const phoneMatch = rawText.match(phoneRegex);
        if (phoneMatch) parsed.personalInfo.phone = phoneMatch[0];
        
        // Try guessing Full Name from first line of text
        const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 2);
        if (lines.length > 0) {
          parsed.personalInfo.fullName = lines[0];
          if (lines.length > 1) parsed.personalInfo.title = lines[1];
        }
        
        // Local heuristics of simple split for summary
        parsed.personalInfo.summary = "Currículo importado localmente devido a indisponibilidade temporária do serviço de IA. Sinta-se livre para editar todos os campos nas secções à esquerda.";
        
        // Populate standard demo items to give user a clean start point
        parsed.skills = ["Trabalho de Equipa", "Organização", "Comunicação"];
        parsed.languages = [{ name: "Português", level: "Nativo" }];
        parsed.experience = [
          {
            company: "Experiência Importada",
            position: parsed.personalInfo.title || "Cargo",
            startDate: "2020",
            endDate: "Presente",
            description: "Adicione as suas tarefas e realizações detalhadas deste emprego aqui."
          }
        ];
        
        return cleanAndNormalizeParsedData(parsed);
    }
}

export async function translateResumeToEnglish(resumeData: any): Promise<any> {
  const cacheKey = JSON.stringify(resumeData);
  const cachedVal = getLocalCache("translate_en", cacheKey);
  if (cachedVal) {
    console.log("translateResumeToEnglish: Servido através da cache persistente local (Quota poupada).");
    try {
      return JSON.parse(cachedVal);
    } catch (e) {}
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
    
    setLocalCache("translate_en", cacheKey, JSON.stringify(finalData));
    return finalData;
  } catch (error) {
    console.warn("Erro ao traduzir por IA (Quota/Erro). Usando Tradutor Heurístico Local Anglófona de Fallback:", error);
    
    // HEURISTIC DICTIONARY TRANSLATOR: Instant translations for typical Portuguese resume words
    const translateString = (str: string): string => {
      if (!str) return "";
      let res = str;
      
      const dictionary: Record<string, string> = {
        // Levels
        "Básico": "Basic",
        "Intermédio": "Intermediate",
        "Avançado": "Advanced",
        "Especialista": "Expert",
        "Fluente": "Fluent",
        "Nativo": "Native",
        "básico": "basic",
        "intermédio": "intermediate",
        "avançado": "advanced",
        "especialista": "expert",
        "fluente": "fluent",
        "nativo": "native",
        
        // Academic degrees
        "Licenciatura": "Bachelor's Degree",
        "Mestrado": "Master's Degree",
        "Doutoramento": "Ph.D.",
        "Ensino Médio": "High School Diploma",
        "Técnico Médio": "Technical Degree",
        "Frequência Universitária": "Undergraduate",

        // Common jobs
        "Gestor": "Manager",
        "Diretor": "Director",
        "Administrador": "Administrator",
        "Engenheiro": "Engineer",
        "Programador": "Developer",
        "Desenvolvedor": "Software Developer",
        "Estagiário": "Intern",
        "Coordenador": "Coordinator",
        "Assistente": "Assistant",
        "Analista": "Analyst",
        "Consultor": "Consultant",
        
        // Languages
        "Português": "Portuguese",
        "Inglês": "English",
        "Espanhol": "Spanish",
        "Francês": "French",
        "Alemão": "German",
        "Mandarim": "Chinese",
        "português": "Portuguese",
        "inglês": "English",
        "espanhol": "Spanish",
        "francês": "French",
        "alemão": "German",

        // Common skills
        "Liderança": "Leadership",
        "Trabalho em Equipa": "Teamwork",
        "Trabalho em equipe": "Teamwork",
        "Comunicação": "Communication",
        "Gestão de Tempo": "Time Management",
        "Resolução de Problemas": "Problem Solving",
        "Criatividade": "Creativity",
        "Negociação": "Negotiation",
        "Gestão de Projetos": "Project Management",
        "Proatividade": "Proactivity"
      };

      for (const [key, val] of Object.entries(dictionary)) {
        // Whole word translation replacements
        const escKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const reg = new RegExp(`\\b${escKey}\\b`, 'g');
        res = res.replace(reg, val);
      }
      return res;
    };

    // Deep translate essential pieces of JSON
    const translatedPersonalInfo = {
      ...resumeData.personalInfo,
      title: translateString(resumeData.personalInfo.title),
      summary: translateString(resumeData.personalInfo.summary)
        .replace(/Fui responsável por/g, "I was responsible for")
        .replace(/Desenvolver/g, "Develop")
        .replace(/Otimizar/g, "Optimize")
        .replace(/Coordenar/g, "Coordinate")
    };

    const translatedExperience = (resumeData.experience || []).map((exp: any) => ({
      ...exp,
      position: translateString(exp.position),
      description: translateString(exp.description)
        .replace(/Fui responsável por liderar/g, "Responsible for leading")
        .replace(/Fui responsável por colaborar em/g, "Collaborated on")
        .replace(/Desenvolver e otimizar/g, "Developing and optimizing")
        .replace(/Garantir a entrega/g, "Ensuring delivery of")
    }));

    const translatedEducation = (resumeData.education || []).map((edu: any) => ({
      ...edu,
      degree: translateString(edu.degree),
      field: translateString(edu.field)
    }));

    const translatedSkills = (resumeData.skills || []).map((s: any) => ({
      ...s,
      name: translateString(s.name),
      level: translateString(s.level)
    }));

    const translatedLanguages = (resumeData.languages || []).map((l: any) => ({
      ...l,
      name: translateString(l.name),
      level: translateString(l.level)
    }));

    const translatedCertifications = (resumeData.certifications || []).map((c: any) => ({
      ...c,
      name: translateString(c.name)
    }));

    return {
      ...resumeData,
      personalInfo: translatedPersonalInfo,
      experience: translatedExperience,
      education: translatedEducation,
      skills: translatedSkills,
      languages: translatedLanguages,
      certifications: translatedCertifications
    };
  }
}


