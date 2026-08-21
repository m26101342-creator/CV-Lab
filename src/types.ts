import { LucideIcon, Briefcase, GraduationCap, MapPin, Phone, Mail, Globe, Award, Languages, PenTool } from 'lucide-react';

export interface CoverLetterSubjectStyle {
  fontSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  fontWeight?: 'normal' | 'semibold' | 'bold' | 'black';
  align?: 'left' | 'center' | 'right';
  layout?: 'inline' | 'block';
  uppercase?: boolean;
  showPrefix?: boolean;
  showSubject?: boolean;
}

export interface ResumeStyleConfig {
  fontSize?: number;       // em px, padrão 13 ou 14
  titleSize?: number;      // em px, padrão 24 ou 28
  sectionSpacing?: number; // em px de margem inferior de seções, ex: 24
  itemSpacing?: number;    // em px de margem inferior de itens, ex: 12
  margins?: number;        // padding geral do doc, ex: 30
  lineHeight?: number;     // em em/rem, ex: 1.4
  alignment?: 'left' | 'center' | 'right' | 'justify';
  fontFamily?: 'sans' | 'serif' | 'mono' | 'grotesk';
  photoBorderRadius?: number; // em px ou %, ex: 999
  showTimeline?: boolean;  // mostrar linha do tempo (pontos) na experiência/educação
  showPhoto?: boolean;     // mostrar círculo da foto de perfil ou iniciais do nome
  contactSize?: number;
  summarySize?: number;
  experienceSize?: number;
  educationSize?: number;
  skillsSize?: number;
  languagesSize?: number;
  customSize?: number;
  certificationsSize?: number;
  interestsSize?: number;
  sectionPositions?: Record<string, 'left' | 'right'>;
  iconColor?: string;
  showEuropassSeal?: boolean;
  europassSealPosition?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-right' | 'header-left' | 'header-right';
  europassSealSize?: number;
  europassSealOffsetX?: number;
  europassSealOffsetY?: number;
  europassSealStyle?: 'standard' | 'white' | 'badge' | 'minimal';
  europassSealBgProtection?: boolean;
}

export interface ResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    website: string;
    title: string;
    summary: string;
    photo?: string;
    photoStyle?: 'circle' | 'square';
    photoSize?: number;
  };
  experience: {
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
    current: boolean;
  }[];
  education: {
    id: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    description?: string; // Tópicos ou notas sobre a formação acadêmica
  }[];
  skills: {
    id: string;
    name: string;
    level: 'Iniciante' | 'Básico' | 'Intermédio' | 'Avançado' | 'Especialista' | 'Ocultar';
  }[];
  languages: {
    id: string;
    name: string;
    level: string;
  }[];
  interests?: string[];
  certifications?: { 
    id: string; 
    name: string; 
    date?: string; 
    issuer?: string; 
    description?: string; 
  }[];
  customSections?: CustomSection[];
  sectionTitles?: Partial<Record<'experience' | 'education' | 'skills' | 'languages' | 'certifications' | 'interests' | 'summary' | 'contact' | string, string>>;
  themeColor?: string;
  styleConfig?: ResumeStyleConfig;
  language?: 'pt' | 'en' | 'es';
}

export interface CustomSectionItem {
  id: string;
  name: string;
  description?: string;
}

export interface CustomSection {
  id: string;
  title: string;
  items: CustomSectionItem[];
}

export const INITIAL_RESUME_DATA: ResumeData = {
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    title: '',
    summary: '',
    photoStyle: 'circle',
    photoSize: 100,
  },
  experience: [],
  education: [],
  skills: [],
  languages: [],
  customSections: [],
  sectionTitles: {},
  themeColor: '#1B2A4A',
  language: 'pt',
  styleConfig: {
    fontSize: 13,
    titleSize: 26,
    sectionSpacing: 25,
    itemSpacing: 10,
    margins: 30,
    lineHeight: 1.4,
    alignment: 'left',
    fontFamily: 'sans',
    showTimeline: true,
    showPhoto: true
  }
};

export type TemplateType = 't1_executive' | 't2_geometric' | 't3_modern' | 't4_barnabas' | 't5_jonathan' | 't6_creative' | 't7_professional' | 't8_geometric_blue' | 't9_emerald_pill' | 't10_johan' | 't11_kelly' | 't12_maria' | 't13_tazi' | 't14_europass_classic' | 't15_europass_modern';

// Tipos de Serviços Oficiais e Tabela de Preços (CV LAB Angola)
export type ServiceType = 'cv_normal' | 'cv_english' | 'cv_europeu' | 'cover_letter' | 'combo' | 'custom';

export interface ServicePriceDefinition {
  type: ServiceType;
  name: string;
  shortName: string;
  defaultPrice: number;
  currency: string;
  description: string;
  badgeColor: string;
  suggestedTemplate: TemplateType;
  language: 'pt' | 'en';
}

export const OFFICIAL_SERVICE_PRICES: Record<ServiceType, ServicePriceDefinition> = {
  cv_normal: {
    type: 'cv_normal',
    name: 'CV Profissional Normal',
    shortName: 'CV Normal',
    defaultPrice: 2000,
    currency: 'Kz',
    description: 'Currículo profissional de alto impacto visual em português, alinhado ao mercado nacional e corporativo.',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    suggestedTemplate: 't8_geometric_blue',
    language: 'pt'
  },
  cv_english: {
    type: 'cv_english',
    name: 'CV em Inglês (English Resume)',
    shortName: 'CV Inglês',
    defaultPrice: 3000,
    currency: 'Kz',
    description: 'Currículo internacional estruturado e traduzido em inglês para multinacionais, embaixadas e vagas remotas.',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    suggestedTemplate: 't1_executive',
    language: 'en'
  },
  cv_europeu: {
    type: 'cv_europeu',
    name: 'CV Europeu (Padrão Europass)',
    shortName: 'CV Europeu',
    defaultPrice: 5000,
    currency: 'Kz',
    description: 'Formato oficial da União Europeia (Europass) com selo de conformidade para candidaturas em Portugal e Europa.',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    suggestedTemplate: 't14_europass_classic',
    language: 'pt'
  },
  cover_letter: {
    type: 'cover_letter',
    name: 'Carta de Apresentação Profissional',
    shortName: 'Carta de Apresentação',
    defaultPrice: 1500,
    currency: 'Kz',
    description: 'Carta formal e persuasiva personalizada para a vaga de emprego pretendida.',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    suggestedTemplate: 't1_executive',
    language: 'pt'
  },
  combo: {
    type: 'combo',
    name: 'Combo Profissional (CV + Carta)',
    shortName: 'Combo Completo',
    defaultPrice: 3500,
    currency: 'Kz',
    description: 'Pacote completo de Currículo + Carta de Apresentação combinados com mesmo design visual.',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    suggestedTemplate: 't8_geometric_blue',
    language: 'pt'
  },
  custom: {
    type: 'custom',
    name: 'Serviço Especial / Consultoria',
    shortName: 'Personalizado',
    defaultPrice: 2000,
    currency: 'Kz',
    description: 'Atendimento personalizado com valor ajustado manualmente.',
    badgeColor: 'bg-gray-100 text-gray-800 border-gray-200',
    suggestedTemplate: 't8_geometric_blue',
    language: 'pt'
  }
};

export interface ClientRegistrationData {
  id?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  serviceType: ServiceType;
  price: number;
  paymentMethod: 'express' | 'transfer' | 'cash' | 'tpa' | 'other';
  paymentStatus: 'paid' | 'pending';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  registeredBy?: string;
  template?: TemplateType;
  themeColor?: string;
  resumeData?: ResumeData;
  coverLetterText?: string;
  letterSubject?: string;
}

export interface StaffAccessLink {
  id: string;
  token: string;
  name: string;
  createdAt: string;
  expiresAt: string;
  durationHours: number;
  isActive: boolean;
  createdBy: string;
  accessCount?: number;
  lastUsedAt?: string | null;
}
