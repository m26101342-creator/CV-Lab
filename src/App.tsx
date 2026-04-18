/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Download, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  User, 
  Briefcase, 
  GraduationCap, 
  Settings, 
  FileText,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  Globe,
  X,
  ExternalLink
} from 'lucide-react';
import { ResumeData, INITIAL_RESUME_DATA, TemplateType } from './types.ts';
import { optimizeResumeText, generateCoverLetter } from './services/geminiService.ts';

// --- UI Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, icon: Icon }: any) => {
  const base = "px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: any = {
    primary: "bg-primary-blue text-white shadow-lg shadow-primary-blue/20 hover:bg-primary-blue/90 h-12",
    secondary: "bg-soft-blue text-primary-blue hover:bg-soft-blue/80 h-12",
    outline: "border-2 border-primary-blue text-primary-blue hover:bg-soft-blue h-12",
    ghost: "text-text-muted hover:text-text-main hover:bg-bg-main h-12",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 h-12"
  };

  return (
    <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`} disabled={disabled}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

const Input = ({ label, value, onChange, placeholder, type = 'text', icon: Icon, disabled = false, ...props }: any) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-[10px] font-black text-text-muted uppercase tracking-wider pl-1">{label}</label>}
    <div className="relative group">
      {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-primary-blue" size={16} />}
      <input
        {...props}
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full bg-white border border-border-main rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue transition-all ${Icon ? 'pl-10' : ''} ${disabled ? 'opacity-50 bg-bg-main' : ''}`}
      />
    </div>
  </div>
);

const TextArea = ({ label, value, onChange, placeholder, onOptimize }: any) => (
  <div className="flex flex-col gap-1.5 w-full">
    <div className="flex justify-between items-center px-1">
      {label && <label className="text-[10px] font-black text-text-muted uppercase tracking-wider">{label}</label>}
      {onOptimize && (
        <button 
          onClick={onOptimize}
          className="text-[10px] font-black text-primary-blue flex items-center gap-1 hover:opacity-80 transition-opacity bg-soft-blue px-2 py-0.5 rounded"
        >
          <Sparkles size={10} />
          OTIMIZAR IA
        </button>
      )}
    </div>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={4}
      className="w-full bg-white border border-border-main rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue transition-all resize-none"
    />
  </div>
);

// --- Resumes & Templates Configuration ---

const TEMPLATES = {
  modern_blue: {
    font: 'font-sans',
    bg: 'bg-white',
    textMain: 'text-gray-800',
    primary: '#0066FF',
    accent: '#0A192F',
    soft: '#F0F5FF',
    lines: '#E2E8F0',
    layout: 'sidebar-left'
  },
  dark_exec: {
    font: 'font-display',
    bg: 'bg-[#0f172a]',
    textMain: 'text-slate-300',
    primary: '#eab308',
    accent: '#ffffff',
    soft: '#1e293b',
    lines: '#334155',
    layout: 'top-header'
  },
  sage_green: {
    font: 'font-sans',
    bg: 'bg-[#FAFAFA]',
    textMain: 'text-[#4e594d]',
    primary: '#6b8266',
    accent: '#2c362a',
    soft: '#eef2ee',
    lines: '#d4dbd3',
    layout: 'sidebar-left'
  },
  crimson: {
    font: 'font-display',
    bg: 'bg-white',
    textMain: 'text-stone-800',
    primary: '#991b1b',
    accent: '#450a0a',
    soft: '#fef2f2',
    lines: '#fecaca',
    layout: 'top-header'
  },
  purple_bold: {
    font: 'font-sans',
    bg: 'bg-[#fdfaff]',
    textMain: 'text-gray-800',
    primary: '#7c3aed',
    accent: '#2e1065',
    soft: '#f3e8ff',
    lines: '#e9d5ff',
    layout: 'sidebar-left'
  },
  citrus: {
    font: 'font-display',
    bg: 'bg-white',
    textMain: 'text-zinc-800',
    primary: '#ea580c',
    accent: '#7c2d12',
    soft: '#fff7ed',
    lines: '#fed7aa',
    layout: 'minimal-left'
  },
  minimal_bw: {
    font: 'font-sans',
    bg: 'bg-white',
    textMain: 'text-black',
    primary: '#000000',
    accent: '#000000',
    soft: '#f4f4f5',
    lines: '#e4e4e7',
    layout: 'minimal-left'
  }
};

const ResumeRenderer = ({ data, templateId }: { data: ResumeData; templateId: TemplateType }) => {
  const theme = TEMPLATES[templateId] || TEMPLATES.modern_blue;
  const tBg = theme.bg;
  const tFont = theme.font;
  const tText = theme.textMain;

  const Contacts = () => (
    <div className={`flex flex-wrap gap-4 text-xs ${templateId === 'dark_exec' ? 'text-slate-400' : 'text-gray-500'}`}>
      {data.personalInfo.email && <div className="flex items-center gap-1 font-medium"><Mail size={12}/> {data.personalInfo.email}</div>}
      {data.personalInfo.phone && <div className="flex items-center gap-1 font-medium"><Phone size={12}/> {data.personalInfo.phone}</div>}
      {data.personalInfo.location && <div className="flex items-center gap-1 font-medium"><MapPin size={12}/> {data.personalInfo.location}</div>}
      {data.personalInfo.website && <div className="flex items-center gap-1 font-medium"><Globe size={12}/> {data.personalInfo.website}</div>}
    </div>
  );

  const SectionTitle = ({ children }: any) => (
    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 pb-2" style={{ color: theme.accent, borderBottom: `1px solid ${theme.lines}` }}>
      {children}
    </h3>
  );

  return (
    <div className={`${tBg} ${tFont} ${tText} min-h-[1120px] shadow-2xl flex flex-col w-full max-w-[800px] mx-auto overflow-hidden`} id="resume-content">
      
      {/* Dynamic Layout Styles */}
      {theme.layout === 'sidebar-left' && (
        <div className="flex-1 flex flex-row">
          {/* Sidebar */}
          <div className="w-1/3 p-10 flex flex-col gap-8 border-r" style={{ backgroundColor: theme.soft, borderColor: theme.lines }}>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter mb-1" style={{ color: theme.accent }}>{data.personalInfo.fullName || "Seu Nome"}</h1>
              <p className="font-bold tracking-widest uppercase text-[10px] mb-6" style={{ color: theme.primary }}>{data.personalInfo.title || "Cargo Desejado"}</p>
              <div className="flex flex-col gap-2 text-xs" style={{ color: theme.accent, opacity: 0.8 }}>
                {data.personalInfo.email && <div className="flex items-center gap-2"><Mail size={12}/> {data.personalInfo.email}</div>}
                {data.personalInfo.phone && <div className="flex items-center gap-2"><Phone size={12}/> {data.personalInfo.phone}</div>}
                {data.personalInfo.location && <div className="flex items-center gap-2"><MapPin size={12}/> {data.personalInfo.location}</div>}
              </div>
            </div>

            <div>
              <SectionTitle>Habilidades</SectionTitle>
              <div className="flex flex-col gap-3">
                {data.skills.map((s) => (
                  <div key={s.id} className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase" style={{ color: theme.accent }}>{s.name}</span>
                    <div className="h-1 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                      <div className="h-full" style={{ backgroundColor: theme.primary, width: s.level === 'Expert' ? '100%' : s.level === 'Advanced' ? '75%' : s.level === 'Intermediate' ? '50%' : '25%' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {data.education.length > 0 && (
              <div>
                <SectionTitle>Formação</SectionTitle>
                <div className="flex flex-col gap-4">
                  {data.education.map((e) => (
                    <div key={e.id}>
                      <p className="text-[9px] font-bold tracking-wider mb-0.5" style={{ color: theme.primary }}>{e.startDate} - {e.endDate}</p>
                      <p className="text-xs font-black leading-tight mb-0.5" style={{ color: theme.accent }}>{e.degree}</p>
                      <p className="text-[10px] opacity-70 font-medium" style={{ color: theme.accent }}>{e.institution}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Main Body */}
          <div className="w-2/3 p-10 flex flex-col gap-8">
            {data.personalInfo.summary && (
              <div>
                <SectionTitle>Perfil Profissional</SectionTitle>
                <p className="text-xs leading-relaxed text-justify font-medium">{data.personalInfo.summary}</p>
              </div>
            )}
            <div>
              <SectionTitle>Experiência Profissional</SectionTitle>
              <div className="flex flex-col gap-8">
                {data.experience.map((ex) => (
                  <div key={ex.id} className="relative pl-5 before:content-[''] before:absolute before:left-0 before:top-1.5 before:w-1.5 before:h-1.5 before:rounded-full" style={{ '--tw-pseudo-before-bg': theme.primary } as any}>
                     <style>{`#resume-content .relative.pl-5::before { background-color: ${theme.primary}; }`}</style>
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="text-sm font-black uppercase tracking-tight" style={{ color: theme.accent }}>{ex.position}</h4>
                      <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: theme.primary }}>{ex.startDate} • {ex.current ? 'Presente' : ex.endDate}</span>
                    </div>
                    <p className="text-xs font-bold mb-2 uppercase tracking-wide opacity-80">{ex.company}</p>
                    <div className="text-xs leading-relaxed whitespace-pre-line text-justify">{ex.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {theme.layout === 'top-header' && (
        <div className="flex-1 flex flex-col">
          <div className="p-12 text-center" style={{ backgroundColor: templateId === 'dark_exec' ? '#0f172a' : theme.soft }}>
            <h1 className="text-4xl font-black uppercase tracking-widest mb-2" style={{ color: theme.accent }}>{data.personalInfo.fullName || "Seu Nome Completo"}</h1>
            <p className="font-bold tracking-[0.3em] uppercase text-xs mb-6" style={{ color: theme.primary }}>{data.personalInfo.title || "Seu Cargo"}</p>
            <div className="flex flex-wrap justify-center gap-6 text-[10px] font-medium tracking-wider uppercase" style={{ color: theme.primary }}>
              {data.personalInfo.email && <div className="flex items-center gap-1.5"><Mail size={12}/> {data.personalInfo.email}</div>}
              {data.personalInfo.phone && <div className="flex items-center gap-1.5"><Phone size={12}/> {data.personalInfo.phone}</div>}
              {data.personalInfo.location && <div className="flex items-center gap-1.5"><MapPin size={12}/> {data.personalInfo.location}</div>}
            </div>
          </div>
          <div className="p-12 flex gap-12">
            <div className="w-2/3 flex flex-col gap-8">
              {data.personalInfo.summary && (
                <div>
                  <SectionTitle>Perfil Profissional</SectionTitle>
                  <p className="text-xs leading-relaxed text-justify font-medium">{data.personalInfo.summary}</p>
                </div>
              )}
              <div>
                <SectionTitle>Experiência</SectionTitle>
                <div className="flex flex-col gap-8">
                  {data.experience.map((ex) => (
                    <div key={ex.id}>
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="text-sm font-black uppercase tracking-tight" style={{ color: theme.accent }}>{ex.position}</h4>
                        <span className="text-[9px] font-black tracking-widest uppercase opacity-70">{ex.startDate} • {ex.current ? 'Presente' : ex.endDate}</span>
                      </div>
                      <p className="text-xs font-bold mb-3 uppercase tracking-wide" style={{ color: theme.primary }}>{ex.company}</p>
                      <div className="text-xs leading-relaxed whitespace-pre-line text-justify">{ex.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="w-1/3 flex flex-col gap-8">
               <div>
                  <SectionTitle>Skills</SectionTitle>
                  <div className="flex flex-wrap gap-2">
                    {data.skills.map(s => (
                      <span key={s.id} className="px-2 py-1 text-[9px] font-bold uppercase border" style={{ borderColor: theme.lines, color: theme.accent }}>{s.name}</span>
                    ))}
                  </div>
               </div>
               {data.education.length > 0 && (
                <div>
                  <SectionTitle>Educação</SectionTitle>
                  <div className="flex flex-col gap-5">
                    {data.education.map((e) => (
                      <div key={e.id}>
                        <p className="text-[9px] font-bold tracking-wider mb-1" style={{ color: theme.primary }}>{e.startDate} - {e.endDate}</p>
                        <p className="text-xs font-black leading-tight mb-0.5" style={{ color: theme.accent }}>{e.degree}</p>
                        <p className="text-[10px] opacity-70 font-medium">{e.institution}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {theme.layout === 'minimal-left' && (
        <div className="flex-1 p-12 flex flex-col border-l-8" style={{ borderColor: theme.primary }}>
          <div className="pb-8 mb-8 border-b" style={{ borderColor: theme.lines }}>
            <h1 className="text-5xl font-black uppercase tracking-tighter mb-2" style={{ color: theme.accent }}>{data.personalInfo.fullName || "Seu Nome Completo"}</h1>
            <p className="font-bold tracking-[0.2em] uppercase text-sm mb-6" style={{ color: theme.primary }}>{data.personalInfo.title || "Seu Cargo"}</p>
            <Contacts />
          </div>
          
          <div className="flex gap-12">
            <div className="w-1/4 flex flex-col gap-8">
               <div>
                  <SectionTitle>Habilidades</SectionTitle>
                  <ul className="flex flex-col gap-2">
                    {data.skills.map(s => (
                      <li key={s.id} className="text-xs font-bold uppercase flex items-center gap-2" style={{ color: theme.accent }}>
                         <span className="w-1 h-1 rounded-full" style={{ backgroundColor: theme.primary }}></span> {s.name}
                      </li>
                    ))}
                  </ul>
               </div>
               {data.education.length > 0 && (
                <div>
                  <SectionTitle>Formação</SectionTitle>
                  <div className="flex flex-col gap-4">
                    {data.education.map((e) => (
                      <div key={e.id}>
                        <p className="text-xs font-black leading-tight mb-0.5" style={{ color: theme.accent }}>{e.degree}</p>
                        <p className="text-[10px] opacity-80 font-medium mb-1">{e.institution}</p>
                        <p className="text-[9px] font-bold tracking-wider" style={{ color: theme.primary }}>{e.startDate} - {e.endDate}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="w-3/4 flex flex-col gap-8">
              {data.personalInfo.summary && (
                <div>
                  <SectionTitle>Resumo</SectionTitle>
                  <p className="text-xs leading-relaxed text-justify font-medium">{data.personalInfo.summary}</p>
                </div>
              )}
              <div>
                <SectionTitle>Experiência</SectionTitle>
                <div className="flex flex-col gap-8">
                  {data.experience.map((ex) => (
                    <div key={ex.id}>
                      <div className="flex items-baseline gap-4 mb-1">
                        <h4 className="text-base font-black uppercase tracking-tight" style={{ color: theme.accent }}>{ex.position}</h4>
                        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: theme.primary }}>{ex.company}</p>
                      </div>
                      <span className="block text-[9px] font-black tracking-widest uppercase opacity-60 mb-3">{ex.startDate} • {ex.current ? 'Presente' : ex.endDate}</span>
                      <div className="text-xs leading-relaxed whitespace-pre-line text-justify">{ex.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};


// --- Main Application ---

export default function App() {
  const [view, setView] = useState<'landing' | 'editor' | 'faq' | 'about' | 'terms'>('landing');
  const [activeStep, setActiveStep] = useState(0);
  const [resumeData, setResumeData] = useState<ResumeData>(INITIAL_RESUME_DATA);
  const [loading, setLoading] = useState(false);
  const [isCoverLetterMode, setIsCoverLetterMode] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState("");
  const [tempSkill, setTempSkill] = useState("");

  const [template, setTemplate] = useState<TemplateType>('modern_blue');

  const editorSteps = [
    { title: 'Perfil', icon: User },
    { title: 'Experiência', icon: Briefcase },
    { title: 'Educação', icon: GraduationCap },
    { title: 'Skills', icon: Settings },
    { title: 'Design', icon: Sparkles },
    { title: 'Finalizar', icon: CheckCircleIcon }
  ];

  function CheckCircleIcon(props: any) {
    return <FileText {...props} />;
  }

  const updatePersonalInfo = (field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  const addExperience = () => {
    const id = Math.random().toString(36).substring(7);
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, { id, company: '', position: '', startDate: '', endDate: '', description: '', current: false }]
    }));
  };

  const removeExperience = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter(ex => ex.id !== id)
    }));
  };

  const addSkill = (name: string) => {
    if (!name.trim()) return;
    const id = Math.random().toString(36).substring(7);
    setResumeData(prev => ({
      ...prev,
      skills: [...prev.skills, { id, name, level: 'Intermediate' }]
    }));
  };

  const addEducation = () => {
    const id = Math.random().toString(36).substring(7);
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, { id, institution: '', degree: '', field: '', startDate: '', endDate: '' }]
    }));
  };

  const handleOptimize = async (type: 'summary' | 'experience' | 'skills', index?: number) => {
    setLoading(true);
    let text = "";
    if (type === 'summary') text = resumeData.personalInfo.summary;
    else if (type === 'experience' && index !== undefined) text = resumeData.experience[index].description;
    
    if (!text) {
      alert("Por favor, digite algum texto antes de otimizar.");
      setLoading(false);
      return;
    }

    const optimized = await optimizeResumeText(text, type);
    
    if (type === 'summary') updatePersonalInfo('summary', optimized);
    else if (type === 'experience' && index !== undefined) {
      const newExp = [...resumeData.experience];
      newExp[index].description = optimized;
      setResumeData(p => ({ ...p, experience: newExp }));
    }
    setLoading(false);
  };

  const handleCreateCoverLetter = async () => {
    setLoading(true);
    const content = await generateCoverLetter(resumeData, resumeData.personalInfo.title || "Vaga de Emprego");
    setGeneratedLetter(content);
    setIsCoverLetterMode(true);
    setLoading(false);
  };

  if (view === 'landing') {
    return (
      <div className="min-h-screen hero-gradient flex flex-col">
        <nav className="h-20 px-6 md:px-12 flex items-center justify-between glass sticky top-0 z-50">
          <div className="text-xl md:text-2xl font-black text-primary-blue tracking-tighter flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-blue rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-blue/30 rotate-3">
              <Sparkles size={20} />
            </div>
            CV LAB
          </div>
          <div className="hidden md:flex items-center gap-8 text-[10px] font-black tracking-widest text-text-muted uppercase">
            <button onClick={() => setView('about')} className="hover:text-primary-blue transition-colors">Sobre Nós</button>
            <button onClick={() => setView('faq')} className="hover:text-primary-blue transition-colors">FAQ</button>
            <button onClick={() => setView('terms')} className="hover:text-primary-blue transition-colors">Termos</button>
          </div>
          <Button variant="outline" onClick={() => setView('editor')} className="text-xs uppercase tracking-widest">Criar CV</Button>
        </nav>

        <main className="flex-1 flex flex-col md:flex-row items-center px-6 md:px-12 py-12 md:py-20 gap-16 max-w-7xl mx-auto w-full">
          <div className="flex-1 flex flex-col gap-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-soft-blue text-primary-blue text-[10px] font-black rounded-full w-fit tracking-widest border border-primary-blue/10 animate-pulse">
              <CreditCard size={14} />
              RESUME + COVER: 1150 KZS
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-deep-blue leading-[0.85] tracking-tighter">
              Crie um CV que <span className="text-primary-blue italic">abre portas.</span>
            </h1>
            <p className="text-xl text-text-muted leading-relaxed font-medium">
              A plataforma mais inteligente para profissionais que não aceitam o genérico.
              Gere currículos e cartas de apresentação com design premium e IA integrada.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button onClick={() => setView('editor')} className="px-10 h-16 text-lg uppercase tracking-tight">Começar Gratuitamente</Button>
              <div className="flex items-center gap-4 text-xs font-bold text-text-muted border-l-2 border-border-main pl-6">
                 <div>
                   <p className="text-deep-blue font-black tracking-tighter text-lg leading-tight">5 Minutos</p>
                   <p className="uppercase tracking-widest text-[9px]">Para concluir tudo</p>
                 </div>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full flex justify-center">
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-full max-w-md group"
            >
              <div className="absolute -inset-4 bg-primary-blue/20 rounded-3xl blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="bg-white rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-8 border border-border-main relative overflow-hidden">
                <div className="flex items-center gap-4 mb-8 border-b-2 border-soft-blue pb-6">
                  <div className="w-14 h-14 bg-soft-blue rounded-2xl flex items-center justify-center text-primary-blue">
                     <User size={24} />
                  </div>
                  <div>
                    <div className="h-4 w-32 bg-deep-blue/10 rounded-full mb-2"></div>
                    <div className="h-2 w-20 bg-primary-blue/30 rounded-full"></div>
                  </div>
                </div>
                <div className="space-y-4">
                  {[80, 95, 70, 100].map((w, i) => (
                    <div key={i} className="h-1.5 bg-soft-blue rounded-full" style={{ width: `${w}%` }}></div>
                  ))}
                  <div className="h-24 w-full bg-soft-blue/40 rounded-2xl border border-dashed border-primary-blue/20 mt-6"></div>
                </div>
                <div className="absolute top-4 right-4 animate-bounce">
                  <div className="bg-primary-blue text-white p-2 rounded-lg shadow-lg">
                    <Sparkles size={16} />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </main>

        <section className="bg-white py-20 px-6 border-t border-border-main">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
            {[
              { title: "Texto Otimizado", desc: "Nossa IA transforma rascunhos em conquistas profissionais marcantes.", icon: Sparkles },
              { title: "Design Mobile-Ready", desc: "Edite seu currículo em qualquer dispositivo com interface fluida e moderna.", icon: Globe },
              { title: "Toque Pessoal", desc: "Nada de modelos genéricos. Designs exclusivos que refletem sua identidade.", icon: FileText }
            ].map((item, i) => (
              <div key={i} className="flex flex-col gap-4">
                <div className="w-12 h-12 bg-primary-blue text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary-blue/20">
                  <item.icon size={24} />
                </div>
                <h4 className="text-xl font-black text-deep-blue tracking-tight">{item.title}</h4>
                <p className="text-sm text-text-muted leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="bg-bg-main py-12 border-t border-border-main text-center flex flex-col items-center gap-6">
           <div className="flex flex-wrap justify-center items-center gap-6 text-xs font-bold text-text-muted uppercase tracking-widest">
              <button onClick={() => setView('about')} className="hover:text-primary-blue transition-colors">Sobre Nós</button>
              <button onClick={() => setView('faq')} className="hover:text-primary-blue transition-colors">FAQ</button>
              <button onClick={() => setView('terms')} className="hover:text-primary-blue transition-colors">Termos e Condições</button>
           </div>
           <p className="text-[10px] text-text-muted opacity-60">© 2026 CV LAB. Todos os direitos reservados.</p>
        </footer>
      </div>
    );
  }

  if (view === 'faq' || view === 'about' || view === 'terms') {
    return (
      <div className="min-h-screen hero-gradient flex flex-col">
        <nav className="h-20 px-6 md:px-12 flex items-center justify-between glass sticky top-0 z-50">
          <button onClick={() => setView('landing')} className="text-xl md:text-2xl font-black text-primary-blue tracking-tighter flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-blue rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-blue/30 rotate-3">
              <Sparkles size={20} />
            </div>
            CV LAB
          </button>
          <div className="hidden md:flex items-center gap-8 text-[10px] font-black tracking-widest text-text-muted uppercase">
            <button onClick={() => setView('about')} className="hover:text-primary-blue transition-colors focus:outline-none">Sobre Nós</button>
            <button onClick={() => setView('faq')} className="hover:text-primary-blue transition-colors focus:outline-none">FAQ</button>
            <button onClick={() => setView('terms')} className="hover:text-primary-blue transition-colors focus:outline-none">Termos</button>
          </div>
          <Button variant="outline" onClick={() => setView('editor')} className="text-xs uppercase tracking-widest">Criar CV</Button>
        </nav>
        
        <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-16">
          <button onClick={() => setView('landing')} className="text-primary-blue text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
            <ChevronLeft size={16} /> Voltar
          </button>

          {view === 'faq' && (
            <div className="space-y-8 bg-white p-10 rounded-3xl shadow-2xl border border-border-main">
              <h1 className="text-4xl font-black text-deep-blue tracking-tight">Perguntas Frequentes (FAQ)</h1>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-primary-blue">Como a IA melhora meu currículo?</h3>
                  <p className="text-sm text-text-main mt-2 leading-relaxed">Nossa integração com o Gemini da Google analisa seu texto base e o reescreve com linguagem executiva, focada em resultados e jargões corretos da sua área, tornando seu perfil mais atrativo aos recrutadores.</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary-blue">O download do PDF é gratuito?</h3>
                  <p className="text-sm text-text-main mt-2 leading-relaxed">Sim! Você pode usar a ferramenta, editar e gerar seu PDF de currículo gratuitamente usando o recurso de impressão nativo.</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary-blue">Como funciona a Carta de Apresentação Premium?</h3>
                  <p className="text-sm text-text-main mt-2 leading-relaxed">Ao custo de 1150 Kzs, o sistema fará uma análise profunda dos seus dados e criará uma carta de apresentação altamente customizada, no formato ideal para agradar recrutadores exigentes.</p>
                </div>
              </div>
            </div>
          )}

          {view === 'about' && (
            <div className="space-y-8 bg-white p-10 rounded-3xl shadow-2xl border border-border-main">
              <h1 className="text-4xl font-black text-deep-blue tracking-tight">Sobre Nós</h1>
              <div className="space-y-4 text-sm text-text-main leading-relaxed">
                <p>Nascemos para resolver um problema claro: criar um currículo moderno e otimizado leva tempo, e o mercado é impaciente.</p>
                <p>A <strong>CV LAB</strong> surge como uma plataforma de ponta para profissionais de sucesso (ou a caminho de o serem). Nós unimos design focado em UX com as melhores engines de Inteligência Artificial generativa do mercado.</p>
                <p>Nossa missão é democratizar o acesso a materiais de candidatura padrão executivo. Chega de currículos no Word. Chega de sofrer para escrever descrições.</p>
              </div>
            </div>
          )}

          {view === 'terms' && (
            <div className="space-y-8 bg-white p-10 rounded-3xl shadow-2xl border border-border-main">
             <h1 className="text-4xl font-black text-deep-blue tracking-tight">Termos e Condições</h1>
             <div className="space-y-4 text-sm text-text-main leading-relaxed">
                <h3 className="font-bold text-primary-blue">1. Aceitação</h3>
                <p>Ao utilizar o aplicativo CV Lab, o usuário concorda plenamente com os termos estabelecidos nesta página.</p>
                
                <h3 className="font-bold text-primary-blue">2. Uso da Inteligência Artificial</h3>
                <p>O serviço utiliza APIs externas (Google Gemini) para gerar textos otimizados. Não garantimos contratações, mas sim a formatação e estruturação correta do texto.</p>

                <h3 className="font-bold text-primary-blue">3. Pagamentos e Reembolsos</h3>
                <p>O pacote premium (Gerador de Carta de Apresentação) é entregue imediatamente de forma digital, invalidando o recurso de reembolso sob regras locais pertinentes a bens consumíveis de software.</p>

                <h3 className="font-bold text-primary-blue">4. Privacidade e Proteção de Dados</h3>
                <p>Nós processamos seus dados (nome, experiências, info. de contato) apenas em tempo de execução para formato de currículo. Recomendamos não incluir informações sensíveis de documentação pessoal grave (Identidade/Passaporte).</p>
             </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main flex flex-col md:flex-row md:h-screen md:overflow-hidden print:bg-white print:h-auto print:overflow-visible">
      
      {/* Sidebar Editor */}
      <aside className="w-full md:w-[420px] bg-white border-r border-border-main flex flex-col shadow-2xl z-30 print:hidden shrink-0">
        <header className="p-6 border-b border-border-main flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('landing')} className="p-2 hover:bg-bg-main rounded-xl transition-colors text-text-muted">
               <ChevronLeft size={20} />
            </button>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-blue">CV Lab Editor</span>
          </div>
          <div className="px-3 py-1 bg-soft-blue text-primary-blue text-[9px] font-black rounded-full">STEP {activeStep + 1}/6</div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 10, opacity: 0 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-deep-blue tracking-tight">{editorSteps[activeStep].title}</h2>
                <div className="h-1 w-12 bg-primary-blue rounded-full"></div>
              </div>

              {activeStep === 0 && ( /* Personal info */
                <div className="space-y-6">
                  <Input label="Nome Completo" value={resumeData.personalInfo.fullName} onChange={(v: string) => updatePersonalInfo('fullName', v)} placeholder="Ex: Ricardo Fernandes" icon={User} />
                  <Input label="Cargo Pretendido" value={resumeData.personalInfo.title} onChange={(v: string) => updatePersonalInfo('title', v)} placeholder="Ex: Diretor de Arte" icon={Briefcase} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Email" value={resumeData.personalInfo.email} onChange={(v: string) => updatePersonalInfo('email', v)} placeholder="email@exemplo.com" icon={Mail} />
                    <Input label="WhatsApp" value={resumeData.personalInfo.phone} onChange={(v: string) => updatePersonalInfo('phone', v)} placeholder="+244 9..." icon={Phone} />
                  </div>
                  <Input label="Localização" value={resumeData.personalInfo.location} onChange={(v: string) => updatePersonalInfo('location', v)} placeholder="Luanda, Angola" icon={MapPin} />
                  <TextArea label="Resumo do Perfil" value={resumeData.personalInfo.summary} onChange={(v: string) => updatePersonalInfo('summary', v)} onOptimize={() => handleOptimize('summary')} placeholder="Conte sua história profissional..." />
                </div>
              )}

              {activeStep === 1 && ( /* Experience */
                <div className="space-y-6">
                  {resumeData.experience.map((ex, i) => (
                    <div key={ex.id} className="p-5 bg-bg-main rounded-2xl border border-border-main space-y-5 relative group">
                      <button onClick={() => removeExperience(ex.id)} className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Trash2 size={16} />
                      </button>
                      <Input label="Empresa" value={ex.company} onChange={(v: string) => {
                         const n = [...resumeData.experience]; n[i].company = v; setResumeData(p => ({...p, experience: n}));
                      }} />
                      <Input label="Cargo" value={ex.position} onChange={(v: string) => {
                         const n = [...resumeData.experience]; n[i].position = v; setResumeData(p => ({...p, experience: n}));
                      }} />
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Início" value={ex.startDate} onChange={(v: string) => {
                           const n = [...resumeData.experience]; n[i].startDate = v; setResumeData(p => ({...p, experience: n}));
                        }} placeholder="Ex: 2022" />
                        <Input label="Fim" value={ex.endDate} onChange={(v: string) => {
                           const n = [...resumeData.experience]; n[i].endDate = v; setResumeData(p => ({...p, experience: n}));
                        }} placeholder="Ex: Presente" disabled={ex.current} />
                      </div>
                      <TextArea label="Atribuições" value={ex.description} onChange={(v: string) => {
                         const n = [...resumeData.experience]; n[i].description = v; setResumeData(p => ({...p, experience: n}));
                      }} onOptimize={() => handleOptimize('experience', i)} />
                    </div>
                  ))}
                  <Button variant="secondary" onClick={addExperience} className="w-full h-14" icon={Plus}>Adicionar Cargo</Button>
                </div>
              )}

              {activeStep === 2 && ( /* Education */
                <div className="space-y-6">
                  {resumeData.education.map((ed, i) => (
                    <div key={ed.id} className="p-5 bg-bg-main rounded-2xl border border-border-main space-y-5">
                       <Input label="Instituição" value={ed.institution} onChange={(v: string) => {
                         const n = [...resumeData.education]; n[i].institution = v; setResumeData(p => ({...p, education: n}));
                       }} />
                       <Input label="Curso/Grau" value={ed.degree} onChange={(v: string) => {
                         const n = [...resumeData.education]; n[i].degree = v; setResumeData(p => ({...p, education: n}));
                       }} />
                       <div className="grid grid-cols-2 gap-4">
                          <Input label="Início" value={ed.startDate} onChange={(v: string) => {
                            const n = [...resumeData.education]; n[i].startDate = v; setResumeData(p => ({...p, education: n}));
                          }} />
                          <Input label="Fim" value={ed.endDate} onChange={(v: string) => {
                            const n = [...resumeData.education]; n[i].endDate = v; setResumeData(p => ({...p, education: n}));
                          }} />
                       </div>
                    </div>
                  ))}
                  <Button variant="secondary" onClick={addEducation} className="w-full h-14" icon={Plus}>Adicionar Formação</Button>
                </div>
              )}

              {activeStep === 3 && ( /* Skills */
                <div className="space-y-6">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Adicionar Habilidade (ex: Marketing Digital)" 
                      value={tempSkill}
                      onChange={setTempSkill}
                    />
                    <Button onClick={() => {
                      addSkill(tempSkill);
                      setTempSkill("");
                    }}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {resumeData.skills.map(s => (
                      <span key={s.id} className="px-3 py-1.5 bg-soft-blue text-primary-blue rounded-lg font-bold text-xs flex items-center gap-2">
                        {s.name}
                        <button onClick={() => setResumeData(p => ({...p, skills: p.skills.filter(sk => sk.id !== s.id)}))}><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activeStep === 4 && ( /* Design / Templates */
                <div className="space-y-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-text-muted mb-4">Escolha um Modelo Moderno</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(TEMPLATES).map(([id, t]) => (
                      <button
                        key={id}
                        onClick={() => setTemplate(id as TemplateType)}
                        className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${template === id ? 'border-primary-blue bg-soft-blue shadow-lg' : 'border-border-main hover:border-primary-blue/30'}`}
                      >
                         <div className="w-full h-16 rounded-lg mb-3 shadow-inner" style={{ backgroundColor: t.bg, borderTop: `8px solid ${t.primary}` }}>
                         </div>
                         <span className="text-[10px] font-bold uppercase" style={{ color: t.accent }}>{id.replace('_', ' ')}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeStep === 5 && ( /* Finish */
                <div className="space-y-8">
                   <div className="p-8 bg-primary-blue text-white rounded-3xl space-y-6 relative overflow-hidden shadow-2xl">
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                      <h3 className="text-2xl font-black leading-tight">Currículo Pronto!</h3>
                      <p className="text-sm opacity-80 font-medium">Você agora pode baixar seu arquivo PDF profissional ou elevar seu nível com uma carta de apresentação.</p>
                      <Button className="w-full bg-white text-primary-blue hover:bg-white/95" onClick={() => window.print()} icon={Download}>Baixar PDF</Button>
                   </div>

                   <div className="p-8 bg-white border-2 border-dashed border-primary-blue/30 rounded-3xl text-center space-y-4">
                      <div className="w-16 h-16 bg-soft-blue text-primary-blue rounded-2xl flex items-center justify-center mx-auto mb-2">
                         <Sparkles size={32} />
                      </div>
                      <h4 className="text-lg font-black text-deep-blue">Carta de Apresentação</h4>
                      <p className="text-xs text-text-muted font-medium">Gere uma carta personalizada para a vaga dos seus sonhos por apenas 1150 Kzs no total.</p>
                      <Button variant="outline" className="w-full" onClick={handleCreateCoverLetter}>Gerar com Gemini IA</Button>
                   </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="p-6 border-t border-border-main bg-white flex justify-between gap-4">
           <Button variant="ghost" disabled={activeStep === 0} onClick={() => setActiveStep(s => s - 1)}>Anterior</Button>
           <Button disabled={activeStep === 5} onClick={() => setActiveStep(s => s + 1)} className="px-10">
             {activeStep === 5 ? 'Concluído' : 'Próximo'}
           </Button>
        </footer>
      </aside>

      {/* Preview Section */}
      <main className="flex-1 bg-bg-main overflow-y-auto w-full p-4 md:p-16 relative custom-scrollbar print:p-0 print:m-0 print:overflow-visible flex flex-col items-center">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center gap-6">
             <div className="w-16 h-16 border-4 border-primary-blue border-t-transparent rounded-full animate-spin shadow-2xl"></div>
             <p className="font-black text-primary-blue text-[10px] tracking-[0.3em] uppercase animate-pulse">Inteligência CV LAB Ativada</p>
          </div>
        )}

        <div className="max-w-[800px] mx-auto origin-top transition-all duration-700 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] print:shadow-none mb-20 md:mb-0">
           <AnimatePresence mode="wait">
             {isCoverLetterMode ? (
               <motion.div 
                 key="letter"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="bg-white min-h-[1120px] p-20 shadow-2xl relative"
               >
                 <button onClick={() => setIsCoverLetterMode(false)} className="absolute top-8 left-8 text-[10px] font-black uppercase text-primary-blue tracking-widest flex items-center gap-2 print:hidden">
                    <ChevronLeft size={14} /> Voltar ao Currículo
                 </button>
                 <div className="max-w-prose mx-auto text-justify whitespace-pre-line text-lg leading-relaxed pt-12 text-text-main">
                    {generatedLetter}
                 </div>
               </motion.div>
             ) : (
               <ResumeRenderer data={resumeData} templateId={template} />
             )}
           </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
