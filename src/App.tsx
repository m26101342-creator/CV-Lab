/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Download, 
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
  ExternalLink,
  CheckCircle,
  MessageCircle,
  Facebook
} from 'lucide-react';
import { AdSenseUnit } from './components/AdSenseUnit';
import { ResumeData, INITIAL_RESUME_DATA, TemplateType } from './types.ts';
import { optimizeResumeText, generateCoverLetter, generateFullResume } from './services/geminiService.ts';
import html2pdf from 'html2pdf.js';

// --- UI Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, icon: Icon }: any) => {
  const base = "px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: any = {
    primary: "bg-primary-blue text-white shadow-lg shadow-primary-blue/20 hover:bg-primary-blue/90 h-12",
    secondary: "bg-soft-blue text-primary-blue hover:bg-soft-blue/80 h-12",
    outline: "border-2 border-primary-blue text-primary-blue hover:bg-soft-blue h-12",
    ghost: "text-text-muted hover:text-text-main hover:bg-bg-main h-12",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 h-12",
    none: ""
  };

  return (
    <button onClick={onClick} className={`${base} ${variants[variant] || ''} ${className}`} disabled={disabled}>
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

const TextArea = ({ label, value, onChange, placeholder, onOptimize, isOptimizing }: any) => (
  <div className="flex flex-col gap-1.5 w-full relative">
    <div className="flex justify-between items-center px-1">
      {label && <label className="text-[10px] font-black text-text-muted uppercase tracking-wider">{label}</label>}
      {onOptimize && (
        <button 
          onClick={onOptimize}
          disabled={isOptimizing}
          className={`text-[10px] font-black text-primary-blue flex items-center gap-1 transition-all bg-soft-blue px-2 py-0.5 rounded border border-primary-blue/20 ${isOptimizing ? 'opacity-80 scale-95 cursor-wait' : 'hover:opacity-80'}`}
        >
          {isOptimizing ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
              <Plus size={10} />
            </motion.div>
          ) : (
            <Plus size={10} />
          )}
          {isOptimizing ? 'OTIMIZANDO...' : 'OTIMIZAR COM IA'}
        </button>
      )}
    </div>
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={isOptimizing}
        rows={4}
        className={`w-full bg-white border border-border-main rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue transition-all resize-none ${isOptimizing ? 'opacity-60' : ''}`}
      />
      {isOptimizing && (
        <div className="absolute inset-0 bg-white/40 flex items-center justify-center rounded-xl backdrop-blur-[1px] animate-pulse">
          <div className="w-1/2 h-1 bg-primary-blue/20 rounded-full overflow-hidden">
             <motion.div className="h-full bg-primary-blue" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ repeat: Infinity, duration: 1.5 }} />
          </div>
        </div>
      )}
    </div>
  </div>
);

// --- Resumes & Templates Configuration ---

const TEMPLATES: Record<TemplateType, { name: string; layout: string; colors: any }> = {
  t1_executive: { name: 'Executivo Classic', layout: 'custom-t1', colors: { primary: '#1B2A4A', text: '#4B5563', heading: '#1B2A4A', soft: '#1B2A4A', lines: '#E5E7EB' } },
  t2_geometric: { name: 'Geométrico Mod', layout: 'custom-t2', colors: { primary: '#1B2A4A', text: '#4B5563', heading: '#1B2A4A', soft: '#F9FAFB', lines: '#F3F4F6' } },
  t3_modern: { name: 'Moderno Vibrante', layout: 'custom-t3', colors: { primary: '#0369A1', text: '#4B5563', heading: '#0369A1', soft: '#F0F9FF', lines: '#BAE6FD', dark: '#075985' } },
  t4_barnabas: { name: 'Sidebar Limpa', layout: 'custom-t4', colors: { primary: '#2D313A', text: '#3E4249', heading: '#333333', soft: '#2D313A', lines: '#E5E7EB' } },
  t5_jonathan: { name: 'Escritor Arches', layout: 'custom-t5', colors: { primary: '#4A4C53', text: '#555555', heading: '#222222', soft: '#F3F4F6', lines: '#D1D5DB' } }
};

// --- Helper to clean up Markdown / AI formatting ---
const renderText = (str: string) => str ? str.replace(/\*/g, '') : '';

const ResumeRenderer = ({ data, templateId }: { data: ResumeData; templateId: TemplateType }) => {
  const theme = TEMPLATES[templateId] || TEMPLATES.t1_executive;
  const c = { ...theme.colors, primary: data.themeColor || theme.colors.primary };

  return (
    <div className={`bg-white min-h-[1123px] w-[794px] relative overflow-visible print:shadow-none`} id="resume-content" style={{ color: '#1f2937' }}>
      
      {/* Dynamic Layout Styles */}
      {theme.layout === 'custom-t1' && (
        <div className="t1" style={{ '--primary': c.primary } as any}>
          <div className="t1-left">
            <div className="t1-avatar-wrap">
              <div 
                className="t1-avatar flex items-center justify-center overflow-hidden" 
                style={{ 
                  borderRadius: data.personalInfo.photoStyle === 'square' ? '12px' : '50%',
                  width: `${data.personalInfo.photoSize || 100}px`,
                  height: `${data.personalInfo.photoSize || 100}px`,
                  fontSize: `${(data.personalInfo.photoSize || 100) * 0.4}px`
                }}
              >
                {data.personalInfo.photo ? <img src={data.personalInfo.photo} referrerPolicy="no-referrer" alt="Profile" className="w-full h-full object-cover object-top" /> : (data.personalInfo.fullName ? data.personalInfo.fullName.charAt(0).toUpperCase() : 'CV')}
              </div>
            </div>
            <div className="pt-4">
              <div className="t1-section-title">Contacto</div>
              {data.personalInfo.email && <div className="t1-contact-item"><span className="t1-contact-icon flex items-center justify-center"><Mail size={12}/></span><span className="t1-contact-text">{data.personalInfo.email}</span></div>}
              {data.personalInfo.phone && <div className="t1-contact-item"><span className="t1-contact-icon flex items-center justify-center"><Phone size={12}/></span><span className="t1-contact-text">{data.personalInfo.phone}</span></div>}
              {data.personalInfo.location && <div className="t1-contact-item"><span className="t1-contact-icon flex items-center justify-center"><MapPin size={12}/></span><span className="t1-contact-text">{data.personalInfo.location}</span></div>}
            </div>
            
            {data.education.length > 0 && (
              <div>
                <div className="t1-section-title">Formação</div>
                {data.education.map(e => (
                  <div key={e.id} className="t1-edu-item">
                    <div className="t1-edu-degree">{e.degree}</div>
                    <div className="t1-edu-school">{e.institution}</div>
                    <div className="t1-edu-year">{e.startDate} - {e.endDate}</div>
                  </div>
                ))}
              </div>
            )}
            
            {data.skills.length > 0 && (
              <div>
                <div className="t1-section-title">Habilidades</div>
                <div className="flex flex-wrap">
                  {data.skills.map(s => (
                     <span key={s.id} className="t1-skill-tag">{s.name}</span>
                  ))}
                </div>
              </div>
            )}

            {data.languages && data.languages.length > 0 && (
              <div>
                <div className="t1-section-title" style={{ marginTop: '24px' }}>Idiomas</div>
                <div className="flex flex-col gap-2">
                  {data.languages.map(l => (
                     <div key={l.id} className="flex justify-between items-center text-[12px]">
                       <span className="font-bold text-gray-700">{l.name}</span>
                       <span className="text-gray-500 italic">{l.level}</span>
                     </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="t1-right">
             <div className="t1-name mb-1">{data.personalInfo.fullName || "Seu Nome"}</div>
             <div className="t1-title mb-4">{data.personalInfo.title || "Cargo Desejado"}</div>
             <div className="t1-divider"></div>
             {data.personalInfo.summary && <div className="t1-bio leading-relaxed">{renderText(data.personalInfo.summary)}</div>}

             {data.experience.length > 0 && (
                <div className="t1-right-section">
                  <div className="t1-right-title">Experiência Profissional</div>
                  {data.experience.map(ex => (
                    <div key={ex.id} className="t1-exp-item">
                      <div className="t1-exp-dot" style={{ marginTop: '6px' }}></div>
                      <div className="t1-exp-body">
                         <div className="t1-exp-role font-bold">{ex.position} | <span style={{color: '#4b5563', fontSize: '13px', fontWeight: '500'}}>{ex.company}</span></div>
                         <div className="t1-exp-period text-gray-400 mt-0.5">{ex.startDate} - {ex.current ? "Presente" : ex.endDate}</div>
                         <div className="t1-exp-desc mt-3 leading-relaxed">{renderText(ex.description)}</div>
                      </div>
                    </div>
                  ))}
                </div>
             )}
          </div>
        </div>
      )}

      {theme.layout === 'custom-t2' && (
        <div className="t2" style={{ '--primary': c.primary, '--soft': c.soft } as any}>
          <div className="t2-header">
             <div 
               className="t2-avatar flex items-center justify-center overflow-hidden"
               style={{ 
                 borderRadius: data.personalInfo.photoStyle === 'square' ? '16px' : '50%',
                 width: `${data.personalInfo.photoSize || 110}px`,
                 height: `${data.personalInfo.photoSize || 110}px`,
                 fontSize: `${(data.personalInfo.photoSize || 110) * 0.4}px`
               }}
             >
               {data.personalInfo.photo ? <img src={data.personalInfo.photo} referrerPolicy="no-referrer" alt="Profile" className="w-full h-full object-cover object-top" /> : (data.personalInfo.fullName ? data.personalInfo.fullName.charAt(0).toUpperCase() : 'CV')}
             </div>
             <div className="t2-header-text">
                <div className="t2-name">{data.personalInfo.fullName || "Seu Nome"}</div>
                <div className="t2-title">{data.personalInfo.title || "Cargo Desejado"}</div>
                <div className="t2-divider"></div>
                {data.personalInfo.summary && <div className="t2-bio">{renderText(data.personalInfo.summary)}</div>}
             </div>
          </div>
          
          <div className="t2-body">
             <div className="t2-left">
                <div className="t2-section">
                   <div className="t2-section-title">Contacto</div>
                   {data.personalInfo.email && <div className="t2-contact-row"><span className="t2-contact-icon flex items-center"><Mail size={14}/></span> <span className="t2-contact-text">{data.personalInfo.email}</span></div>}
                   {data.personalInfo.phone && <div className="t2-contact-row"><span className="t2-contact-icon flex items-center"><Phone size={14}/></span> <span className="t2-contact-text">{data.personalInfo.phone}</span></div>}
                   {data.personalInfo.location && <div className="t2-contact-row"><span className="t2-contact-icon flex items-center"><MapPin size={14}/></span> <span className="t2-contact-text">{data.personalInfo.location}</span></div>}
                </div>
                
                {data.education.length > 0 && (
                  <div className="t2-section">
                     <div className="t2-section-title">Formação</div>
                     {data.education.map(e => (
                       <div key={e.id} className="t2-edu-item">
                         <div className="t2-edu-degree">{e.degree}</div>
                         <div className="t2-edu-school">{e.institution}</div>
                         <div className="t2-edu-year">{e.startDate} - {e.endDate}</div>
                       </div>
                     ))}
                  </div>
                )}
                
                {data.skills.length > 0 && (
                  <div className="t2-section">
                     <div className="t2-section-title">Habilidades</div>
                     {data.skills.map(s => (
                       <div key={s.id} className="t2-skill-item">
                          <div className="t2-skill-label">{s.name}</div>
                       </div>
                     ))}
                  </div>
                )}
                
                {data.languages && data.languages.length > 0 && (
                  <div className="t2-section">
                     <div className="t2-section-title">Idiomas</div>
                     {data.languages.map(l => (
                       <div key={l.id} className="flex justify-between items-center mb-2 text-[12px]">
                          <div className="font-semibold text-gray-800">{l.name}</div>
                          <div className="font-medium text-gray-400">{l.level}</div>
                       </div>
                     ))}
                  </div>
                )}
             </div>
             
             <div className="t2-right">
                {data.experience.length > 0 && (
                  <div className="t2-section">
                     <div className="t2-section-title">Experiência Profissional</div>
                     {data.experience.map(ex => (
                        <div key={ex.id} className="t2-exp-item">
                           <div className="t2-exp-header">
                              <div className="t2-exp-company">{ex.company}</div>
                              <div className="t2-exp-period">{ex.startDate} - {ex.current ? "Presente" : ex.endDate}</div>
                           </div>
                           <div className="t2-exp-role">{ex.position}</div>
                           <div className="t2-exp-desc">{renderText(ex.description)}</div>
                        </div>
                     ))}
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {theme.layout === 'custom-t3' && (
        <div className="t3" style={{ '--primary': c.primary, '--primary-dark': c.dark, '--primary-light': c.lines, '--primary-soft': c.soft } as any}>
           <div className="t3-header">
              <div className="t3-header-left">
                 <div 
                   className="t3-avatar shadow-lg border-4 border-white flex items-center justify-center overflow-hidden"
                   style={{ 
                     borderRadius: data.personalInfo.photoStyle === 'square' ? '12px' : '50%',
                     width: `${data.personalInfo.photoSize || 100}px`,
                     height: `${data.personalInfo.photoSize || 100}px`,
                     fontSize: `${(data.personalInfo.photoSize || 100) * 0.4}px`
                   }}
                 >
                   {data.personalInfo.photo ? <img src={data.personalInfo.photo} referrerPolicy="no-referrer" alt="Profile" className="w-full h-full object-cover object-top" /> : (data.personalInfo.fullName ? data.personalInfo.fullName.charAt(0).toUpperCase() : 'CV')}
                 </div>
              </div>
              <div className="t3-header-right">
                 <div className="t3-name leading-tight text-center sm:text-left">{data.personalInfo.fullName || "Seu Nome"}</div>
                 <div className="t3-title text-center sm:text-left">{data.personalInfo.title || "Cargo Desejado"}</div>
                 <div className="t3-divider mx-auto sm:mx-0"></div>
                 {data.personalInfo.summary && <div className="t3-bio leading-relaxed">{renderText(data.personalInfo.summary)}</div>}
              </div>
           </div>
           
           <div className="t3-body">
              <div className="t3-left">
                 <div className="t3-section">
                    <div className="t3-section-title text-center">Contacto</div>
                    {data.personalInfo.email && <div className="t3-contact-row"><span className="t3-contact-icon flex items-center"><Mail size={12}/></span> <span className="t3-contact-text">{data.personalInfo.email}</span></div>}
                    {data.personalInfo.phone && <div className="t3-contact-row"><span className="t3-contact-icon flex items-center"><Phone size={12}/></span> <span className="t3-contact-text">{data.personalInfo.phone}</span></div>}
                    {data.personalInfo.location && <div className="t3-contact-row"><span className="t3-contact-icon flex items-center"><MapPin size={12}/></span> <span className="t3-contact-text">{data.personalInfo.location}</span></div>}
                 </div>
                 
                 {data.education.length > 0 && (
                   <div className="t3-section">
                     <div className="t3-section-title text-center">Formação</div>
                     {data.education.map(e => (
                       <div key={e.id} className="t3-edu-item">
                          <div className="t3-edu-school font-bold">{e.institution}</div>
                          <div className="t3-edu-degree">{e.degree}</div>
                          <div className="t3-edu-year text-gray-500 opacity-70">{e.startDate} - {e.endDate}</div>
                       </div>
                     ))}
                   </div>
                 )}
              </div>
              
              <div className="t3-right">
                 {data.experience.length > 0 && (
                   <div className="t3-section">
                      <div className="t3-section-title text-center">Experiência Profissional</div>
                      {data.experience.map(ex => (
                         <div key={ex.id} className="t3-exp-item pb-4 border-b border-gray-100 last:border-0 mb-4">
                            <div className="t3-exp-header mb-1">
                               <div className="t3-exp-company font-black uppercase tracking-wider">{ex.company}</div>
                               <div className="t3-exp-period bg-primary-soft text-primary px-2 py-0.5 rounded text-[10px] font-bold">{ex.startDate} - {ex.current ? "Presente" : ex.endDate}</div>
                            </div>
                            <div className="t3-exp-role font-bold text-gray-700 italic">{ex.position}</div>
                            <div className="t3-exp-desc mt-2 leading-relaxed">{renderText(ex.description)}</div>
                         </div>
                      ))}
                   </div>
                 )}
                 
                 {data.skills.length > 0 && (
                   <div className="t3-section" style={{marginTop: '20px'}}>
                      <div className="t3-section-title text-center">Habilidades</div>
                      <div className="grid grid-cols-1 gap-2">
                        {data.skills.map(s => (
                           <div key={s.id} className="t3-skill-item">
                              <div className="t3-skill-label font-medium">{s.name}</div>
                              <div className="t3-skill-bar-bg h-1.5 rounded-full">
                                 <div className="t3-skill-bar-fill h-full rounded-full" style={{ width: s.level === 'Especialista' ? '100%' : s.level === 'Avançado' ? '75%' : s.level === 'Intermédio' ? '50%' : '25%' }}></div>
                              </div>
                           </div>
                        ))}
                      </div>
                   </div>
                 )}

                 {data.languages && data.languages.length > 0 && (
                   <div className="t3-section" style={{marginTop: '20px'}}>
                      <div className="t3-section-title text-center">Idiomas</div>
                      <div className="grid grid-cols-1 gap-2">
                        {data.languages.map(l => (
                           <div key={l.id} className="t3-skill-item">
                              <div className="flex justify-between items-center w-full mb-1">
                                <div className="t3-skill-label font-medium">{l.name}</div>
                                <div className="text-[10px] uppercase font-bold text-gray-500">{l.level}</div>
                              </div>
                              <div className="t3-skill-bar-bg h-1.5 rounded-full">
                                 <div className="t3-skill-bar-fill h-full rounded-full" style={{ width: l.level === 'Nativo' ? '100%' : l.level === 'Fluente' ? '85%' : l.level === 'Avançado' ? '70%' : l.level === 'Intermédio' ? '50%' : '25%' }}></div>
                              </div>
                           </div>
                        ))}
                      </div>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {theme.layout === 'custom-t4' && (
        <div className="flex w-full min-h-[1123px] bg-white text-left font-sans overflow-visible relative border border-gray-100">
          <div className="w-[32%] flex flex-col relative z-10" style={{ backgroundColor: c.primary, color: 'white' }}>
             {data.personalInfo.photo ? (
               <div className="w-full flex justify-center py-8">
                  <img 
                    src={data.personalInfo.photo} 
                    referrerPolicy="no-referrer" 
                    className="object-cover object-top filter brightness-95 shadow-2xl" 
                    style={{ 
                      width: data.personalInfo.photoStyle === 'circle' ? `${(data.personalInfo.photoSize || 100) * 1.5}px` : '100%',
                      height: data.personalInfo.photoStyle === 'circle' ? `${(data.personalInfo.photoSize || 100) * 1.5}px` : '320px',
                      borderRadius: data.personalInfo.photoStyle === 'circle' ? '50%' : '0',
                      border: data.personalInfo.photoStyle === 'circle' ? '4px solid rgba(255,255,255,0.2)' : 'none'
                    }} 
                  />
               </div>
             ) : (
               <div 
                 className="w-full flex items-center justify-center font-black bg-black/20" 
                 style={{ 
                   height: data.personalInfo.photoStyle === 'circle' ? `${(data.personalInfo.photoSize || 100) * 1.5}px` : '320px',
                   width: data.personalInfo.photoStyle === 'circle' ? `${(data.personalInfo.photoSize || 100) * 1.5}px` : '100%',
                   borderRadius: data.personalInfo.photoStyle === 'circle' ? '50%' : '0',
                   margin: data.personalInfo.photoStyle === 'circle' ? '20px auto' : '0',
                   fontSize: '4rem'
                 }}
               >
                 {data.personalInfo.fullName.charAt(0)}
               </div>
             )}
             <div className="p-10 flex flex-col gap-10 flex-1">
                <div>
                   <h1 className="text-[38px] font-black leading-[1.1] mb-2">{data.personalInfo.fullName.replace(' ', '\n')}</h1>
                   <p className="text-sm tracking-[0.2em] uppercase font-semibold text-white/70 mt-4">{data.personalInfo.title}</p>
                </div>
                <div>
                   <h3 className="text-xl font-bold mb-5 pb-2 text-white border-b-2 border-white/20 inline-block pr-6">Contacto</h3>
                   <div className="flex flex-col gap-4 text-[13px] opacity-90">
                     {data.personalInfo.email && <div className="flex items-center gap-3"><Mail size={16} className="opacity-70"/> {data.personalInfo.email}</div>}
                     {data.personalInfo.phone && <div className="flex items-center gap-3"><Phone size={16} className="opacity-70"/> {data.personalInfo.phone}</div>}
                     {data.personalInfo.location && <div className="flex items-center gap-3"><MapPin size={16} className="opacity-70"/> {data.personalInfo.location}</div>}
                   </div>
                </div>
                {data.languages && data.languages.length > 0 && (
                  <div>
                     <h3 className="text-xl font-bold mb-5 pb-2 text-white border-b-2 border-white/20 inline-block pr-6">Idiomas</h3>
                     <div className="flex flex-col gap-3 text-[13px] opacity-90">
                       {data.languages.map(l => (
                          <div key={l.id} className="flex flex-col gap-0.5">
                             <div className="font-bold flex items-center gap-2">• {l.name}</div>
                             <div className="pl-4 text-[11px] opacity-70 uppercase tracking-widest">{l.level}</div>
                          </div>
                       ))}
                     </div>
                  </div>
                )}
             </div>
          </div>
          <div className="w-[68%] p-14 flex flex-col gap-10 bg-white" style={{ color: '#1f2937' }}>
             {data.personalInfo.summary && (
               <div>
                  <h2 className="text-[28px] font-black mb-4 leading-tight" style={{ color: '#111827' }}>Perfil Profissional</h2>
                  <div className="w-12 h-1.5 bg-gray-200 mb-6 rounded-full"></div>
                  <p className="text-[14px] leading-[1.8] text-left font-serif" style={{ color: '#374151' }}>{renderText(data.personalInfo.summary)}</p>
               </div>
             )}
             {data.experience.length > 0 && (
               <div>
                  <h2 className="text-[28px] font-black mb-4 leading-tight" style={{ color: '#111827' }}>Experiência Profissional</h2>
                  <div className="w-12 h-1.5 bg-gray-200 mb-8 rounded-full"></div>
                  <div className="flex flex-col gap-10">
                    {data.experience.map(ex => (
                      <div key={ex.id} className="relative pl-6 border-l-2 border-gray-100">
                         <div className="absolute top-1 -left-[9px] w-4 h-4 rounded-full bg-white border-2 border-gray-200"></div>
                         <h4 className="text-[16px] font-bold mb-1" style={{ color: '#1f2937' }}>{ex.position}</h4>
                         <div className="flex justify-between items-center mb-4">
                            <span className="text-[13px] font-bold tracking-tight uppercase" style={{ color: '#4b5563' }}>{ex.company}</span>
                            <span className="text-[11px] font-black bg-gray-100 px-2 py-1 rounded" style={{ color: '#6b7280' }}>{ex.startDate} - {ex.current ? "Presente" : ex.endDate}</span>
                         </div>
                         <p className="text-[13px] leading-[1.7] text-left font-serif mt-1" style={{ color: '#4b5563' }}>{renderText(ex.description)}</p>
                      </div>
                    ))}
                  </div>
               </div>
             )}
             {data.skills.length > 0 && (
               <div>
                  <h2 className="text-[28px] font-black mb-4 leading-tight" style={{ color: '#111827' }}>Habilidades</h2>
                  <div className="w-12 h-1.5 bg-gray-200 mb-6 rounded-full"></div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] leading-[1.8] font-serif" style={{ color: '#374151' }}>
                    {data.skills.map(s => <span key={s.id} className="flex items-center gap-2 font-bold">• {s.name}</span>)}
                  </div>
               </div>
             )}
             {data.education.length > 0 && (
               <div>
                  <h2 className="text-[28px] font-black mb-4 leading-tight" style={{ color: '#111827' }}>Formação</h2>
                  <div className="w-12 h-1.5 bg-gray-200 mb-6 rounded-full"></div>
                  <div className="flex flex-col gap-6">
                    {data.education.map(e => (
                      <div key={e.id}>
                         <div className="flex justify-between items-center mb-1">
                            <h4 className="text-[15px] font-bold" style={{ color: '#1f2937' }}>{e.degree}</h4>
                            <span className="text-[12px] font-bold text-gray-400">{e.startDate} - {e.endDate}</span>
                         </div>
                         <span className="text-[13px] font-medium italic opacity-70" style={{ color: '#4b5563' }}>{e.institution}</span>
                      </div>
                    ))}
                  </div>
               </div>
             )}
          </div>
        </div>
      )}

      {theme.layout === 'custom-t5' && (
        <div className="flex w-full min-h-[1123px] bg-[#FAFAFA] text-left font-sans overflow-visible relative">
           <div className="w-[34%] flex flex-col relative z-10 pt-16" style={{ backgroundColor: c.soft || '#F3F4F6' }}>
             <div className="bg-white h-64 w-full absolute top-0 left-0" style={{ borderBottomLeftRadius: '60%', borderBottomRightRadius: '60%', transform: 'scaleX(1.3)', transformOrigin: 'top center', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}></div>
             <div className="relative z-20 w-full flex flex-col items-center px-10">
                {data.personalInfo.photo ? (
                  <img 
                    src={data.personalInfo.photo} 
                    referrerPolicy="no-referrer" 
                    className="object-cover object-top border-[5px] border-white mb-12 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] bg-white" 
                    style={{ 
                      width: `${data.personalInfo.photoSize || 160}px`,
                      height: `${data.personalInfo.photoSize || 160}px`,
                      borderRadius: data.personalInfo.photoStyle === 'circle' ? '50%' : '24px'
                    }}
                  />
                ) : (
                  <div 
                    className="border-[5px] border-white mb-12 flex items-center justify-center font-black shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] bg-gray-100 text-gray-400" 
                    style={{ 
                      width: `${data.personalInfo.photoSize || 160}px`,
                      height: `${data.personalInfo.photoSize || 160}px`,
                      borderRadius: data.personalInfo.photoStyle === 'circle' ? '50%' : '24px',
                      fontSize: `${(data.personalInfo.photoSize || 160) * 0.4}px`
                    }}
                  >
                    {data.personalInfo.fullName.charAt(0)}
                  </div>
                )}
                
                <div className="w-full mb-10">
                  <div className="mb-6 border-b-2 pb-2" style={{ borderColor: `${c.primary}40` }}>
                     <h3 className="text-[12px] font-black uppercase tracking-[0.2em]" style={{ color: c.primary }}>Contacto</h3>
                  </div>
                  <div className="flex flex-col gap-4 text-[13px] w-full font-medium" style={{ color: c.text }}>
                     {data.personalInfo.phone && <div className="flex items-center gap-3"><Phone className="opacity-70" size={16} color={c.primary}/> <span>{data.personalInfo.phone}</span></div>}
                     {data.personalInfo.email && <div className="flex items-center gap-3"><Mail className="opacity-70" size={16} color={c.primary}/> <span className="break-all">{data.personalInfo.email}</span></div>}
                     {data.personalInfo.location && <div className="flex items-center gap-3"><MapPin className="opacity-70" size={16} color={c.primary}/> <span>{data.personalInfo.location}</span></div>}
                  </div>
                </div>

                {data.skills.length > 0 && (
                  <div className="w-full mb-10">
                    <div className="mb-6 border-b-2 pb-2" style={{ borderColor: `${c.primary}40` }}>
                       <h3 className="text-[12px] font-black uppercase tracking-[0.2em]" style={{ color: c.primary }}>Habilidades</h3>
                    </div>
                    <ul className="flex flex-col gap-3 text-[13px] w-full pl-2 space-y-1" style={{ color: c.text }}>
                       {data.skills.map(s => (
                         <li key={s.id} className="font-semibold flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: c.primary}}></div>
                           {s.name}
                         </li>
                       ))}
                    </ul>
                  </div>
                )}

                {data.languages && data.languages.length > 0 && (
                  <div className="w-full mb-10">
                    <div className="mb-6 border-b-2 pb-2" style={{ borderColor: `${c.primary}40` }}>
                       <h3 className="text-[12px] font-black uppercase tracking-[0.2em]" style={{ color: c.primary }}>Idiomas</h3>
                    </div>
                    <ul className="flex flex-col gap-3 text-[13px] w-full pl-2 space-y-1" style={{ color: c.text }}>
                       {data.languages.map(l => (
                         <li key={l.id} className="font-semibold flex items-center justify-between">
                           <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: c.primary}}></div> {l.name}</span>
                           <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md" style={{backgroundColor: `${c.primary}15`, color: c.primary}}>{l.level}</span>
                         </li>
                       ))}
                    </ul>
                  </div>
                )}
                
                {data.education.length > 0 && (
                  <div className="w-full mb-10">
                    <div className="mb-6 border-b-2 pb-2" style={{ borderColor: `${c.primary}40` }}>
                       <h3 className="text-[12px] font-black uppercase tracking-[0.2em]" style={{ color: c.primary }}>Formação</h3>
                    </div>
                    <div className="flex flex-col gap-6 w-full" style={{ color: c.text }}>
                       {data.education.map(e => (
                         <div key={e.id} className="relative">
                            <div className="font-black mb-1 text-[13px] leading-tight" style={{ color: c.primary }}>{e.institution}</div>
                            <div className="font-medium text-[13px] text-gray-700">{e.degree}</div>
                            <div className="text-[11px] font-bold opacity-60 mt-1 uppercase tracking-wider">{e.startDate} - {e.endDate}</div>
                         </div>
                       ))}
                    </div>
                  </div>
                )}
             </div>
           </div>

           <div className="w-[66%] py-20 px-14 flex flex-col gap-12 bg-white shadow-[-20px_0_40px_rgba(0,0,0,0.02)] relative z-10">
              <div>
                 <h1 className="text-[48px] uppercase font-black leading-[1] tracking-tighter" style={{ color: c.primary }}>
                   {data.personalInfo.fullName.split(' ')[0]} <br/>
                   <span className="font-light tracking-normal text-gray-800">{data.personalInfo.fullName.split(' ').slice(1).join(' ')}</span>
                 </h1>
                 <p className="text-[16px] uppercase tracking-[0.3em] font-black mt-6" style={{ color: c.primary }}>{data.personalInfo.title}</p>
              </div>

              {data.personalInfo.summary && (
                <div className="relative">
                   <div className="absolute -left-6 top-0 w-1.5 h-full rounded-r-lg" style={{ backgroundColor: c.primary }}></div>
                   <h2 className="text-[18px] font-black uppercase tracking-[0.15em] mb-4" style={{ color: '#111827' }}>Perfil Profissional</h2>
                   <p className="text-[13px] leading-[1.8] text-left text-gray-600 font-medium">{renderText(data.personalInfo.summary)}</p>
                </div>
              )}

              {data.experience.length > 0 && (
                <div>
                   <h2 className="text-[18px] font-black uppercase tracking-[0.15em] mb-6 border-b pb-4" style={{ color: '#111827', borderColor: '#F3F4F6' }}>Experiência Profissional</h2>
                   <div className="flex flex-col gap-8">
                     {data.experience.map(ex => (
                       <div key={ex.id}>
                          <div className="flex justify-between items-baseline mb-1">
                             <h4 className="text-[17px] font-black text-gray-900 tracking-tight">{ex.position}</h4>
                             <span className="text-[11px] font-bold px-3 py-1 bg-gray-100 rounded-lg text-gray-500">{ex.startDate} - {ex.current ? "Presente" : ex.endDate}</span>
                          </div>
                          <div className="text-[14px] font-bold mb-4 flex items-center gap-2" style={{ color: c.primary }}>
                             {ex.company}
                          </div>
                          <p className="text-[13px] leading-[1.8] text-left text-gray-600 font-medium pl-4 border-l-2" style={{borderColor: `${c.primary}20`}}>{renderText(ex.description)}</p>
                       </div>
                     ))}
                   </div>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};


// --- Main Application ---

export default function App() {
  const [view, setView] = useState<'landing' | 'editor' | 'faq' | 'about' | 'terms' | 'tips' | 'showcase'>('landing');
  const [activeStep, setActiveStep] = useState(0);
  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    const saved = localStorage.getItem('cv_lab_data');
    return saved ? JSON.parse(saved) : INITIAL_RESUME_DATA;
  });
  const [loading, setLoading] = useState(false);
  const [optimizingId, setOptimizingId] = useState<string | null>(null);
  const [isCoverLetterMode, setIsCoverLetterMode] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState("");
  const [tempSkill, setTempSkill] = useState("");
  const [tempLanguage, setTempLanguage] = useState("");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const [template, setTemplate] = useState<TemplateType>(() => {
    return (localStorage.getItem('cv_lab_template') as TemplateType) || 't1_executive';
  });

  useEffect(() => {
    localStorage.setItem('cv_lab_data', JSON.stringify(resumeData));
  }, [resumeData]);

  useEffect(() => {
    localStorage.setItem('cv_lab_template', template);
  }, [template]);
  const [previewScale, setPreviewScale] = useState(1);
  const [currentBanner, setCurrentBanner] = useState(0);

  const banners = [
    "https://i.supaimg.com/6bc04951-8cbe-4706-9f0c-a01f9ea9a6c4/d25d88cc-8de9-4afc-8385-0ed21b0e333b.png",
    "https://i.supaimg.com/6bc04951-8cbe-4706-9f0c-a01f9ea9a6c4/4406a25d-b692-476b-955d-409d5a851e46.jpg"
  ];

  const nextBanner = () => setCurrentBanner((prev) => (prev + 1) % banners.length);
  const prevBanner = () => setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      // Pre-visualização deve caber na largura da tela com margem
      if (width < 850) {
        const availableWidth = width - 40; // 20px padding cada lado
        const scale = availableWidth / 794;
        setPreviewScale(Math.min(scale, 1));
      } else {
        setPreviewScale(1);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let interval: any;
    if (view === 'landing') {
      interval = setInterval(() => {
        nextBanner();
      }, 4500);
    }
    return () => clearInterval(interval);
  }, [view, currentBanner]);

  const handleDownloadPdf = async () => {
    const elementId = isCoverLetterMode ? 'cover-letter-content' : 'resume-content';
    const element = document.getElementById(elementId);
    if (!element) return;

    setIsDownloading(true);
    
    // Configurações otimizadas para evitar elementos tortos e desalinhados
    const opt = {
      margin:       0,
      filename:     isCoverLetterMode ? 'Carta_Apresentacao.pdf' : `${resumeData.personalInfo.fullName.replace(/\s+/g, '_')}_Curriculo.pdf`,
      image:        { type: 'jpeg' as const, quality: 1 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true, 
        letterRendering: false,
        scrollY: 0,
        scrollX: 0,
        windowWidth: 794
      },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      pagebreak:    { mode: ['css', 'legacy'] }
    };

    try {
      // Forçamos o scroll para o topo antes da captura para evitar desalinhamento
      window.scrollTo(0, 0);
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const editorSteps = [
    { title: 'Perfil', icon: User },
    { title: 'Experiência', icon: Briefcase },
    { title: 'Educação', icon: GraduationCap },
    { title: 'Habilidades', icon: Settings },
    { title: 'Design', icon: FileText },
    { title: 'Finalizar', icon: CheckCircle }
  ];

  const updatePersonalInfo = (field: string, value: any) => {
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
      skills: [...prev.skills, { id, name, level: 'Intermédio' }]
    }));
  };

  const addLanguage = (name: string) => {
    if (!name.trim()) return;
    const id = Math.random().toString(36).substring(7);
    setResumeData(prev => ({
      ...prev,
      languages: [...prev.languages, { id, name, level: 'Fluente' }]
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
    const optId = type === 'experience' ? `exp-${index}` : type;
    setOptimizingId(optId);

    let text = "";
    if (type === 'summary') text = resumeData.personalInfo.summary;
    else if (type === 'experience' && index !== undefined) text = resumeData.experience[index].description;
    
    if (!text) {
      alert("Por favor, digite algum texto antes de otimizar.");
      setOptimizingId(null);
      return;
    }

    const optimized = await optimizeResumeText(text, type);
    
    if (optimized === text) {
      alert("A IA não conseguiu sugerir mudanças significativas. Verifique:\n1. Se o texto inserido tem detalhes suficientes.\n2. Se a chave da API (VITE_GEMINI_API_KEY) está configurada no seu ambiente de deploy.");
    } else {
      if (type === 'summary') updatePersonalInfo('summary', optimized);
      else if (type === 'experience' && index !== undefined) {
        const newExp = [...resumeData.experience];
        newExp[index].description = optimized;
        setResumeData(p => ({ ...p, experience: newExp }));
      }
    }
    
    setOptimizingId(null);
  };

  const handleCreateCoverLetter = async () => {
    setLoading(true);
    const content = await generateCoverLetter(resumeData, resumeData.personalInfo.title || "Vaga de Emprego");
    setGeneratedLetter(content);
    setIsCoverLetterMode(true);
    setLoading(false);
  };

  const handleAutoFill = async () => {
    if (!resumeData.personalInfo.fullName || !resumeData.personalInfo.title) {
      alert("Preencha seu Nome e Cargo Pretendido para usarmos como base.");
      return;
    }

    setLoading(true);
    try {
      const data = await generateFullResume(resumeData.personalInfo);
      setResumeData(prev => ({
        ...prev,
        personalInfo: { ...prev.personalInfo, summary: data.summary },
        experience: data.experience.map((e: any) => ({ ...e, id: Math.random().toString(36).substring(7) })),
        education: data.education.map((e: any) => ({ ...e, id: Math.random().toString(36).substring(7) })),
        skills: data.skills.map((s: string) => ({ name: s, id: Math.random().toString(36).substring(7), level: 'Intermédio' })),
        languages: (data.languages || []).map((s: string) => ({ name: s, id: Math.random().toString(36).substring(7), level: 'Fluente' }))
      }));
      alert("Currículo gerado com sucesso! Você pode ajustar os detalhes agora.");
    } catch (err) {
      alert("Erro ao auto-completar. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  if (view === 'landing') {
    return (
      <div className="min-h-screen hero-gradient flex flex-col">
        <nav className="h-20 px-6 md:px-12 flex items-center justify-between glass sticky top-0 z-50">
          <div className="cursor-pointer" onClick={() => setView('landing')}>
            <img 
              src="https://i.supaimg.com/6bc04951-8cbe-4706-9f0c-a01f9ea9a6c4/f7862e8c-46f6-4d82-a9e0-b9cb52c6fc4f.png" 
              alt="CV LAB" 
              className="h-10 md:h-12 w-auto object-contain"
              referrerPolicy="no-referrer" 
            />
          </div>
          <div className="hidden md:flex items-center gap-8 text-[10px] font-black tracking-widest text-text-muted uppercase">
            <button onClick={() => setView('tips')} className="hover:text-primary-blue transition-colors focus:outline-none flex items-center gap-1.5">
              Dicas <span className="text-[7px] bg-primary-blue text-white px-1 py-0.5 rounded-sm animate-pulse">Novo</span>
            </button>
            <button onClick={() => setView('showcase')} className="hover:text-primary-blue transition-colors focus:outline-none flex items-center gap-1.5">
              Exemplos <span className="text-[7px] bg-deep-blue text-white px-1 py-0.5 rounded-sm">Novo</span>
            </button>
            <button onClick={() => setView('about')} className="hover:text-primary-blue transition-colors focus:outline-none">Sobre Nós</button>
            <button onClick={() => setView('faq')} className="hover:text-primary-blue transition-colors focus:outline-none">FAQ</button>
            <button onClick={() => setView('terms')} className="hover:text-primary-blue transition-colors focus:outline-none">Termos</button>
          </div>
          <Button variant="outline" onClick={() => setView('editor')} className="text-xs uppercase tracking-widest">Criar CV</Button>
        </nav>

        {/* Animated Banner Carousel - Positioned after Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full relative group h-auto min-h-[100px]"
        >
          <div className="w-full relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.img 
                key={currentBanner}
                src={banners[currentBanner]} 
                alt={`Banner ${currentBanner + 1}`} 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className="w-full h-auto object-cover"
                referrerPolicy="no-referrer"
              />
            </AnimatePresence>
          </div>

          {/* Navigation Arrows */}
          <button 
            onClick={prevBanner}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/40 backdrop-blur-md hover:bg-white/60 text-deep-blue rounded-full flex items-center justify-center transition-all z-10 border border-white/20 shadow-lg"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={nextBanner}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/40 backdrop-blur-md hover:bg-white/60 text-deep-blue rounded-full flex items-center justify-center transition-all z-10 border border-white/20 shadow-lg"
          >
            <ChevronRight size={24} />
          </button>

          {/* Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, i) => (
              <div 
                key={i} 
                className={`w-2 h-2 rounded-full transition-all ${currentBanner === i ? 'bg-primary-blue w-6' : 'bg-primary-blue/30'}`}
              />
            ))}
          </div>
        </motion.div>

        <main className="flex-1 flex flex-col md:flex-row items-center px-6 md:px-12 py-12 md:py-20 gap-16 max-w-7xl mx-auto w-full">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex-1 flex flex-col gap-8"
          >
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
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-1 w-full flex flex-col items-center justify-center"
          >
             <div className="flex flex-col items-center justify-center space-y-8 w-full">
               <h2 className="text-3xl font-black text-deep-blue text-center mb-4">O que dizem os profissionais</h2>
               
               <div className="w-full max-w-lg space-y-6">
                  {[
                    {
                      name: "Ana Silva",
                      role: "Diretora de Marketing",
                      testimonial: "A CV LAB transformou completamente meu currículo. A linguagem usada pela IA foi o divisor de águas para minha contratação."
                    },
                    {
                      name: "Ricardo Mendes",
                      role: "Engenheiro de Dados",
                      testimonial: "Interface incrível, rápida e o resultado final é de um nível executivo que eu não conseguiria fazer sozinho no Word."
                    }
                  ].map((t, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-border-main shadow-sm hover:shadow-xl transition-shadow group">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-soft-blue flex items-center justify-center text-primary-blue font-black text-lg">
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-deep-blue">{t.name}</div>
                          <div className="text-[10px] text-text-muted font-black uppercase tracking-widest">{t.role}</div>
                        </div>
                      </div>
                      <p className="text-sm text-text-muted leading-relaxed italic">"{t.testimonial}"</p>
                    </div>
                  ))}
               </div>
             </div>
          </motion.div>
        </main>
        
        <motion.img
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          src="https://i.supaimg.com/6bc04951-8cbe-4706-9f0c-a01f9ea9a6c4/646b44b0-23b8-462d-9e14-c75ff88d0244.png"
          alt="Banner de Destaque"
          className="w-full object-cover"
          referrerPolicy="no-referrer"
        />

        <section className="bg-white py-16 px-6 border-t border-border-main scroll-mt-20">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
            >
              {[
                { 
                  title: "Texto Otimizado", 
                  desc: "Nossa IA transforma rascunhos em conquistas profissionais marcantes.", 
                  icon: FileText,
                  color: "bg-soft-blue text-primary-blue"
                },
                { 
                  title: "Design Mobile-Ready", 
                  desc: "Edite seu currículo em qualquer dispositivo com interface fluida e moderna.", 
                  icon: Globe,
                  color: "bg-deep-blue text-white"
                },
                { 
                  title: "Toque Pessoal", 
                  desc: "Nada de modelos genéricos. Designs exclusivos que refletem sua identidade.", 
                  icon: Settings,
                  color: "bg-primary-blue text-white"
                }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -5 }}
                  className="p-8 rounded-[32px] border border-border-main bg-white hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.05)] transition-all group"
                >
                  <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform`}>
                    <item.icon size={22} />
                  </div>
                  <h3 className="text-xl font-black text-deep-blue tracking-tight mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <AdSenseUnit />

        <motion.footer 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="bg-bg-main py-12 border-t border-border-main text-center flex flex-col items-center gap-6"
        >
           <div className="flex flex-wrap justify-center items-center gap-6 text-xs font-bold text-text-muted uppercase tracking-widest">
              <button onClick={() => setView('tips')} className="hover:text-primary-blue transition-colors">Dicas</button>
              <button onClick={() => setView('showcase')} className="hover:text-primary-blue transition-colors">Exemplos</button>
              <button onClick={() => setView('about')} className="hover:text-primary-blue transition-colors">Sobre Nós</button>
              <button onClick={() => setView('faq')} className="hover:text-primary-blue transition-colors">FAQ</button>
              <button onClick={() => setView('terms')} className="hover:text-primary-blue transition-colors">Termos e Condições</button>
              <a href="https://www.facebook.com/share/18jr2KKfK1/" target="_blank" rel="noopener noreferrer" className="hover:text-primary-blue transition-colors">
                <Facebook size={16} />
              </a>
           </div>
           <Button onClick={() => setView('editor')} className="px-8 h-12 text-sm uppercase tracking-tight">Criar Currículo</Button>
           <p className="text-[10px] text-text-muted opacity-60">© 2026 CV LAB. Todos os direitos reservados.</p>
        </motion.footer>

        {/* Floating WhatsApp Button - Already handled at landing page logic level or consolidate here if needed */}
      </div>
    );
  }

  if (view === 'faq' || view === 'about' || view === 'terms' || view === 'tips' || view === 'showcase') {
    return (
      <div className="min-h-screen hero-gradient flex flex-col">
        <nav className="h-20 px-6 md:px-12 flex items-center justify-between glass sticky top-0 z-50">
          <button onClick={() => setView('landing')} className="flex items-center">
            <img 
              src="https://i.supaimg.com/6bc04951-8cbe-4706-9f0c-a01f9ea9a6c4/f7862e8c-46f6-4d82-a9e0-b9cb52c6fc4f.png" 
              alt="CV LAB" 
              className="h-10 md:h-12 w-auto object-contain"
              referrerPolicy="no-referrer" 
            />
          </button>
          <div className="hidden md:flex items-center gap-8 text-[10px] font-black tracking-widest text-text-muted uppercase">
            <button onClick={() => setView('tips')} className="hover:text-primary-blue transition-colors focus:outline-none flex items-center gap-1.5">
              Dicas <span className="text-[7px] bg-primary-blue text-white px-1 py-0.5 rounded-sm animate-pulse">Novo</span>
            </button>
            <button onClick={() => setView('showcase')} className="hover:text-primary-blue transition-colors focus:outline-none flex items-center gap-1.5">
              Exemplos <span className="text-[7px] bg-deep-blue text-white px-1 py-0.5 rounded-sm">Novo</span>
            </button>
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

          {view === 'tips' && (
            <div className="space-y-12">
              <div className="text-center space-y-4 mb-12">
                <h1 className="text-5xl font-black text-deep-blue tracking-tight">Dicas de Especialistas</h1>
                <p className="text-text-muted font-medium">Pequenos detalhes que fazem grandes diferenças no seu recrutamento.</p>
              </div>

              <div className="grid gap-8">
                {[
                  {
                    title: "A Regra dos 6 Segundos",
                    desc: "Recrutadores levam em média apenas 6 segundos para decidir se o seu currículo vale uma leitura completa. Use títulos claros e uma estrutura limpa.",
                    icon: "⏱️"
                  },
                  {
                    title: "Verbos de Ação",
                    desc: "Evite frases como 'Responsável por...'. Use verbos fortes como 'Liderei', 'Implementei', 'Reduzi custos em 20%'.",
                    icon: "🚀"
                  },
                  {
                    title: "Quantifique suas Conquistas",
                    desc: "Números saltam aos olhos. 'Gerenciei equipe' vs 'Gerenciei equipe de 15 pessoas e aumentamos a produtividade em 30%'.",
                    icon: "📈"
                  },
                  {
                    title: "Otimização para ATS",
                    desc: "Muitas empresas usam softwares para filtrar currículos. Utilize palavras-chave específicas da sua área que aparecem no anúncio da vaga.",
                    icon: "🔍"
                  }
                ].map((tip, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-8 bg-white rounded-[32px] border border-border-main flex gap-6 items-start hover:shadow-xl transition-shadow group"
                  >
                    <div className="text-4xl">{tip.icon}</div>
                    <div className="space-y-2">
                       <h3 className="text-xl font-black text-deep-blue group-hover:text-primary-blue transition-colors">{tip.title}</h3>
                       <p className="text-text-main font-medium leading-relaxed opacity-80">{tip.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="bg-primary-blue p-10 rounded-[40px] text-white flex flex-col md:flex-row items-center gap-8 shadow-2xl shadow-primary-blue/20">
                <div className="space-y-4 flex-1">
                  <h3 className="text-2xl font-black">Quer uma análise personalizada?</h3>
                  <p className="text-white/80 text-sm font-medium">Nossa IA pode revisar seu currículo atual e sugerir melhorias específicas para o seu perfil profissional.</p>
                </div>
                <Button onClick={() => setView('editor')} className="bg-white text-primary-blue hover:bg-white/90 shrink-0 h-14 px-8 uppercase tracking-widest text-xs">Começar Agora</Button>
              </div>
            </div>
          )}

          {view === 'showcase' && (
            <div className="space-y-12">
              <div className="text-center space-y-4 mb-12">
                <h1 className="text-5xl font-black text-deep-blue tracking-tight">Galeria de Sucesso</h1>
                <p className="text-text-muted font-medium">Inspire-se em currículos que já foram aprovados por grandes empresas.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {[
                  { name: "Modelo Executivo", desc: "Perfeito para cargos de gestão e liderança.", img: "https://picsum.photos/seed/resume1/600/800" },
                  { name: "Modelo Criativo", desc: "Ideal para designers, publicidade e artes.", img: "https://picsum.photos/seed/resume2/600/800" },
                  { name: "Modelo Minimalista", desc: "Foco total no conteúdo e experiências.", img: "https://picsum.photos/seed/resume3/600/800" },
                  { name: "Modelo Académico", desc: "Estruturado para investigadores e professores.", img: "https://picsum.photos/seed/resume4/600/800" }
                ].map((item, idx) => (
                  <motion.div 
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-[32px] border border-border-main overflow-hidden shadow-sm hover:shadow-2xl transition-all cursor-pointer group"
                    onClick={() => setView('editor')}
                  >
                    <div className="aspect-[3/4] overflow-hidden relative">
                      <img src={item.img} alt={item.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                      <div className="absolute inset-0 bg-deep-blue/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="bg-white text-primary-blue px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest">Usar este Modelo</span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-black text-deep-blue">{item.name}</h3>
                      <p className="text-sm text-text-muted font-medium">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {view === 'faq' && (
            <div className="space-y-12">
              <div className="text-center space-y-4 mb-12">
                <h1 className="text-5xl font-black text-deep-blue tracking-tight">Perguntas Frequentes</h1>
                <p className="text-text-muted font-medium">Tudo o que você precisa saber para criar um currículo imbatível.</p>
              </div>
              
              <div className="grid gap-6">
                {[
                  {
                    q: "Como a Inteligência Artificial melhora meu currículo?",
                    a: "Nossa IA, baseada no Google Gemini, analisa as suas experiências brutas e as reescreve utilizando verbos de ação e métricas de impacto. Ela ajusta o tom para ser mais executivo e garante que as palavras-chave certas para o seu setor estejam presentes, aumentando suas chances em sistemas de triagem automáticos (ATS)."
                  },
                  {
                    q: "O download do currículo é realmente gratuito?",
                    a: "Sim. A criação do currículo e a exportação para PDF são totalmente gratuitas. Nós acreditamos que a base da sua carreira não deve ter custos proibitivos. Oferecemos serviços premium opcionais, como a geração de cartas de apresentação personalizadas por IA."
                  },
                  {
                    q: "Meus dados estão seguros?",
                    a: "Absolutamente. Nós não armazenamos seus dados pessoais em servidores permanentes. As informações que você insere permanecem no seu navegador e são processadas apenas para gerar o documento. Recomendamos sempre não incluir números de documentos sensíveis como BI ou Passaporte, pois não são necessários em uma triagem inicial."
                  },
                  {
                    q: "Posso criar mais de um currículo?",
                    a: "Sim, você pode alternar entre diferentes templates e ajustar as informações à vontade. Cada vez que você gera um novo PDF, ele reflete as alterações atuais."
                  },
                  {
                    q: "Como funciona o pagamento da Carta de Apresentação?",
                    a: "Para gerar uma carta de apresentação premium, solicitamos um pagamento único de 1150 Kzs. Este valor cobre o processamento avançado de IA para criar um texto altamente persuasivo e formatado especificamente para a vaga que você deseja."
                  },
                  {
                    q: "O currículo é compatível com sistemas ATS?",
                    a: "Sim, nossos templates foram desenhados para serem lidos facilmente por sistemas de rastreamento de candidatos (ATS). Evitamos layouts excessivamente complexos que poderiam confundir os robôs de recrutamento."
                  }
                ].map((item, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={idx} 
                    className="bg-white p-8 rounded-3xl shadow-sm border border-border-main hover:border-primary-blue/30 transition-colors group"
                  >
                    <h3 className="text-xl font-black text-deep-blue mb-3 group-hover:text-primary-blue transition-colors">{item.q}</h3>
                    <p className="text-text-main leading-relaxed font-medium opacity-80">{item.a}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {view === 'about' && (
            <div className="space-y-16">
              <div className="text-center space-y-4 mb-12">
                <h1 className="text-5xl font-black text-deep-blue tracking-tight">Nossa Missão</h1>
                <p className="text-text-muted font-medium italic">Elevando o padrão das candidaturas em Angola e no mundo.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="w-12 h-12 bg-primary-blue flex items-center justify-center rounded-2xl text-white shadow-xl shadow-primary-blue/20">
                    <Briefcase size={24} />
                  </div>
                  <h2 className="text-3xl font-black text-deep-blue leading-tight">Chega de currículos genéricos em Word.</h2>
                  <p className="text-text-main leading-relaxed font-medium opacity-90">
                    A CV LAB nasceu da percepção de que muitos profissionais qualificados perdem oportunidades incríveis simplesmente porque não sabem 'se vender' no papel. 
                    O mercado de trabalho evoluiu, mas a forma como as pessoas montam seus currículos permaneceu estagnada por décadas.
                  </p>
                  <p className="text-text-main leading-relaxed font-medium opacity-90">
                    Nossa plataforma utiliza o que há de mais moderno em design de interface e processamento de linguagem natural para garantir que sua primeira impressão seja impecável.
                  </p>
                </div>
                <div className="bg-soft-blue/50 p-8 rounded-[40px] border border-primary-blue/10 relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-blue/5 rounded-full blur-3xl group-hover:bg-primary-blue/10 transition-colors"></div>
                  <blockquote className="relative z-10 italic text-xl font-medium text-deep-blue/80">
                    "O design não é apenas o que parece e o que se sente. O design é como funciona. E no currículo, o design deve funcionar para que você seja contratado."
                  </blockquote>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-8">
                {[
                  { label: "Design Premium", desc: "Templates criados por especialistas em UX para máxima legibilidade." },
                  { label: "IA Integrada", desc: "Textos otimizados pelo Google Gemini para soar como um executivo sênior." },
                  { label: "Foco no Candidato", desc: "Ferramenta gratuita e acessível para impulsionar talentos locais." }
                ].map((stat, i) => (
                  <div key={i} className="space-y-2 p-6 bg-white rounded-3xl border border-border-main shadow-sm">
                    <h4 className="text-lg font-black text-primary-blue uppercase tracking-tight">{stat.label}</h4>
                    <p className="text-sm text-text-muted font-medium">{stat.desc}</p>
                  </div>
                ))}
              </div>

              <div className="bg-deep-blue text-white p-12 rounded-[40px] text-center space-y-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-10"></div>
                <h3 className="text-3xl font-black relative z-10">Pronto para dar o próximo passo?</h3>
                <p className="text-white/70 max-w-xl mx-auto font-medium relative z-10">
                  Junte-se a milhares de profissionais que já transformaram suas carreiras com a ajuda da CV LAB.
                </p>
                <div className="relative z-10 pt-4">
                  <Button onClick={() => setView('editor')} className="bg-white text-primary-blue hover:bg-white/90 px-12 h-16 text-lg">Começar Agora</Button>
                </div>
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
    <div className="min-h-screen bg-bg-main flex flex-col md:flex-row justify-center md:h-screen md:overflow-hidden print:bg-white print:h-auto print:overflow-visible">
      
      {/* Sidebar Editor */}
      <aside className={`w-full max-w-3xl mx-auto md:w-[600px] bg-white border-x border-border-main flex flex-col shadow-2xl z-30 print:hidden shrink-0 ${showPreviewModal ? 'hidden' : 'flex'}`}>
        <header className="p-4 border-b border-border-main flex items-center justify-between sticky top-0 bg-white z-40 shadow-sm">
          <div className="flex items-center gap-3">
             <button onClick={() => setView('landing')} className="p-2 hover:bg-bg-main rounded-xl transition-colors text-text-muted">
               <ChevronLeft size={20} />
             </button>
             <img 
               src="https://i.supaimg.com/6bc04951-8cbe-4706-9f0c-a01f9ea9a6c4/f7862e8c-46f6-4d82-a9e0-b9cb52c6fc4f.png" 
               alt="CV LAB" 
               className="h-6 w-auto object-contain hidden sm:inline"
               referrerPolicy="no-referrer" 
             />
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-soft-blue text-primary-blue text-[9px] font-black rounded-full hidden md:block">PASSO {activeStep + 1}/6</div>
            <Button variant="outline" className="h-9 px-4 text-xs font-bold" onClick={() => setShowPreviewModal(true)} icon={ExternalLink}>Pré-Visualizar</Button>
            <Button className="h-9 px-4 text-xs font-bold hidden sm:flex" onClick={handleDownloadPdf} disabled={isDownloading} icon={Download}>{isDownloading ? 'Baixando...' : 'Baixar'}</Button>
          </div>
        </header>

        {/* New Visual Stepper / Tabs */}
        <div className="bg-bg-main/30 border-b border-border-main overflow-x-auto no-scrollbar">
          <div className="flex px-4 py-3 min-w-max gap-1">
            {editorSteps.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = activeStep === idx;
              const isPast = activeStep > idx;
              
              return (
                <button 
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`flex flex-col items-center gap-1.5 px-4 py-2 rounded-xl transition-all relative group
                    ${isActive ? 'bg-white shadow-sm ring-1 ring-primary-blue/10' : 'hover:bg-white/50'}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300
                    ${isActive ? 'bg-primary-blue text-white shadow-lg shadow-primary-blue/30 scale-110' : isPast ? 'bg-primary-blue/10 text-primary-blue' : 'bg-gray-100 text-gray-400'}`}>
                    <StepIcon size={18} />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider transition-colors
                    ${isActive ? 'text-primary-blue' : 'text-text-muted group-hover:text-text-main'}`}>
                    {step.title}
                  </span>
                  {isActive && (
                    <motion.div 
                      layoutId="active-step-indicator"
                      className="absolute -bottom-3 left-1/4 right-1/4 h-0.5 bg-primary-blue rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

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
                  {/* Enhanced Photo Upload UI */}
                  <div className="flex flex-col gap-4 p-6 bg-primary-blue/5 rounded-3xl border-2 border-dashed border-primary-blue/20 relative overflow-hidden group hover:border-primary-blue/40 transition-all">
                     <div className="flex items-center gap-6">
                       <div className="relative shrink-0">
                         <div className={`w-28 h-28 rounded-2xl border-2 border-dashed border-primary-blue/30 overflow-hidden flex items-center justify-center transition-all bg-white shadow-inner group-hover:scale-105 ${resumeData.personalInfo.photo ? 'border-none' : ''}`}>
                            {resumeData.personalInfo.photo ? (
                              <img src={resumeData.personalInfo.photo} className="w-full h-full object-cover" alt="Preview"/>
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <User size={32} className="text-primary-blue/20" />
                                <span className="text-[8px] font-black uppercase text-primary-blue/40">Sem Foto</span>
                              </div>
                            )}
                         </div>
                         <label className="absolute -bottom-3 -right-3 w-12 h-12 bg-primary-blue text-white rounded-2xl flex items-center justify-center cursor-pointer shadow-2xl hover:bg-deep-blue hover:scale-110 active:scale-95 transition-all border-4 border-white z-10">
                           <Plus size={24} />
                           <input 
                             type="file" 
                             accept="image/*"
                             className="hidden"
                             onChange={(e) => {
                               const file = e.target.files?.[0];
                               if (file) {
                                 const reader = new FileReader();
                                 reader.onloadend = () => {
                                   updatePersonalInfo('photo', reader.result as string);
                                 };
                                 reader.readAsDataURL(file);
                               }
                             }}
                           />
                         </label>
                       </div>

                       <div className="flex-1 space-y-2">
                         <h4 className="text-base font-black text-deep-blue uppercase tracking-tight">Foto no Currículo</h4>
                         <p className="text-xs text-text-muted font-medium leading-relaxed">
                           {resumeData.personalInfo.photo 
                             ? "Excelente! Sua foto já está no currículo. Você pode ajustar o estilo abaixo." 
                             : "Adicione uma foto profissional para aumentar sua credibilidade em até 40%."}
                         </p>
                         {!resumeData.personalInfo.photo && (
                           <div className="flex items-center gap-2 text-primary-blue font-bold text-[10px] animate-pulse">
                             <ChevronRight size={14} /> Clique no botão azul para enviar
                           </div>
                         )}
                         {resumeData.personalInfo.photo && (
                           <button onClick={() => updatePersonalInfo('photo', '')} className="text-[10px] text-red-500 uppercase font-black tracking-widest hover:text-red-600 flex items-center gap-1 transition-colors mt-2">
                             <Trash2 size={12}/> Remover Foto
                           </button>
                         )}
                       </div>
                     </div>
                  </div>

                  <div className="flex flex-col gap-3 p-4 bg-soft-blue/30 rounded-2xl border border-primary-blue/10">
                    <label className="text-[10px] font-black text-primary-blue uppercase tracking-wider">Ajustes da Foto</label>
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-2">
                        <span className="text-[9px] font-bold text-text-muted uppercase">Formato</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => updatePersonalInfo('photoStyle', 'circle')}
                            className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${resumeData.personalInfo.photoStyle === 'circle' ? 'bg-primary-blue text-white shadow-md' : 'bg-white border border-border-main text-text-muted'}`}
                          >Círculo</button>
                          <button 
                            onClick={() => updatePersonalInfo('photoStyle', 'square')}
                            className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${resumeData.personalInfo.photoStyle === 'square' ? 'bg-primary-blue text-white shadow-md' : 'bg-white border border-border-main text-text-muted'}`}
                          >Quadrado</button>
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <span className="text-[9px] font-bold text-text-muted uppercase">Tamanho</span>
                        <div className="flex items-center gap-3">
                           <input 
                              type="range" min="80" max="250" step="5" 
                              value={resumeData.personalInfo.photoSize || 100}
                              onChange={(e) => updatePersonalInfo('photoSize', parseInt(e.target.value))}
                              className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-blue"
                           />
                           <span className="text-[10px] font-bold text-primary-blue w-8">{resumeData.personalInfo.photoSize}px</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Input label="Nome Completo" value={resumeData.personalInfo.fullName} onChange={(v: string) => updatePersonalInfo('fullName', v)} placeholder="Ex: Ricardo Fernandes" icon={User} />
                  <Input label="Cargo Pretendido" value={resumeData.personalInfo.title} onChange={(v: string) => updatePersonalInfo('title', v)} placeholder="Ex: Diretor de Arte" icon={Briefcase} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Email" value={resumeData.personalInfo.email} onChange={(v: string) => updatePersonalInfo('email', v)} placeholder="email@exemplo.com" icon={Mail} />
                    <Input label="WhatsApp" value={resumeData.personalInfo.phone} onChange={(v: string) => updatePersonalInfo('phone', v)} placeholder="+244 9..." icon={Phone} />
                  </div>
                  <Input label="Localização" value={resumeData.personalInfo.location} onChange={(v: string) => updatePersonalInfo('location', v)} placeholder="Luanda, Angola" icon={MapPin} />
                  
                  <div className="p-6 bg-deep-blue text-white rounded-3xl space-y-4 shadow-xl border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary-blue/20 rounded-full blur-2xl translate-x-12 -translate-y-12"></div>
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-primary-blue rounded-xl">
                          <Plus size={20} className="animate-pulse" />
                       </div>
                       <h4 className="font-black uppercase text-[11px] tracking-widest text-white/90">Atalho Inteligente</h4>
                    </div>
                    <p className="text-xs text-white/70 font-medium leading-relaxed">Otimize seu tempo! Nossa IA gera sugestões de alto impacto para seu resumo e histórico profissional baseado no seu cargo atual.</p>
                    <Button 
                      variant="none"
                      className="w-full bg-white text-deep-blue hover:bg-white/90 h-11 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/10 transition-all active:scale-95" 
                      onClick={handleAutoFill}
                      disabled={loading}
                    >
                      {loading ? (
                         <div className="flex items-center gap-2">
                           <div className="w-3 h-3 border-2 border-primary-blue border-t-transparent rounded-full animate-spin"></div>
                           <span>Sincronizando Dados...</span>
                         </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Plus size={16} />
                          <span>Gerar Sugestões Profissionais</span>
                        </div>
                      )}
                    </Button>
                  </div>

                  <TextArea label="Resumo do Perfil" value={resumeData.personalInfo.summary} onChange={(v: string) => updatePersonalInfo('summary', v)} onOptimize={() => handleOptimize('summary')} isOptimizing={optimizingId === 'summary'} placeholder="Conte sua história profissional..." />
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
                      }} onOptimize={() => handleOptimize('experience', i)} isOptimizing={optimizingId === `exp-${i}`} />
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
                <div className="space-y-10">
                  <div className="space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary-blue">Habilidades</h3>
                    <div className="flex gap-2">
                       <Input 
                         placeholder="Ex: Marketing Digital" 
                         value={tempSkill}
                         onChange={setTempSkill}
                       />
                       <Button onClick={() => {
                         addSkill(tempSkill);
                         setTempSkill("");
                       }}>Adicionar</Button>
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

                  <div className="space-y-6 pt-6 border-t border-border-main">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary-blue">Idiomas</h3>
                    <div className="flex gap-2">
                       <Input 
                         placeholder="Ex: Inglês" 
                         value={tempLanguage}
                         onChange={setTempLanguage}
                       />
                       <Button onClick={() => {
                         addLanguage(tempLanguage);
                         setTempLanguage("");
                       }}>Adicionar</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {resumeData.languages.map(l => (
                         <span key={l.id} className="px-3 py-1.5 bg-soft-blue text-primary-blue rounded-lg font-bold text-xs flex items-center gap-2">
                           {l.name}
                           <button onClick={() => setResumeData(p => ({...p, languages: p.languages.filter(lk => lk.id !== l.id)}))}><X size={12} /></button>
                         </span>
                       ))}
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 4 && ( /* Design / Templates */
                <div className="space-y-8">
                  <div className="space-y-2">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary-blue">Estilo Visual</h3>
                    <p className="text-xs text-text-muted">Personalize a identidade do seu documento.</p>
                  </div>

                  <div className="p-6 bg-soft-blue/30 rounded-3xl border border-primary-blue/10 space-y-4">
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-black uppercase text-primary-blue tracking-widest">Cor Principal</span>
                       <div className="flex gap-2">
                          {['#1B2A4A', '#064E3B', '#7F1D1D', '#0369A1', '#0D4A45', '#4A4C53'].map(color => (
                            <button 
                              key={color}
                              onClick={() => setResumeData(p => ({ ...p, themeColor: color }))}
                              className={`w-6 h-6 rounded-full border-2 transition-all ${resumeData.themeColor === color ? 'border-primary-blue scale-125' : 'border-transparent'}`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                          <div className="relative w-8 h-8 rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center bg-white cursor-pointer">
                             <Plus size={14} className="text-text-muted" />
                             <input 
                                type="color" 
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => setResumeData(p => ({ ...p, themeColor: e.target.value }))}
                             />
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(TEMPLATES).map(([id, t]) => (
                      <button
                        key={id}
                        onClick={() => setTemplate(id as TemplateType)}
                        className={`group relative flex items-center gap-4 p-4 rounded-3xl border-2 transition-all duration-300 ${template === id ? 'border-primary-blue bg-soft-blue/10 shadow-md' : 'border-border-main hover:border-primary-blue/20 bg-white'}`}
                      >
                         <div 
                           className="w-20 h-20 rounded-2xl flex flex-col overflow-hidden shrink-0 border border-black/5 shadow-inner transition-colors duration-500"
                           style={{ background: resumeData.themeColor || t.colors.primary }}
                         >
                            <div className="h-5 w-full bg-white/20"></div>
                            <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-center">
                               <div className="h-1.5 w-2/3 bg-white/40 rounded-full"></div>
                               <div className="h-1.5 w-full bg-white/20 rounded-full"></div>
                               <div className="h-1.5 w-full bg-white/20 rounded-full"></div>
                            </div>
                         </div>
                         <div className="text-left flex-1 min-w-0">
                           <span className="text-sm font-black uppercase tracking-widest block truncate text-deep-blue">
                             {t.name}
                           </span>
                           <span className="text-[10px] text-text-muted font-bold uppercase tracking-tight opacity-70">
                             Layout {t.layout.split('-')[1]}
                           </span>
                         </div>
                         {template === id ? (
                           <div className="w-8 h-8 bg-primary-blue text-white rounded-full flex items-center justify-center shadow-lg">
                              <CheckCircle size={18} />
                           </div>
                         ) : (
                           <div className="w-6 h-6 rounded-full border-2 border-border-main group-hover:border-primary-blue/30 shrink-0"></div>
                         )}
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
                      <p className="text-sm opacity-80 font-medium text-balance">Você agora pode visualizar seu documento de maneira completa, baixá-lo ou gerar uma carta de apresentação.</p>
                      
                      <Button variant="outline" className="w-full text-white border-white hover:bg-white/10" onClick={() => { setIsCoverLetterMode(false); setShowPreviewModal(true); }} icon={ExternalLink}>Visualizar Online</Button>
                      <Button className="w-full bg-deep-blue text-white hover:bg-deep-blue/90 border-0" onClick={handleDownloadPdf} disabled={isDownloading} icon={Download}>
                        {isDownloading ? "Preparando o seu Currículo..." : "Baixar Currículo em PDF"}
                      </Button>
                   </div>

                   <div className="p-8 bg-white border-2 border-dashed border-primary-blue/30 rounded-3xl text-center space-y-4 overflow-hidden relative">
                      <AnimatePresence mode="wait">
                        {generatedLetter ? (
                          <motion.div 
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-4"
                          >
                             <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto relative">
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 bg-green-100 rounded-full opacity-50"></motion.div>
                                <CheckCircle size={32} className="relative z-10" />
                             </div>
                             <h4 className="text-lg font-black text-deep-blue">Carta Gerada com Sucesso</h4>
                             <p className="text-xs text-text-muted font-medium">A sua carta foi adaptada para o seu cargo e já está pronta.</p>
                             
                             <Button className="w-full bg-white text-primary-blue border border-primary-blue hover:bg-primary-blue/5" onClick={() => { setIsCoverLetterMode(true); setShowPreviewModal(true); }}>
                               Visualizar Carta
                             </Button>
                             <Button className="w-full bg-primary-blue text-white hover:bg-primary-blue/90" onClick={() => { setIsCoverLetterMode(true); setTimeout(handleDownloadPdf, 100); }} disabled={isDownloading} icon={Download}>
                               {isDownloading ? "Gerando PDF..." : "Baixar Carta em PDF"}
                             </Button>
                          </motion.div>
                        ) : (
                          <motion.div 
                            key="create"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                          >
                             <div className="w-16 h-16 bg-soft-blue text-primary-blue rounded-2xl flex items-center justify-center mx-auto mb-2">
                                <FileText size={32} />
                             </div>
                             <h4 className="text-lg font-black text-deep-blue">Carta de Apresentação</h4>
                             <p className="text-xs text-text-muted font-medium leading-relaxed">Destaque sua candidatura! Gere uma carta estratégica e personalizada para a vaga dos seus sonhos por apenas 1150 Kzs.</p>
                             
                             <Button variant="none" className="w-full bg-primary-blue text-white hover:bg-deep-blue h-12 text-sm font-black uppercase tracking-widest shadow-xl shadow-primary-blue/20 transition-all rounded-2xl" onClick={handleCreateCoverLetter} disabled={loading}>
                                {loading ? (
                                   <div className="flex items-center justify-center gap-2">
                                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                      <span>A Redigir...</span>
                                   </div>
                                ) : "Gerar Carta Premium"}
                             </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                   </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="p-6 border-t border-border-main bg-white flex justify-between gap-4">
           <Button variant="ghost" disabled={activeStep === 0} onClick={() => setActiveStep(s => s - 1)}>Anterior</Button>
           <Button disabled={activeStep === 5} onClick={() => setActiveStep(s => s + 1)} className="px-10" icon={ChevronRight}>
             {activeStep === 5 ? 'Concluído' : 'Próximo'}
           </Button>
        </footer>
      </aside>

      {/* Preview Section - Transformed to Modal explicitly on request/mobile, hidden standard */}
      <main className={`flex-1 overflow-y-auto overflow-x-hidden w-full custom-scrollbar transition-all duration-300 print:flex print:bg-white print:p-0 print:m-0 print:overflow-visible flex-col items-center ${showPreviewModal ? 'fixed inset-0 z-50 bg-bg-main/95 backdrop-blur-md pt-20 pb-8 px-2 flex' : 'hidden print:flex'}`}>
        
        {loading && (
          <div className="fixed inset-0 bg-white/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center gap-6 print:hidden">
             <div className="w-16 h-16 border-4 border-primary-blue border-t-transparent rounded-full animate-spin shadow-2xl"></div>
             <div className="flex flex-col items-center gap-2">
               <img 
                 src="https://i.supaimg.com/6bc04951-8cbe-4706-9f0c-a01f9ea9a6c4/f7862e8c-46f6-4d82-a9e0-b9cb52c6fc4f.png" 
                 alt="CV LAB" 
                 className="h-12 w-auto object-contain brightness-0 invert"
                 referrerPolicy="no-referrer" 
               />
               <p className="font-black text-primary-blue text-[10px] tracking-[0.3em] uppercase animate-pulse">Inteligência Artificial Ativada</p>
             </div>
          </div>
        )}

        {/* Modal Close & Actions Header */}
        {showPreviewModal && (
          <div className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-border-main flex items-center justify-start px-4 md:px-8 print:hidden shadow-sm z-[60]">
             <button onClick={() => setShowPreviewModal(false)} className="flex items-center gap-2 text-xs font-bold text-text-muted hover:text-text-main transition-colors">
               <X size={16}/> <span>Sair da Pré-visualização</span>
             </button>
          </div>
        )}

        {/* Scaled Wrapper to prevent horizontal scroll and extra vertical whitespace */}
        <div 
          className="flex justify-center w-full"
          style={{ height: showPreviewModal ? `${1123 * previewScale}px` : 'auto' }}
        >
          <div 
            className={`origin-top transition-all duration-700 print:shadow-none print:w-full shadow-[0_60px_120px_-20px_rgba(0,0,0,0.2)]`}
            style={{ 
              transform: showPreviewModal ? `scale(${previewScale})` : 'none',
              width: '794px',
              height: '1123px',
              flexShrink: 0
            }}
          >
             <AnimatePresence mode="wait">
               {isCoverLetterMode ? (
                 <motion.div 
                   key="letter"
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   id="cover-letter-content"
                   className="bg-white min-h-[1123px] w-[794px] p-20 relative flex flex-col font-sans text-left shadow-2xl"
                 >
                    <button data-html2canvas-ignore="true" onClick={() => setIsCoverLetterMode(false)} className="absolute top-8 left-8 text-[10px] font-black uppercase text-primary-blue tracking-widest flex items-center gap-2 print:hidden group bg-soft-blue px-4 py-2 rounded-full hover:bg-primary-blue hover:text-white transition-all">
                       <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Voltar ao Editor
                    </button>

                    {/* Minimalist Professional Header */}
                    <div className="flex justify-between items-end border-b-4 border-primary-blue/5 pb-10 mb-12 mt-8">
                      <div className="space-y-1">
                        <h1 className="text-4xl font-black text-deep-blue tracking-tighter uppercase leading-none">
                          {resumeData.personalInfo.fullName || 'Seu Nome'}
                        </h1>
                        <p className="text-primary-blue font-black tracking-[0.2em] text-[10px] uppercase">
                          {resumeData.personalInfo.title || 'Seu Cargo'}
                        </p>
                      </div>
                      <div className="text-right space-y-1 text-text-muted font-medium text-[11px]">
                        <div className="flex items-center justify-end gap-2 text-primary-blue font-bold">
                          <span>{resumeData.personalInfo.phone}</span>
                          <span className="opacity-30">•</span>
                          <span>{resumeData.personalInfo.email}</span>
                        </div>
                        <p className="uppercase tracking-wider opacity-60 font-black">{resumeData.personalInfo.location}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 mb-12">
                      <span className="text-primary-blue font-black text-[9px] uppercase tracking-[0.3em] mb-1">Data de Emissão</span>
                      <div className="text-deep-blue text-sm font-bold">
                        {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                    
                    <div className="flex-1 text-justify whitespace-pre-line text-[15px] leading-[1.8] text-slate-700 font-medium">
                       {renderText(generatedLetter)}
                    </div>

                    <div className="mt-20 pt-16 border-t border-gray-100 flex justify-between items-center">
                       <div className="text-left">
                          <p className="text-xs text-text-muted uppercase tracking-widest mb-1">Atentamente,</p>
                          <p className="text-lg font-black text-deep-blue tracking-tight underline decoration-primary-blue/30 decoration-4 underline-offset-8">
                             {resumeData.personalInfo.fullName}
                          </p>
                       </div>
                       <div className="w-24 h-24 bg-soft-blue/50 rounded-full flex items-center justify-center opacity-20 filter grayscale">
                          <CheckCircle size={32} className="text-primary-blue" />
                       </div>
                    </div>
                 </motion.div>
               ) : (
                 <ResumeRenderer data={resumeData} templateId={template} />
               )}
             </AnimatePresence>
          </div>
        </div>
      </main>

      {/* WhatsApp Support Floating Button - Only on Landing Page */}
      {view === 'landing' && (
        <motion.a
          href="https://wa.me/message/PMCAAS2LKZBSM1"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-8 right-8 z-[100] w-14 h-14 bg-primary-blue text-white rounded-full flex items-center justify-center shadow-2xl hover:shadow-primary-blue/40 transition-all cursor-pointer group"
        >
          <MessageCircle size={28} fill="currentColor" />
          <span className="absolute right-full mr-4 bg-white text-deep-blue text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-xl opacity-0 translate-x-4 pointer-events-none transition-all group-hover:opacity-100 group-hover:translate-x-0 hidden md:block whitespace-nowrap">
            Suporte WhatsApp
          </span>
        </motion.a>
      )}
    </div>
  );
}
