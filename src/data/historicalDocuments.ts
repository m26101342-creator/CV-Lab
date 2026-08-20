export interface HistoricalDocumentItem {
  id: string;
  type: 'cv' | 'cover_letter' | 'combo';
  candidateName: string;
  candidateTitle: string;
  candidateEmail: string;
  candidatePhone: string;
  template: string;
  themeColor: string;
  action: string;
  price: number;
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
    candidateName: 'Manuel Domingos António',
    candidateTitle: 'Engenheiro de Redes & Infraestruturas TI',
    candidateEmail: 'manuel.domingos@exemplo.ao',
    candidatePhone: '+244 923 456 789',
    template: 't8_geometric_blue',
    themeColor: '#1E40AF',
    action: 'Descarregar PDF',
    price: 2000,
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
    candidateName: 'Cláudia Sebastião Silva',
    candidateTitle: 'Candidatura a Gestora de Projetos',
    candidateEmail: 'claudia.silva@exemplo.ao',
    candidatePhone: '+244 934 112 334',
    template: 't1_executive',
    themeColor: '#1E40AF',
    action: 'Imprimir',
    price: 1000,
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
    candidateName: 'Josiel Ferreira',
    candidateTitle: 'Desenvolvedor Full Stack & Engenheiro Cloud',
    candidateEmail: 'josiel.ferreira@cvlab.ao',
    candidatePhone: '+244 928 889 900',
    template: 'custom-t8',
    themeColor: '#1E40AF',
    action: 'Descarregar PDF',
    price: 2000,
    generatedBy: 'ronalmaferreira04@icloud.com',
    createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
    resumeData: {
      personalInfo: {
        fullName: 'Josiel Ferreira',
        title: 'Desenvolvedor Full Stack & Engenheiro Cloud',
        email: 'josiel.ferreira@cvlab.ao',
        phone: '+244 928 889 900',
        location: 'Luanda, Angola',
        summary: 'Desenvolvedor de Software especialista em React, Node.js, TypeScript e arquitetura serverless. Experiência comprovada no lançamento de produtos digitais de alta escalabilidade.'
      },
      experience: [
        {
          id: 'exp1',
          position: 'Lead Full Stack Developer',
          company: 'CV LAB Angola',
          location: 'Luanda',
          startDate: '2022',
          endDate: 'Presente',
          current: true,
          description: 'Arquitetura e desenvolvimento da plataforma de criação de currículos e gestão de documentos com Next.js, React e Firestore.'
        },
        {
          id: 'exp2',
          position: 'Software Developer',
          company: 'Inovação Digital Lda',
          location: 'Luanda',
          startDate: '2019',
          endDate: '2022',
          current: false,
          description: 'Desenvolvimento de APIs RESTful e aplicações Web com Node.js, PostgreSQL e Tailwind CSS.'
        }
      ],
      education: [
        {
          id: 'edu1',
          degree: 'Licenciatura em Ciências da Computação',
          institution: 'Instituto Superior Politécnico de Tecnologias e Ciências (ISPTEC)',
          location: 'Luanda',
          startDate: '2015',
          endDate: '2019'
        }
      ],
      skills: [
        { id: 'sk1', name: 'React / Next.js / TypeScript', level: 'Especialista' },
        { id: 'sk2', name: 'Node.js / Express / APIs', level: 'Especialista' },
        { id: 'sk3', name: 'Firebase / Firestore / Cloud SQL', level: 'Avançado' },
        { id: 'sk4', name: 'Docker / CI/CD / Git', level: 'Avançado' }
      ],
      languages: [
        { id: 'l1', name: 'Português', level: 'Nativo' },
        { id: 'l2', name: 'Inglês', level: 'Fluente' }
      ]
    }
  },
  {
    id: 'doc_hist_04',
    type: 'cv',
    candidateName: 'Teresa Gonçalves',
    candidateTitle: 'Especialista em Recursos Humanos & Gestão de Talentos',
    candidateEmail: 'teresa.goncalves@exemplo.ao',
    candidatePhone: '+244 945 223 344',
    template: 't2_modern',
    themeColor: '#047857',
    action: 'Descarregar PDF',
    price: 2000,
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
    candidateName: 'António Kiala',
    candidateTitle: 'Consultor Financeiro & Contabilista Sénior (OCPCA)',
    candidateEmail: 'antonio.kiala@exemplo.ao',
    candidatePhone: '+244 912 334 455',
    template: 't3_corporate',
    themeColor: '#0F172A',
    action: 'Descarregar PDF',
    price: 2000,
    generatedBy: 'sumodemanga50@gmail.com',
    createdAt: new Date(Date.now() - 3600000 * 55).toISOString(),
    resumeData: {
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
    candidateName: 'Dra. Marlene Baptista',
    candidateTitle: 'Médica de Clínica Geral & Emergências',
    candidateEmail: 'marlene.baptista@exemplo.ao',
    candidatePhone: '+244 923 887 766',
    template: 't7_medical',
    themeColor: '#0284C7',
    action: 'Descarregar PDF',
    price: 2000,
    generatedBy: 'ronalmaferreira04@icloud.com',
    createdAt: new Date(Date.now() - 3600000 * 70).toISOString(),
    resumeData: {
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
    candidateName: 'Eng. Domingos Ndala',
    candidateTitle: 'Engenheiro Civil & Fiscal de Obras e Estruturas',
    candidateEmail: 'domingos.ndala@exemplo.ao',
    candidatePhone: '+244 931 556 677',
    template: 't4_minimal',
    themeColor: '#D97706',
    action: 'Descarregar PDF',
    price: 2000,
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
    candidateName: 'Esperança Luísa',
    candidateTitle: 'Gestora de Marketing Digital, Redes Sociais & Branding',
    candidateEmail: 'esperanca.luisa@exemplo.ao',
    candidatePhone: '+244 942 990 011',
    template: 't5_creative',
    themeColor: '#7C3AED',
    action: 'Descarregar PDF',
    price: 2000,
    generatedBy: 'sumodemanga50@gmail.com',
    createdAt: new Date(Date.now() - 3600000 * 98).toISOString(),
    resumeData: {
      personalInfo: {
        fullName: 'Esperança Luísa',
        title: 'Gestora de Marketing Digital, Redes Sociais & Branding',
        email: 'esperanca.luisa@exemplo.ao',
        phone: '+244 942 990 011',
        location: 'Luanda, Angola',
        summary: 'Especialista em estratégias de crescimento em redes sociais (Meta Ads, TikTok, LinkedIn), criação de campanhas de inbound marketing e posicionamento de marcas corporativas.'
      },
      experience: [
        {
          id: 'exp1',
          position: 'Marketing Manager',
          company: 'Agência Criativa Luanda',
          location: 'Luanda',
          startDate: '2021',
          endDate: 'Presente',
          current: true,
          description: 'Gestão de contas de clientes de grande porte, planeamento de campanhas pagas com ROI superior a 300% e liderança de equipa criativa.'
        }
      ],
      education: [
        {
          id: 'edu1',
          degree: 'Licenciatura em Comunicação Social & Marketing',
          institution: 'Universidade Jean Piaget de Angola',
          location: 'Luanda',
          startDate: '2016',
          endDate: '2020'
        }
      ],
      skills: [
        { id: 'sk1', name: 'Meta Ads / Google Ads', level: 'Especialista' },
        { id: 'sk2', name: 'Copywriting & Content Strategy', level: 'Especialista' },
        { id: 'sk3', name: 'Design Gráfico / Figma / Canva', level: 'Avançado' }
      ]
    }
  },
  {
    id: 'doc_hist_09',
    type: 'cv',
    candidateName: 'Carlos Eduardo',
    candidateTitle: 'Técnico de Suporte TI & Helpdesk Empresarial',
    candidateEmail: 'carlos.eduardo@exemplo.ao',
    candidatePhone: '+244 927 665 544',
    template: 't6_technical',
    themeColor: '#0284C7',
    action: 'Descarregar PDF',
    price: 2000,
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
    candidateName: 'Dra. Helena Capanda',
    candidateTitle: 'Candidatura a Diretora de Operações & Logística',
    candidateEmail: 'helena.capanda@exemplo.ao',
    candidatePhone: '+244 933 445 566',
    template: 't1_executive',
    themeColor: '#1E40AF',
    action: 'Descarregar PDF',
    price: 1000,
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
    candidateName: 'Victor Manuel',
    candidateTitle: 'Candidatura a Assistente Administrativo & Secretariado',
    candidateEmail: 'victor.manuel@exemplo.ao',
    candidatePhone: '+244 929 112 233',
    template: 't2_modern',
    themeColor: '#1E40AF',
    action: 'Imprimir',
    price: 1000,
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
    candidateName: 'Afonso Mateus',
    candidateTitle: 'Arquiteto de Software & Engenheiro DevOps',
    candidateEmail: 'afonso.mateus@exemplo.ao',
    candidatePhone: '+244 924 778 899',
    template: 'custom-t8',
    themeColor: '#1E40AF',
    action: 'Descarregar PDF',
    price: 2000,
    generatedBy: 'm26101342@gmail.com',
    createdAt: new Date(Date.now() - 3600000 * 160).toISOString(),
    resumeData: {
      personalInfo: {
        fullName: 'Afonso Mateus',
        title: 'Arquiteto de Software & Engenheiro DevOps',
        email: 'afonso.mateus@exemplo.ao',
        phone: '+244 924 778 899',
        location: 'Luanda, Angola',
        summary: 'Especialista em pipelines de CI/CD, Kubernetes, infraestrutura como código (Terraform) e microsserviços em ambiente AWS e Google Cloud.'
      },
      experience: [
        {
          id: 'exp1',
          position: 'DevOps Lead',
          company: 'BFA - Banco de Fomento Angola',
          location: 'Luanda',
          startDate: '2020',
          endDate: 'Presente',
          current: true,
          description: 'Implementação de esteiras automatizadas de deploy para internet banking com 99.99% de disponibilidade.'
        }
      ],
      education: [
        {
          id: 'edu1',
          degree: 'Licenciatura em Engenharia de Software',
          institution: 'Universidade Independente de Angola (UNIA)',
          location: 'Luanda',
          startDate: '2015',
          endDate: '2019'
        }
      ],
      skills: [
        { id: 'sk1', name: 'Kubernetes / Docker / Helm', level: 'Especialista' },
        { id: 'sk2', name: 'AWS Cloud / Terraform', level: 'Especialista' },
        { id: 'sk3', name: 'GitHub Actions / GitLab CI', level: 'Avançado' }
      ]
    }
  }
];
