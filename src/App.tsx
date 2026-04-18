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
  CheckCircle
} from 'lucide-react';
import { ResumeData, INITIAL_RESUME_DATA, TemplateType } from './types.ts';
import { optimizeResumeText, generateCoverLetter } from './services/geminiService.ts';
import html2pdf from 'html2pdf.js';

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
          {isOptimizing ? 'OTIMIZANDO...' : 'OTIMIZAR IA'}
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
  t1_executive: { name: 'Executive Dark', layout: 'custom-t1', colors: { primary: '#1B2A4A', text: '#4B5563', heading: '#1B2A4A', soft: '#1B2A4A', lines: '#E5E7EB' } },
  t1_emerald: { name: 'Executive Emerald',  layout: 'custom-t1', colors: { primary: '#064E3B', text: '#4B5563', heading: '#064E3B', soft: '#064E3B', lines: '#E5E7EB' } },
  t2_geometric: { name: 'Geometric Mod', layout: 'custom-t2', colors: { primary: '#1B2A4A', text: '#4B5563', heading: '#1B2A4A', soft: '#F9FAFB', lines: '#F3F4F6' } },
  t2_burgundy: { name: 'Geometric Crimson',  layout: 'custom-t2', colors: { primary: '#7F1D1D', text: '#4B5563', heading: '#7F1D1D', soft: '#FEF2F2', lines: '#FEE2E2' } },
  t3_teal: { name: 'Teal Bold', layout: 'custom-t3', colors: { primary: '#0D4A45', text: '#4B5563', heading: '#0D4A45', soft: '#F0FAF9', lines: '#D1FAF6', dark: '#082E2A' } },
  t3_ocean: { name: 'Ocean Bold', layout: 'custom-t3', colors: { primary: '#0369A1', text: '#4B5563', heading: '#0369A1', soft: '#F0F9FF', lines: '#BAE6FD', dark: '#075985' } },
  t4_barnabas: { name: 'Clean Sidebar', layout: 'custom-t4', colors: { primary: '#2D313A', text: '#3E4249', heading: '#333333', soft: '#2D313A', lines: '#E5E7EB' } },
  t5_jonathan: { name: 'Jonathan Arches', layout: 'custom-t5', colors: { primary: '#4A4C53', text: '#555555', heading: '#222222', soft: '#F3F4F6', lines: '#D1D5DB' } }
};

// --- Helper to clean up Markdown / AI formatting ---
const renderText = (str: string) => str ? str.replace(/\*/g, '') : '';

const ResumeRenderer = ({ data, templateId }: { data: ResumeData; templateId: TemplateType }) => {
  const theme = TEMPLATES[templateId] || TEMPLATES.t1_executive;
  const c = theme.colors;

  return (
    <div className={`bg-white h-[1123px] w-[794px] relative overflow-hidden print:shadow-none`} id="resume-content" style={{ color: '#1f2937' }}>
      
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
          <div className="t2-bg-shapes">
             <div className="t2-shape1"></div>
             <div className="t2-shape2"></div>
          </div>
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
                   <div className="t2-section-title">Contato</div>
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
             </div>
             
             <div className="t2-right">
                {data.experience.length > 0 && (
                  <div className="t2-section">
                     <div className="t2-section-title">Experiência</div>
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
                    <div className="t3-section-title text-center">Contato</div>
                    {data.personalInfo.email && <div className="t3-contact-row"><span className="t3-contact-icon flex items-center"><Mail size={12}/></span> <span className="t3-contact-text">{data.personalInfo.email}</span></div>}
                    {data.personalInfo.phone && <div className="t3-contact-row"><span className="t3-contact-icon flex items-center"><Phone size={12}/></span> <span className="t3-contact-text">{data.personalInfo.phone}</span></div>}
                    {data.personalInfo.location && <div className="t3-contact-row"><span className="t3-contact-icon flex items-center"><MapPin size={12}/></span> <span className="t3-contact-text">{data.personalInfo.location}</span></div>}
                 </div>
                 
                 {data.education.length > 0 && (
                   <div className="t3-section">
                     <div className="t3-section-title text-center">Educação</div>
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
                      <div className="t3-section-title text-center">Experiência</div>
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
                                 <div className="t3-skill-bar-fill h-full rounded-full" style={{ width: s.level === 'Expert' ? '100%' : s.level === 'Advanced' ? '75%' : s.level === 'Intermediate' ? '50%' : '25%' }}></div>
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
        <div className="flex w-full min-h-[1123px] bg-white text-left font-sans overflow-hidden relative border border-gray-100">
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
                   <h3 className="text-xl font-bold mb-5 pb-2 text-white border-b-2 border-white/20 inline-block pr-6">Contact</h3>
                   <div className="flex flex-col gap-4 text-[13px] opacity-90">
                     {data.personalInfo.email && <div className="flex items-center gap-3"><Mail size={16} className="opacity-70"/> {data.personalInfo.email}</div>}
                     {data.personalInfo.phone && <div className="flex items-center gap-3"><Phone size={16} className="opacity-70"/> {data.personalInfo.phone}</div>}
                     {data.personalInfo.location && <div className="flex items-center gap-3"><MapPin size={16} className="opacity-70"/> {data.personalInfo.location}</div>}
                   </div>
                </div>
                {data.languages && data.languages.length > 0 && (
                  <div>
                     <h3 className="text-xl font-bold mb-5 pb-2 text-white border-b-2 border-white/20 inline-block pr-6">Languages</h3>
                     <div className="flex flex-col gap-3 text-[13px] opacity-90">
                       {data.languages.map((l, i) => <div key={i} className="flex items-center gap-2">• {l}</div>)}
                     </div>
                  </div>
                )}
             </div>
          </div>
          <div className="w-[68%] p-14 flex flex-col gap-10 bg-white" style={{ color: '#1f2937' }}>
             {data.personalInfo.summary && (
               <div>
                  <h2 className="text-[28px] font-black mb-4 leading-tight" style={{ color: '#111827' }}>Profile</h2>
                  <div className="w-12 h-1.5 bg-gray-200 mb-6 rounded-full"></div>
                  <p className="text-[14px] leading-[1.8] text-justify font-serif" style={{ color: '#374151' }}>{renderText(data.personalInfo.summary)}</p>
               </div>
             )}
             {data.experience.length > 0 && (
               <div>
                  <h2 className="text-[28px] font-black mb-4 leading-tight" style={{ color: '#111827' }}>Experience</h2>
                  <div className="w-12 h-1.5 bg-gray-200 mb-8 rounded-full"></div>
                  <div className="flex flex-col gap-10">
                    {data.experience.map(ex => (
                      <div key={ex.id} className="relative pl-6 border-l-2 border-gray-100">
                         <div className="absolute top-1 -left-[9px] w-4 h-4 rounded-full bg-white border-2 border-gray-200"></div>
                         <h4 className="text-[16px] font-bold mb-1" style={{ color: '#1f2937' }}>{ex.position}</h4>
                         <div className="flex justify-between items-center mb-4">
                            <span className="text-[13px] font-bold tracking-tight uppercase" style={{ color: '#4b5563' }}>{ex.company}</span>
                            <span className="text-[11px] font-black bg-gray-100 px-2 py-1 rounded" style={{ color: '#6b7280' }}>{ex.startDate} - {ex.current ? 'Present' : ex.endDate}</span>
                         </div>
                         <p className="text-[13px] leading-[1.7] text-justify font-serif mt-1" style={{ color: '#4b5563' }}>{renderText(ex.description)}</p>
                      </div>
                    ))}
                  </div>
               </div>
             )}
             {data.skills.length > 0 && (
               <div>
                  <h2 className="text-[28px] font-black mb-4 leading-tight" style={{ color: '#111827' }}>Skills</h2>
                  <div className="w-12 h-1.5 bg-gray-200 mb-6 rounded-full"></div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] leading-[1.8] font-serif" style={{ color: '#374151' }}>
                    {data.skills.map(s => <span key={s.id} className="flex items-center gap-2 font-bold">• {s.name}</span>)}
                  </div>
               </div>
             )}
             {data.education.length > 0 && (
               <div>
                  <h2 className="text-[28px] font-black mb-4 leading-tight" style={{ color: '#111827' }}>Education</h2>
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
        <div className="flex w-full min-h-[1123px] bg-white text-left font-sans overflow-hidden relative">
           <div className="w-[35%] flex flex-col relative z-10 pt-16" style={{ backgroundColor: c.soft }}>
             <div className="bg-white h-56 w-full absolute top-0 left-0" style={{ borderBottomLeftRadius: '50%', borderBottomRightRadius: '50%', transform: 'scaleX(1.4)', transformOrigin: 'top center' }}></div>
             <div className="relative z-20 w-full flex flex-col items-center px-8">
                {data.personalInfo.photo ? (
                  <img 
                    src={data.personalInfo.photo} 
                    referrerPolicy="no-referrer" 
                    className="object-cover object-top border-[6px] border-white mb-10 shadow-xl" 
                    style={{ 
                      width: `${data.personalInfo.photoSize || 150}px`,
                      height: `${data.personalInfo.photoSize || 150}px`,
                      borderRadius: data.personalInfo.photoStyle === 'circle' ? '50%' : '16px'
                    }}
                  />
                ) : (
                  <div 
                    className="border-[6px] border-white mb-10 flex items-center justify-center font-black shadow-xl" 
                    style={{ 
                      backgroundColor: '#e5e7eb', 
                      color: '#6b7280',
                      width: `${data.personalInfo.photoSize || 150}px`,
                      height: `${data.personalInfo.photoSize || 150}px`,
                      borderRadius: data.personalInfo.photoStyle === 'circle' ? '50%' : '16px',
                      fontSize: `${(data.personalInfo.photoSize || 150) * 0.4}px`
                    }}
                  >
                    {data.personalInfo.fullName.charAt(0)}
                  </div>
                )}
                
                <div className="w-full mb-10">
                  <div className="flex justify-center mb-5">
                     <h3 className="border-2 rounded-[20px] px-6 py-1 text-[11px] font-bold text-center uppercase tracking-[0.15em] bg-white" style={{ borderColor: c.primary, color: c.primary }}>Contact</h3>
                  </div>
                  <div className="flex flex-col gap-4 text-[13px] w-full px-2" style={{ color: c.text }}>
                     {data.personalInfo.phone && <div className="flex items-center gap-3"><Phone className="opacity-60" size={16}/> {data.personalInfo.phone}</div>}
                     {data.personalInfo.email && <div className="flex items-center gap-3"><Mail  className="opacity-60" size={16}/> {data.personalInfo.email}</div>}
                     {data.personalInfo.location && <div className="flex items-center gap-3"><MapPin className="opacity-60" size={16}/> {data.personalInfo.location}</div>}
                  </div>
                </div>

                {data.skills.length > 0 && (
                  <div className="w-full mb-10">
                    <div className="flex justify-center mb-5">
                       <h3 className="border-2 rounded-[20px] px-6 py-1 text-[11px] font-bold text-center uppercase tracking-[0.15em] bg-white" style={{ borderColor: c.primary, color: c.primary }}>Skills</h3>
                    </div>
                    <ul className="flex flex-col gap-3 text-[13px] w-full px-4 list-disc pl-6" style={{ color: c.text }}>
                       {data.skills.map(s => (
                         <li key={s.id} className="font-semibold">{s.name}</li>
                       ))}
                    </ul>
                  </div>
                )}
                
                {data.education.length > 0 && (
                  <div className="w-full mb-10">
                    <div className="flex justify-center mb-5">
                       <h3 className="border-2 rounded-[20px] px-6 py-1 text-[11px] font-bold text-center uppercase tracking-[0.15em] bg-white" style={{ borderColor: c.primary, color: c.primary }}>Education</h3>
                    </div>
                    <div className="flex flex-col gap-5 text-[12px] w-full px-2" style={{ color: c.text }}>
                       {data.education.map(e => (
                         <div key={e.id}>
                            <div className="font-black mb-1 text-[13px]" style={{ color: c.primary }}>{e.institution}</div>
                            <div className="font-bold opacity-80">{e.startDate} - {e.endDate}</div>
                            <div className="mt-1">{e.degree}</div>
                         </div>
                       ))}
                    </div>
                  </div>
                )}
             </div>
           </div>

           <div className="w-[65%] py-20 px-12 flex flex-col gap-10">
              <div className="pb-4">
                 <h1 className="text-[54px] uppercase font-light leading-[1.05] tracking-tight" style={{ color: c.primary }}>
                   {data.personalInfo.fullName.split(' ')[0]} <br/>
                   <span className="font-black">{data.personalInfo.fullName.split(' ').slice(1).join(' ')}</span>
                 </h1>
                 <p className="text-[18px] uppercase tracking-[0.25em] font-bold mt-4" style={{ color: c.primary }}>{data.personalInfo.title}</p>
              </div>

              {data.personalInfo.summary && (
                <div>
                   <h2 className="text-[20px] font-black uppercase tracking-[0.2em] mb-4" style={{ color: c.primary }}>Professional Profile</h2>
                   <div className="w-full h-1 bg-gray-100 mb-6">
                      <div className="h-full w-20" style={{ backgroundColor: c.primary }}></div>
                   </div>
                   <p className="text-[14px] leading-relaxed text-justify" style={{ color: '#4b5563' }}>{renderText(data.personalInfo.summary)}</p>
                </div>
              )}

              {data.experience.length > 0 && (
                <div>
                   <h2 className="text-[20px] font-black uppercase tracking-[0.2em] mb-4" style={{ color: c.primary }}>Work Experience</h2>
                   <div className="w-full h-1 bg-gray-100 mb-8 font-black">
                      <div className="h-full w-20" style={{ backgroundColor: c.primary }}></div>
                   </div>
                   <div className="flex flex-col gap-10">
                     {data.experience.map(ex => (
                       <div key={ex.id}>
                          <div className="flex justify-between items-baseline mb-2">
                             <h4 className="text-[16px] font-black uppercase" style={{ color: '#1f2937' }}>{ex.position}</h4>
                             <span className="text-[11px] font-bold px-3 py-1 bg-gray-100 rounded-full" style={{ color: '#6b7280' }}>{ex.startDate} - {ex.current ? "Present" : ex.endDate}</span>
                          </div>
                          <div className="text-[13px] font-bold mb-4 italic" style={{ color: c.primary }}>{ex.company}</div>
                          <p className="text-[13px] leading-relaxed text-justify" style={{ color: '#4b5563' }}>{renderText(ex.description)}</p>
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
  const [view, setView] = useState<'landing' | 'editor' | 'faq' | 'about' | 'terms'>('landing');
  const [activeStep, setActiveStep] = useState(0);
  const [resumeData, setResumeData] = useState<ResumeData>(INITIAL_RESUME_DATA);
  const [loading, setLoading] = useState(false);
  const [optimizingId, setOptimizingId] = useState<string | null>(null);
  const [isCoverLetterMode, setIsCoverLetterMode] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState("");
  const [tempSkill, setTempSkill] = useState("");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const [template, setTemplate] = useState<TemplateType>('t1_executive');
  const [previewScale, setPreviewScale] = useState(1);

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

  const handleDownloadPdf = async () => {
    const elementId = isCoverLetterMode ? 'cover-letter-content' : 'resume-content';
    const element = document.getElementById(elementId);
    if (!element) return;

    setIsDownloading(true);
    
    // Configurações do html2pdf
    const opt = {
      margin:       0,
      filename:     isCoverLetterMode ? 'Carta_Apresentacao.pdf' : `${resumeData.personalInfo.fullName.replace(/\s+/g, '_')}_Curriculo.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794
      },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
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
    { title: 'Skills', icon: Settings },
    { title: 'Design', icon: FileText },
    { title: 'Finalizar', icon: CheckCircleIcon }
  ];

  function CheckCircleIcon(props: any) {
    return <FileText {...props} />;
  }

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
      alert("A IA não conseguiu sugerir mudanças significativas para este texto. Tente adicionar mais detalhes.");
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

  if (view === 'landing') {
    return (
      <div className="min-h-screen hero-gradient flex flex-col">
        <nav className="h-20 px-6 md:px-12 flex items-center justify-between glass sticky top-0 z-50">
          <div className="text-xl md:text-2xl font-black text-primary-blue tracking-tighter flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-blue rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-blue/30 rotate-3">
              <Plus size={20} />
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

        {/* New Top Flyer Banner - Glued to Header */}
        <div className="w-full">
          <img 
            src="https://i.supaimg.com/6bc04951-8cbe-4706-9f0c-a01f9ea9a6c4/d25d88cc-8de9-4afc-8385-0ed21b0e333b.png" 
            alt="Flyer Institucional" 
            className="w-full h-auto"
            referrerPolicy="no-referrer"
          />
        </div>

        <main className="flex-1 flex flex-col md:flex-row items-center px-6 md:px-12 py-12 md:py-20 gap-16 max-w-7xl mx-auto w-full">
          <div className="flex-1 flex flex-col gap-8">
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
                    <CheckCircleIcon size={16} />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </main>

        {/* Flyer Full Width Banner - Positioned after the Hero/Resume Vector - Full Bleed */}
        <div className="w-full mb-12">
          <img 
            src="https://i.supaimg.com/6bc04951-8cbe-4706-9f0c-a01f9ea9a6c4/4406a25d-b692-476b-955d-409d5a851e46.jpg" 
            alt="Flyer Promocional" 
            className="w-full h-auto"
            referrerPolicy="no-referrer"
          />
        </div>

        <section className="bg-white py-20 px-6 border-t border-border-main">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
            {[
              { title: "Texto Otimizado", desc: "Nossa IA transforma rascunhos em conquistas profissionais marcantes.", icon: FileText },
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
              <Plus size={20} />
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
    <div className="min-h-screen bg-bg-main flex flex-col md:flex-row justify-center md:h-screen md:overflow-hidden print:bg-white print:h-auto print:overflow-visible">
      
      {/* Sidebar Editor */}
      <aside className={`w-full max-w-3xl mx-auto md:w-[600px] bg-white border-x border-border-main flex flex-col shadow-2xl z-30 print:hidden shrink-0 ${showPreviewModal ? 'hidden' : 'flex'}`}>
        <header className="p-4 border-b border-border-main flex items-center justify-between sticky top-0 bg-white z-40 shadow-sm">
          <div className="flex items-center gap-3">
             <button onClick={() => setView('landing')} className="p-2 hover:bg-bg-main rounded-xl transition-colors text-text-muted">
               <ChevronLeft size={20} />
             </button>
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-blue hidden sm:inline">CV Lab Editor</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-soft-blue text-primary-blue text-[9px] font-black rounded-full hidden md:block">STEP {activeStep + 1}/6</div>
            <Button variant="outline" className="h-9 px-4 text-xs font-bold" onClick={() => setShowPreviewModal(true)} icon={ExternalLink}>Pré-Visualizar</Button>
            <Button className="h-9 px-4 text-xs font-bold hidden sm:flex" onClick={handleDownloadPdf} disabled={isDownloading} icon={Download}>{isDownloading ? 'Baixando...' : 'Baixar'}</Button>
          </div>
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
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-wider">Foto de Perfil (Opcional)</label>
                    <input 
                      type="file" 
                      accept="image/*"
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
                      className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-soft-blue file:text-primary-blue hover:file:bg-primary-blue/10 cursor-pointer text-text-muted"
                    />
                    {resumeData.personalInfo.photo && (
                       <div className="mt-1 flex items-center justify-between">
                         <div className="text-[10px] font-bold text-green-600 flex items-center gap-1"><CheckCircleIcon size={12}/> Foto adicionada.</div>
                         <button onClick={() => updatePersonalInfo('photo', '')} className="text-[9px] text-red-500 uppercase font-black tracking-widest hover:underline">Remover</button>
                       </div>
                    )}
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
                  <div className="space-y-2">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary-blue">Catálogo de Modelos</h3>
                    <p className="text-xs text-text-muted">Selecione o estilo visual que melhor representa sua carreira.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(TEMPLATES).map(([id, t]) => (
                      <button
                        key={id}
                        onClick={() => setTemplate(id as TemplateType)}
                        className={`group relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 ${template === id ? 'border-primary-blue bg-soft-blue/10 shadow-sm' : 'border-border-main hover:border-primary-blue/20 bg-white'}`}
                      >
                         <div 
                           className="w-16 h-16 rounded-xl flex flex-col overflow-hidden shrink-0 border border-black/5 shadow-sm"
                           style={{ background: t.colors.primary }}
                         >
                            <div className="h-4 w-full bg-white/20"></div>
                            <div className="p-2 space-y-1">
                               <div className="h-1 w-2/3 bg-white/40 rounded-full"></div>
                               <div className="h-1 w-full bg-white/20 rounded-full"></div>
                               <div className="h-1 w-full bg-white/20 rounded-full"></div>
                            </div>
                         </div>
                         <div className="text-left flex-1 min-w-0">
                           <span className="text-[11px] font-black uppercase tracking-widest block truncate" style={{ color: template === id ? '#0066FF' : '#334155' }}>
                             {t.name}
                           </span>
                           <span className="text-[9px] text-text-muted font-bold uppercase tracking-tighter opacity-70">
                             Layout {t.layout.split('-')[1]}
                           </span>
                         </div>
                         {template === id ? (
                           <CheckCircle size={20} className="text-primary-blue shrink-0" />
                         ) : (
                           <div className="w-5 h-5 rounded-full border-2 border-border-main group-hover:border-primary-blue/30 shrink-0"></div>
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
                      <Button className="w-full bg-white text-primary-blue hover:bg-white/95" onClick={() => setShowPreviewModal(true)} icon={ExternalLink}>Pré-Visualizar</Button>
                      <Button variant="outline" className="w-full text-white border-white hover:bg-white/10" onClick={handleDownloadPdf} disabled={isDownloading} icon={Download}>{isDownloading ? "Gerando PDF..." : "Baixar Currículo"}</Button>
                   </div>

                   <div className="p-8 bg-white border-2 border-dashed border-primary-blue/30 rounded-3xl text-center space-y-4">
                      <div className="w-16 h-16 bg-soft-blue text-primary-blue rounded-2xl flex items-center justify-center mx-auto mb-2">
                         <FileText size={32} />
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

      {/* Preview Section - Transformed to Modal explicitly on request/mobile, hidden standard */}
      <main className={`flex-1 overflow-y-auto overflow-x-hidden w-full custom-scrollbar transition-all duration-300 print:flex print:bg-white print:p-0 print:m-0 print:overflow-visible flex-col items-center ${showPreviewModal ? 'fixed inset-0 z-50 bg-bg-main/95 backdrop-blur-md pt-20 pb-8 px-2 flex' : 'hidden print:flex'}`}>
        
        {loading && (
          <div className="fixed inset-0 bg-white/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center gap-6 print:hidden">
             <div className="w-16 h-16 border-4 border-primary-blue border-t-transparent rounded-full animate-spin shadow-2xl"></div>
             <p className="font-black text-primary-blue text-[10px] tracking-[0.3em] uppercase animate-pulse">Inteligência CV LAB Ativada</p>
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
                   className={`bg-white min-h-[1123px] w-[794px] p-10 md:p-20 relative`}
                 >
                   <button onClick={() => setIsCoverLetterMode(false)} className="absolute top-8 left-8 text-[10px] font-black uppercase text-primary-blue tracking-widest flex items-center gap-2 print:hidden">
                      <ChevronLeft size={14} /> Voltar ao Currículo
                   </button>
                   <div className="max-w-prose mx-auto text-justify whitespace-pre-line text-sm md:text-lg leading-relaxed pt-12" style={{ color: '#334155' }}>
                      {renderText(generatedLetter)}
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
        <a 
          href="https://wa.me/244954748806" 
          target="_blank" 
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-[100] bg-[#25D366] text-white p-4 rounded-full shadow-[0_8px_30px_rgb(37,211,102,0.4)] hover:scale-110 active:scale-95 transition-all flex items-center gap-3 group print:hidden"
        >
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-500 font-bold text-xs uppercase tracking-widest">Suporte WhatsApp</span>
          <svg 
            viewBox="0 0 24 24" 
            width="24" 
            height="24" 
            stroke="currentColor" 
            strokeWidth="2" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-7.6 8.38 8.38 0 0 1 3.8.9L22 4l-2 5z"></path>
          </svg>
        </a>
      )}
    </div>
  );
}
