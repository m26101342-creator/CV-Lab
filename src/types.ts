import { LucideIcon, Briefcase, GraduationCap, MapPin, Phone, Mail, Globe, Award, Languages, PenTool } from 'lucide-react';

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
  }[];
  skills: {
    id: string;
    name: string;
    level: 'Básico' | 'Intermédio' | 'Avançado' | 'Especialista';
  }[];
  languages: {
    id: string;
    name: string;
    level: string;
  }[];
  interests?: string[];
  certifications?: { id: string; name: string; date: string }[];
  themeColor?: string;
  styleConfig?: ResumeStyleConfig;
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
  themeColor: '#1B2A4A',
  styleConfig: {
    fontSize: 13,
    titleSize: 26,
    sectionSpacing: 25,
    itemSpacing: 10,
    margins: 30,
    lineHeight: 1.4,
    alignment: 'left',
    fontFamily: 'sans'
  }
};

export type TemplateType = 't1_executive' | 't2_geometric' | 't3_modern' | 't4_barnabas' | 't5_jonathan' | 't6_creative' | 't7_professional' | 't8_geometric_blue' | 't9_emerald_pill' | 't10_johan' | 't11_kelly' | 't12_maria' | 't13_tazi';
