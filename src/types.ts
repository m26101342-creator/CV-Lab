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
    level: 'Basic' | 'Intermediate' | 'Advanced' | 'Expert';
  }[];
  languages: string[];
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
  },
  experience: [],
  education: [],
  skills: [],
  languages: [],
};

export type TemplateType = 'modern_blue' | 'dark_exec' | 'sage_green' | 'crimson' | 'purple_bold' | 'citrus' | 'minimal_bw';
