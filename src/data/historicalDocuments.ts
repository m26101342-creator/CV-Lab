import { ServiceType } from '../types';

export interface HistoricalDocumentItem {
  id: string;
  type: 'cv' | 'cover_letter' | 'combo';
  serviceType: ServiceType;
  candidateName: string;
  candidateTitle: string;
  candidateEmail: string;
  candidatePhone: string;
  template: string;
  themeColor: string;
  action: string;
  price: number;
  paymentMethod?: 'express' | 'transfer' | 'cash' | 'tpa' | 'other';
  paymentStatus?: 'paid' | 'pending';
  notes?: string;
  generatedBy: string;
  createdAt: string;
  letterSubject?: string;
  coverLetterText?: string;
  resumeData?: any;
}

export const OFFICIAL_HISTORICAL_DOCUMENTS: HistoricalDocumentItem[] = [
  {
    id: 'doc_hist_01',
    type: 'cv',
    serviceType: 'cv_normal',
    candidateName: 'Manuel Domingos António',
    candidateTitle: 'Engenheiro de Redes & Infraestruturas TI',
    candidateEmail: 'manuel.domingos@exemplo.ao',
    candidatePhone: '+244 923 456 789',
    template: 't8_geometric_blue',
    themeColor: '#1E40AF',
    action: 'Descarregar PDF',
    price: 2000,
    paymentMethod: 'express',
    paymentStatus: 'paid',
    notes: 'CV Profissional Normal para processo seletivo telecom',
    generatedBy: 'm26101342@gmail.com',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    resumeData: {
      personalInfo: {
        fullName: 'Manuel Domingos António',
        title: 'Engenheiro de Redes & Infraestruturas TI',
        email: 'manuel.domingos@exemplo.ao',
        phone: '+244 923 456 789',
        location: 'Luanda, Angola',
        summary: 'Engenheiro de Redes com mais de 6 anos de experiência em planeamento, implementação e segurança de infraestruturas de telecomunicações críticas.'
      },
      experience: [
        {
          id: 'exp1',
          position: 'Administrador de Redes Sénior',
          company: 'Unitel S.A.',
          location: 'Luanda',
          startDate: '2021',
          endDate: 'Presente',
          current: true,
          description: 'Gestão de routing, switching BGP/OSPF, firewalls Fortinet e monitorização 24/7.'
        },
        {
          id: 'exp2',
          position: 'Técnico de Suporte de Redes',
          company: 'NCR Angola',
          location: 'Luanda',
          startDate: '2018',
          endDate: '2021',
          current: false,
          description: 'Suporte técnico a clientes empresariais e instalação de routers Cisco.'
        }
      ],
      education: [
        {
          id: 'edu1',
          degree: 'Licenciatura em Engenharia de Telecomunicações',
          institution: 'Universidade Agostinho Neto (UAN)',
          location: 'Luanda',
          startDate: '2014',
          endDate: '2019'
        }
      ],
      skills: [
        { id: 'sk1', name: 'Cisco CCNA / CCNP', level: 'Especialista' },
        { id: 'sk2', name: 'Fortinet / Firewalls', level: 'Avançado' },
        { id: 'sk3', name: 'Linux / Docker', level: 'Avançado' },
        { id: 'sk4', name: 'Routing & Switching BGP', level: 'Especialista' }
      ],
      languages: [
        { id: 'l1', name: 'Português', level: 'Nativo' },
        { id: 'l2', name: 'Inglês', level: 'Técnico / Avançado' }
      ]
    }
  },
  {
    id: 'doc_hist_02',
    type: 'cover_letter',
    serviceType: 'cover_letter',
    candidateName: 'Cláudia Sebastião Silva',
    candidateTitle: 'Candidatura a Gestora de Projetos',
    candidateEmail: 'claudia.silva@exemplo.ao',
    candidatePhone: '+244 934 112 334',
    template: 't1_executive',
    themeColor: '#1E40AF',
    action: 'Imprimir',
    price: 1500,
    paymentMethod: 'express',
    paymentStatus: 'paid',
    notes: 'Carta de Apresentação Executiva para vaga de Gestão',
    generatedBy: 'sumodemanga50@gmail.com',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    letterSubject: 'Candidatura a Gestora de Projetos Sénior - Ref: 2026/GP',
    coverLetterText: `Exmos. Senhores do Conselho de Administração,

Venho por este meio manifestar o meu elevado interesse em integrar a vossa instituição como Gestora de Projetos. Com mais de 7 anos de experiência na liderança de equipas multidisciplinares no setor bancário e tecnológico em Angola, possuo certificação internacional PMP (Project Management Professional) e forte capacidade na entrega de projetos dentro dos prazos e orçamentos estabelecidos.

Ao longo do meu percurso, liderei a transformação digital de sistemas de pagamento e processos operacionais com impacto direto no aumento da produtividade em mais de 35%.

Agradeço antecipadamente a atenção dispensada e manifesto a minha total disponibilidade para uma entrevista.

Com os melhores cumprimentos,
Cláudia Sebastião Silva`
  },
  {
    id: 'doc_hist_03',
    type: 'cv',
    serviceType: 'cv_english',
    candidateName: 'Josiel Ferreira',
    candidateTitle: 'Lead Full Stack & Cloud Solutions Engineer',
    candidateEmail: 'josiel.ferreira@cvlab.ao',
    candidatePhone: '+244 928 889 900',
    template: 't1_executive',
    themeColor: '#1E40AF',
    action: 'Descarregar PDF',
    price: 3000,
    paymentMethod: 'transfer',
    paymentStatus: 'paid',
    notes: 'CV Internacional em Inglês para empresas multinacionais',
    generatedBy: 'ronalmaferreira04@icloud.com',
    createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
    resumeData: {
      language: 'en',
      personalInfo: {
        fullName: 'Josiel Ferreira',
        title: 'Lead Full Stack & Cloud Solutions Engineer',
        email: 'josiel.ferreira@cvlab.ao',
        phone: '+244 928 889 900',
        location: 'Luanda, Angola',
        summary: 'Senior Software Engineer specializing in React, TypeScript, Node.js and Cloud Infrastructure. Proven track record in shipping enterprise web applications and scalable APIs.'
      },
      experience: [
        {
          id: 'exp1',
          position: 'Lead Full Stack Developer',
          company: 'CV LAB Angola',
          location: 'Luanda',
          startDate: '2022',
          endDate: 'Present',
          current: true,
          description: 'Designed and implemented full-stack resume automation platform with TypeScript, React, and Cloud infrastructure.'
        },
        {
          id: 'exp2',
          position: 'Software Engineer',
          company: 'Digital Solutions Ltd',
          location: 'Luanda',
          startDate: '2019',
          endDate: '2022',
          current: false,
          description: 'Developed RESTful services, automated CI/CD pipelines, and improved platform response times by 40%.'
        }
      ],
      education: [
        {
          id: 'edu1',
          degree: 'B.Sc. in Computer Science',
          institution: 'Higher Polytechnic Institute of Technologies and Sciences (ISPTEC)',
          location: 'Luanda',
          startDate: '2015',
          endDate: '2019'
        }
      ],
      skills: [
        { id: 'sk1', name: 'React / Next.js / TypeScript', level: 'Especialista' },
        { id: 'sk2', name: 'Node.js / Express / REST APIs', level: 'Especialista' },
        { id: 'sk3', name: 'Cloud Architecture / Docker', level: 'Avançado' },
        { id: 'sk4', name: 'PostgreSQL / Firestore', level: 'Avançado' }
      ],
      languages: [
        { id: 'l1', name: 'English', level: 'Fluent / Professional' },
        { id: 'l2', name: 'Portuguese', level: 'Native' }
      ]
    }
  },
  {
    id: 'doc_hist_04',
    type: 'cv',
    serviceType: 'cv_normal',
    candidateName: 'Teresa Gonçalves',
    candidateTitle: 'Especialista em Recursos Humanos & Gestão de Talentos',
    candidateEmail: 'teresa.goncalves@exemplo.ao',
    candidatePhone: '+244 945 223 344',
    template: 't2_geometric',
    themeColor: '#047857',
    action: 'Descarregar PDF',
    price: 2000,
    paymentMethod: 'express',
    paymentStatus: 'paid',
    notes: 'CV Normal em Português para Grupo Zahara',
    generatedBy: 'm26101342@gmail.com',
    createdAt: new Date(Date.now() - 3600000 * 42).toISOString(),
    resumeData: {
      personalInfo: {
        fullName: 'Teresa Gonçalves',
        title: 'Especialista em Recursos Humanos & Gestão de Talentos',
        email: 'teresa.goncalves@exemplo.ao',
        phone: '+244 945 223 344',
        location: 'Luanda, Angola',
        summary: 'Profissional de Recursos Humanos com foco em recrutamento estratégico, desenvolvimento organizacional e implementação de programas de retenção de talentos.'
      },
      experience: [
        {
          id: 'exp1',
          position: 'Responsável de Recrutamento & Seleção',
          company: 'Grupo Zahara',
          location: 'Luanda',
          startDate: '2020',
          endDate: 'Presente',
          current: true,
          description: 'Gestão de processos seletivos de quadros médios e superiores, avaliação de competências e integração de novos colaboradores.'
        }
      ],
      education: [
        {
          id: 'edu1',
          degree: 'Licenciatura em Psicologia do Trabalho e das Organizações',
          institution: 'Universidade Católica de Angola (UCAN)',
          location: 'Luanda',
          startDate: '2015',
          endDate: '2019'
        }
      ],
      skills: [
        { id: 'sk1', name: 'Recrutamento & Seleção (R&S)', level: 'Especialista' },
        { id: 'sk2', name: 'Gestão de Desempenho (KPIs)', level: 'Avançado' },
        { id: 'sk3', name: 'Legislação Laboral Angolana', level: 'Avançado' }
      ]
    }
  },
  {
    id: 'doc_hist_05',
    type: 'cv',
    serviceType: 'cv_europeu',
    candidateName: 'António Kiala',
    candidateTitle: 'Consultor Financeiro & Contabilista Sénior (OCPCA)',
    candidateEmail: 'antonio.kiala@exemplo.ao',
    candidatePhone: '+244 912 334 455',
    template: 't14_europass_classic',
    themeColor: '#0F172A',
    action: 'Descarregar PDF',
    price: 5000,
    paymentMethod: 'tpa',
    paymentStatus: 'paid',
    notes: 'CV Europeu Europass para processos em Portugal e Europa',
    generatedBy: 'sumodemanga50@gmail.com',
    createdAt: new Date(Date.now() - 3600000 * 55).toISOString(),
    resumeData: {
      styleConfig: { showEuropassSeal: true },
      personalInfo: {
        fullName: 'António Kiala',
        title: 'Consultor Financeiro & Contabilista Sénior (OCPCA)',
        email: 'antonio.kiala@exemplo.ao',
        phone: '+244 912 334 455',
        location: 'Luanda, Angola',
        summary: 'Contabilista certificado pela Ordem dos Contabilistas e Peritos Contabilistas de Angola (OCPCA), com sólida experiência em auditoria fiscal, demonstrações financeiras e planeamento tributário (AGT).'
      },
      experience: [
        {
          id: 'exp1',
          position: 'Contabilista Chefe',
          company: 'PetroAngola Services Lda',
          location: 'Luanda',
          startDate: '2019',
          endDate: 'Presente',
          current: true,
          description: 'Supervisão do fecho de contas, declarações fiscais (IVA, IRT, II) e coordenação com auditorias externas Big 4.'
        }
      ],
      education: [
        {
          id: 'edu1',
          degree: 'Licenciatura em Economia e Gestão Financeira',
          institution: 'Universidade Lusíada de Angola',
          location: 'Luanda',
          startDate: '2013',
          endDate: '2017'
        }
      ],
      skills: [
        { id: 'sk1', name: 'Primavera BSS / SAP ERP', level: 'Especialista' },
        { id: 'sk2', name: 'PGC Angolano / Normas IFRS', level: 'Especialista' },
        { id: 'sk3', name: 'Fiscalidade AGT & IVA', level: 'Avançado' }
      ]
    }
  },
  {
    id: 'doc_hist_06',
    type: 'cv',
    serviceType: 'cv_europeu',
    candidateName: 'Dra. Marlene Baptista',
    candidateTitle: 'Médica de Clínica Geral & Emergências',
    candidateEmail: 'marlene.baptista@exemplo.ao',
    candidatePhone: '+244 923 887 766',
    template: 't14_europass_classic',
    themeColor: '#0284C7',
    action: 'Descarregar PDF',
    price: 5000,
    paymentMethod: 'express',
    paymentStatus: 'paid',
    notes: 'CV Europeu Europass com selo oficial para validação na Ordem dos Médicos em Portugal',
    generatedBy: 'ronalmaferreira04@icloud.com',
    createdAt: new Date(Date.now() - 3600000 * 70).toISOString(),
    resumeData: {
      styleConfig: { showEuropassSeal: true },
      personalInfo: {
        fullName: 'Dra. Marlene Baptista',
        title: 'Médica de Clínica Geral & Emergências',
        email: 'marlene.baptista@exemplo.ao',
        phone: '+244 923 887 766',
        location: 'Luanda, Angola',
        summary: 'Médica inscrita na Ordem dos Médicos de Angola, com dedicação a cuidados intensivos, atendimento em banco de urgência e diagnóstico clínico precoce.'
      },
      experience: [
        {
          id: 'exp1',
          position: 'Médica Assistente',
          company: 'Hospital Geral de Luanda',
          location: 'Luanda',
          startDate: '2020',
          endDate: 'Presente',
          current: true,
          description: 'Atendimento no banco de urgência pediátrico e geral, triagem de casos graves e acompanhamento de enfermarias.'
        }
      ],
      education: [
        {
          id: 'edu1',
          degree: 'Mestrado Integrado em Medicina Geral',
          institution: 'Faculdade de Medicina da UAN',
          location: 'Luanda',
          startDate: '2013',
          endDate: '2019'
        }
      ],
      skills: [
        { id: 'sk1', name: 'Suporte Avançado de Vida (ACLS)', level: 'Especialista' },
        { id: 'sk2', name: 'Triagem Clínica & Emergência', level: 'Especialista' },
        { id: 'sk3', name: 'Medicina Preventiva', level: 'Avançado' }
      ]
    }
  },
  {
    id: 'doc_hist_07',
    type: 'cv',
    serviceType: 'cv_normal',
    candidateName: 'Eng. Domingos Ndala',
    candidateTitle: 'Engenheiro Civil & Fiscal de Obras e Estruturas',
    candidateEmail: 'domingos.ndala@exemplo.ao',
    candidatePhone: '+244 931 556 677',
    template: 't8_geometric_blue',
    themeColor: '#D97706',
    action: 'Descarregar PDF',
    price: 2000,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    notes: 'CV Profissional Normal para Omatapalo',
    generatedBy: 'm26101342@gmail.com',
    createdAt: new Date(Date.now() - 3600000 * 85).toISOString(),
    resumeData: {
      personalInfo: {
        fullName: 'Eng. Domingos Ndala',
        title: 'Engenheiro Civil & Fiscal de Obras e Estruturas',
        email: 'domingos.ndala@exemplo.ao',
        phone: '+244 931 556 677',
        location: 'Benguela, Angola',
        summary: 'Engenheiro Civil com vasta experiência em dimensionamento de estruturas de betão armado, fiscalização de empreitadas de construção e gestão orçamental de projetos.'
      },
      experience: [
        {
          id: 'exp1',
          position: 'Diretor de Obra',
          company: 'Construtora Omatapalo',
          location: 'Benguela / Luanda',
          startDate: '2019',
          endDate: 'Presente',
          current: true,
          description: 'Gestão integral de obras de infraestruturas públicas, controlo de qualidade de materiais e coordenação de equipas de terreno.'
        }
      ],
      education: [
        {
          id: 'edu1',
          degree: 'Licenciatura em Engenharia Civil',
          institution: 'Universidade Katyavala Bwila (UKB)',
          location: 'Benguela',
          startDate: '2014',
          endDate: '2018'
        }
      ],
      skills: [
        { id: 'sk1', name: 'AutoCAD / CYPECAD / Revit', level: 'Especialista' },
        { id: 'sk2', name: 'Gestão Orçamental & Medições', level: 'Especialista' },
        { id: 'sk3', name: 'Fiscalização de Qualidade ISO', level: 'Avançado' }
      ]
    }
  },
  {
    id: 'doc_hist_08',
    type: 'cv',
    serviceType: 'cv_english',
    candidateName: 'Esperança Luísa',
    candidateTitle: 'Digital Marketing & Growth Manager',
    candidateEmail: 'esperanca.luisa@exemplo.ao',
    candidatePhone: '+244 942 990 011',
    template: 't1_executive',
    themeColor: '#7C3AED',
    action: 'Descarregar PDF',
    price: 3000,
    paymentMethod: 'express',
    paymentStatus: 'paid',
    notes: 'CV Internacional em Inglês para agências e marcas multinacionais',
    generatedBy: 'sumodemanga50@gmail.com',
    createdAt: new Date(Date.now() - 3600000 * 98).toISOString(),
    resumeData: {
      language: 'en',
      personalInfo: {
        fullName: 'Esperança Luísa',
        title: 'Digital Marketing & Growth Manager',
        email: 'esperanca.luisa@exemplo.ao',
        phone: '+244 942 990 011',
        location: 'Luanda, Angola',
        summary: 'Digital Marketing Strategist with extensive experience in omnichannel campaigns (Meta Ads, Google Ads, LinkedIn), brand positioning, and high-conversion inbound funnels.'
      },
      experience: [
        {
          id: 'exp1',
          position: 'Growth Marketing Manager',
          company: 'Luanda Digital Agency',
          location: 'Luanda',
          startDate: '2021',
          endDate: 'Present',
          current: true,
          description: 'Managed multi-channel digital ad accounts with average ROAS over 320% and led creative content team.'
        }
      ],
      education: [
        {
          id: 'edu1',
          degree: 'B.A. in Media Communications & Marketing',
          institution: 'Jean Piaget University of Angola',
          location: 'Luanda',
          startDate: '2016',
          endDate: '2020'
        }
      ],
      skills: [
        { id: 'sk1', name: 'Meta Ads / Google Analytics 4', level: 'Especialista' },
        { id: 'sk2', name: 'Copywriting & Content Strategy', level: 'Especialista' },
        { id: 'sk3', name: 'Figma / UI Design & Branding', level: 'Avançado' }
      ]
    }
  },
  {
    id: 'doc_hist_09',
    type: 'cv',
    serviceType: 'cv_normal',
    candidateName: 'Carlos Eduardo',
    candidateTitle: 'Técnico de Suporte TI & Helpdesk Empresarial',
    candidateEmail: 'carlos.eduardo@exemplo.ao',
    candidatePhone: '+244 927 665 544',
    template: 't8_geometric_blue',
    themeColor: '#0284C7',
    action: 'Descarregar PDF',
    price: 2000,
    paymentMethod: 'express',
    paymentStatus: 'paid',
    notes: 'CV Profissional Normal para Sonangol',
    generatedBy: 'm26101342@gmail.com',
    createdAt: new Date(Date.now() - 3600000 * 110).toISOString(),
    resumeData: {
      personalInfo: {
        fullName: 'Carlos Eduardo',
        title: 'Técnico de Suporte TI & Helpdesk Empresarial',
        email: 'carlos.eduardo@exemplo.ao',
        phone: '+244 927 665 544',
        location: 'Luanda, Angola',
        summary: 'Técnico de TI com experiência na manutenção preventiva e corretiva de hardware, gestão de utilizadores no Active Directory e suporte presencial e remoto de nível 1 e 2.'
      },
      experience: [
        {
          id: 'exp1',
          position: 'Técnico de Helpdesk Nível 2',
          company: 'Sonangol Distribuidora',
          location: 'Luanda',
          startDate: '2021',
          endDate: 'Presente',
          current: true,
          description: 'Resolução de incidentes técnicos, configuração de computadores Windows 11 / Mac e gestão de impressoras de rede.'
        }
      ],
      education: [
        {
          id: 'edu1',
          degree: 'Ensino Médio Técnico em Informática de Gestão',
          institution: 'Instituto Médio Politécnico Industrial de Luanda (IMPIL)',
          location: 'Luanda',
          startDate: '2016',
          endDate: '2019'
        }
      ],
      skills: [
        { id: 'sk1', name: 'Windows Server & Active Directory', level: 'Avançado' },
        { id: 'sk2', name: 'Microsoft 365 & Outlook', level: 'Especialista' },
        { id: 'sk3', name: 'Hardware & Redes LAN', level: 'Avançado' }
      ]
    }
  },
  {
    id: 'doc_hist_10',
    type: 'cover_letter',
    serviceType: 'cover_letter',
    candidateName: 'Dra. Helena Capanda',
    candidateTitle: 'Candidatura a Diretora de Operações & Logística',
    candidateEmail: 'helena.capanda@exemplo.ao',
    candidatePhone: '+244 933 445 566',
    template: 't1_executive',
    themeColor: '#1E40AF',
    action: 'Descarregar PDF',
    price: 1500,
    paymentMethod: 'express',
    paymentStatus: 'paid',
    notes: 'Carta de Apresentação para Comissão Executiva',
    generatedBy: 'ronalmaferreira04@icloud.com',
    createdAt: new Date(Date.now() - 3600000 * 125).toISOString(),
    letterSubject: 'Candidatura a Diretora de Operações e Cadeia de Abastecimento',
    coverLetterText: `Exmos. Senhores da Comissão Executiva,

Apresento a minha candidatura para a posição de Diretora de Operações e Cadeia de Abastecimento. Com mais de uma década de experiência no planeamento logístico marítimo e terrestre no corredor do Lobito e Luanda, destaco-me pela otimização de frotas e redução de custos aduaneiros e de armazenagem em mais de 28%.

A minha abordagem focada em metodologias Lean e Six Sigma permite criar operações robustas e resilientes.

Estou disponível para aprofundar de que forma posso contribuir para os objetivos de expansão da vossa empresa.

Atentamente,
Dra. Helena Capanda`
  },
  {
    id: 'doc_hist_11',
    type: 'cover_letter',
    serviceType: 'cover_letter',
    candidateName: 'Victor Manuel',
    candidateTitle: 'Candidatura a Assistente Administrativo & Secretariado',
    candidateEmail: 'victor.manuel@exemplo.ao',
    candidatePhone: '+244 929 112 233',
    template: 't2_geometric',
    themeColor: '#1E40AF',
    action: 'Imprimir',
    price: 1500,
    paymentMethod: 'express',
    paymentStatus: 'paid',
    notes: 'Carta de Apresentação Administrativa',
    generatedBy: 'sumodemanga50@gmail.com',
    createdAt: new Date(Date.now() - 3600000 * 140).toISOString(),
    letterSubject: 'Candidatura a Assistente Administrativo Executivo - Ref: 2026/ADM',
    coverLetterText: `Exmo. Senhor Diretor de Recursos Humanos,

Dirijo-me a V. Exa. para apresentar a minha candidatura à vaga de Assistente Administrativo Executivo. Com experiência comprovada na gestão de correspondência oficial, arquivo digital, agendamento executivo e preparação de relatórios de gestão, disponho de excelente domínio das ferramentas Microsoft Office (Word, Excel e PowerPoint) e elevado sentido de responsabilidade e confidencialidade.

Agradeço desde já a consideração da minha candidatura e coloco-me à inteira disposição para prestar esclarecimentos complementares.

Respeitosamente,
Victor Manuel`
  },
  {
    id: 'doc_hist_12',
    type: 'cv',
    serviceType: 'cv_english',
    candidateName: 'Afonso Mateus',
    candidateTitle: 'Cloud Architect & Senior DevOps Engineer',
    candidateEmail: 'afonso.mateus@exemplo.ao',
    candidatePhone: '+244 924 778 899',
    template: 't1_executive',
    themeColor: '#1E40AF',
    action: 'Descarregar PDF',
    price: 3000,
    paymentMethod: 'transfer',
    paymentStatus: 'paid',
    notes: 'CV Internacional em Inglês para setor bancário e tech',
    generatedBy: 'm26101342@gmail.com',
    createdAt: new Date(Date.now() - 3600000 * 160).toISOString(),
    resumeData: {
      language: 'en',
      personalInfo: {
        fullName: 'Afonso Mateus',
        title: 'Cloud Architect & Senior DevOps Engineer',
        email: 'afonso.mateus@exemplo.ao',
        phone: '+244 924 778 899',
        location: 'Luanda, Angola',
        summary: 'Cloud & Infrastructure Architect with 7+ years of experience in Kubernetes orchestration, Terraform automation, and secure enterprise financial cloud systems.'
      },
      experience: [
        {
          id: 'exp1',
          position: 'DevOps & Cloud Lead',
          company: 'BFA - Banco de Fomento Angola',
          location: 'Luanda',
          startDate: '2020',
          endDate: 'Present',
          current: true,
          description: 'Architected automated zero-downtime deployment pipelines for core banking services with 99.99% availability.'
        }
      ],
      education: [
        {
          id: 'edu1',
          degree: 'B.Sc. in Software Engineering',
          institution: 'Independent University of Angola (UNIA)',
          location: 'Luanda',
          startDate: '2015',
          endDate: '2019'
        }
      ],
      skills: [
        { id: 'sk1', name: 'Kubernetes / Docker / Helm', level: 'Especialista' },
        { id: 'sk2', name: 'AWS & Google Cloud / Terraform', level: 'Especialista' },
        { id: 'sk3', name: 'CI/CD Pipelines & Security', level: 'Avançado' }
      ]
    }
  }
];
