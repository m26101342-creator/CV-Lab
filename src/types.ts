import { LucideIcon, Briefcase, GraduationCap, MapPin, Phone, Mail, Globe, Award, Languages, PenTool } from 'lucide-react';

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
    level: 'Básico' | 'Intermédio' | 'Avançado' | 'Fluente' | 'Nativo';
  }[];
  themeColor?: string;
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
};

export type TemplateType = 't1_executive' | 't2_geometric' | 't3_modern' | 't4_barnabas' | 't5_jonathan';
