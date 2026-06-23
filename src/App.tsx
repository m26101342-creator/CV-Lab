/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Minus,
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
  Facebook,
  Instagram,
  Shield,
  LogOut,
  Search,
  Upload,
  Sparkles,
  Zap,
  Languages,
  RotateCcw,
  Award,
  AlertTriangle,
  AlertCircle,
  Printer,
  Video,
  Type,
  Grid,
  Scissors,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { AdSenseUnit } from './components/AdSenseUnit';
import { ResumeData, INITIAL_RESUME_DATA, TemplateType, ResumeStyleConfig } from './types.ts';
import { optimizeResumeText, generateCoverLetter, generateFullResume, parseResumeFromText, translateResumeToEnglish, translateLetterToEnglish, translateResumeToSpanish, translateLetterToSpanish, alterResumeInformation } from './services/geminiService.ts';
import { pdf } from '@react-pdf/renderer';
import { PdfDocument } from './pdf/PdfDocument';
import * as pdfjsLib from 'pdfjs-dist';

// Use CDN for worker to ensure reliability in all environments
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.6.205/build/pdf.worker.min.mjs`;

import { 
    auth, db, useAuth, loginWithGoogle, logOut,
    collection, addDoc, onSnapshot, doc, query, where, getDocs, updateDoc, setDoc, serverTimestamp, getDoc, deleteDoc,
    createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile
} from './lib/firebase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';

// --- Helper Functions ---

const extractTextFromPDF = async (file: File): Promise<{ text: string, image?: string }> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    let fullText = "";
    
    // Attempt text extraction
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => (item as any).str).join(" ");
        fullText += pageText + "\n";
    }

    let imageBase64: string | undefined = undefined;

    // Fallback: If text is empty or very short, capture first page as image for AI Vision OCR
    if (fullText.trim().length < 50 && pdf.numPages > 0) {
      console.log("PDF parece ser uma imagem. Tentando renderizar página para OCR via Visão computacional...");
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 2.0 }); // High quality for better OCR
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (context) {
        await (page as any).render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        imageBase64 = canvas.toDataURL('image/png');
      }
    }

    return { text: fullText, image: imageBase64 };
  } catch (error) {
    console.error("Erro ao extrair texto do PDF:", error);
    throw new Error("Não foi possível ler o arquivo PDF. Verifique se o arquivo não está protegido por senha.");
  }
};

// --- UI Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, icon: Icon, type = 'button' }: any) => {
  const base = "px-6 py-2.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.96] disabled:opacity-40 disabled:cursor-not-allowed text-xs tracking-wider uppercase";
  const variants: any = {
    primary: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/15 hover:from-blue-500 hover:to-indigo-500 border border-white/20 h-11",
    secondary: "bg-white/30 backdrop-blur-md text-gray-800 border border-white/40 shadow-sm hover:bg-white/50 h-11",
    outline: "border border-blue-500/30 text-blue-600 bg-white/20 backdrop-blur-md hover:bg-white/40 h-11",
    ghost: "text-gray-500 hover:text-gray-800 hover:bg-white/30 h-11",
    danger: "bg-red-500/10 backdrop-blur-md text-red-600 hover:bg-red-500/20 h-11 border border-red-500/15",
    none: ""
  };

  return (
    <button type={type} onClick={onClick} className={`${base} ${variants[variant] || ''} ${className}`} disabled={disabled}>
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
};

const Input = ({ label, value, onChange, placeholder, type = 'text', icon: Icon, disabled = false, ...props }: any) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">{label}</label>}
    <div className="relative group">
      {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-blue-500" size={14} />}
      <input
        {...props}
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full bg-white/35 backdrop-blur-md border border-white/40 rounded-xl px-4 h-11 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/60 transition-all shadow-sm ${Icon ? 'pl-9' : ''} ${disabled ? 'opacity-40 bg-gray-50/50' : ''}`}
      />
    </div>
  </div>
);

const TextArea = ({ label, value, onChange, placeholder, onOptimize, isOptimizing }: any) => (
  <div className="flex flex-col gap-1.5 w-full relative">
    <div className="flex justify-between items-center px-1">
      {label && <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</label>}
      {onOptimize && (
        <button 
          onClick={onOptimize}
          disabled={isOptimizing}
          className={`text-[9px] font-bold text-blue-600 flex items-center gap-1.5 transition-all bg-white/45 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/50 ${isOptimizing ? 'opacity-80 scale-95 cursor-wait' : 'hover:opacity-85 hover:bg-white/60'}`}
        >
          {isOptimizing ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
              <Plus size={10} />
            </motion.div>
          ) : (
            <Plus size={10} />
          )}
          {isOptimizing ? 'OTIMIZANDO...' : 'MELHORAR COM IA'}
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
        className={`w-full bg-white/35 backdrop-blur-md border border-white/40 rounded-xl p-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/60 transition-all resize-y shadow-sm min-h-[140px] ${isOptimizing ? 'opacity-40' : ''}`}
      />
      {isOptimizing && (
        <div className="absolute inset-0 bg-white/20 flex items-center justify-center rounded-xl backdrop-blur-sm animate-pulse">
          <div className="w-1/2 h-1 bg-blue-500/20 rounded-full overflow-hidden">
             <motion.div className="h-full bg-blue-500" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ repeat: Infinity, duration: 1.5 }} />
          </div>
        </div>
      )}
    </div>
  </div>
);

// --- Resumes & Templates Configuration ---

const TEMPLATES: Record<TemplateType, { name: string; layout: string; colors: any }> = {
  t1_executive: { name: 'Nath', layout: 'custom-t1', colors: { primary: '#1B2A4A', text: '#4B5563', heading: '#1B2A4A', soft: '#1B2A4A', lines: '#E5E7EB' } },
  t2_geometric: { name: 'Dúnia', layout: 'custom-t2', colors: { primary: '#1B2A4A', text: '#4B5563', heading: '#1B2A4A', soft: '#F9FAFB', lines: '#F3F4F6' } },
  t3_modern: { name: 'Daniel', layout: 'custom-t3', colors: { primary: '#2D3748', text: '#4A5568', heading: '#1A202C', soft: '#F7FAFC', lines: '#E2E8F0', dark: '#1A202C' } },
  t4_barnabas: { name: 'Jack', layout: 'custom-t4', colors: { primary: '#2D313A', text: '#3E4249', heading: '#333333', soft: '#2D313A', lines: '#E5E7EB' } },
  t5_jonathan: { name: 'Príncipe', layout: 'custom-t5', colors: { primary: '#4A4C53', text: '#555555', heading: '#222222', soft: '#F3F4F6', lines: '#D1D5DB' } },
  t6_creative: { name: 'Lopera', layout: 'custom-t6', colors: { primary: '#34495E', text: '#333', heading: '#111', soft: '#F4F6F6', lines: '#D1D5DB' } },
  t7_professional: { name: 'Ivânia', layout: 'custom-t7', colors: { primary: '#186A3B', text: '#333', heading: '#111', soft: '#E9F7EF', lines: '#D1D5DB' } },
  t8_geometric_blue: { name: 'Josiel', layout: 'custom-t8', colors: { primary: '#1E40AF', text: '#475569', heading: '#1E3A8A', soft: '#EFF6FF', lines: '#E2E8F0' } },
  t9_emerald_pill: { name: 'Isabel', layout: 'custom-t9', colors: { primary: '#0F766E', text: '#374151', heading: '#111827', soft: '#F0FDF4', lines: '#E5E7EB' } },
  t10_johan: { name: 'Ronalma', layout: 'custom-t10', colors: { primary: '#1A365D', text: '#4A5568', heading: '#111827', soft: '#F7FAFC', lines: '#E2E8F0' } },
  t11_kelly: { name: 'Bezinho', layout: 'custom-t11', colors: { primary: '#EA580C', text: '#374151', heading: '#111827', soft: '#FFF7ED', lines: '#FFEDD5' } },
  t12_maria: { name: 'Maria', layout: 'custom-t12', colors: { primary: '#801D38', text: '#374151', heading: '#4C1021', soft: '#FFF5F6', lines: '#F5E1E4' } },
  t13_tazi: { name: 'Tazi', layout: 'custom-t13', colors: { primary: '#0B4F6C', text: '#334155', heading: '#0F172A', soft: '#EBF5F8', lines: '#D0E5EB' } }
};

// --- Helpers ---
const renderText = (str: string) => str ? str.replace(/\*/g, '') : '';
const getSectionTitle = (data: ResumeData, key: keyof NonNullable<ResumeData['sectionTitles']>, defaultTitle: string) => {
  if (data.sectionTitles?.[key]) return data.sectionTitles[key];
  if (data.language === 'en') {
    const enDefaults: Record<string, string> = {
      experience: "Professional Experience",
      education: "Education",
      skills: "Skills",
      languages: "Languages",
      certifications: "Certifications",
      interests: "Interests",
      summary: "Profile"
    };
    return enDefaults[key] || defaultTitle;
  }
  if (data.language === 'es') {
    const esDefaults: Record<string, string> = {
      experience: "Experiencia Profesional",
      education: "Educación",
      skills: "Habilidades",
      languages: "Idiomas",
      certifications: "Certificaciones",
      interests: "Intereses",
      summary: "Perfil"
    };
    return esDefaults[key] || defaultTitle;
  }
  return defaultTitle;
};

const ProfilePage = ({ user, isAdmin, setView, onLogout, onRequestDownload }: { 
    user: any; 
    isAdmin: boolean; 
    setView: (v: any) => void; 
    onLogout: () => void;
    onRequestDownload: (data: any, type: 'resume' | 'cover_letter', templateId: TemplateType, filename: string, setLocalGenerating: (b: boolean) => void) => Promise<void>;
}) => {
    const [myOrders, setMyOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState<string | null>(null);

    useEffect(() => {
        if (!user || user.email === 'anonymous') {
            setLoading(false);
            return;
        }
        
        const q = query(
            collection(db, 'orders'),
            where('ownerId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMyOrders(fetched.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            setLoading(false);
        }, (err) => {
            console.error("Firestore read failed, fallback offline list:", err);
            setLoading(false);
        });

        return unsubscribe;
    }, [user]);

    const downloadPDF = async (order: any, specificType: 'resume' | 'cover_letter' = 'resume') => {
        if (isGenerating) return;
        const generationKey = `${order.id}-${specificType}`;
        
        try {
            const filename = specificType === 'resume' ? 'Curriculo_CVLAB.pdf' : 'Carta_Apresentacao_CVLAB.pdf';
            const documentData = order.documentType === 'combo'
                ? (specificType === 'resume' ? order.documentData.resume : order.documentData.coverLetter)
                : order.documentData;

            const resumeDataToUse = specificType === 'resume' ? (documentData.resume || documentData) : documentData;
            const templateId = resumeDataToUse?.template as TemplateType || 't1_executive';

            await onRequestDownload(
                documentData, 
                specificType, 
                templateId, 
                filename, 
                (status: boolean) => {
                    if (status) {
                        setIsGenerating(generationKey);
                    } else {
                        setIsGenerating(null);
                    }
                }
            );
        } catch (err) {
            console.error("Erro ao descarregar PDF:", err);
            alert("Erro ao baixar o documento. Por favor, tente novamente.");
            setIsGenerating(null);
        }
    };

    if (!user || user.email === 'anonymous') return (
        <div className="p-20 text-center space-y-6 max-w-xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-xl py-16 my-12">
            <div className="w-20 h-20 bg-soft-blue text-primary-blue rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={40} />
            </div>
            <h2 className="text-2xl font-black text-deep-blue uppercase tracking-tight font-sans">Acesso Limitado</h2>
            <p className="text-sm text-text-muted max-w-sm mx-auto leading-relaxed">Você está navegando temporariamente como convidado. Entre com sua conta Google ou faça login para gerir seus currículos premium.</p>
            <div className="pt-4">
                <Button onClick={loginWithGoogle} className="px-8 shadow-xl bg-primary-blue text-white hover:bg-primary-blue/90">Aceder com Conta Google</Button>
            </div>
        </div>
    );

    // Expand combo orders into separate items for direct beautiful card representation
    const expandedItems: any[] = [];
    myOrders.forEach(o => {
        if (o.documentType === 'combo') {
            expandedItems.push({ ...o, subType: 'resume', displayName: 'Currículo Profissional' });
            expandedItems.push({ ...o, subType: 'cover_letter', displayName: 'Carta de Apresentação' });
        } else {
            expandedItems.push({ 
                ...o, 
                subType: o.documentType, 
                displayName: o.documentType === 'cover_letter' ? 'Carta de Apresentação' : 'Currículo Profissional' 
            });
        }
    });

    return (
        <div className="max-w-5xl mx-auto py-10 px-4 md:px-6 space-y-8">
            
            {/* Header Greeting Panel (Design Style Image 1 & 2) */}
            <div className="relative bg-gradient-to-tr from-primary-blue via-indigo-950 to-slate-900 rounded-[2.5rem] p-8 md:p-10 overflow-hidden shadow-xl border border-white/5 select-none text-white animate-fade-in animate-duration-500">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
                <div className="absolute -top-32 -right-32 w-80 h-80 bg-blue-500/20 rounded-full blur-[90px] pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[70px] pointer-events-none"></div>
                
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10 font-sans">
                    <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                        <div className="relative">
                            <img 
                                src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || 'U')}&background=fff&color=0D8ABC`} 
                                className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white/10 shadow-2xl object-cover relative select-none" 
                                alt="Foto"
                                referrerPolicy="no-referrer"
                            />
                        {isAdmin && (
                            <div className="absolute -bottom-1 -right-1 bg-red-600 text-white text-[8px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border border-white/10 shadow-lg font-mono">
                                ADMIN
                            </div>
                        )}
                    </div>
                    
                    <div className="space-y-1.5">
                        <p className="text-[10px] font-black tracking-[0.2em] uppercase text-blue-200 font-sans">Área do Candidato Premium</p>
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">{user.displayName || 'Membro CV Lab'}</h2>
                        <div className="flex items-center justify-center md:justify-start gap-1.5 text-xs text-white/70">
                            <Mail size={13} className="text-blue-350" />
                            <span className="font-medium font-sans">{user.email}</span>
                        </div>
                    </div>
                </div>

                {/* Premium Card Badge (resembles Wallet Card decoration in Image 1) */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 max-w-sm w-full md:w-auto h-full flex flex-col justify-between gap-6">
                    <div className="flex justify-between items-start gap-12">
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest font-sans">Acesso Ativo</p>
                            <p className="text-lg font-black text-white tracking-widest font-mono">CV LAB VIP</p>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                            <Award size={18} className="text-amber-400" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">✓ Ativado para Angola</span>
                        <p className="text-[10px] text-white/60 font-bold tracking-wide">MULTICAIXA Express habilitado</p>
                    </div>
                </div>
            </div>
        </div>

            {/* Quick Actions Bento Style Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-fade-in">
                
                {/* 1. Criar Currículo Widget Button */}
                <div 
                    onClick={() => setView('editor')}
                    className="group bg-white hover:bg-slate-50 border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center gap-4 text-left select-none relative overflow-hidden"
                >
                    <div className="w-12 h-12 rounded-2xl bg-soft-blue text-primary-blue flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Plus size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-deep-blue uppercase tracking-tight font-sans">Criar Currículo</h4>
                        <p className="text-xs text-text-muted truncate">Comece seu rascunho com IA</p>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 group-hover:translate-x-1 transition-transform shrink-0" />
                </div>

                {/* 2. Admin Panel Widget Button */}
                {isAdmin ? (
                    <div 
                        onClick={() => setView('admin')}
                        className="group bg-white hover:bg-amber-50/25 border border-amber-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center gap-4 text-left select-none"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Shield size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-black text-amber-950 uppercase tracking-tight font-sans">Administração</h4>
                            <p className="text-xs text-amber-500 truncate">Vendas, preços e relatórios</p>
                        </div>
                        <ChevronRight size={18} className="text-amber-300 group-hover:translate-x-1 transition-transform shrink-0" />
                    </div>
                ) : (
                    <div className="bg-white border border-slate-100 rounded-[2rem] p-6 flex items-center gap-4 text-left select-none opacity-60">
                        <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center shrink-0">
                            <Zap size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-black text-slate-500 uppercase tracking-tight font-sans">Sincronia ATS</h4>
                            <p className="text-xs text-slate-400 truncate">Sincronização Ativa</p>
                        </div>
                    </div>
                )}

                {/* 3. Encerrar Sessão Button Container */}
                <div 
                    onClick={onLogout}
                    className="group bg-white hover:bg-red-50/20 border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center gap-4 text-left select-none relative overflow-hidden"
                >
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-500 group-hover:text-red-500 group-hover:bg-red-50 flex items-center justify-center shrink-0 transition-all">
                        <LogOut size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-deep-blue uppercase tracking-tight group-hover:text-red-600 transition-colors font-sans font-sans">Terminar Sessão</h4>
                        <p className="text-xs text-text-muted truncate">Sair com segurança</p>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 group-hover:translate-x-1 transition-transform shrink-0" />
                </div>
            </div>

            {/* Main Documents Grid representing Image 2's "Ongoing Projects" bento items */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-deep-blue uppercase tracking-tight flex items-center gap-2 font-sans">
                        <Briefcase size={18} className="text-primary-blue" />
                        Seus Documentos Gerados
                    </h3>
                    <span className="text-[11px] font-black text-primary-blue bg-soft-blue px-3 py-1 rounded-full uppercase tracking-wider font-sans">
                        {expandedItems.length} Documentos
                    </span>
                </div>

                {loading ? (
                    <div className="p-16 text-center border-2 border-dashed border-gray-100 rounded-[2.5rem] bg-white">
                        <div className="animate-spin w-8 h-8 border-4 border-primary-blue border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-xs text-text-muted uppercase font-black tracking-widest font-sans">Sincronizando com a nuvem...</p>
                    </div>
                ) : expandedItems.length === 0 ? (
                    <div className="p-16 text-center border border-slate-150 rounded-[2.5rem] bg-white space-y-4 max-w-lg mx-auto">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                            <FileText size={32} />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-md font-black text-deep-blue uppercase tracking-tight font-sans">Nenhum currículo encontrado</h4>
                            <p className="text-xs text-text-muted leading-relaxed font-sans">Você ainda não gerou ou comprou nenhum currículo premium nesta conta. Crie e descarregue um layout incrível agora!</p>
                        </div>
                        <div className="pt-2 flex justify-center">
                            <Button onClick={() => setView('editor')} className="px-6 shadow-lg bg-primary-blue text-white hover:bg-primary-blue/90 font-black uppercase text-xs tracking-wider font-sans">
                                <Plus size={16} /> Criar Meu Primeiro Currículo
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                        {expandedItems.map((item, idx) => {
                            const isGeneratingThis = isGenerating === `${item.id}-${item.subType}`;
                            return (
                                <div 
                                    key={`${item.id}-${item.subType}-${idx}`} 
                                    className="bg-white border border-slate-100 rounded-[2rem] p-6 hover:shadow-xl transition-all duration-300 relative group overflow-hidden flex flex-col justify-between gap-6"
                                >
                                    {/* Top Metadata Row */}
                                    <div className="space-y-3.5">
                                        <div className="flex justify-between items-center gap-4">
                                            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest font-sans">
                                                ID: {item.id.slice(0, 8)}
                                            </span>
                                            
                                            {/* Status Badge */}
                                            {item.status === 'approved' ? (
                                                <span className="text-[9px] uppercase font-black tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1 font-sans">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Pronto
                                                </span>
                                            ) : (
                                                <span className="text-[9px] uppercase font-black tracking-widest text-amber-500 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 flex items-center gap-1 animate-pulse font-sans">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Pendente
                                                </span>
                                            )}
                                        </div>

                                        {/* Card Main Title */}
                                        <div className="space-y-1">
                                            <h4 className="font-black text-deep-blue text-lg tracking-tight group-hover:text-primary-blue transition-colors font-sans">
                                                {item.displayName}
                                            </h4>
                                            <p className="text-[11px] text-text-muted font-bold flex items-center gap-1 font-sans">
                                                <FileText size={12} className="text-gray-400" />
                                                Gerado em {new Date(item.createdAt).toLocaleDateString('pt-PT')}
                                            </p>
                                        </div>

                                        {/* Stylized Progress Bar representing completion state (Aesthetic Image 2 feature) */}
                                        <div className="space-y-1.5 pt-2">
                                            <div className="flex justify-between items-center text-[10px] uppercase font-black text-slate-400 font-sans">
                                                <span>Fidelidade A4</span>
                                                <span className={item.status === 'approved' ? 'text-emerald-500 font-bold' : 'text-amber-500 font-bold'}>
                                                    {item.status === 'approved' ? '100% Compilado' : 'Processando GPO'}
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-1000 ${
                                                        item.status === 'approved' ? 'bg-emerald-500 w-full' : 'bg-amber-400 w-3/4 animate-pulse'
                                                    }`}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Footnotes: Click to Download PDF instantly! */}
                                    <div className="pt-2">
                                        <button 
                                            disabled={isGeneratingThis}
                                            onClick={() => downloadPDF(item, item.subType)}
                                            className={`w-full py-3 px-4 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                                item.status === 'approved'
                                                    ? 'bg-slate-900 hover:bg-black text-white shadow-md shadow-slate-900/10'
                                                    : 'bg-amber-500 hover:bg-amber-600 text-white border border-amber-600/10 shadow-md shadow-amber-500/10 hover:-translate-y-0.5'
                                            } disabled:opacity-50`}
                                        >
                                            {isGeneratingThis ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin font-sans"></div>
                                                    <span>Compilando...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Download size={14} />
                                                    <span>Descarregar PDF {item.subType === 'cover_letter' ? '(Carta)' : ''}</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

const CoverLetterRenderer = React.memo(({ content, personalInfo, themeColor, language = 'pt', onChangeContent }: { content: string; personalInfo: any; themeColor?: string; language?: string; onChangeContent?: (content: string) => void }) => {
  const c = { primary: themeColor || '#1B2A4A' };
  const info = personalInfo || {};
  const isEn = language === 'en';
  
  // Calculate a scaling factor dynamic for super long cover letters to keep them strictly on 1 page
  const textLength = content ? content.length : 0;
  const densityScale = textLength > 1200 ? Math.max(0.68, Math.min(1.0, 1 - (textLength - 1200) * 0.00025)) : 1.0;
  
  const wRender = 794 / densityScale;
  const hRender = 1122 / densityScale;

  return (
    <div 
      id="cover-letter-content"
      className="bg-white relative overflow-visible print:shadow-none shadow-2xl"
      style={{ 
        width: '794px', 
        minHeight: '1122px',
        color: '#1f2937'
      }}
    >
      <div 
        className="relative overflow-visible flex flex-col font-sans text-left"
        style={{ 
          width: `${wRender}px`,
          height: 'auto',
          minHeight: `${hRender}px`,
          transform: `scale(${densityScale})`,
          transformOrigin: 'top left',
          padding: '80px',
          boxSizing: 'border-box'
        }}
      >
         {/* Minimalist Professional Header */}
         <div className="flex justify-between items-start pb-8 mb-10 mt-4">
           <div className="space-y-1.5 max-w-[80%]">
             <h1 className="text-[32px] font-black tracking-tight leading-none" style={{ color: c.primary }}>
               {info.fullName }
             </h1>
             <p className="text-gray-500 font-medium tracking-[0.1em] text-[11px] uppercase">
               {info.title || (isEn ? 'Your Position' : 'Seu Cargo')}
             </p>
           </div>
         </div>

         <div className="flex justify-between items-end mb-12 text-[12px] uppercase tracking-widest font-bold text-gray-400">
           <span>{isEn ? 'Spontaneous Application' : 'Candidatura Espontânea'}</span>
           <span>{(info.location ? info.location.split(',')[0] + ', ' : '') + new Date().toLocaleDateString(isEn ? 'en-US' : 'pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
         </div>
         
         <div className="flex-1 w-full relative">
            {onChangeContent ? (
               <>
                 {/* Textarea para editing interativo no ecrã (oculto na impressão) */}
                 <textarea
                   className="absolute inset-0 w-full h-full text-justify text-[14px] leading-[2.1] text-gray-800 font-medium px-4 bg-transparent outline-none resize-none scrollbar-hide print:hidden"
                   value={content ? content.replace(/\*/g, '') : ''}
                   onChange={(e) => onChangeContent(e.target.value)}
                   spellCheck="false"
                 />
                 {/* Div idêntica focada em renderizar o texto com nitidez extrema e cor sólida ao imprimir */}
                 <div className="text-justify whitespace-pre-line text-[14px] leading-[2.1] text-gray-900 font-medium px-4 hidden print:block">
                    {content ? content.replace(/\*/g, '') : ''}
                 </div>
               </>
            ) : (
               <div className="text-justify whitespace-pre-line text-[14px] leading-[2.1] text-gray-900 font-medium px-4">
                  {content ? content.replace(/\*/g, '') : ''}
               </div>
            )}
         </div>

         <div className="mt-20 pt-10 flex flex-col justify-end items-end pr-4 mt-auto">
            <div className="text-right">
               <p className="text-[11px] text-gray-400 uppercase tracking-widest mb-4">Atenciosamente,</p>
               <p className="text-[18px] font-black italic tracking-tighter" style={{ color: c.primary }}>
                  {info.fullName }
               </p>
            </div>
         </div>
      </div>
    </div>
  );
});

const MyResumesPage = ({ user, setView, onRequestDownload }: { 
    user: any; 
    setView: (v: any) => void;
    onRequestDownload: (data: any, type: 'resume' | 'cover_letter', templateId: TemplateType, filename: string, setLocalGenerating: (b: boolean) => void) => Promise<void>;
}) => {
    const [myOrders, setMyOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState<string | null>(null);

    useEffect(() => {
        if (!user || user.email === 'anonymous' || !db) return;
        
        const q = query(
            collection(db, 'orders'),
            where('ownerId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMyOrders(fetched.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            setLoading(false);
        });

        return unsubscribe;
    }, [user]);

    const downloadPDF = async (order: any, specificType: 'resume' | 'cover_letter' = 'resume') => {
        if (isGenerating) return;
        const generationKey = `${order.id}-${specificType}`;
        
        try {
            const filename = specificType === 'resume' ? 'Curriculo_CVLAB.pdf' : 'Carta_Apresentacao_CVLAB.pdf';
            
            // Extract correct data based on type
            const documentData = order.documentType === 'combo'
                ? (specificType === 'resume' ? order.documentData.resume : order.documentData.coverLetter)
                : order.documentData;

            const resumeDataToUse = specificType === 'resume' ? (documentData.resume || documentData) : documentData;
            const templateId = resumeDataToUse?.template as TemplateType || 't1_executive';

            await onRequestDownload(
                documentData, 
                specificType, 
                templateId, 
                filename, 
                (status: boolean) => {
                    if (status) {
                        setIsGenerating(generationKey);
                    } else {
                        setIsGenerating(null);
                    }
                }
            );
        } catch (err) {
            console.error("Erro ao solicitar download de PDF:", err);
            alert("Erro ao baixar o documento. Por favor, tente novamente.");
            setIsGenerating(null);
        }
    };

    if (loading) return <div className="p-20 text-center"><div className="animate-spin w-8 h-8 border-4 border-primary-blue border-t-transparent rounded-full mx-auto"></div></div>;

    // Expand combo orders into separate items for the user to see both
    const expandedItems: any[] = [];
    myOrders.forEach(o => {
        if (o.documentType === 'combo') {
            expandedItems.push({ ...o, subType: 'resume', displayName: 'Currículo Profissional' });
            expandedItems.push({ ...o, subType: 'cover_letter', displayName: 'Carta de Apresentação' });
        } else {
            expandedItems.push({ 
                ...o, 
                subType: o.documentType, 
                displayName: o.documentType === 'cover_letter' ? 'Carta de Apresentação' : 'Currículo Profissional' 
            });
        }
    });

    return (
        <div className="max-w-4xl mx-auto py-12 px-6 relative">
            <header className="mb-10 flex flex-col items-center md:items-start space-y-3 pb-8 border-b border-slate-200/50">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Meus Documentos</h2>
                <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100/50">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                    <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Painel de Controlo</p>
                </div>
            </header>

            <div className="grid gap-6">
                {expandedItems.map((item, idx) => (
                    <div key={`${item.id}-${item.subType}-${idx}`} className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all group overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-slate-50 to-transparent -mr-10 -mt-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        
                        <div className="space-y-3 relative z-10 w-full md:w-auto">
                            <div className="flex items-center gap-3">
                                <span className={`w-2.5 h-2.5 rounded-full ${item.status === 'approved' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`}></span>
                                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Ref: {item.id.slice(0, 8)}</span>
                            </div>
                            <h3 className="font-black text-xl text-slate-900 tracking-tight">
                                {item.displayName}
                            </h3>
                            <p className="text-xs text-slate-500 font-bold flex items-center gap-1.5"><FileText size={12}/> Gerado a {new Date(item.createdAt).toLocaleDateString('pt-BR')}</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10 w-full md:w-auto justify-end">
                            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                item.status === 'approved' 
                                ? 'bg-green-50 text-green-700 border-green-100' 
                                : 'bg-amber-50 text-amber-700 border-amber-100'
                            }`}>
                                {item.status === 'approved' ? 'Liberado para Download' : 'Aguardando Aprovação'}
                            </div>
                            
                            {item.status === 'approved' && (
                                <Button 
                                    size="sm" 
                                    onClick={() => downloadPDF(item, item.subType)} 
                                    disabled={!!isGenerating}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-12 px-8 rounded-xl shadow-lg shadow-blue-500/30 w-full sm:w-auto border-none font-bold tracking-wide"
                                >
                                   {isGenerating === `${item.id}-${item.subType}` ? (
                                       <div className="flex items-center gap-2">
                                           <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                           <span>PROCESSANDO...</span>
                                       </div>
                                   ) : (
                                       <><Download size={16} className="mr-2" /> BAIXAR AGORA</>
                                   )}
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
                
                {myOrders.length === 0 && (
                    <div className="bg-white p-16 rounded-[3rem] border border-slate-100 text-center space-y-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02]"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-50 rounded-full blur-[80px]"></div>
                        
                        <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-blue-500/20 relative z-10 rotate-3 hover:rotate-6 transition-transform">
                            <FileText size={40} className="text-white" />
                        </div>
                        <div className="space-y-4 relative z-10">
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Painel Vazio</h3>
                            <p className="text-sm text-slate-500 max-w-sm mx-auto font-medium leading-relaxed">Você ainda não gerou nenhum documento através da plataforma. Inicie a sua jornada agora.</p>
                        </div>
                        <Button onClick={() => setView('editor')} className="px-10 h-14 rounded-xl bg-gradient-to-r from-slate-900 to-black hover:from-black hover:to-slate-900 text-white shadow-xl shadow-slate-900/20 uppercase tracking-widest text-[11px] border-none relative z-10">Começar Currículo</Button>
                    </div>
                )}
            </div>
        </div>
    );
};

const AdminPanel = ({ setView }: { setView?: any }) => {
    const { isAdmin, user } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'visitors' | 'meetings'>('overview');
    
    // Live authorized editable variables
    const [realCVsCount, setRealCVsCount] = useState(9);
    const [realRevenue, setRealRevenue] = useState(18000);
    const [meetingLink, setMeetingLink] = useState('https://meet.google.com/abc-defg-hij');
    const [cvPrice, setCvPrice] = useState(2000);

    // Notes and team chats
    const [adminNotes, setAdminNotes] = useState<any[]>([]);
    const [newNoteText, setNewNoteText] = useState('');
    const [newNoteCategory, setNewNoteCategory] = useState<'Aviso' | 'Urgente' | 'Anotação' | 'Reunião'>('Anotação');

    // Editing mode toggles
    const [isEditingRealStats, setIsEditingRealStats] = useState(false);
    const [editCVsCount, setEditCVsCount] = useState('9');
    const [editRevenue, setEditRevenue] = useState('18000');
    const [editMeetingLink, setEditMeetingLink] = useState('https://meet.google.com/abc-defg-hij');
    const [editCvPrice, setEditCvPrice] = useState('2000');

    const [stats, setStats] = useState({ 
        users: 0, 
        pending: 0, 
        approved: 0, 
        online: 0, 
        totalVisitors: 0,
        revenue: 0,
        conversion: 0
    });
    const [chartData, setChartData] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const itemsPerPage = 8;
    
    useEffect(() => {
        console.log("Admin Status:", isAdmin, "User Email:", auth?.currentUser?.email);
        if (!isAdmin || !db) return;
        
        // Fetch all orders to keep stats and search accurate
        const q = query(collection(db, 'orders'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            let pendingCount = 0;
            let approvedCount = 0;
            const dailyData: { [key: string]: number } = {};

            const fetchedOrders = snapshot.docs.map(doc => {
                const data: any = {id: doc.id, ...doc.data()};
                if (data.status === 'pending') pendingCount++;
                if (data.status === 'approved') approvedCount++;
                
                try {
                   const date = new Date(data.createdAt).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
                   dailyData[date] = (dailyData[date] || 0) + 1;
                } catch(e) {}

                return data;
            });
            
            const formattedChartData = Object.keys(dailyData)
                .map(date => ({ date, pedidos: dailyData[date] }))
                .sort((a, b) => {
                    const [d1, m1] = a.date.split('/');
                    const [d2, m2] = b.date.split('/');
                    return new Date(2026, parseInt(m1)-1, parseInt(d1)).getTime() - new Date(2026, parseInt(m2)-1, parseInt(d2)).getTime();
                })
                .slice(-7);

            setChartData(formattedChartData);
            
            setStats(s => {
                const visitors = s.totalVisitors || 1;
                return { 
                    ...s, 
                    pending: pendingCount, 
                    approved: approvedCount,
                    revenue: approvedCount * cvPrice,
                    conversion: fetchedOrders.length > 0 ? (fetchedOrders.length / visitors) * 100 : 0
                };
            });
            setOrders(fetchedOrders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }, (error) => {
            console.error("Firestore listener error:", error);
            if (error.code === 'permission-denied') {
                alert("Acesso negado ao banco de dados.");
            }
        });

        // Fast simple snapshots for counts
        const fetchGlobalStats = async () => {
            const usersSnap = await getDocs(collection(db, 'users'));
            const visitorsSnap = await getDocs(collection(db, 'visitors'));
            setStats(s => ({ 
                ...s, 
                users: usersSnap.size,
                totalVisitors: visitorsSnap.size
            }));
        };
        fetchGlobalStats();

        // Online Presence Listener
        const presenceRef = collection(db, 'presence');
        const unsubPresence = onSnapshot(presenceRef, (snapshot) => {
            const now = new Date();
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);
            
            const active = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                .filter((p: any) => new Date(p.lastSeen) > fiveMinutesAgo);
            
            setOnlineUsers(active.sort((a: any, b: any) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()));
            setStats(s => ({ ...s, online: active.length }));
        });

        // Live Admin Metrics Listener
        const metricsRef = doc(db, 'admin_settings', 'metrics');
        const unsubMetrics = onSnapshot(metricsRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setRealCVsCount(data.realCVsCount ?? 9);
                setRealRevenue(data.realRevenue ?? 18000);
                setMeetingLink(data.meetingLink ?? 'https://meet.google.com/abc-defg-hij');
                setCvPrice(data.cvPrice ?? 2000);
                setEditCVsCount(String(data.realCVsCount ?? 9));
                setEditRevenue(String(data.realRevenue ?? 18000));
                setEditMeetingLink(data.meetingLink ?? 'https://meet.google.com/abc-defg-hij');
                setEditCvPrice(String(data.cvPrice ?? 2000));
            } else {
                setDoc(metricsRef, {
                    realCVsCount: 9,
                    realRevenue: 18000,
                    meetingLink: 'https://meet.google.com/abc-defg-hij',
                    cvPrice: 2000
                });
            }
        });

        // Live Notes Board Listener
        const notesQuery = query(collection(db, 'admin_notes'));
        const unsubNotes = onSnapshot(notesQuery, (snapshot) => {
            const fetched = snapshot.docs.map(dsc => ({ id: dsc.id, ...dsc.data() }));
            setAdminNotes(fetched.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        });

        return () => {
            unsubscribe();
            unsubPresence();
            unsubMetrics();
            unsubNotes();
        };
    }, [isAdmin]);

    const handleSendNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNoteText.trim()) return;
        if (!db) {
            alert("A base de dados não está disponível no momento.");
            return;
        }
        try {
            await addDoc(collection(db, 'admin_notes'), {
                text: newNoteText.trim(),
                category: newNoteCategory,
                author: user?.displayName || user?.email || 'Membro da Equipa',
                authorEmail: user?.email || '',
                createdAt: new Date().toISOString()
            });
            setNewNoteText('');
        } catch (err) {
            console.error("Erro ao publicar nota:", err);
        }
    };

    const handleDeleteNote = async (id: string) => {
        if (!db) return;
        try {
            await deleteDoc(doc(db, 'admin_notes', id));
        } catch (err) {
            console.error("Erro ao apagar nota:", err);
        }
    };

    const handleSaveRealMetrics = async () => {
        if (!db) {
            alert("A base de dados não está disponível no momento.");
            return;
        }
        try {
            const metricsRef = doc(db, 'admin_settings', 'metrics');
            await setDoc(metricsRef, {
                realCVsCount: Math.max(0, parseInt(editCVsCount) || 0),
                realRevenue: Math.max(0, parseInt(editRevenue) || 0),
                meetingLink: editMeetingLink.trim() || 'https://meet.google.com/abc-defg-hij',
                cvPrice: Math.max(0, parseInt(editCvPrice) || 2000)
            });
            setIsEditingRealStats(false);
            alert("Métricas da equipa e preço do CV atualizados com sucesso!");
        } catch (err) {
            console.error("Erro ao salvar métricas:", err);
            alert("Falha ao atualizar parâmetros.");
        }
    };

    const approveOrder = async (order: any) => {
        console.log("Tentando aprovar pedido:", order.id, "Usuário Logado:", auth?.currentUser?.email);
        const startTime = Date.now();
        try {
            if (!db) throw new Error("Database not initialized");
            if (!order?.id) throw new Error("Order ID is missing");

            // Update order status using setDoc with merge for robustness
            const orderRef = doc(db, 'orders', order.id);
            await setDoc(orderRef, { 
                status: 'approved', 
                updatedAt: new Date().toISOString() 
            }, { merge: true });
            
            console.log(`Status do pedido ${order.id} atualizado para approved em ${Date.now() - startTime}ms`);
            
            // Try to send email but don't block if it fails
            try {
                if (order.contactEmail) {
                    await addDoc(collection(db, 'mail'), {
                        to: [order.contactEmail],
                        message: {
                            subject: 'CV LAB - Documento Liberado',
                            html: `<p>Seu documento foi aprovado. Acesse o site para baixar.</p>`
                        }
                    });
                    console.log("E-mail de notificação enfileirado");
                }
            } catch (mailError) {
                console.warn("Falha ao enfileirar e-mail:", mailError);
            }
            
            alert("Pedido aprovado com sucesso!");
        } catch (e: any) { 
            console.error("ERRO NA APROVAÇÃO:", e);
            const errorMsg = e.code ? `[${e.code}] ${e.message}` : e.message;
            alert("Erro ao aprovar: " + (errorMsg || 'Erro desconhecido. Verifique o console.')); 
        }
    };

    if (!isAdmin) return <div className="p-20 text-center font-bold text-red-500 font-sans uppercase tracking-widest text-xs">Acesso Restrito.</div>;

    const filteredOrders = orders.filter(o => 
        (searchQuery ? o.id.toLowerCase().includes(searchQuery.toLowerCase()) || (o.contactEmail && o.contactEmail.toLowerCase().includes(searchQuery.toLowerCase())) : true)
    );
    const displayOrders = searchQuery ? filteredOrders : filteredOrders.filter(o => o.status === 'pending');
    const paginatedOrders = displayOrders.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    const totalPages = Math.ceil(displayOrders.length / itemsPerPage);

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-[#F8FAFC] font-sans">
            {/* Sidebar Premium */}
            <aside className="w-full md:w-80 bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0F172A] p-8 flex flex-col relative overflow-hidden shadow-2xl z-20 shrink-0">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                <div className="absolute -top-32 -left-32 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px]"></div>
                
                <div className="flex items-center gap-4 mb-12 relative z-10">
                    <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-500/30">L</div>
                    <div>
                        <h2 className="text-lg font-black text-white leading-none tracking-tight">CV LAB</h2>
                        <span className="text-[10px] text-blue-200/60 font-bold uppercase tracking-widest">Painel Admin</span>
                    </div>
                </div>

                <nav className="space-y-2 flex-1 relative z-10">
                    {[
                        { id: 'overview', label: 'Dashboard', icon: Globe },
                        { id: 'orders', label: 'Pagamentos', icon: CreditCard },
                        { id: 'visitors', label: 'Membros Conetados', icon: User },
                        { id: 'meetings', label: 'Sala de Reuniões', icon: Video },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id as any); setPage(1); }}
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300 ${
                                activeTab === tab.id 
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20 scale-[1.02]' 
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <div className={`${activeTab === tab.id ? 'text-white' : 'text-slate-500'}`}>
                                <tab.icon size={20} strokeWidth={2.5} />
                            </div>
                            {tab.label}
                        </button>
                    ))}
                </nav>

                <div className="pt-4 relative z-10 space-y-4">
                    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-[2rem] border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-bl-full -mr-4 -mt-4"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Fatura Real</p>
                        <p className="text-2xl font-black text-white tracking-tight">{realRevenue.toLocaleString()} Kzs</p>
                    </div>

                    {setView && (
                        <button 
                            onClick={() => setView('landing')} 
                            className="w-full flex items-center justify-center gap-2 py-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all border border-white/5"
                        >
                            <ChevronLeft size={16} /> Voltar ao Início
                        </button>
                    )}
                </div>
            </aside>

            {/* Main Area */}
            <main className="flex-1 p-6 md:p-12 space-y-10 overflow-y-auto max-h-screen relative">
                <div className="absolute top-0 left-0 w-full h-64 bg-slate-100/50 -z-10"></div>
                
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 mt-4 border-b border-slate-200/50">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            {activeTab === 'overview' ? 'Monitoramento em Tempo Real' : activeTab === 'orders' ? 'Gestão de Liberações' : 'Métricas de Usuários'}
                        </h1>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Sistema de Inteligência Operacional
                        </p>
                    </div>
                    
                    {activeTab === 'orders' && (
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                value={searchQuery ?? ''}
                                onChange={e => {setSearchQuery(e.target.value); setPage(1);}}
                                placeholder="Buscar por email..." 
                                className="w-full pl-12 pr-5 py-4 text-sm font-bold bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] outline-none border border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                            />
                        </div>
                    )}
                </header>

                {activeTab === 'overview' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
                        {/* Gestão de Métricas de Vendas (Dono/ADM) */}
                        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group border border-indigo-900/40">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                            
                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black tracking-tight">Métricas Oficializadas CV LAB</h3>
                                    <p className="text-xs text-blue-200/80 font-medium">Parâmetros oficiais de faturamento real de vendas e currículos validados.</p>
                                    
                                    <div className="flex flex-wrap gap-4 pt-4">
                                        <div className="bg-white/5 backdrop-blur px-5 py-3 rounded-2xl border border-white/10 min-w-[120px]">
                                            <span className="block text-[9px] uppercase tracking-wider font-bold text-blue-200">Currículos Validados</span>
                                            <span className="text-2xl font-black">{realCVsCount} CVs</span>
                                        </div>
                                        <div className="bg-white/5 backdrop-blur px-5 py-3 rounded-2xl border border-white/10 min-w-[125px]">
                                            <span className="block text-[9px] uppercase tracking-wider font-bold text-blue-200">Faturamento Oficial</span>
                                            <span className="text-2xl font-black text-emerald-400">{realRevenue.toLocaleString()} Kzs</span>
                                        </div>
                                        <div className="bg-white/5 backdrop-blur px-5 py-3 rounded-2xl border border-white/10 min-w-[110px]">
                                            <span className="block text-[9px] uppercase tracking-wider font-bold text-blue-200">Preço do CV</span>
                                            <span className="text-2xl font-black text-amber-300">{cvPrice.toLocaleString()} Kz</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="w-full lg:w-auto bg-white/5 backdrop-blur p-5 rounded-3xl border border-white/10 space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-blue-100">Atualização Prática de Faturação</h4>
                                    
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="block text-[10px] font-bold text-blue-200 mb-1">Total de CVs</label>
                                            <input 
                                                type="number" 
                                                value={editCVsCount} 
                                                onChange={e => setEditCVsCount(e.target.value)} 
                                                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-2.5 py-2 text-xs font-bold font-mono text-white outline-none focus:border-blue-400" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-blue-100 mb-1">Faturação (Kz)</label>
                                            <input 
                                                type="number" 
                                                value={editRevenue} 
                                                onChange={e => setEditRevenue(e.target.value)} 
                                                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-2.5 py-2 text-xs font-bold font-mono text-white outline-none focus:border-blue-400" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-amber-200 mb-1">Preço CV (Kz)</label>
                                            <input 
                                                type="number" 
                                                value={editCvPrice} 
                                                onChange={e => setEditCvPrice(e.target.value)} 
                                                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-2.5 py-2 text-xs font-bold font-mono text-white outline-none focus:border-blue-400" 
                                            />
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={handleSaveRealMetrics}
                                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md border-0"
                                    >
                                        Gravar Alterações
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Online Atualmente', val: stats.online, color: 'text-green-500', icon: Globe, highlight: true },
                                { label: 'Trafégo Único (Vida)', val: stats.totalVisitors, color: 'text-slate-800', icon: User },
                                { label: 'Taxa de Conversão', val: `${stats.conversion.toFixed(1)}%`, color: 'text-amber-500', icon: BarChart },
                                { label: 'Aguardando Pagamento', val: stats.pending, color: 'text-blue-600', icon: CreditCard },
                            ].map((s, i) => (
                                <div key={i} className="bg-white p-7 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-center text-center hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-50 to-transparent -mr-8 -mt-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500">
                                        <s.icon size={24} className={s.highlight ? 'text-green-500' : 'text-slate-400'} strokeWidth={2} />
                                    </div>
                                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">{s.label}</span>
                                    <div className="flex items-center gap-2">
                                        {s.highlight && <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>}
                                        <span className={`text-4xl font-black tracking-tighter ${s.color}`}>{s.val}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/50 rounded-full blur-[100px] -mr-20 -mt-20"></div>
                            
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 relative z-10 gap-4">
                                <div>
                                    <h3 className="font-black text-slate-900 text-2xl tracking-tight">Atividade de Pedidos</h3>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Últimos 7 dias de operação</p>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl">
                                    <div className="w-3 h-3 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)]"></div>
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Volume Registado</span>
                                </div>
                            </div>
                            <div className="w-full h-[360px] relative z-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorPed" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                                                <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 700, fill: '#94A3B8'}} dy={15} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 700, fill: '#94A3B8'}} dx={-15} />
                                        <Tooltip 
                                            contentStyle={{borderRadius: '1.5rem', border: '1px solid #F1F5F9', padding: '16px 20px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)'}} 
                                            itemStyle={{color: '#2563EB', fontWeight: '900', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em'}}
                                        />
                                        <Area type="monotone" dataKey="pedidos" stroke="#2563EB" strokeWidth={5} fillOpacity={1} fill="url(#colorPed)" animationDuration={2000} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in slide-in-from-right-4 duration-500 relative z-10">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <tr>
                                        <th className="px-8 py-5">Data de Criação</th>
                                        <th className="px-8 py-5">E-mail do Cliente</th>
                                        <th className="px-8 py-5">Documento</th>
                                        <th className="px-8 py-5 text-center">Estado</th>
                                        <th className="px-8 py-5 text-right">Controle</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {paginatedOrders.map(o => (
                                        <tr key={o.id} className="group hover:bg-blue-50/30 transition-colors duration-300">
                                            <td className="px-8 py-6 text-slate-500 font-bold">{new Date(o.createdAt).toLocaleDateString()}</td>
                                            <td className="px-8 py-6 font-black text-slate-900">{o.contactEmail}</td>
                                            <td className="px-8 py-6">
                                                <span className="text-[10px] font-black uppercase tracking-tighter bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg border border-slate-200">
                                                    {o.documentType === 'combo' ? 'Combo Premium' : (o.documentType === 'resume' ? 'Currículo' : 'Carta Ref.')}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${
                                                    o.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                                                }`}>
                                                    {o.status === 'pending' ? 'Aguardando' : 'Liberado'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                {o.status === 'pending' ? (
                                                    <button onClick={() => approveOrder(o)} className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-6 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all">Validar</button>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-2 text-green-600 font-black text-[11px] uppercase">
                                                        <CheckCircle size={16} /> Finalizado
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {totalPages > 1 && (
                            <div className="p-8 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">Página {page} de {totalPages}</span>
                                <div className="flex gap-2">
                                    <button disabled={page === 1} onClick={() => setPage(page - 1)} className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm"><ChevronLeft size={18}/></button>
                                    <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm"><ChevronRight size={18}/></button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'visitors' && (
                    <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in slide-in-from-left-4 duration-500 relative z-10">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <tr>
                                        <th className="px-8 py-5">Utilizador</th>
                                        <th className="px-8 py-5">Página Atual</th>
                                        <th className="px-8 py-5 text-right">Sinal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {onlineUsers.map(u => (
                                        <tr key={u.id} className="hover:bg-blue-50/30 transition-colors duration-300">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-[11px] font-black shadow-sm ${u.isAnonymous ? 'bg-slate-100 text-slate-500 border border-slate-200' : 'bg-gradient-to-tr from-blue-500 to-blue-600 text-white'}`}>
                                                        {u.isAnonymous ? 'VIS' : (u.email?.[0]?.toUpperCase() || 'USR')}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-900 text-sm tracking-tight">{u.email || 'Explorando Anónimo'}</span>
                                                        <span className="text-[10px] text-slate-400 font-mono font-bold">{new Date(u.lastSeen).toLocaleTimeString()}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 lowercase italic text-slate-500 font-bold">#{u.view || 'navegando...'}</td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 text-green-600 border border-green-100">
                                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-0.5">Online</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {onlineUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-8 py-24 text-center text-slate-400 font-bold uppercase text-[11px] tracking-widest">Nenhum rastro de presença detetado recentemente.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'meetings' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500 relative z-10">
                        {/* Sala de Reunião Link & Info Box */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                                        <Video size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Sala de Reuniões Virtual</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Espaço oficial para o alinhamento da equipa</p>
                                    </div>
                                </div>

                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Esta é a nossa sala oficial para reuniões rápidas de feedback, alinhamentos diários e desenho das novas atualizações do CV LAB. Use o link do Google Meet abaixo para aceder instantaneamente.
                                </p>

                                <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Link de Acesso Ativo</span>
                                        <a href={meetingLink} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-blue-600 hover:underline break-all">
                                            {meetingLink}
                                        </a>
                                    </div>
                                    <a 
                                        href={meetingLink} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center h-12 px-6 bg-blue-600 hover:bg-blue-700 font-black text-xs text-white uppercase tracking-widest rounded-xl transition-all shadow-md shrink-0 border-0"
                                    >
                                        Aceder à Sala
                                    </a>
                                </div>

                                {/* Link Editor */}
                                <div className="pt-4 border-t border-slate-100 space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Alterar Link da Sala</h4>
                                    <div className="flex gap-3">
                                        <input 
                                            type="text" 
                                            value={editMeetingLink} 
                                            onChange={e => setEditMeetingLink(e.target.value)} 
                                            placeholder="Ex: https://meet.google.com/..."
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold font-mono outline-none focus:border-blue-500" 
                                        />
                                        <button 
                                            onClick={handleSaveRealMetrics} 
                                            className="h-12 px-5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl active:scale-[0.98] transition-all border-0 cursor-pointer"
                                        >
                                            Guardar Link
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Lateral Team Guidelines */}
                            <div className="bg-gradient-to-b from-slate-900 to-slate-800 p-8 rounded-[2rem] text-white shadow-xl space-y-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
                                <h3 className="text-lg font-black tracking-tight relative z-10">Pautas Fundamentais</h3>
                                <ul className="space-y-4 text-xs font-black text-slate-300 relative z-10">
                                    <li className="flex items-start gap-2.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                        <span>Confirmar cada venda de {cvPrice.toLocaleString()} Kzs no botão físico para o placar de faturamento real sincronizar na hora.</span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                        <span>Garantir que os clientes registados estão com o MULTICAIXA Express ativo ao gerar faturas.</span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                        <span>Esteja pronto para abrir o terminal contabilístico às 8:00 com credenciais de Supervisor.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Quadro de Notas & Avisos Coletivos */}
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-8">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-5">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Quadro Coletivo de Notas</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Avisos e anotações internas da equipa</p>
                                </div>
                                <div className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest">
                                    {adminNotes.length} Notas Ativas
                                </div>
                            </div>

                            {/* Note Publisher Form */}
                            <form onSubmit={handleSendNote} className="space-y-4">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <select 
                                        value={newNoteCategory} 
                                        onChange={e => setNewNoteCategory(e.target.value as any)}
                                        className="h-12 px-4 rounded-xl text-xs font-bold border border-slate-200 bg-slate-50 outline-none focus:border-blue-500"
                                    >
                                        <option value="Anotação">📝 Anotação</option>
                                        <option value="Aviso">📢 Aviso Geral</option>
                                        <option value="Urgente">🚨 Urgente</option>
                                        <option value="Reunião">👥 Reunião</option>
                                    </select>
                                    <input 
                                        type="text" 
                                        value={newNoteText} 
                                        onChange={e => setNewNoteText(e.target.value)} 
                                        placeholder="Escreva um aviso para a restante equipa..."
                                        className="flex-1 h-12 px-5 rounded-xl text-xs font-bold border border-slate-200 bg-slate-50 outline-none focus:border-blue-500"
                                    />
                                    <button 
                                        type="submit" 
                                        className="h-12 px-8 bg-blue-600 hover:bg-blue-700 font-black text-xs text-white uppercase tracking-widest rounded-xl transition-all border-0 cursor-pointer"
                                    >
                                        Fixar Nota
                                    </button>
                                </div>
                            </form>

                            {/* Active Notes Display */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {adminNotes.map(note => (
                                    <div key={note.id} className="p-6 bg-slate-50 hover:bg-slate-50/80 border border-slate-100 rounded-2xl relative overflow-hidden group">
                                        {/* Corner Tag */}
                                        <div className="flex justify-between items-start gap-4 mb-4">
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${
                                                note.category === 'Urgente' ? 'bg-red-100 text-red-700' :
                                                note.category === 'Aviso' ? 'bg-amber-100 text-amber-700' :
                                                note.category === 'Reunião' ? 'bg-blue-100 text-blue-700' :
                                                'bg-slate-200 text-slate-700'
                                            }`}>
                                                {note.category || 'Nota'}
                                            </span>
                                            <button 
                                                onClick={() => handleDeleteNote(note.id)}
                                                className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity border-0 bg-transparent cursor-pointer p-1"
                                                title="Apagar Nota"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>

                                        <p className="text-xs text-slate-700 leading-relaxed font-semibold mb-4">{note.text}</p>
                                        
                                        <div className="pt-3 border-t border-slate-200/50 flex justify-between items-center text-[9px] font-bold text-slate-400">
                                            <span>Por: {note.author}</span>
                                            <span>{note.createdAt ? new Date(note.createdAt).toLocaleDateString() : ''}</span>
                                        </div>
                                    </div>
                                ))}

                                {adminNotes.length === 0 && (
                                    <div className="col-span-full py-16 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                                        Nenhuma nota afixada por agora. Escreva uma no quadro acima!
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

const EditableTitle = ({ 
  text, 
  defaultText, 
  onSave, 
  className, 
  style,
  as: Component = 'div'
}: { 
  text?: string, 
  defaultText: string, 
  onSave?: (v: string) => void,
  className?: string,
  style?: React.CSSProperties,
  as?: any
}) => {
  const [val, setVal] = useState(text || defaultText);
  const [editing, setEditing] = useState(false);

  React.useEffect(() => {
    setVal(text || defaultText);
  }, [text, defaultText]);

  if (!onSave) {
    return <Component className={className} style={style}>{val}</Component>;
  }

  return (
    <Component 
      className={`relative group ${className}`} 
      style={{ ...style, cursor: 'text' }}
    >
      <input
        type="text"
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={() => onSave(val)}
        onKeyDown={e => { if (e.key === 'Enter') { e.currentTarget.blur(); } }}
        className="bg-transparent border-none outline-none w-full p-0 m-0 font-inherit color-inherit rounded hover:bg-black/10 focus:bg-white focus:text-black focus:ring-2 focus:ring-primary-blue/50 transition-colors cursor-text border-b border-transparent hover:border-current border-dashed"
        style={{ color: 'inherit', fontWeight: 'inherit', fontSize: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit' }}
        title="Clique para editar o título da seção"
      />
    </Component>
  );
};

const ResumeRenderer = React.memo(({ data, templateId, showGuides, onChange }: { data: ResumeData; templateId: TemplateType; showGuides?: boolean; onChange?: React.Dispatch<React.SetStateAction<ResumeData>> }) => {
  const theme = TEMPLATES[templateId] || TEMPLATES.t1_executive;
  const c = { ...theme.colors, primary: data.themeColor || theme.colors.primary };

  const style = data.styleConfig || {
    fontSize: 13,
    titleSize: 26,
    sectionSpacing: 25,
    itemSpacing: 10,
    margins: 30,
    lineHeight: 1.4,
    alignment: 'left',
    fontFamily: 'sans',
    photoBorderRadius: 50
  };

  const handleTitleChange = (key: keyof NonNullable<ResumeData['sectionTitles']>, value: string) => {
    if (onChange) {
      onChange(prev => ({
        ...prev,
        sectionTitles: {
          ...(prev.sectionTitles || {}),
          [key]: value
        }
      }));
    }
  };

  const wasDraggingRef = React.useRef(false);

  const touchStateRef = React.useRef<{
    initialDist: number | null;
    initialFontSize: number;
    initialTitleSize: number;
    initialPhotoSize: number;
    initialMargins: number;
    targetType: string | null;
  }>({
    initialDist: null,
    initialFontSize: 13,
    initialTitleSize: 26,
    initialPhotoSize: 100,
    initialMargins: 30,
    targetType: null,
  });

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      
      const target = e.target as HTMLElement;
      const container = document.getElementById('resume-content');
      let targetType = 'fontSize';
      if (container) {
        const selectable = findSelectableElement(target, container);
        if (selectable) {
          if (selectable.type === 'personalInfo' || selectable.type === 'name') {
            targetType = 'titleSize';
          } else if (selectable.type === 'avatar') {
            targetType = 'photoSize';
          } else {
            targetType = 'fontSize';
          }
        } else {
          targetType = 'margins';
        }
      }

      touchStateRef.current = {
        initialDist: dist,
        initialFontSize: style.fontSize || 13,
        initialTitleSize: style.titleSize || 26,
        initialPhotoSize: data.personalInfo.photoSize || 100,
        initialMargins: style.margins || 30,
        targetType
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchStateRef.current.initialDist !== null) {
      if (e.cancelable) e.preventDefault();
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      
      const factor = currentDist / touchStateRef.current.initialDist;
      const { targetType, initialFontSize, initialTitleSize, initialPhotoSize, initialMargins } = touchStateRef.current;

      if (onChange) {
        if (targetType === 'titleSize') {
          const newSize = Math.max(16, Math.min(60, Math.round(initialTitleSize * factor)));
          onChange((prev: any) => ({
            ...prev,
            styleConfig: { ...(prev.styleConfig || {}), titleSize: newSize }
          }));
        } else if (targetType === 'photoSize') {
          const newSize = Math.max(40, Math.min(220, Math.round(initialPhotoSize * factor)));
          onChange((prev: any) => ({
            ...prev,
            personalInfo: { ...prev.personalInfo, photoSize: newSize }
          }));
        } else if (targetType === 'margins') {
          const newSize = Math.max(10, Math.min(80, Math.round(initialMargins * factor)));
          onChange((prev: any) => ({
            ...prev,
            styleConfig: { ...(prev.styleConfig || {}), margins: newSize }
          }));
        } else {
          const newSize = Math.max(8, Math.min(24, Number((initialFontSize * factor).toFixed(1))));
          onChange((prev: any) => ({
            ...prev,
            styleConfig: { ...(prev.styleConfig || {}), fontSize: newSize }
          }));
        }
      }
    }
  };

  const handleTouchEnd = () => {
    touchStateRef.current.initialDist = null;
  };

  React.useEffect(() => {
    const el = document.getElementById('resume-content');
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.05 : 0.95;
        const target = e.target as HTMLElement;
        const container = document.getElementById('resume-content');
        if (container && onChange) {
          const selectable = findSelectableElement(target, container);
          if (selectable) {
            if (selectable.type === 'personalInfo' || selectable.type === 'name') {
              onChange((prev: any) => {
                const currentSize = prev.styleConfig?.titleSize || 26;
                const newSize = Math.max(16, Math.min(60, Math.round(currentSize * factor)));
                return { ...prev, styleConfig: { ...(prev.styleConfig || {}), titleSize: newSize } };
              });
            } else if (selectable.type === 'avatar') {
              onChange((prev: any) => {
                const currentSize = prev.personalInfo.photoSize || 100;
                const newSize = Math.max(40, Math.min(220, Math.round(currentSize * factor)));
                return { ...prev, personalInfo: { ...prev.personalInfo, photoSize: newSize } };
              });
            } else {
              onChange((prev: any) => {
                const currentSize = prev.styleConfig?.fontSize || 13;
                const newSize = Math.max(8, Math.min(24, Number((currentSize * factor).toFixed(1))));
                return { ...prev, styleConfig: { ...(prev.styleConfig || {}), fontSize: newSize } };
              });
            }
          }
        }
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
    };
  }, [onChange, style]);

  // Local state for direct touch and drag-to-resize/reorder action
  const [dragState, setDragState] = React.useState<{
    active: boolean;
    type: string;
    id: string;
    index: number;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    startVal: any;
    currentVal: any;
    secondaryStartVal?: any;
    secondaryCurrentVal?: any;
  }>({
    active: false,
    type: '',
    id: '',
    index: -1,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    startVal: null,
    currentVal: null,
    secondaryStartVal: null,
    secondaryCurrentVal: null
  });

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    wasDraggingRef.current = false;
    // Check if clicking/touching editable fields
    const target = e.target as HTMLElement;
    
    const nameEl = target.closest('.t1-name, .t2-name, .t3-name, h1, [class*="-name"]');
    const avatarEl = target.closest('.t1-avatar, .t2-avatar, .t1-avatar-wrap, [class*="-avatar"], img');
    const titleEl = target.closest('.t1-section-title, .t1-right-title, .t2-section-title, .t3-section-title, h3, h2, [class*="-title"]');
    const expEl = target.closest('.t1-exp-item, .t2-exp-item, [class*="-exp-item"], [class*="exp-item"]');
    const eduEl = target.closest('.t1-edu-item, .t2-edu-item, [class*="-edu-item"], [class*="edu-item"]');
    const bioEl = target.closest('.t1-bio, .t2-bio, .t1-bio-wrap, p, [class*="-bio"]');
    const contactEl = target.closest('.t1-contact-item, .t2-contact-row, .t1-contact-text, .t2-contact-text, [class*="contact-item"], [class*="contact-row"]');
    const skillEl = target.closest('.t1-skill-tag, [class*="-skill-tag"], [class*="skill"]');
    const langEl = target.closest('[class*="lang-item"], [class*="language"], .flex.justify-between.items-center');

    let type = '';
    let id = '';
    let index = -1;
    let interactiveEl: HTMLElement | null = null;

    if (nameEl) {
      type = 'name';
      interactiveEl = nameEl as HTMLElement;
    } else if (avatarEl) {
      type = 'photo';
      interactiveEl = avatarEl as HTMLElement;
    } else if (expEl) {
      type = 'experience';
      interactiveEl = expEl as HTMLElement;
      const parent = expEl.parentElement;
      if (parent) {
        index = Array.from(parent.children).indexOf(expEl);
      }
    } else if (eduEl) {
      type = 'education';
      interactiveEl = eduEl as HTMLElement;
      const parent = eduEl.parentElement;
      if (parent) {
        index = Array.from(parent.children).indexOf(eduEl);
      }
    } else if (titleEl) {
      type = 'sectionSpacing';
      interactiveEl = titleEl as HTMLElement;
    } else if (contactEl) {
      type = 'contact';
      interactiveEl = contactEl as HTMLElement;
    } else if (skillEl) {
      type = 'skills';
      interactiveEl = skillEl as HTMLElement;
    } else if (langEl) {
      type = 'languages';
      interactiveEl = langEl as HTMLElement;
    } else if (bioEl) {
      type = 'bio';
      interactiveEl = bioEl as HTMLElement;
    } else {
      type = 'margins';
      interactiveEl = document.getElementById('resume-content');
    }

    if (!type || !interactiveEl) return;

    e.preventDefault();
    try {
      interactiveEl.setPointerCapture(e.pointerId);
    } catch (err) {}

    let startVal: any = null;
    let secondaryStartVal: any = null;

    if (type === 'name') {
      startVal = style.titleSize || 26;
    } else if (type === 'photo') {
      startVal = data.personalInfo.photoSize || 100;
      secondaryStartVal = style.photoBorderRadius !== undefined ? style.photoBorderRadius : 50;
    } else if (type === 'bio') {
      startVal = style.fontSize || 13;
      secondaryStartVal = style.lineHeight || 1.4;
    } else if (type === 'sectionSpacing') {
      startVal = style.sectionSpacing || 25;
      secondaryStartVal = style.fontSize || 13;
    } else if (type === 'experience' || type === 'education') {
      startVal = index;
      secondaryStartVal = style.itemSpacing || 10;
    } else if (type === 'contact') {
      startVal = style.fontSize || 13;
      secondaryStartVal = style.itemSpacing || 10;
    } else if (type === 'skills') {
      startVal = style.itemSpacing || 10;
    } else if (type === 'languages') {
      startVal = style.fontSize || 13;
    } else if (type === 'margins') {
      startVal = style.margins || 30;
    }

    const rect = document.getElementById('resume-content')?.getBoundingClientRect();
    const x = rect ? e.clientX - rect.left : e.clientX;
    const y = rect ? e.clientY - rect.top : e.clientY;

    setDragState({
      active: true,
      type,
      id,
      index,
      startX: e.clientX,
      startY: e.clientY,
      currentX: x,
      currentY: y,
      startVal,
      currentVal: startVal,
      secondaryStartVal
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.active) return;
    e.preventDefault();

    const rect = document.getElementById('resume-content')?.getBoundingClientRect();
    const x = rect ? e.clientX - rect.left : e.clientX;
    const y = rect ? e.clientY - rect.top : e.clientY;

    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      wasDraggingRef.current = true;
    }

    let currentVal = dragState.startVal;
    let secondaryCurrentVal = dragState.secondaryStartVal;
    let updatedStyle = { ...style };
    let updatedPersonalInfo = { ...data.personalInfo };

    if (dragState.type === 'name') {
      currentVal = Math.max(16, Math.min(60, dragState.startVal + dx / 4));
      updatedStyle.titleSize = Math.round(currentVal);
      if (onChange) {
        onChange((prev: any) => ({
          ...prev,
          styleConfig: { ...prev.styleConfig, titleSize: updatedStyle.titleSize }
        }));
      }
    } else if (dragState.type === 'photo') {
      currentVal = Math.max(40, Math.min(220, dragState.startVal + dx / 2));
      updatedPersonalInfo.photoSize = Math.round(currentVal);
      
      const verticalOffset = dy / 1.5;
      secondaryCurrentVal = Math.max(0, Math.min(50, dragState.secondaryStartVal + verticalOffset));
      updatedStyle.photoBorderRadius = Math.round(secondaryCurrentVal);
      
      if (onChange) {
        onChange((prev: any) => ({
          ...prev,
          personalInfo: { ...prev.personalInfo, photoSize: updatedPersonalInfo.photoSize },
          styleConfig: { ...prev.styleConfig, photoBorderRadius: updatedStyle.photoBorderRadius }
        }));
      }
    } else if (dragState.type === 'bio') {
      currentVal = Math.max(9, Math.min(20, dragState.startVal + dx / 15));
      updatedStyle.fontSize = Number(currentVal.toFixed(1));
      
      secondaryCurrentVal = Math.max(1.1, Math.min(2.0, dragState.secondaryStartVal + dy / 150));
      updatedStyle.lineHeight = Number(secondaryCurrentVal.toFixed(2));
      
      if (onChange) {
        onChange((prev: any) => ({
          ...prev,
          styleConfig: { 
            ...prev.styleConfig, 
            fontSize: updatedStyle.fontSize,
            lineHeight: updatedStyle.lineHeight 
          }
        }));
      }
    } else if (dragState.type === 'sectionSpacing') {
      currentVal = Math.max(5, Math.min(60, dragState.startVal + dy / 2));
      updatedStyle.sectionSpacing = Math.round(currentVal);
      
      secondaryCurrentVal = Math.max(10, Math.min(30, (dragState.secondaryStartVal || 13) + dx / 10));
      
      if (onChange) {
        onChange((prev: any) => ({
          ...prev,
          styleConfig: { 
            ...prev.styleConfig, 
            sectionSpacing: updatedStyle.sectionSpacing,
          }
        }));
      }
    } else if (dragState.type === 'experience' || dragState.type === 'education') {
      const spaceVal = Math.max(2, Math.min(40, dragState.secondaryStartVal + dx / 5));
      updatedStyle.itemSpacing = Math.round(spaceVal);
      
      const thresh = 65;
      const step = Math.round(dy / thresh);
      if (step !== 0) {
        const moveIndex = dragState.index;
        const targetIndex = moveIndex + step;
        const listName = dragState.type;
        const list = [...(data[listName] || [])];
        
        if (targetIndex >= 0 && targetIndex < list.length) {
          const temp = list[moveIndex];
          list[moveIndex] = list[targetIndex];
          list[targetIndex] = temp;

          if (onChange) {
            onChange((prev: any) => ({
              ...prev,
              [listName]: list,
              styleConfig: { ...prev.styleConfig, itemSpacing: updatedStyle.itemSpacing }
            }));
          }

          setDragState(prev => ({
            ...prev,
            index: targetIndex,
            startY: e.clientY
          }));
        }
      } else {
        if (onChange) {
          onChange((prev: any) => ({
            ...prev,
            styleConfig: { ...prev.styleConfig, itemSpacing: updatedStyle.itemSpacing }
          }));
        }
      }
    } else if (dragState.type === 'contact') {
      currentVal = Math.max(9, Math.min(18, dragState.startVal + dx / 15));
      updatedStyle.fontSize = Number(currentVal.toFixed(1));
      
      secondaryCurrentVal = Math.max(2, Math.min(30, dragState.secondaryStartVal + dy / 6));
      updatedStyle.itemSpacing = Math.round(secondaryCurrentVal);
      
      if (onChange) {
        onChange((prev: any) => ({
          ...prev,
          styleConfig: { 
            ...prev.styleConfig, 
            fontSize: updatedStyle.fontSize,
            itemSpacing: updatedStyle.itemSpacing
          }
        }));
      }
    } else if (dragState.type === 'skills') {
      currentVal = Math.max(2, Math.min(35, dragState.startVal + dx / 5));
      updatedStyle.itemSpacing = Math.round(currentVal);
      if (onChange) {
        onChange((prev: any) => ({
          ...prev,
          styleConfig: { ...prev.styleConfig, itemSpacing: updatedStyle.itemSpacing }
        }));
      }
    } else if (dragState.type === 'languages') {
      currentVal = Math.max(9, Math.min(18, dragState.startVal + dx / 15));
      updatedStyle.fontSize = Number(currentVal.toFixed(1));
      if (onChange) {
        onChange((prev: any) => ({
          ...prev,
          styleConfig: { ...prev.styleConfig, fontSize: updatedStyle.fontSize }
        }));
      }
    } else if (dragState.type === 'margins') {
      currentVal = Math.max(10, Math.min(80, dragState.startVal + dx / 3));
      updatedStyle.margins = Math.round(currentVal);
      if (onChange) {
        onChange((prev: any) => ({
          ...prev,
          styleConfig: { ...prev.styleConfig, margins: updatedStyle.margins }
        }));
      }
    }

    setDragState(prev => ({
      ...prev,
      currentX: x,
      currentY: y,
      currentVal,
      secondaryCurrentVal
    }));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.active) return;
    const target = e.target as HTMLElement;
    try {
      target.releasePointerCapture(e.pointerId);
    } catch (err) {}
    setDragState(prev => ({ ...prev, active: false }));
    setTimeout(() => {
      wasDraggingRef.current = false;
    }, 120);
  };

  const [selectedElement, setSelectedElement] = React.useState<any>(null);
  const [hoveredElement, setHoveredElement] = React.useState<any>(null);
  const [isProcessingAI, setIsProcessingAI] = React.useState<boolean>(false);

  const findSelectableElement = (target: HTMLElement, container: HTMLElement): any => {
    let current: HTMLElement | null = target;
    while (current && current !== container) {
      const text = current.innerText || current.textContent || "";
      const rect = current.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const relativeRect = {
        top: rect.top - containerRect.top,
        left: rect.left - containerRect.left,
        width: rect.width,
        height: rect.height
      };

      // Avatar/Photo checks
      const isAvatar = current.classList.contains('t1-avatar') || 
                       current.classList.contains('t1-avatar-wrap') || 
                       current.classList.contains('t2-avatar') || 
                       current.classList.contains('t4-avatar') || 
                       current.getAttribute('class')?.includes('t5-avatar') || 
                       current.getAttribute('class')?.includes('avatar') || 
                       current.getAttribute('class')?.includes('photo') ||
                       (current.tagName.toLowerCase() === 'img' && current.getAttribute('src')?.includes('photo')) ||
                       (current.tagName.toLowerCase() === 'img' && current.getAttribute('class')?.includes('object-cover'));

      if (isAvatar) {
        return {
          type: 'avatar',
          label: 'Círculo de Foto / Iniciais',
          currentText: 'Foto de perfil do currículo',
          title: 'Avatar',
          rect: relativeRect,
          domElement: current
        };
      }

      // Summary checks
      const isSummary = current.classList.contains('t1-bio') || 
                        current.classList.contains('t2-bio') || 
                        current.classList.contains('t3-bio') || 
                        current.getAttribute('class')?.includes('bio') || 
                        (current.tagName.toLowerCase() === 'p' && data.personalInfo.summary && text.includes(data.personalInfo.summary.substring(0, Math.min(20, data.personalInfo.summary.length))));
                        
      if (isSummary && data.personalInfo.summary) {
        return {
          type: 'summary',
          label: 'Resumo / Sobre Mim',
          currentText: data.personalInfo.summary,
          title: 'Perfil Profissional',
          rect: relativeRect,
          domElement: current
        };
      }

      // Experience checks
      const isExperience = current.classList.contains('t1-exp-item') || 
                           current.classList.contains('t2-exp-item') || 
                           current.getAttribute('class')?.includes('exp-item') || 
                           current.getAttribute('class')?.includes('expItem') || 
                           current.getAttribute('class')?.includes('timelineItem') || 
                           current.getAttribute('class')?.includes('expBox') ||
                           current.getAttribute('class')?.includes('rowItem') ||
                           current.getAttribute('class')?.includes('exp-card');
                           
      if (isExperience && data.experience && data.experience.length > 0) {
        const match = data.experience.find(ex => 
          text.includes(ex.position) || text.includes(ex.company) || (ex.description && text.includes(ex.description.substring(0, Math.min(20, ex.description.length))))
        );
        if (match) {
          return {
            type: 'experience',
            id: match.id,
            label: `Experiência: ${match.position} em ${match.company}`,
            currentText: match.description || match.position,
            title: match.position,
            rect: relativeRect,
            domElement: current
          };
        }
      }

      // Education checks
      const isEducation = current.classList.contains('t1-edu-item') || 
                          current.classList.contains('t2-edu-item') || 
                          current.getAttribute('class')?.includes('edu-item') || 
                          current.getAttribute('class')?.includes('eduItem') ||
                          current.getAttribute('class')?.includes('eduBox') ||
                          current.getAttribute('class')?.includes('edu-card');
                          
      if (isEducation && data.education && data.education.length > 0) {
        const match = data.education.find(edu => 
          text.includes(edu.institution) || text.includes(edu.degree) || (edu.description && text.includes(edu.description.substring(0, Math.min(20, edu.description.length))))
        );
        if (match) {
          return {
            type: 'education',
            id: match.id,
            label: `Formação: ${match.degree} em ${match.institution}`,
            currentText: match.description || `${match.degree} - ${match.field}`,
            title: match.degree,
            rect: relativeRect,
            domElement: current
          };
        }
      }

      // Custom Section checks
      const isCustomSectionItem = current.getAttribute('class')?.includes('csi-') || 
                                  current.getAttribute('class')?.includes('cs-item') ||
                                  current.getAttribute('class')?.includes('custom-item');
                                  
      if (isCustomSectionItem && data.customSections && data.customSections.length > 0) {
        for (const cs of data.customSections) {
          for (const item of cs.items) {
            if (text.includes(item.name) || (item.description && text.includes(item.description.substring(0, Math.min(20, item.description.length))))) {
              return {
                type: 'custom',
                id: item.id,
                sectionId: cs.id,
                label: `${cs.title}: ${item.name}`,
                currentText: item.description || item.name,
                title: item.name,
                rect: relativeRect,
                domElement: current
              };
            }
          }
        }
      }

      // Skills checks
      const isSkill = current.classList.contains('t1-skill-tag') || 
                      current.getAttribute('class')?.includes('skill-tag') || 
                      current.getAttribute('class')?.includes('skillItem') ||
                      current.getAttribute('class')?.includes('skillName');
                      
      if (isSkill && data.skills && data.skills.length > 0) {
        const match = data.skills.find(sk => text.includes(sk.name) || sk.name.includes(text));
        if (match) {
          return {
            type: 'skills',
            id: match.id,
            label: `Habilidade: ${match.name}`,
            currentText: match.name,
            title: match.name,
            rect: relativeRect,
            domElement: current
          };
        }
      }

      // Language checks
      const isLang = current.getAttribute('class')?.includes('lang-item') || 
                     current.getAttribute('class')?.includes('language') || 
                     current.getAttribute('class')?.includes('langBox');
                     
      if (isLang && data.languages && data.languages.length > 0) {
        const match = data.languages.find(l => text.includes(l.name) || l.name.includes(text));
        if (match) {
          return {
            type: 'languages',
            id: match.id,
            label: `Idioma: ${match.name}`,
            currentText: `${match.name} - ${match.level}`,
            title: match.name,
            rect: relativeRect,
            domElement: current
          };
        }
      }

      // Generic title/h1 checks
      const isNameOrTitle = current.classList.contains('t1-name') || 
                            current.classList.contains('t1-title') || 
                            current.getAttribute('class')?.includes('-name') || 
                            current.getAttribute('class')?.includes('-title') ||
                            current.tagName.toLowerCase() === 'h1';

      if (isNameOrTitle) {
        return {
          type: 'personalInfo',
          label: 'Informações Pessoais',
          currentText: data.personalInfo.title || data.personalInfo.fullName,
          title: data.personalInfo.fullName,
          rect: relativeRect,
          domElement: current
        };
      }

      current = current.parentElement;
    }
    return null;
  };

  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onChange) return;
    if (wasDraggingRef.current) return;
    const target = e.target as HTMLElement;
    
    if (target.closest('[data-html2canvas-ignore="true"]')) {
      return;
    }
    
    const container = document.getElementById('resume-content');
    if (container) {
      const selectable = findSelectableElement(target, container);
      if (selectable) {
        setSelectedElement(selectable);
      } else {
        setSelectedElement(null);
      }
    }
  };

  const handlePreviewMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onChange) return;
    if (dragState.active || wasDraggingRef.current) {
      setHoveredElement(null);
      return;
    }
    const target = e.target as HTMLElement;
    
    if (target.closest('[data-html2canvas-ignore="true"]')) {
      setHoveredElement(null);
      return;
    }
    
    const container = document.getElementById('resume-content');
    if (container) {
      const selectable = findSelectableElement(target, container);
      if (selectable) {
        setHoveredElement(selectable);
      } else {
        setHoveredElement(null);
      }
    }
  };

  const handleUpdateInformation = async (action: 'expand' | 'shorten') => {
    if (!selectedElement || !onChange) return;
    setIsProcessingAI(true);
    try {
      const updatedText = await alterResumeInformation(
        selectedElement.currentText, 
        action, 
        selectedElement.type
      );
      
      if (selectedElement.type === 'summary') {
        onChange(prev => ({
          ...prev,
          personalInfo: {
            ...prev.personalInfo,
            summary: updatedText
          }
        }));
      } else if (selectedElement.type === 'experience') {
        onChange(prev => ({
          ...prev,
          experience: prev.experience.map(exp => 
            exp.id === selectedElement.id ? { ...exp, description: updatedText } : exp
          )
        }));
      } else if (selectedElement.type === 'education') {
        onChange(prev => ({
          ...prev,
          education: prev.education.map(edu => 
            edu.id === selectedElement.id ? { ...edu, description: updatedText } : edu
          )
        }));
      } else if (selectedElement.type === 'custom') {
        onChange(prev => ({
          ...prev,
          customSections: (prev.customSections || []).map(cs => {
            if (cs.id === selectedElement.sectionId) {
              return {
                ...cs,
                items: cs.items.map(item => 
                  item.id === selectedElement.id ? { ...item, description: updatedText } : item
                )
              };
            }
            return cs;
          })
        }));
      }
      
      // Update local currentText state inside the selectedElement
      setSelectedElement((prevSelected: any) => {
        if (!prevSelected) return null;
        return {
          ...prevSelected,
          currentText: updatedText
        };
      });
    } catch (error) {
      console.error("Erro ao processar as alterações de informação:", error);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleAdjustStyle = (styleProp: keyof ResumeStyleConfig, delta: number) => {
    if (onChange) {
      onChange((prev: any) => {
        const currentVal = (prev.styleConfig?.[styleProp] !== undefined)
          ? prev.styleConfig[styleProp]
          : (styleProp === 'fontSize' ? 13 : styleProp === 'itemSpacing' ? 10 : styleProp === 'margins' ? 30 : 0);
        
        const newVal = Math.max(1, currentVal + delta);
        return {
          ...prev,
          styleConfig: {
            ...(prev.styleConfig || {}),
            [styleProp]: newVal
          }
        };
      });
    }
  };

  // Fixed scale to 1.0 so that templates occupy the entire A4 page area beautifully
  const densityScale = 1.0;

  const wRender = 794;
  const hRender = 1122;

  const fontFam = style.fontFamily === 'serif' ? 'Georgia, serif' : style.fontFamily === 'mono' ? 'monospace' : style.fontFamily === 'grotesk' ? '"Space Grotesk", sans-serif' : 'Inter, sans-serif';

  return (
    <div 
      className={`bg-white relative overflow-visible print:shadow-none shadow-[0_60px_120px_-20px_rgba(0,0,0,0.2)]`} 
      id="resume-content"
      style={{ 
        width: '794px', 
        minHeight: '1122px',
        color: '#1f2937'
      }}
      onClick={handlePreviewClick}
      onMouseMove={handlePreviewMouseMove}
      onMouseLeave={() => setHoveredElement(null)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Absolute Overlays for Interactive Selection & Control */}
      {onChange && hoveredElement && (!selectedElement || selectedElement.id !== hoveredElement.id) && (
        <div 
          data-html2canvas-ignore="true"
          className="absolute z-30 border-2 border-indigo-400/50 bg-indigo-50/5 pointer-events-none rounded transition-all duration-75 cursor-pointer"
          style={{
            top: `${hoveredElement.rect.top - 4}px`,
            left: `${hoveredElement.rect.left - 4}px`,
            width: `${hoveredElement.rect.width + 8}px`,
            height: `${hoveredElement.rect.height + 8}px`,
          }}
        >
          <div className="absolute -top-6 left-0 bg-indigo-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded shadow scale-95 origin-bottom-left whitespace-nowrap">
            🔍 Ajustar: {hoveredElement.label}
          </div>
        </div>
      )}

      {onChange && selectedElement && (
        <>
          {/* Elegant dashed Indigo highlight around the selected element, with NO page-dimming background */}
          <div 
            data-html2canvas-ignore="true"
            className="absolute z-30 border-2 border-indigo-500 bg-indigo-50/5 pointer-events-none rounded border-dashed animate-pulse duration-1000"
            style={{
              top: `${selectedElement.rect.top - 4}px`,
              left: `${selectedElement.rect.left - 4}px`,
              width: `${selectedElement.rect.width + 8}px`,
              height: `${selectedElement.rect.height + 8}px`,
            }}
          />

          {/* Sizing Controller Floating Bar */}
          <div
            data-html2canvas-ignore="true"
            className="absolute z-50 bg-white border border-gray-200 shadow-2xl rounded-full px-2.5 py-1.5 flex items-center gap-1.5 select-none pointer-events-auto"
            style={{
              top: `${selectedElement.rect.top + selectedElement.rect.height + 12 < 1122 ? selectedElement.rect.top + selectedElement.rect.height + 12 : selectedElement.rect.top - 50}px`,
              left: `${Math.max(8, Math.min(794 - 240, selectedElement.rect.left + (selectedElement.rect.width / 2) - 100))}px`,
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (selectedElement.type === 'personalInfo' || selectedElement.type === 'name') {
                  handleAdjustStyle('titleSize', -1);
                } else if (selectedElement.type === 'avatar') {
                  if (onChange) {
                    onChange((prev: any) => ({
                      ...prev,
                      personalInfo: {
                        ...prev.personalInfo,
                        photoSize: Math.max(40, (prev.personalInfo.photoSize || 100) - 5)
                      }
                    }));
                  }
                } else {
                  handleAdjustStyle('fontSize', -0.5);
                }
              }}
              className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-800 flex items-center justify-center border border-gray-200 shadow-sm active:scale-90 transition-all cursor-pointer font-bold text-xs"
              title="Diminuir"
            >
              <Minus size={12} />
            </button>
            <span className="text-[10px] font-mono font-black text-slate-700 min-w-[36px] text-center">
              {(() => {
                if (selectedElement.type === 'personalInfo' || selectedElement.type === 'name') {
                  return `${style.titleSize || 26}px`;
                } else if (selectedElement.type === 'avatar') {
                  return `${data.personalInfo.photoSize || 100}px`;
                } else {
                  return `${(style.fontSize || 13).toFixed(1)}px`;
                }
              })()}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (selectedElement.type === 'personalInfo' || selectedElement.type === 'name') {
                  handleAdjustStyle('titleSize', 1);
                } else if (selectedElement.type === 'avatar') {
                  if (onChange) {
                    onChange((prev: any) => ({
                      ...prev,
                      personalInfo: {
                        ...prev.personalInfo,
                        photoSize: Math.min(220, (prev.personalInfo.photoSize || 100) + 5)
                      }
                    }));
                  }
                } else {
                  handleAdjustStyle('fontSize', 0.5);
                }
              }}
              className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-800 flex items-center justify-center border border-gray-200 shadow-sm active:scale-90 transition-all cursor-pointer font-bold text-xs"
              title="Aumentar"
            >
              <Plus size={12} />
            </button>

            {['experience', 'education', 'skills', 'contact', 'custom'].includes(selectedElement.type) && (
              <>
                <div className="w-[1px] h-3.5 bg-gray-200 mx-0.5" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAdjustStyle('itemSpacing', -1);
                  }}
                  className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm active:scale-90 transition-all cursor-pointer"
                  title="Diminuir Espaçamento"
                >
                  <Minimize2 size={11} />
                </button>
                <span className="text-[9px] font-mono font-black text-indigo-600 min-w-[28px] text-center" title="Espaçamento">
                  {style.itemSpacing || 10}px
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAdjustStyle('itemSpacing', 1);
                  }}
                  className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm active:scale-90 transition-all cursor-pointer"
                  title="Aumentar Espaçamento"
                >
                  <Maximize2 size={11} />
                </button>
              </>
            )}
          </div>
          
          {/* Micro floating editor pill - compact, glassy, and completely responsive */}
          <div
            data-html2canvas-ignore="true"
            className="absolute z-50 bg-slate-950/95 border border-slate-800 text-white rounded-full shadow-2xl px-2.5 py-1.5 flex items-center gap-1.5 font-sans select-none backdrop-blur animate-in fade-in-50 slide-in-from-top-1 duration-150"
            style={{
              top: `${selectedElement.rect.top - 46 < 10 ? selectedElement.rect.top + selectedElement.rect.height + 8 : selectedElement.rect.top - 46}px`,
              left: `${Math.max(8, Math.min(794 - 264, selectedElement.rect.left + (selectedElement.rect.width / 2) - 120))}px`,
              pointerEvents: 'auto'
            }}
          >
            {/* Element type identifier tag */}
            <div className="text-[9px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-950/60 border border-indigo-900/60 px-2 py-0.5 rounded-full whitespace-nowrap">
              {selectedElement.type === 'summary' ? 'Resumo' : selectedElement.type === 'experience' ? 'Experiência' : selectedElement.type === 'education' ? 'Estudos' : selectedElement.type === 'custom' ? 'Secção' : selectedElement.type === 'avatar' ? 'Círculo de Foto' : 'Texto'}
            </div>

            {selectedElement.type === 'avatar' ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onChange) {
                    onChange((prev: any) => ({
                      ...prev,
                      styleConfig: { ...(prev.styleConfig || {}), showPhoto: false }
                    }));
                  }
                  setSelectedElement(null);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-rose-200 hover:text-white hover:bg-rose-900/60 bg-rose-950/30 border border-rose-500/20 rounded-full cursor-pointer transition-all"
                title="Eliminar o círculo e ocultar a foto de perfil do CV de forma definitiva"
              >
                <Trash2 size={11} className="text-rose-400" />
                <span>Eliminar Círculo</span>
              </button>
            ) : (
              <>
                {/* AI Expand */}
                <button
                  disabled={isProcessingAI || selectedElement.type === 'skills' || selectedElement.type === 'languages' || selectedElement.type === 'personalInfo'}
                  onClick={(e) => { e.stopPropagation(); handleUpdateInformation('expand'); }}
                  className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-slate-200 hover:text-white hover:bg-slate-800 rounded-full cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                  title="Expandir informações usando Inteligência Artificial"
                >
                  <Sparkles size={11} className="text-emerald-400 font-bold" />
                  <span>Expandir</span>
                </button>

                {/* Vertical column separator */}
                <div className="w-[1px] h-3.5 bg-slate-800" />

                {/* AI Shorten */}
                <button
                  disabled={isProcessingAI || selectedElement.type === 'skills' || selectedElement.type === 'languages' || selectedElement.type === 'personalInfo'}
                  onClick={(e) => { e.stopPropagation(); handleUpdateInformation('shorten'); }}
                  className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-slate-200 hover:text-white hover:bg-slate-800 rounded-full cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                  title="Resumir texto usando Inteligência Artificial"
                >
                  <Scissors size={10} className="text-rose-400 font-bold" />
                  <span>Resumir</span>
                </button>
              </>
            )}

            {/* Dismiss trigger */}
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedElement(null); }}
              className="ml-0.5 p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full cursor-pointer transition-colors"
              title="Limpar seleção"
            >
              <X size={11} />
            </button>

            {/* Progress status loader */}
            {isProcessingAI && (
              <div className="absolute inset-0 bg-slate-950/95 rounded-full flex items-center justify-center gap-2 px-3">
                <div className="w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[9px] font-bold text-slate-200 animate-pulse">Ajustando Texto...</span>
              </div>
            )}
          </div>
        </>
      )}
      <style>{`
        /* Overrides customizadas do painel de design */
        #resume-content {
          font-family: ${fontFam} !important;
          text-align: ${style.alignment || 'left'} !important;
        }
        
        /* Grelha de Alinhamento e Régua Seção */
        #resume-content.show-guides {
          outline: 2px dashed rgba(99, 102, 241, 0.5) !important;
          outline-offset: -2px !important;
          box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.25) !important;
        }



        /* Profile image with custom interactive pointer rounded borders */
        #resume-content img,
        #resume-content .t1-avatar,
        #resume-content .t2-avatar,
        #resume-content .t1-avatar-wrap img,
        #resume-content .t1-avatar img,
        #resume-content .t2-avatar img,
        #resume-content [class*="-avatar"] img {
          border-radius: ${style.photoBorderRadius !== undefined ? style.photoBorderRadius : 50}% !important;
        }
        #resume-content .t1-avatar,
        #resume-content .t2-avatar,
        #resume-content .t1-avatar-wrap,
        #resume-content [class*="-avatar"] {
          border-radius: ${style.photoBorderRadius !== undefined ? style.photoBorderRadius : 50}% !important;
          width: ${data.personalInfo.photoSize || 100}px !important;
          height: ${data.personalInfo.photoSize || 100}px !important;
        }

        /* Text fonts size & line height overrides */
        #resume-content p, 
        #resume-content span:not(.t1-contact-icon), 
        #resume-content div:not(.t1-name):not(.t2-name):not(.t3-name):not(.t1-left):not(.t2-header):not(.t1-avatar):not(.t2-avatar):not(.shrink-0), 
        #resume-content li, 
        #resume-content td {
          font-size: ${style.fontSize}px !important;
          line-height: ${style.lineHeight || 1.4} !important;
        }

        /* Sub-texts are slightly smaller to maintain visual hierarchy */
        #resume-content .t1-exp-desc,
        #resume-content .t1-contact-text,
        #resume-content .t2-contact-text,
        #resume-content .t1-edu-year,
        #resume-content .t2-edu-year,
        #resume-content .t1-edu-school {
          font-size: ${Math.max(8, (style.fontSize || 13) - 2)}px !important;
        }

        /* Main Full-Name Overrides */
        #resume-content .t1-name, 
        #resume-content .t2-name, 
        #resume-content .t3-name,
        #resume-content .t1-left .t1-avatar-wrap + div .font-bold,
        #resume-content h1 {
          font-size: ${style.titleSize || 26}px !important;
          line-height: 1.1 !important;
        }

        /* Section Title Margins and Size Overrides */
        #resume-content .t1-section-title,
        #resume-content .t1-right-title,
        #resume-content .t2-section-title,
        #resume-content h3,
        #resume-content h2 {
          font-size: ${Math.min(22, (style.fontSize || 13) + 3)}px !important;
          margin-bottom: ${style.sectionSpacing}px !important;
          margin-top: ${Math.max(10, (style.sectionSpacing || 25) - 5)}px !important;
        }

        /* Document margins padding control */
        #resume-content .t1-left,
        #resume-content .t2-left {
          padding-top: ${style.margins}px !important;
          padding-bottom: ${style.margins}px !important;
          padding-left: calc(${style.margins}px * 0.6) !important;
          padding-right: calc(${style.margins}px * 0.6) !important;
        }
        #resume-content .t1-right,
        #resume-content .t2-right,
        #resume-content .t2-header {
          padding: ${style.margins}px ${style.margins}px !important;
        }

        /* List Items Margin Control */
        #resume-content .t1-exp-item,
        #resume-content .t2-edu-item,
        #resume-content .t1-edu-item,
        #resume-content .t1-contact-item,
        #resume-content .t2-contact-row {
          margin-bottom: ${style.itemSpacing}px !important;
        }
      `}</style>
      
      {/* Canva-style interactive guidelines overlay */}
      {dragState.active && (
        <div className="absolute inset-0 pointer-events-none z-[999]" style={{ width: '100%', height: '100%' }}>
          {/* Left margin guideline */}
          <div 
            className="absolute top-0 bottom-0 border-l border-dashed border-indigo-500/80" 
            style={{ left: `${style.margins}px` }}
          >
            <span className="absolute top-4 left-1 bg-indigo-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded shadow whitespace-nowrap">Margem Esq. ({style.margins}px)</span>
          </div>

          {/* Right margin guideline */}
          <div 
            className="absolute top-0 bottom-0 border-l border-dashed border-indigo-500/80" 
            style={{ right: `${style.margins}px` }}
          >
            <span className="absolute top-4 right-1 bg-indigo-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded shadow whitespace-nowrap">Margem Dir. ({style.margins}px)</span>
          </div>

          {/* Vertical axis center guideline */}
          <div 
            className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 border-l border-dashed border-rose-500/80"
          >
            <span className="absolute top-1/4 -translate-x-1/2 bg-rose-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded shadow whitespace-nowrap">Eixo Central</span>
          </div>

          {/* Horizontal coordinate tracking line with dynamic values */}
          <div 
            className="absolute left-0 right-0 border-t border-dashed border-indigo-500" 
            style={{ top: `${dragState.currentY}px` }}
          >
            <div 
              className="absolute bg-indigo-950 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-2xl flex items-center gap-1.5 whitespace-nowrap"
              style={{ 
                left: `${Math.min(650, Math.max(50, dragState.currentX))}px`, 
                top: '-24px',
                transform: 'translateX(-50%)' 
              }}
            >
              <span>✨</span>
              <span className="uppercase tracking-wider">
                {dragState.type === 'name' && `Tamanho do Nome: ${Math.round(dragState.currentVal)}px`}
                {dragState.type === 'photo' && `Tamanho da Foto: ${Math.round(dragState.currentVal)}px | Cantos: ${Math.round(dragState.secondaryCurrentVal)}%`}
                {dragState.type === 'bio' && `Tamanho Fonte: ${dragState.currentVal}px | Espaço Linhas: ${dragState.secondaryCurrentVal}`}
                {dragState.type === 'sectionSpacing' && `Espaço Seções: ${Math.round(dragState.currentVal)}px`}
                {dragState.type === 'experience' && `Reordenando Experiência #${dragState.index + 1} | Espaço: ${style.itemSpacing || 10}px`}
                {dragState.type === 'education' && `Reordenando Formação #${dragState.index + 1} | Espaço: ${style.itemSpacing || 10}px`}
                {dragState.type === 'contact' && `Fonte Contatos: ${dragState.currentVal}px | Espço Linhas: ${dragState.secondaryCurrentVal}px`}
                {dragState.type === 'skills' && `Espaçamento Habilidades: ${Math.round(dragState.currentVal)}px`}
                {dragState.type === 'languages' && `Tamanho Texto Idiomas: ${dragState.currentVal}px`}
                {dragState.type === 'margins' && `Margem Documento: ${Math.round(dragState.currentVal)}px`}
              </span>
            </div>
          </div>
        </div>
      )}

      <div 
        className="relative overflow-visible"
        style={{ 
          width: `${wRender}px`,
          height: 'auto',
          minHeight: `${hRender}px`,
          transform: `scale(${densityScale})`,
          transformOrigin: 'top left'
        }}
      >
        
        {/* Dynamic Layout Styles */}
      {theme.layout === 'custom-t1' && (
        <div className="t1" style={{ '--primary': c.primary } as any}>
          <div className="t1-left">
            {data.styleConfig?.showPhoto !== false && (
              <div className="t1-avatar-wrap">
                <div 
                  className="t1-avatar overflow-hidden" 
                  style={{ 
                    borderRadius: data.personalInfo.photoStyle === 'square' ? '12px' : '50%',
                    width: `${data.personalInfo.photoSize || 100}px`,
                    height: `${data.personalInfo.photoSize || 100}px`,
                    fontSize: `${(data.personalInfo.photoSize || 100) * 0.4}px`,
                    lineHeight: `${data.personalInfo.photoSize || 100}px`,
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {data.personalInfo.photo ? <img src={data.personalInfo.photo} referrerPolicy="no-referrer" alt="Profile" className="w-full h-full object-cover object-top" /> : (data.personalInfo.fullName ? data.personalInfo.fullName.charAt(0).toUpperCase() : 'CV')}
                </div>
              </div>
            )}
            {/* T1 Sidebar sections with improved alignment */}
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: data.styleConfig?.showPhoto !== false ? '32px' : '0px' }}>
              <div style={{ marginBottom: '32px' }}>
                <div className="t1-section-title">{data.language === 'en' ? 'Contact' : 'Contacto'}</div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {data.personalInfo.email && <div key="email" className="t1-contact-item flex items-center gap-2.5"><span className="t1-contact-icon flex items-center justify-center shrink-0"><Mail size={12} /></span><span className="t1-contact-text leading-none">{data.personalInfo.email}</span></div>}
                  {data.personalInfo.phone && <div key="phone" className="t1-contact-item flex items-center gap-2.5"><span className="t1-contact-icon flex items-center justify-center shrink-0"><Phone size={12} /></span><span className="t1-contact-text leading-none">{data.personalInfo.phone}</span></div>}
                  {data.personalInfo.location && <div key="loc" className="t1-contact-item flex items-center gap-2.5"><span className="t1-contact-icon flex items-center justify-center shrink-0"><MapPin size={12} /></span><span className="t1-contact-text leading-none">{data.personalInfo.location}</span></div>}
                </div>
              </div>
              
              {data.education.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <div className="t1-section-title">{data.language === 'en' ? 'Education' : 'Formação'}</div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {data.education.map((e, idx) => (
                      <div key={e.id || `edu-${idx}`} className="t1-edu-item" style={{ marginBottom: idx === data.education.length - 1 ? 0 : '18px' }}>
                        <div className="t1-edu-degree">{e.degree}</div>
                        <div className="t1-edu-school">{e.institution}</div>
                        <div className="t1-edu-year">{e.startDate} - {e.endDate}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {data.skills.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <EditableTitle as="div" className="t1-section-title" defaultText="Habilidades" text={getSectionTitle(data, 'skills', 'Habilidades')} onSave={onChange ? (v) => handleTitleChange('skills', v) : undefined} />
                  <div>
                    {data.skills.map((s, idx) => (
                       <span key={s.id || `skill-${idx}`} className="t1-skill-tag">{s.name}</span>
                    ))}
                  </div>
                </div>
              )}

              {data.languages && data.languages.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <EditableTitle as="div" className="t1-section-title" defaultText="Idiomas" text={getSectionTitle(data, 'languages', 'Idiomas')} onSave={onChange ? (v) => handleTitleChange('languages', v) : undefined} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {data.languages.map((l, idx) => (
                       <div key={l.id || `lang-${idx}`} className="flex justify-between items-center text-[12px] opacity-90" style={{ marginBottom: idx === data.languages.length - 1 ? 0 : '12px' }}>
                         <span className="font-bold">{l.name}</span>
                         <span className="opacity-60 italic text-[10px] uppercase font-black tracking-widest">{l.level}</span>
                       </div>
                    ))}
                  </div>
                </div>
              )}

              {data.customSections?.map((cs, idx) => (
                <div key={cs.id || `cs-${idx}`} style={{ marginBottom: '32px' }}>
                  <div className="t1-section-title">{cs.title}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {cs.items.map((item, idxx) => (
                       <div key={item.id || `csi-${idxx}`} className="flex flex-col text-[12px] opacity-90">
                         <span className="font-bold mb-1">{item.name}</span>
                         {item.description && <span className="opacity-80 leading-relaxed font-serif text-[11px] whitespace-pre-wrap">{item.description}</span>}
                       </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="t1-right">
             <div className="t1-name mb-1">{data.personalInfo.fullName }</div>
             <div className="t1-title mb-4">{data.personalInfo.title }</div>
             <div className="t1-divider"></div>
             {data.personalInfo.summary && <div className="t1-bio leading-relaxed">{renderText(data.personalInfo.summary)}</div>}

             {data.experience.length > 0 && (
                <div className="t1-right-section">
                  <EditableTitle as="div" className="t1-right-title" defaultText="Experiência Profissional" text={getSectionTitle(data, 'experience', 'Experiência Profissional')} onSave={onChange ? (v) => handleTitleChange('experience', v) : undefined} />
                  <div className="flex flex-col gap-6">
                    {data.experience.map((ex, idx) => (
                      <div key={ex.id || `exp-${idx}`} className="t1-exp-item">
                        <div className="flex flex-col items-center pt-1.5 flex-shrink-0">
                          <div className="t1-exp-dot"></div>
                          <div className="flex-1 w-0.5 bg-gray-100 my-1"></div>
                        </div>
                        <div className="t1-exp-body">
                           <div className="t1-exp-role font-bold">{ex.position} | <span style={{color: '#4b5563', fontSize: '13px', fontWeight: '500'}}>{ex.company}</span></div>
                           <div className="t1-exp-period text-gray-400 mt-0.5 uppercase tracking-tighter font-black text-[10px]">{ex.startDate} - {ex.current ? (data.language === 'en' ? 'Present' : 'Presente') : ex.endDate}</div>
                           <div className="t1-exp-desc mt-3 leading-relaxed">{renderText(ex.description)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
             )}
          </div>
        </div>
      )}

      {theme.layout === 'custom-t2' && (
        <div className="t2" style={{ '--primary': c.primary, '--soft': c.soft } as any}>
          <div className="t2-header">
             {data.styleConfig?.showPhoto !== false && (
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
             )}
             <div className="t2-header-text">
                <div className="t2-name">{data.personalInfo.fullName }</div>
                <div className="t2-title">{data.personalInfo.title }</div>
                <div className="t2-divider"></div>
                {data.personalInfo.summary && <div className="t2-bio">{renderText(data.personalInfo.summary)}</div>}
             </div>
          </div>
          
          <div className="t2-body">
             <div className="t2-left">
                <div className="t2-section">
                   <div className="t2-section-title">{data.language === 'en' ? 'Contact' : 'Contacto'}</div>
                   <div className="flex flex-col gap-3">
                     {data.personalInfo.email && <div key="email" className="t2-contact-row flex items-center gap-2.5"><span className="t2-contact-icon flex items-center justify-center shrink-0"><Mail size={14} /></span> <span className="t2-contact-text" style={{ lineHeight: '1.2' }}>{data.personalInfo.email}</span></div>}
                     {data.personalInfo.phone && <div key="phone" className="t2-contact-row flex items-center gap-2.5"><span className="t2-contact-icon flex items-center justify-center shrink-0"><Phone size={14} /></span> <span className="t2-contact-text" style={{ lineHeight: '1.2' }}>{data.personalInfo.phone}</span></div>}
                     {data.personalInfo.location && <div key="loc" className="t2-contact-row flex items-center gap-2.5"><span className="t2-contact-icon flex items-center justify-center shrink-0"><MapPin size={14} /></span> <span className="t2-contact-text" style={{ lineHeight: '1.2' }}>{data.personalInfo.location}</span></div>}
                   </div>
                </div>
                
                {data.education.length > 0 && (
                  <div className="t2-section">
                     <div className="t2-section-title">{data.language === 'en' ? 'Education' : 'Formação'}</div>
                     <div className="flex flex-col gap-4">
                       {data.education.map((e, idx) => (
                         <div key={e.id || `edu-${idx}`} className="t2-edu-item">
                           <div className="t2-edu-degree">{e.degree}</div>
                           <div className="t2-edu-school">{e.institution}</div>
                           <div className="t2-edu-year">{e.startDate} - {e.endDate}</div>
                         </div>
                       ))}
                     </div>
                  </div>
                )}
                
                {data.skills.length > 0 && (
                  <div className="t2-section">
                     <div className="t2-section-title">{data.language === 'en' ? 'Skills' : 'Habilidades'}</div>
                     <div className="flex flex-wrap gap-2">
                       {data.skills.map((s, idx) => (
                         <div key={s.id || `skill-${idx}`} className="t2-skill-item px-3 py-1 bg-white border border-gray-100 rounded shadow-sm text-xs font-bold text-gray-700">
                           {s.name}
                         </div>
                       ))}
                     </div>
                  </div>
                )}
                
                {data.languages && data.languages.length > 0 && (
                  <div className="t2-section">
                     <EditableTitle as="div" className="t2-section-title" defaultText="Idiomas" text={getSectionTitle(data, 'languages', 'Idiomas')} onSave={onChange ? (v) => handleTitleChange('languages', v) : undefined} />
                     <div className="flex flex-col gap-2">
                       {data.languages.map((l, idx) => (
                         <div key={l.id || `lang-${idx}`} className="flex justify-between items-center text-[12px]">
                            <div className="font-semibold text-gray-800">{l.name}</div>
                            <div className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">{l.level}</div>
                         </div>
                       ))}
                     </div>
                  </div>
                )}
             </div>
             
             <div className="t2-right">
                {data.experience.length > 0 && (
                  <div className="t2-section">
                     <EditableTitle as="div" className="t2-section-title" defaultText="Experiência Profissional" text={getSectionTitle(data, 'experience', 'Experiência Profissional')} onSave={onChange ? (v) => handleTitleChange('experience', v) : undefined} />
                     <div className="flex flex-col gap-8">
                       {data.experience.map((ex, idx) => (
                          <div key={ex.id || `exp-${idx}`} className="t2-exp-item">
                             <div className="t2-exp-header">
                                <div className="t2-exp-company">{ex.company}</div>
                                <div className="t2-exp-period">{ex.startDate} - {ex.current ? (data.language === 'en' ? 'Present' : 'Presente') : ex.endDate}</div>
                             </div>
                             <div className="t2-exp-role">{ex.position}</div>
                             <div className="t2-exp-desc">{renderText(ex.description)}</div>
                          </div>
                       ))}
                     </div>
                  </div>
                )}

                {data.customSections?.map((cs, idx) => (
                  <div key={cs.id || `cs-${idx}`} className="t2-section">
                    <div className="t2-section-title">{cs.title}</div>
                    <div className="flex flex-col gap-6">
                      {cs.items.map((item, idxx) => (
                        <div key={item.id || `csi-${idxx}`} className="t2-exp-item">
                           <div className="t2-exp-role" style={{ fontSize: '13px' }}>{item.name}</div>
                           {item.description && <div className="t2-exp-desc mt-1.5">{renderText(item.description)}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {theme.layout === 'custom-t3' && (
        <div className="t3" style={{ '--primary': c.primary, '--primary-light': c.lines, '--heading': c.heading } as any}>
           <div className="t3-header">
              <div className="t3-name">{data.personalInfo.fullName }</div>
              <div className="t3-title">{data.personalInfo.title }</div>
              {data.personalInfo.summary && <div className="t3-bio">{renderText(data.personalInfo.summary)}</div>}
              
              <div className="t3-contact-row">
                {data.personalInfo.email && <div key="email" className="t3-contact-item flex items-center gap-1.5"><Mail size={12} className="t3-contact-icon shrink-0" /> <span style={{ lineHeight: '1.2' }}>{data.personalInfo.email}</span></div>}
                {data.personalInfo.phone && <div key="phone" className="t3-contact-item flex items-center gap-1.5"><Phone size={12} className="t3-contact-icon shrink-0" /> <span style={{ lineHeight: '1.2' }}>{data.personalInfo.phone}</span></div>}
                {data.personalInfo.location && <div key="loc" className="t3-contact-item flex items-center gap-1.5"><MapPin size={12} className="t3-contact-icon shrink-0" /> <span style={{ lineHeight: '1.2' }}>{data.personalInfo.location}</span></div>}
              </div>
           </div>
           
           <div className="t3-body">
              <div className="t3-left">                 
                 {data.education.length > 0 && (
                   <div>
                     <div className="t3-section-title">Formação Académica</div>
                     {data.education.map((e, idx) => (
                       <div key={e.id || `edu-${idx}`} className="t3-edu-item">
                          <div className="t3-edu-school">{e.institution}</div>
                          <div className="t3-edu-degree">{e.degree}</div>
                          <div className="t3-edu-year">{e.startDate} - {e.endDate}</div>
                       </div>
                     ))}
                   </div>
                 )}

                 {data.skills.length > 0 && (
                   <div>
                      <div className="t3-section-title">{data.language === 'en' ? 'Skills' : 'Habilidades'}</div>
                      <div>
                        {data.skills.map((s, idx) => (
                           <div key={s.id || `skill-${idx}`} className="t3-skill-item">
                              <span className="t3-skill-label">{s.name}</span>
                              {s.level && s.level !== 'Ocultar' && <span className="t3-skill-level">{s.level}</span>}
                           </div>
                        ))}
                      </div>
                   </div>
                 )}

                 {data.languages && data.languages.length > 0 && (
                   <div>
                      <div className="t3-section-title">{data.language === 'en' ? 'Languages' : 'Idiomas'}</div>
                      <div>
                        {data.languages.map((l, idx) => (
                           <div key={l.id || `lang-${idx}`} className="t3-skill-item">
                              <span className="t3-skill-label">{l.name}</span>
                              <span className="t3-skill-level">{l.level}</span>
                           </div>
                        ))}
                      </div>
                   </div>
                 )}
              </div>
              
              <div className="t3-right">
                 {data.experience.length > 0 && (
                   <div>
                      <EditableTitle as="div" className="t3-section-title" defaultText="Experiência Profissional" text={getSectionTitle(data, 'experience', 'Experiência Profissional')} onSave={onChange ? (v) => handleTitleChange('experience', v) : undefined} />
                      {data.experience.map((ex, idx) => (
                         <div key={ex.id || `exp-${idx}`} className="t3-exp-item">
                            <div className="t3-exp-header">
                               <div className="t3-exp-company">{ex.company}</div>
                               <div className="t3-exp-period">{ex.startDate} - {ex.current ? (data.language === 'en' ? 'Present' : 'Presente') : ex.endDate}</div>
                            </div>
                            <div className="t3-exp-role">{ex.position}</div>
                            <div className="t3-exp-desc">{renderText(ex.description)}</div>
                         </div>
                      ))}
                   </div>
                 )}

                 {data.customSections?.map((cs, idx) => (
                   <div key={cs.id || `cs-${idx}`}>
                      <div className="t3-section-title">{cs.title}</div>
                      {cs.items.map((item, idxx) => (
                         <div key={item.id || `csi-${idxx}`} className="t3-exp-item">
                            <div className="t3-exp-role" style={{ fontSize: '13px' }}>{item.name}</div>
                            {item.description && <div className="t3-exp-desc mt-1.5">{renderText(item.description)}</div>}
                         </div>
                      ))}
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {theme.layout === 'custom-t4' && (
        <div className="flex w-full min-h-[1122px] h-auto bg-white text-left font-sans overflow-visible relative border border-gray-100">
          <div className="w-[32%] flex flex-col relative z-10" style={{ backgroundColor: c.primary, color: 'white' }}>
             {data.styleConfig?.showPhoto !== false && (data.personalInfo.photo ? (
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
                 className="w-full font-black bg-black/20" 
                 style={{ 
                   height: data.personalInfo.photoStyle === 'circle' ? `${(data.personalInfo.photoSize || 100) * 1.5}px` : '320px',
                   width: data.personalInfo.photoStyle === 'circle' ? `${(data.personalInfo.photoSize || 100) * 1.5}px` : '100%',
                   borderRadius: data.personalInfo.photoStyle === 'circle' ? '50%' : '0',
                   margin: data.personalInfo.photoStyle === 'circle' ? '20px auto' : '0',
                   fontSize: '4rem',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   lineHeight: data.personalInfo.photoStyle === 'circle' ? `${(data.personalInfo.photoSize || 100) * 1.5}px` : '320px',
                   textAlign: 'center'
                 }}
               >
                 {data.personalInfo.fullName.charAt(0)}
               </div>
             ))}
             <div className="p-10 flex flex-col gap-10 flex-1">
                <div>
                   <h1 className="text-[38px] font-black leading-[1.1] mb-2">{data.personalInfo.fullName.replace(' ', '\n')}</h1>
                   <p className="text-sm tracking-[0.2em] uppercase font-semibold text-white/70 mt-4">{data.personalInfo.title}</p>
                </div>
                <div>
                   <h3 className="text-xl font-bold mb-5 pb-2 text-white border-b-2 border-white/20 inline-block pr-6">{data.language === 'en' ? 'Contact' : 'Contacto'}</h3>
                     <div className="flex flex-col text-[13px] opacity-90">
                       {data.personalInfo.email && <div key="email" className="flex items-center gap-2 mb-4"><Mail size={14} className="opacity-75 shrink-0" /> <span style={{ lineHeight: '1.2' }}>{data.personalInfo.email}</span></div>}
                       {data.personalInfo.phone && <div key="phone" className="flex items-center gap-2 mb-4"><Phone size={14} className="opacity-75 shrink-0" /> <span style={{ lineHeight: '1.2' }}>{data.personalInfo.phone}</span></div>}
                       {data.personalInfo.location && <div key="loc" className="flex items-center gap-2 mb-4"><MapPin size={14} className="opacity-75 shrink-0" /> <span style={{ lineHeight: '1.2' }}>{data.personalInfo.location}</span></div>}
                     </div>
                </div>
                {data.languages && data.languages.length > 0 && (
                  <div>
                     <EditableTitle as="h3" className="text-xl font-bold mb-5 pb-2 text-white border-b-2 border-white/20 inline-block pr-6"  defaultText="Idiomas" text={getSectionTitle(data, 'languages', 'Idiomas')} onSave={onChange ? (v) => handleTitleChange('languages', v) : undefined} />
                     <div className="flex flex-col gap-3 text-[13px] opacity-90">
                       {data.languages.map((l, idx) => (
                          <div key={l.id || `lang-${idx}`} className="flex flex-col gap-0.5">
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
                  <EditableTitle as="h2" className="text-[28px] font-black mb-4 leading-tight" style={{ color: '#111827' }} defaultText="Perfil Profissional" text={getSectionTitle(data, 'summary', 'Perfil Profissional')} onSave={onChange ? (v) => handleTitleChange('summary', v) : undefined} />
                  <div className="w-12 h-1.5 bg-gray-200 mb-6 rounded-full"></div>
                  <p className="text-[14px] leading-[1.8] text-left font-serif" style={{ color: '#374151' }}>{renderText(data.personalInfo.summary)}</p>
               </div>
             )}
             {data.experience.length > 0 && (
               <div>
                  <EditableTitle as="h2" className="text-[28px] font-black mb-4 leading-tight" style={{ color: '#111827' }} defaultText="Experiência Profissional" text={getSectionTitle(data, 'experience', 'Experiência Profissional')} onSave={onChange ? (v) => handleTitleChange('experience', v) : undefined} />
                  <div className="w-12 h-1.5 bg-gray-200 mb-8 rounded-full"></div>
                  <div className="flex flex-col gap-10">
                     {data.experience.map((ex, idx) => (
                       <div key={ex.id || `exp-${idx}`} className="flex gap-4">
                          <div className="flex flex-col items-center pt-2">
                             <div className="w-3 h-3 rounded-full border-2 border-gray-200"></div>
                             <div className="w-0.5 flex-1 bg-gray-50 my-1"></div>
                          </div>
                          <div className="flex-1">
                             <h4 className="text-[16px] font-bold mb-1" style={{ color: '#1f2937' }}>{ex.position}</h4>
                             <div className="flex justify-between items-center mb-4">
                                <span className="text-[13px] font-bold tracking-tight uppercase" style={{ color: '#4b5563' }}>{ex.company}</span>
                                <span className="text-[11px] font-black bg-gray-100 px-2 py-1 rounded" style={{ color: '#6b7280' }}>{ex.startDate} - {ex.current ? (data.language === 'en' ? 'Present' : 'Presente') : ex.endDate}</span>
                             </div>
                             <p className="text-[13px] leading-[1.7] text-left font-serif mt-1" style={{ color: '#4b5563' }}>{renderText(ex.description)}</p>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
             )}
             {data.skills.length > 0 && (
               <div>
                  <EditableTitle as="h2" className="text-[28px] font-black mb-4 leading-tight" style={{ color: '#111827' }} defaultText="Habilidades" text={getSectionTitle(data, 'skills', 'Habilidades')} onSave={onChange ? (v) => handleTitleChange('skills', v) : undefined} />
                  <div className="w-12 h-1.5 bg-gray-200 mb-6 rounded-full"></div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] leading-[1.8] font-serif" style={{ color: '#374151' }}>
                    {data.skills.map((s, idx) => <span key={s.id || `skill-${idx}`} className="flex items-center gap-2 font-bold">• {s.name}</span>)}
                  </div>
               </div>
             )}
             {data.education.length > 0 && (
               <div>
                  <EditableTitle as="h2" className="text-[28px] font-black mb-4 leading-tight" style={{ color: '#111827' }} defaultText="Formação" text={getSectionTitle(data, 'education', 'Formação')} onSave={onChange ? (v) => handleTitleChange('education', v) : undefined} />
                  <div className="w-12 h-1.5 bg-gray-200 mb-6 rounded-full"></div>
                  <div className="flex flex-col gap-6">
                    {data.education.map((e, idx) => (
                      <div key={e.id || `edu-${idx}`}>
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
             {data.customSections?.map((cs, idx) => (
               <div key={cs.id || `cs-${idx}`}>
                  <h2 className="text-[28px] font-black mb-4 leading-tight" style={{ color: '#111827' }}>{cs.title}</h2>
                  <div className="w-12 h-1.5 bg-gray-200 mb-6 rounded-full"></div>
                  <div className="flex flex-col gap-6">
                    {cs.items.map((item, idxx) => (
                      <div key={item.id || `csi-${idxx}`}>
                         <h4 className="text-[15px] font-bold mb-1" style={{ color: '#1f2937' }}>{item.name}</h4>
                         {item.description && <p className="text-[13px] leading-[1.7] text-left font-serif mt-1" style={{ color: '#4b5563' }}>{renderText(item.description)}</p>}
                      </div>
                    ))}
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {theme.layout === 'custom-t5' && (
        <div className="flex w-full min-h-[1122px] h-auto bg-[#FAFAFA] text-left font-sans overflow-visible relative">
           <div className="w-[34%] flex flex-col relative z-20 pt-16" style={{ backgroundColor: c.soft || '#F3F4F6' }}>
             {/* Decorative header shape - simplified for PDF consistency */}
             <div className="absolute top-0 left-0 right-0 h-48 bg-white" style={{ borderRadius: '0 0 100px 100px', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}></div>
             
             <div className="relative z-30 w-full flex flex-col items-center px-10">
               {data.styleConfig?.showPhoto !== false && (
                <div className="mb-12 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] bg-white overflow-hidden" 
                     style={{ 
                       width: `${data.personalInfo.photoSize || 160}px`,
                       height: `${data.personalInfo.photoSize || 160}px`,
                       borderRadius: data.personalInfo.photoStyle === 'circle' ? '50%' : '24px',
                       border: '5px solid white'
                     }}>
                {data.personalInfo.photo ? (
                  <img src={data.personalInfo.photo} referrerPolicy="no-referrer" alt="Profile" className="w-full h-full object-cover object-top" />
                ) : (
                  <div 
                    className="w-full h-full font-black bg-gray-100 text-gray-400" 
                    style={{ 
                      fontSize: `${(data.personalInfo.photoSize || 160) * 0.4}px`,
                      lineHeight: `${data.personalInfo.photoSize || 160}px`,
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                    {data.personalInfo.fullName.charAt(0)}
                  </div>
                )}
                </div>
               )}
                
                <div className="w-full mb-10">
                  <div className="mb-6 border-b-2 pb-2" style={{ borderColor: `${c.primary}40` }}>
                     <h3 className="text-[12px] font-black uppercase tracking-[0.2em]" style={{ color: c.primary }}>{data.language === 'en' ? 'Contact' : 'Contacto'}</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', fontSize: '13px', width: '100%', fontWeight: '500', color: '#374151' }}>
                     {data.personalInfo.phone && <div key="phone" className="flex items-center gap-2.5 mb-4 text-gray-700 font-semibold"><Phone size={14} className="opacity-75 shrink-0" style={{ color: c.primary }} /> <span style={{ lineHeight: '1.2' }}>{data.personalInfo.phone}</span></div>}
                     {data.personalInfo.email && <div key="email" className="flex items-center gap-2.5 mb-4 text-gray-700 font-semibold"><Mail size={14} className="opacity-75 shrink-0" style={{ color: c.primary }} /> <span className="break-all" style={{ lineHeight: '1.2' }}>{data.personalInfo.email}</span></div>}
                     {data.personalInfo.location && <div key="loc" className="flex items-center gap-2.5 mb-4 text-gray-700 font-semibold"><MapPin size={14} className="opacity-75 shrink-0" style={{ color: c.primary }} /> <span style={{ lineHeight: '1.2' }}>{data.personalInfo.location}</span></div>}
                  </div>
                </div>

                {data.skills.length > 0 && (
                  <div className="w-full mb-10">
                    <div className="mb-6 border-b-2 pb-2" style={{ borderColor: `${c.primary}40` }}>
                       <EditableTitle as="h3" className="text-[12px] font-black uppercase tracking-[0.2em]"  style={{ color: c.primary }} defaultText="Habilidades" text={getSectionTitle(data, 'skills', 'Habilidades')} onSave={onChange ? (v) => handleTitleChange('skills', v) : undefined} />
                    </div>
                    <div className="flex flex-col gap-3">
                       {data.skills.map((s, idx) => (
                         <div key={s.id || `skill-${idx}`} className="font-semibold text-[13px] flex items-center gap-2" style={{ color: '#374151' }}>
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{backgroundColor: c.primary}}></div>
                            {s.name}
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                {data.education.length > 0 && (
                  <div className="w-full mb-10">
                    <div className="mb-6 border-b-2 pb-2" style={{ borderColor: `${c.primary}40` }}>
                       <EditableTitle as="h3" className="text-[12px] font-black uppercase tracking-[0.2em]"  style={{ color: c.primary }} defaultText="Formação" text={getSectionTitle(data, 'education', 'Formação')} onSave={onChange ? (v) => handleTitleChange('education', v) : undefined} />
                    </div>
                    <div className="flex flex-col gap-6" style={{ color: '#374151' }}>
                       {data.education.map((e, idx) => (
                         <div key={e.id || `edu-${idx}`}>
                            <div className="font-black mb-1 text-[13px] leading-tight" style={{ color: c.primary }}>{e.institution}</div>
                            <div className="font-medium text-[13px]">{e.degree}</div>
                            <div className="text-[11px] font-bold opacity-60 mt-1 uppercase tracking-wider">{e.startDate} - {e.endDate}</div>
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                {/* Languages Section */}
                {data.languages && data.languages.length > 0 && (
                  <div className="w-full mb-10">
                    <div className="mb-6 border-b-2 pb-2" style={{ borderColor: `${c.primary}40` }}>
                       <EditableTitle as="h3" className="text-[12px] font-black uppercase tracking-[0.2em]"  style={{ color: c.primary }} defaultText="Idiomas" text={getSectionTitle(data, 'languages', 'Idiomas')} onSave={onChange ? (v) => handleTitleChange('languages', v) : undefined} />
                    </div>
                    <div className="flex flex-col gap-3">
                       {data.languages.map((l, idx) => (
                         <div key={l.id || `lang-${idx}`} className="font-semibold text-[13px] flex justify-between items-center" style={{ color: '#374151' }}>
                            <div className="flex items-center gap-2">
                               <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{backgroundColor: c.primary}}></div>
                               <span>{l.name}</span>
                            </div>
                            <span className="text-[10px] uppercase font-black tracking-wider opacity-60">{l.level}</span>
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                {/* Certifications Section */}
                {data.certifications && data.certifications.length > 0 && (
                  <div className="w-full mb-10">
                    <div className="mb-6 border-b-2 pb-2" style={{ borderColor: `${c.primary}40` }}>
                       <EditableTitle as="h3" className="text-[12px] font-black uppercase tracking-[0.2em]"  style={{ color: c.primary }} defaultText="Certificações" text={getSectionTitle(data, 'certifications', 'Certificações')} onSave={onChange ? (v) => handleTitleChange('certifications', v) : undefined} />
                    </div>
                    <div className="flex flex-col gap-4">
                       {data.certifications.map((cert, idx) => (
                         <div key={cert.id || `cert-${idx}`} style={{ color: '#374151' }}>
                            <div className="font-bold text-[13px] leading-tight text-gray-800">{cert.name}</div>
                            {cert.date && <div className="text-[11px] font-bold opacity-60 mt-0.5 uppercase tracking-wider">{cert.date}</div>}
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                {/* Interests Section */}
                {data.interests && data.interests.length > 0 && (
                  <div className="w-full mb-10">
                    <div className="mb-6 border-b-2 pb-2" style={{ borderColor: `${c.primary}40` }}>
                       <EditableTitle as="h3" className="text-[12px] font-black uppercase tracking-[0.2em]"  style={{ color: c.primary }} defaultText="Interesses" text={getSectionTitle(data, 'interests', 'Interesses')} onSave={onChange ? (v) => handleTitleChange('interests', v) : undefined} />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                       {data.interests.map((interest, idx) => (
                         <span key={idx} className="px-2.5 py-1 bg-white border border-gray-200/80 rounded-full text-[10px] font-bold text-gray-600 shadow-sm">
                           {interest}
                         </span>
                       ))}
                    </div>
                  </div>
                )}
             </div>
           </div>

           <div className="w-[66%] py-20 px-14 flex flex-col gap-12 bg-white relative z-10">
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
                   <EditableTitle as="h2" className="text-[18px] font-black uppercase tracking-[0.15em] mb-6 border-b pb-4" style={{ color: '#111827', borderColor: '#F3F4F6' }} defaultText="Experiência Profissional" text={getSectionTitle(data, 'experience', 'Experiência Profissional')} onSave={onChange ? (v) => handleTitleChange('experience', v) : undefined} />
                   <div className="flex flex-col gap-8">
                     {data.experience.map((ex, idx) => (
                       <div key={ex.id || `exp-${idx}`} className="flex gap-4">
                          <div className="flex flex-col items-center pt-2">
                             <div className="w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: c.primary }}></div>
                             <div className="w-0.5 flex-1 bg-gray-50 my-1"></div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-baseline mb-1">
                               <h4 className="text-[17px] font-black text-gray-900 tracking-tight">{ex.position}</h4>
                               <span className="text-[11px] font-bold px-3 py-1 bg-gray-100 rounded-lg text-gray-500">{ex.startDate} - {ex.current ? (data.language === 'en' ? 'Present' : 'Presente') : ex.endDate}</span>
                            </div>
                            <div className="text-[14px] font-bold mb-4 flex items-center gap-2" style={{ color: c.primary }}>
                               {ex.company}
                            </div>
                            <p className="text-[13px] leading-[1.8] text-left text-gray-600 font-medium pl-4 border-l-2" style={{borderColor: `${c.primary}20`}}>{renderText(ex.description)}</p>
                          </div>
                       </div>
                     ))}
                   </div>
                </div>
              )}

              {data.customSections?.map((cs, idx) => (
                <div key={cs.id || `cs-${idx}`}>
                   <h2 className="text-[18px] font-black uppercase tracking-[0.15em] mb-6 border-b pb-4" style={{ color: '#111827', borderColor: '#F3F4F6' }}>{cs.title}</h2>
                   <div className="flex flex-col gap-8">
                     {cs.items.map((item, idxx) => (
                       <div key={item.id || `csi-${idxx}`} className="flex gap-4">
                          {data.styleConfig?.showTimeline !== false && <div className="flex flex-col items-center pt-2">
<div className="w-2.5 h-2.5 rounded-full border-2 bg-white" style={{ borderColor: c.primary }}></div>
<div className="w-0.5 flex-1 bg-gray-50 my-1"></div>
</div>}
                          <div className="flex-1">
                            <div className="flex justify-between items-baseline mb-1">
                               <h4 className="text-[17px] font-black text-gray-900 tracking-tight">{item.name}</h4>
                            </div>
                            {item.description && <p className="text-[13px] leading-[1.8] text-left text-gray-600 font-medium pl-4 border-l-2 mt-2" style={{borderColor: `${c.primary}20`}}>{renderText(item.description)}</p>}
                          </div>
                       </div>
                     ))}
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {theme.layout === 'custom-t6' && (
        <div className="flex flex-col w-full min-h-[1122px] h-auto bg-[#fcfcfc] p-12 font-sans overflow-visible text-left relative" style={{ border: `16px solid ${c.primary}` }}>
          <div className="flex flex-col items-center pb-6 mb-6 border-b-2" style={{ borderColor: c.primary }}>
            {data.styleConfig?.showPhoto !== false && data.personalInfo.photo && (
              <img 
                src={data.personalInfo.photo} 
                referrerPolicy="no-referrer" 
                className="object-cover object-top mb-4 shadow" 
                style={{ 
                  borderRadius: data.personalInfo.photoStyle === 'circle' ? '50%' : '15px',
                  width: `${data.personalInfo.photoSize || 100}px`,
                  height: `${data.personalInfo.photoSize || 100}px`
                }} 
              />
            )}
            <h1 className="text-3xl font-black uppercase tracking-wider mb-2" style={{ color: c.primary }}>{data.personalInfo.fullName }</h1>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.25em]">{data.personalInfo.title }</p>
            <div className="flex items-center gap-4 mt-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
              {data.personalInfo.phone && <span className="flex items-center gap-1"><Phone size={11} /> {data.personalInfo.phone}</span>}
              {(data.personalInfo.phone && data.personalInfo.email) && <span>•</span>}
              {data.personalInfo.email && <span className="flex items-center gap-1"><Mail size={11} /> {data.personalInfo.email}</span>}
              {(data.personalInfo.email && data.personalInfo.location) && <span>•</span>}
              {data.personalInfo.location && <span className="flex items-center gap-1"><MapPin size={11} /> {data.personalInfo.location}</span>}
            </div>
          </div>

          {data.personalInfo.summary && (
            <p className="text-xs italic text-gray-600 font-medium text-center max-w-2xl mx-auto leading-relaxed mb-6 font-serif">
              "{renderText(data.personalInfo.summary)}"
            </p>
          )}

          <div className="grid grid-cols-2 gap-8 flex-1 overflow-hidden">
            <div className="space-y-6">
              {data.experience.length > 0 && (
                <div>
                  <EditableTitle as="h3" className="text-sm font-black uppercase tracking-wider mb-4"  style={{ color: '#111827' }} defaultText="Experiência" text={getSectionTitle(data, 'experience', 'Experiência')} onSave={onChange ? (v) => handleTitleChange('experience', v) : undefined} />
                  <div className="space-y-4">
                    {data.experience.map((ex, idx) => (
                      <div key={ex.id || `exp-${idx}`} className={`space-y-1 ${data.styleConfig?.showTimeline !== false ? 'pl-3 border-l-2' : ''}`} style={data.styleConfig?.showTimeline !== false ? { borderLeftColor: c.primary } : {}}>
                        <h4 className="text-xs font-black text-gray-955">{ex.position}</h4>
                        <div className="text-[10px] font-bold text-gray-400">
                          {ex.company} | {ex.startDate} - {ex.current ? (data.language === 'en' ? 'Present' : 'Presente') : ex.endDate}
                        </div>
                        <p className="text-[11px] leading-relaxed text-gray-600 mt-1">{renderText(ex.description)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.customSections?.map((cs, idx) => (
                <div key={cs.id || `cs-${idx}`}>
                  <h3 className="text-sm font-black uppercase tracking-wider mb-4" style={{ color: '#111827' }}>{cs.title}</h3>
                  <div className="space-y-4">
                    {cs.items.map((item, idxx) => (
                      <div key={item.id || `csi-${idxx}`} className={`space-y-1 ${data.styleConfig?.showTimeline !== false ? 'pl-3 border-l-2' : ''}`} style={data.styleConfig?.showTimeline !== false ? { borderLeftColor: c.primary } : {}}>
                        <h4 className="text-xs font-black text-gray-955">{item.name}</h4>
                        {item.description && <p className="text-[11px] leading-relaxed text-gray-600 mt-1">{renderText(item.description)}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              {data.education.length > 0 && (
                <div>
                  <EditableTitle as="h3" className="text-sm font-black uppercase tracking-wider mb-4"  style={{ color: '#111827' }} defaultText="Formação" text={getSectionTitle(data, 'education', 'Formação')} onSave={onChange ? (v) => handleTitleChange('education', v) : undefined} />
                  <div className="space-y-3">
                    {data.education.map((e, idx) => (
                      <div key={e.id || `edu-${idx}`} className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm space-y-1">
                        <h4 className="text-xs font-black text-gray-900">{e.degree}</h4>
                        <p className="text-[11px] text-gray-600 font-medium">{e.institution}</p>
                        <p className="text-[9px] font-black text-gray-400">{e.startDate} - {e.endDate}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.skills.length > 0 && (
                <div>
                  <EditableTitle as="h3" className="text-sm font-black uppercase tracking-wider mb-4"  style={{ color: '#111827' }} defaultText="Habilidades" text={getSectionTitle(data, 'skills', 'Habilidades')} onSave={onChange ? (v) => handleTitleChange('skills', v) : undefined} />
                  <div className="flex flex-wrap gap-1.5">
                    {data.skills.map((s, idx) => (
                      <span key={s.id || `skill-${idx}`} className="px-2.5 py-1 bg-white border border-gray-100 rounded-lg text-[10px] font-bold text-gray-700 shadow-sm">
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {data.languages && data.languages.length > 0 && (
                <div>
                  <EditableTitle as="h3" className="text-sm font-black uppercase tracking-wider mb-3"  style={{ color: '#111827' }} defaultText="Idiomas" text={getSectionTitle(data, 'languages', 'Idiomas')} onSave={onChange ? (v) => handleTitleChange('languages', v) : undefined} />
                  <div className="space-y-2">
                    {data.languages.map((l, idx) => (
                      <div key={l.id || `lang-${idx}`} className="flex justify-between items-center text-[11px]">
                        <span className="font-bold text-gray-800">{l.name}</span>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">{l.level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {theme.layout === 'custom-t7' && (
        <div className="flex flex-col w-full min-h-[1122px] h-auto bg-white text-center font-sans overflow-visible relative">
          <div className="flex flex-col items-center p-10 pb-12 text-white relative" style={{ backgroundColor: c.primary }}>
            {data.styleConfig?.showPhoto !== false && data.personalInfo.photo && (
              <div className="mb-4">
                <img 
                  src={data.personalInfo.photo} 
                  referrerPolicy="no-referrer" 
                  className="object-cover object-top border-4 border-white shadow-md mx-auto" 
                  style={{ 
                    borderRadius: data.personalInfo.photoStyle === 'circle' ? '50%' : '12px',
                    width: `${data.personalInfo.photoSize || 80}px`,
                    height: `${data.personalInfo.photoSize || 80}px`
                  }} 
                />
              </div>
            )}
            <h1 className="text-3xl font-black uppercase tracking-wider">{data.personalInfo.fullName }</h1>
            <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-90 mt-1">{data.personalInfo.title }</p>
          </div>

          <div className="bg-gray-100/80 px-10 py-3.5 flex flex-wrap justify-center gap-x-6 gap-y-1.5 text-[10px] font-black text-gray-500 uppercase tracking-widest">
            {data.personalInfo.phone && <span className="flex items-center gap-1"><Phone size={11} className="shrink-0" /> {data.personalInfo.phone}</span>}
            {data.personalInfo.email && <span className="flex items-center gap-1"><Mail size={11} className="shrink-0" /> {data.personalInfo.email}</span>}
            {data.personalInfo.location && <span className="flex items-center gap-1"><MapPin size={11} className="shrink-0" /> {data.personalInfo.location}</span>}
          </div>

          <div className="flex flex-row gap-8 p-10 flex-1 overflow-hidden">
            <div className="w-[60%] border-r border-gray-100 pr-8 space-y-6">
              {data.personalInfo.summary && (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider mb-3 text-gray-900">{data.language === 'en' ? 'Summary' : 'Síntese'}</h3>
                  <p className="text-xs leading-relaxed text-gray-600 font-medium font-serif">{renderText(data.personalInfo.summary)}</p>
                </div>
              )}

              {data.experience.length > 0 && (
                <div>
                  <EditableTitle as="h3" className="text-xs font-black uppercase tracking-wider mb-4 text-gray-900"  defaultText="Experiência" text={getSectionTitle(data, 'experience', 'Experiência')} onSave={onChange ? (v) => handleTitleChange('experience', v) : undefined} />
                  <div className="space-y-5">
                    {data.experience.map((ex, idx) => (
                      <div key={ex.id || `exp-${idx}`} className="space-y-1">
                        <div className="flex justify-between items-baseline">
                          <h4 className="text-xs font-black text-gray-950">{ex.position}</h4>
                          <span className="text-[10px] font-black text-gray-400 uppercase">{ex.startDate} - {ex.current ? (data.language === 'en' ? 'Present' : 'Presente') : ex.endDate}</span>
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-tight" style={{ color: c.primary }}>{ex.company}</p>
                        <p className="text-[11px] leading-relaxed text-gray-600 mt-1">{renderText(ex.description)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CUSTOM SECTIONS */}
              {data.customSections?.map((cs, idx) => (
                <div key={cs.id || `cs-${idx}`}>
                  <h3 className="text-xs font-black uppercase tracking-wider mb-4 text-gray-900">{cs.title}</h3>
                  <div className="space-y-5">
                    {cs.items.map((item, idxx) => (
                      <div key={item.id || `csi-${idxx}`} className="space-y-1">
                        <div className="flex justify-between items-baseline">
                          <h4 className="text-xs font-black text-gray-950">{item.name}</h4>
                        </div>
                        {item.description && <p className="text-[11px] leading-relaxed text-gray-600 mt-1">{renderText(item.description)}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="w-[40%] space-y-6">
              {data.skills.length > 0 && (
                <div>
                  <EditableTitle as="h3" className="text-xs font-black uppercase tracking-wider mb-4 text-gray-900"  defaultText="Habilidades" text={getSectionTitle(data, 'skills', 'Habilidades')} onSave={onChange ? (v) => handleTitleChange('skills', v) : undefined} />
                  <div className="space-y-3.5">
                    {data.skills.filter(s => s && s.name).map((s, idx) => {
                      const showLevel = s.level && s.level !== 'Ocultar';
                      const widthPercent = s.level === 'Especialista' ? '100%' : s.level === 'Avançado' ? '80%' : s.level === 'Intermédio' ? '60%' : s.level === 'Básico' ? '40%' : s.level === 'Iniciante' ? '20%' : '0%';
                      return (
                        <div key={s.id || `skill-${idx}`} className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-700">{s.name}</p>
                          {showLevel && (
                            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-500" 
                                style={{ 
                                  backgroundColor: c.primary,
                                  width: widthPercent
                                }} 
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {data.education.length > 0 && (
                <div>
                  <EditableTitle as="h3" className="text-xs font-black uppercase tracking-wider mb-3 text-gray-900"  defaultText="Educação" text={getSectionTitle(data, 'education', 'Educação')} onSave={onChange ? (v) => handleTitleChange('education', v) : undefined} />
                  <div className="space-y-3">
                    {data.education.map((e, idx) => (
                      <div key={e.id || `edu-${idx}`} className="space-y-1">
                        <h4 className="text-xs font-black text-gray-950">{e.degree}</h4>
                        <p className="text-[11px] text-gray-500 font-semibold">{e.institution}</p>
                        <p className="text-[9px] font-bold text-gray-400">{e.startDate} - {e.endDate}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.languages && data.languages.length > 0 && (
                <div>
                  <EditableTitle as="h3" className="text-xs font-black uppercase tracking-wider mb-3 text-gray-900"  defaultText="Idiomas" text={getSectionTitle(data, 'languages', 'Idiomas')} onSave={onChange ? (v) => handleTitleChange('languages', v) : undefined} />
                  <div className="space-y-2">
                    {data.languages.map((l, idx) => (
                      <div key={l.id || `lang-${idx}`} className="flex justify-between items-center text-[11px]">
                        <span className="font-bold text-gray-800">{l.name}</span>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">{l.level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {theme.layout === 'custom-t8' && (
        <div className="flex flex-row w-full min-h-[1122px] h-auto bg-white text-left font-sans overflow-visible relative">
          {/* Top Geometric Accent */}
          <div className="absolute top-0 left-0 right-0 h-44 bg-gradient-to-r from-blue-900 to-blue-700 pointer-events-none" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 40%, 0% 100%)', backgroundColor: c.primary }}></div>
          <div className="absolute top-0 left-0 right-0 h-44 bg-sky-400/30 pointer-events-none" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 15%, 0% 85%)' }}></div>
          
          {/* Bottom Geometric Accent */}
          <div className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none" style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0, 0% 100%)', backgroundColor: c.primary }}></div>
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-sky-400/20 pointer-events-none" style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 30%, 0% 100%)' }}></div>

          {/* Left Column (Light Gray Background / Sidebar) */}
          <div className="w-[35%] bg-gray-50 h-full p-8 pt-10 flex flex-col relative z-10 border-r border-gray-100 shrink-0">
            {/* Avatar Wrap */}
            {data.styleConfig?.showPhoto !== false && (
              <div className="flex flex-col items-center mb-8 relative">
                <div 
                  className="rounded-full border-4 shadow-lg overflow-hidden flex items-center justify-center bg-white" 
                  style={{ 
                    borderColor: '#38BDF8', // Cyan border
                    width: `${data.personalInfo.photoSize || 110}px`,
                    height: `${data.personalInfo.photoSize || 110}px`
                  }} 
                >
                  {data.personalInfo.photo ? (
                    <img 
                      src={data.personalInfo.photo} 
                      referrerPolicy="no-referrer" 
                      className="object-cover object-top w-full h-full" 
                    />
                  ) : (
                    <div className="text-3xl font-black text-gray-300">
                      {data.personalInfo.fullName ? data.personalInfo.fullName.charAt(0).toUpperCase() : 'CV'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CONTACT Section */}
            <div className="mb-8">
              <h3 className="text-sm font-black uppercase tracking-wider mb-4 text-center pb-1 border-b-2 border-sky-400/50" style={{ color: c.primary }}>{data.language === 'en' ? 'Contact' : 'Contacto'}</h3>
              <div className="space-y-3">
                {data.personalInfo.email && (
                  <div className="flex items-center gap-3 text-[10px] font-bold text-gray-700">
                    <span className="w-6 h-6 rounded-full bg-sky-400 flex items-center justify-center text-white shrink-0 shadow-sm"><Mail size={11} /></span>
                    <span className="truncate">{data.personalInfo.email}</span>
                  </div>
                )}
                {data.personalInfo.phone && (
                  <div className="flex items-center gap-3 text-[10px] font-bold text-gray-700">
                    <span className="w-6 h-6 rounded-full bg-sky-400 flex items-center justify-center text-white shrink-0 shadow-sm"><Phone size={11} /></span>
                    <span>{data.personalInfo.phone}</span>
                  </div>
                )}
                {data.personalInfo.location && (
                  <div className="flex items-center gap-3 text-[10px] font-bold text-gray-700">
                    <span className="w-6 h-6 rounded-full bg-sky-400 flex items-center justify-center text-white shrink-0 shadow-sm"><MapPin size={11} /></span>
                    <span>{data.personalInfo.location}</span>
                  </div>
                )}
                {data.personalInfo.website && (
                  <div className="flex items-center gap-3 text-[10px] font-bold text-gray-700">
                    <span className="w-6 h-6 rounded-full bg-sky-400 flex items-center justify-center text-white shrink-0 shadow-sm"><Globe size={11} /></span>
                    <span className="truncate">{data.personalInfo.website}</span>
                  </div>
                )}
              </div>
            </div>

            {/* SKILLS Section with Rating Dots */}
            {data.skills.length > 0 && (
              <div className="mb-8">
                <EditableTitle as="h3" className="text-sm font-black uppercase tracking-wider mb-4 text-center pb-1 border-b-2 border-sky-400/50"  style={{ color: c.primary }} defaultText="Habilidades" text={getSectionTitle(data, 'skills', 'Habilidades')} onSave={onChange ? (v) => handleTitleChange('skills', v) : undefined} />
                <div className="space-y-2.5">
                  {data.skills.filter(s => s && s.name).map((s, idx) => {
                    const dotsCount = s.level === 'Especialista' ? 5 : s.level === 'Avançado' ? 4 : s.level === 'Intermédio' ? 3 : s.level === 'Básico' ? 2 : s.level === 'Iniciante' ? 1 : 0;
                    const showDots = s.level && s.level !== 'Ocultar';
                    return (
                      <div key={s.id || `skill-${idx}`} className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-gray-700 mr-2 truncate">{s.name}</span>
                        {showDots && (
                          <div className="flex gap-1 shrink-0">
                            {[1, 2, 3, 4, 5].map(dot => (
                              <div 
                                key={dot} 
                                className={`w-2 h-2 rounded-full transition-colors duration-300 ${dot <= dotsCount ? 'bg-sky-400' : 'bg-gray-200'}`}
                                style={dot <= dotsCount ? { backgroundColor: c.primary } : {}}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* HOBBIES / INTERESTS Section */}
            {data.interests && data.interests.length > 0 && (
              <div>
                <EditableTitle as="h3" className="text-sm font-black uppercase tracking-wider mb-4 text-center pb-1 border-b-2 border-sky-400/50"  style={{ color: c.primary }} defaultText="Interesses" text={getSectionTitle(data, 'interests', 'Interesses')} onSave={onChange ? (v) => handleTitleChange('interests', v) : undefined} />
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {data.interests.map((interest, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-white border border-gray-200 rounded-full text-[9px] font-bold text-gray-600 shadow-sm">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column (White Background) */}
          <div className="w-[65%] h-full p-8 pt-6 flex flex-col relative z-20 overflow-hidden">
            {/* Header / Name Block */}
            <div className="mb-8 mt-4">
              <h1 className="text-3xl font-black text-white drop-shadow-md tracking-wider uppercase mb-1">{data.personalInfo.fullName }</h1>
              <p className="text-xs font-bold text-sky-300 tracking-[0.25em] uppercase">{data.personalInfo.title }</p>
            </div>

            <div className="space-y-6 flex-1 overflow-hidden mt-6">
              {/* ABOUT ME Section */}
              {data.personalInfo.summary && (
                <div>
                  <div className="inline-block py-1.5 px-5 rounded-full text-[10px] font-black uppercase tracking-wider text-white mb-3" style={{ backgroundColor: c.primary }}>
                    Sobre Mim
                  </div>
                  <p className="text-xs leading-relaxed text-gray-600 font-medium">{renderText(data.personalInfo.summary)}</p>
                </div>
              )}

              {/* EDUCATION Section */}
              {data.education.length > 0 && (
                <div>
                  <EditableTitle as="div" className="inline-block py-1.5 px-5 rounded-full text-[10px] font-black uppercase tracking-wider text-white mb-4"  style={{ backgroundColor: c.primary }} defaultText="Formação Académica" text={getSectionTitle(data, 'education', 'Formação Académica')} onSave={onChange ? (v) => handleTitleChange('education', v) : undefined} />
                  <div className="space-y-4">
                    {data.education.map((e, idx) => (
                      <div key={e.id || `edu-${idx}`} className={`relative ${data.styleConfig?.showTimeline !== false ? 'pl-6 border-l-2 border-sky-400/30' : ''}`}>
                        {data.styleConfig?.showTimeline !== false && <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow bg-sky-400" />}
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h4 className="text-xs font-black text-gray-900">{e.degree}</h4>
                          <span className="text-[9px] font-black text-sky-500 uppercase tracking-tight shrink-0">{e.startDate} - {e.endDate}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-bold">{e.institution}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* EXPERIENCE Section */}
              {data.experience.length > 0 && (
                <div>
                  <EditableTitle as="div" className="inline-block py-1.5 px-5 rounded-full text-[10px] font-black uppercase tracking-wider text-white mb-4"  style={{ backgroundColor: c.primary }} defaultText="Experiência Profissional" text={getSectionTitle(data, 'experience', 'Experiência Profissional')} onSave={onChange ? (v) => handleTitleChange('experience', v) : undefined} />
                  <div className="space-y-4">
                    {data.experience.map((ex, idx) => (
                      <div key={ex.id || `exp-${idx}`} className={`relative ${data.styleConfig?.showTimeline !== false ? 'pl-6 border-l-2 border-sky-400/30' : ''}`}>
                        {data.styleConfig?.showTimeline !== false && <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow bg-sky-400" />}
                        <div className="flex justify-between items-baseline mb-1">
                          <h4 className="text-xs font-black text-gray-955">{ex.position}</h4>
                          <span className="text-[9px] font-black text-sky-500 uppercase tracking-tight shrink-0">{ex.startDate} - {ex.current ? (data.language === 'en' ? 'Present' : 'Presente') : ex.endDate}</span>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-tight mb-2" style={{ color: c.primary }}>{ex.company}</p>
                        <p className="text-[11px] leading-relaxed text-gray-600 font-medium">{renderText(ex.description)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CUSTOM SECTIONS */}
              {data.customSections?.map((cs, idx) => (
                <div key={cs.id || `cs-${idx}`}>
                  <div className="inline-block py-1.5 px-5 rounded-full text-[10px] font-black uppercase tracking-wider text-white mb-4" style={{ backgroundColor: c.primary }}>
                    {cs.title}
                  </div>
                  <div className="space-y-4">
                    {cs.items.map((item, idxx) => (
                      <div key={item.id || `csi-${idxx}`} className={`relative ${data.styleConfig?.showTimeline !== false ? 'pl-6 border-l-2 border-sky-400/30' : ''}`}>
                        {data.styleConfig?.showTimeline !== false && <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow bg-sky-400" />}
                        <div className="flex justify-between items-baseline mb-1">
                          <h4 className="text-xs font-black text-gray-955">{item.name}</h4>
                        </div>
                        {item.description && <p className="text-[11px] leading-relaxed text-gray-600 font-medium mt-1">{renderText(item.description)}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {theme.layout === 'custom-t9' && (
        <div className="flex flex-col w-full min-h-[1122px] h-auto bg-white text-left font-sans overflow-visible relative">
          {/* Professional Header */}
          <div className="p-12 pb-8 border-b-4 border-gray-100 flex justify-between items-center" style={{ borderBottomColor: c.primary }}>
            <div className="space-y-3">
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 leading-none">{data.personalInfo.fullName }</h1>
              <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: c.primary }}>{data.personalInfo.title }</p>
            </div>
            
            {data.styleConfig?.showPhoto !== false && data.personalInfo.photo && (
              <img 
                src={data.personalInfo.photo} 
                referrerPolicy="no-referrer" 
                className="object-cover object-top border-2 border-gray-100 shadow-md shrink-0" 
                style={{ 
                  borderRadius: data.personalInfo.photoStyle === 'circle' ? '50%' : '8px',
                  width: `${data.personalInfo.photoSize || 85}px`,
                  height: `${data.personalInfo.photoSize || 85}px`
                }} 
              />
            )}
          </div>

          {/* Contact Bar */}
          <div className="bg-gray-50/80 px-12 py-3.5 flex flex-wrap gap-x-6 gap-y-1.5 text-[10px] font-semibold text-gray-600 border-b border-gray-100">
            {data.personalInfo.phone && <span className="flex items-center gap-1.5"><Phone size={11} className="shrink-0" style={{ color: c.primary }} /> {data.personalInfo.phone}</span>}
            {data.personalInfo.email && <span className="flex items-center gap-1.5"><Mail size={11} className="shrink-0" style={{ color: c.primary }} /> {data.personalInfo.email}</span>}
            {data.personalInfo.location && <span className="flex items-center gap-1.5"><MapPin size={11} className="shrink-0" style={{ color: c.primary }} /> {data.personalInfo.location}</span>}
            {data.personalInfo.website && <span className="flex items-center gap-1.5"><Globe size={11} className="shrink-0" style={{ color: c.primary }} /> {data.personalInfo.website}</span>}
          </div>

          <div className="flex flex-row flex-1 p-12 gap-10">
            {/* Left Column (63% width) */}
            <div className="w-[63%] space-y-8">
              {/* Summary */}
              {data.personalInfo.summary && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-4 rounded-full" style={{ backgroundColor: c.primary }}></span>
                    <EditableTitle as="h3" className="text-sm font-extrabold uppercase tracking-wider text-gray-900"  defaultText="Sobre Mim" text={getSectionTitle(data, 'summary', 'Sobre Mim')} onSave={onChange ? (v) => handleTitleChange('summary', v) : undefined} />
                  </div>
                  <p className="text-xs leading-relaxed text-gray-600 font-medium font-serif italic pr-2">
                    {renderText(data.personalInfo.summary)}
                  </p>
                </div>
              )}

              {/* Experience */}
              {data.experience.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-4 rounded-full" style={{ backgroundColor: c.primary }}></span>
                    <EditableTitle as="h3" className="text-sm font-extrabold uppercase tracking-wider text-gray-900"  defaultText="Experiência Profissional" text={getSectionTitle(data, 'experience', 'Experiência Profissional')} onSave={onChange ? (v) => handleTitleChange('experience', v) : undefined} />
                  </div>
                  <div className="space-y-6">
                    {data.experience.map((ex, idx) => (
                      <div key={ex.id || `exp-${idx}`} className={`space-y-1.5 relative ${data.styleConfig?.showTimeline !== false ? 'pl-4 border-l border-gray-100' : ''}`}>
                        {/* Dot indicator */}
                        {data.styleConfig?.showTimeline !== false && <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ backgroundColor: c.primary }}></div>}
                        <div className="flex justify-between items-baseline">
                          <h4 className="text-xs font-bold text-gray-900 leading-tight">{ex.position}</h4>
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-tight shrink-0">{ex.startDate} - {ex.current ? (data.language === 'en' ? 'Present' : 'Presente') : ex.endDate}</span>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-tight" style={{ color: c.primary }}>{ex.company}</p>
                        <p className="text-[11px] leading-relaxed text-gray-500 mt-1 whitespace-pre-line">{renderText(ex.description)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CUSTOM SECTIONS */}
              {data.customSections?.map((cs, idx) => (
                <div key={cs.id || `cs-${idx}`} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-4 rounded-full" style={{ backgroundColor: c.primary }}></span>
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-900">{cs.title}</h3>
                  </div>
                  <div className="space-y-6">
                    {cs.items.map((item, idxx) => (
                      <div key={item.id || `csi-${idxx}`} className={`space-y-1.5 relative ${data.styleConfig?.showTimeline !== false ? 'pl-4 border-l border-gray-100' : ''}`}>
                        {/* Dot indicator */}
                        {data.styleConfig?.showTimeline !== false && <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ backgroundColor: c.primary }}></div>}
                        <div className="flex justify-between items-baseline">
                          <h4 className="text-xs font-bold text-gray-900 leading-tight">{item.name}</h4>
                        </div>
                        {item.description && <p className="text-[11px] leading-relaxed text-gray-500 mt-1 whitespace-pre-line">{renderText(item.description)}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column (37% width) */}
            <div className="w-[37%] space-y-8 border-l border-gray-100 pl-8">
              {/* Skills */}
              {data.skills.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-4 rounded-full" style={{ backgroundColor: c.primary }}></span>
                    <EditableTitle as="h3" className="text-sm font-extrabold uppercase tracking-wider text-gray-900"  defaultText="Habilidades" text={getSectionTitle(data, 'skills', 'Habilidades')} onSave={onChange ? (v) => handleTitleChange('skills', v) : undefined} />
                  </div>
                  <div className="space-y-3">
                    {data.skills.map((s, idx) => {
                      const value = s.level === 'Especialista' ? 100 : s.level === 'Avançado' ? 80 : s.level === 'Intermédio' ? 60 : s.level === 'Básico' ? 40 : s.level === 'Iniciante' ? 20 : 0;
                      const showLevel = s.level && s.level !== 'Ocultar';
                      return (
                        <div key={s.id || `skill-${idx}`} className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-bold text-gray-700">
                            <span>{s.name}</span>
                            {showLevel && <span className="text-[8px] opacity-75 font-black uppercase tracking-wider" style={{ color: c.primary }}>{s.level}</span>}
                          </div>
                          {showLevel && (
                            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-500"
                                style={{ 
                                  backgroundColor: c.primary,
                                  width: `${value}%`
                                }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Education */}
              {data.education.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-4 rounded-full" style={{ backgroundColor: c.primary }}></span>
                    <EditableTitle as="h3" className="text-sm font-extrabold uppercase tracking-wider text-gray-900"  defaultText="Formação Académica" text={getSectionTitle(data, 'education', 'Formação Académica')} onSave={onChange ? (v) => handleTitleChange('education', v) : undefined} />
                  </div>
                  <div className="space-y-4">
                    {data.education.map((e, idx) => (
                      <div key={e.id || `edu-${idx}`} className={`space-y-1 relative ${data.styleConfig?.showTimeline !== false ? 'pl-3 border-l border-gray-100' : ''}`}>
                        {/* Elegant vertical dot */}
                        {data.styleConfig?.showTimeline !== false && <div className="absolute -left-[4px] top-1.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.primary }}></div>}
                        <h4 className="text-xs font-bold text-gray-900 leading-tight">{e.degree}</h4>
                        <p className="text-[10px] text-gray-500 font-semibold">{e.institution}</p>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{e.startDate} - {e.endDate}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages */}
              {data.languages && data.languages.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-4 rounded-full" style={{ backgroundColor: c.primary }}></span>
                    <EditableTitle as="h3" className="text-sm font-extrabold uppercase tracking-wider text-gray-900"  defaultText="Idiomas" text={getSectionTitle(data, 'languages', 'Idiomas')} onSave={onChange ? (v) => handleTitleChange('languages', v) : undefined} />
                  </div>
                  <div className="space-y-2">
                    {data.languages.map((l, idx) => (
                      <div key={l.id || `lang-${idx}`} className="flex justify-between items-center text-[10px] font-bold text-gray-700">
                        <span>{l.name}</span>
                        <span className="text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider bg-gray-50 text-gray-500 border border-gray-100">{l.level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications/Awards list */}
              {data.certifications && data.certifications.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-4 rounded-full" style={{ backgroundColor: c.primary }}></span>
                    <EditableTitle as="h3" className="text-sm font-extrabold uppercase tracking-wider text-gray-900"  defaultText="Certificações" text={getSectionTitle(data, 'certifications', 'Certificações')} onSave={onChange ? (v) => handleTitleChange('certifications', v) : undefined} />
                  </div>
                  <div className="space-y-3">
                    {data.certifications.map((cVal, idx) => (
                      <div key={cVal.id || `cert-${idx}`} className={`space-y-0.5 relative ${data.styleConfig?.showTimeline !== false ? 'pl-3 border-l border-gray-100' : ''}`}>
                        {data.styleConfig?.showTimeline !== false && <div className="absolute -left-[4px] top-1.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.primary }}></div>}
                        <h4 className="text-xs font-bold text-gray-900 leading-tight">{cVal.name}</h4>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{cVal.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {theme.layout === 'custom-t10' && (
        <div className="flex flex-col w-full min-h-[1122px] h-auto bg-white text-left font-sans overflow-visible relative">
          {/* Top Elegant Accent Header Line */}
          <div className="h-3 w-full" style={{ backgroundColor: c.primary }}></div>
          
          {/* Main Top Header Block (Johan Bluestone Style) */}
          <div className="px-12 py-10 flex justify-between items-center bg-gray-50/50 border-b border-gray-100">
            <div className="space-y-2 max-w-[65%]">
              <h1 className="text-4xl font-extrabold tracking-widest text-slate-900 uppercase leading-none">{data.personalInfo.fullName }</h1>
              <p className="text-xs font-black uppercase tracking-[0.3em] font-mono" style={{ color: c.primary }}>{data.personalInfo.title }</p>
              {data.personalInfo.summary && (
                <p className="text-[11px] leading-relaxed text-gray-500 mt-2 font-serif italic pr-4">
                  "{renderText(data.personalInfo.summary)}"
                </p>
              )}
            </div>
            
            {/* Round photo placed neatly with background overlap border */}
            {data.styleConfig?.showPhoto !== false && (
              <div className="relative pr-2 shrink-0">
                <div 
                  className="w-24 h-24 rounded-full border-4 shadow-md bg-white overflow-hidden flex items-center justify-center p-0.5"
                  style={{ borderColor: c.primary }}
                >
                  {data.personalInfo.photo ? (
                    <img 
                      src={data.personalInfo.photo} 
                      referrerPolicy="no-referrer" 
                      className="object-cover object-top w-full h-full rounded-full" 
                    />
                  ) : (
                    <div className="text-3xl font-black text-gray-300">
                      {data.personalInfo.fullName ? data.personalInfo.fullName.charAt(0).toUpperCase() : 'CV'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-row flex-1 min-h-[850px]">
            {/* Left Column (35% width, beautiful dark sidebar resembling Johan Bluestone's color blocking) */}
            <div className="w-[35%] p-8 text-white flex flex-col shrink-0 space-y-8" style={{ backgroundColor: '#1E293B' /* Solid Dark Slate */ }}>
              
              {/* Contact Block */}
              <div className="space-y-4">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] px-2.5 py-1 bg-white/10 rounded-md inline-block max-w-full">
                  Contacto
                </span>
                <div className="space-y-3 pl-1">
                  {data.personalInfo.phone && (
                    <div className="flex items-center gap-2.5 text-[10px] font-medium text-slate-200">
                      <Phone size={12} className="shrink-0" style={{ color: c.primary }} />
                      <span>{data.personalInfo.phone}</span>
                    </div>
                  )}
                  {data.personalInfo.email && (
                    <div className="flex items-center gap-2.5 text-[10px] font-medium text-slate-200 break-all">
                      <Mail size={12} className="shrink-0" style={{ color: c.primary }} />
                      <span>{data.personalInfo.email}</span>
                    </div>
                  )}
                  {data.personalInfo.location && (
                    <div className="flex items-center gap-2.5 text-[10px] font-medium text-slate-200">
                      <MapPin size={12} className="shrink-0" style={{ color: c.primary }} />
                      <span>{data.personalInfo.location}</span>
                    </div>
                  )}
                  {data.personalInfo.website && (
                    <div className="flex items-center gap-2.5 text-[10px] font-medium text-slate-200 break-all">
                      <Globe size={12} className="shrink-0" style={{ color: c.primary }} />
                      <span>{data.personalInfo.website}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills with elegant customized segmented progress meters */}
              {data.skills.length > 0 && (
                <div className="space-y-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] px-2.5 py-1 bg-white/10 rounded-md inline-block">
                    Habilidades
                  </span>
                  <div className="space-y-3.5 pl-1">
                    {data.skills.map((s, idx) => {
                      const value = s.level === 'Especialista' ? 5 : s.level === 'Avançado' ? 4 : s.level === 'Intermédio' ? 3 : s.level === 'Básico' ? 2 : s.level === 'Iniciante' ? 1 : 0;
                      const showLevel = s.level && s.level !== 'Ocultar';
                      return (
                        <div key={s.id || `skill-${idx}`} className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-200">
                            <span>{s.name}</span>
                            {showLevel && <span className="text-[8px] opacity-75 font-mono uppercase" style={{ color: c.primary }}>{s.level}</span>}
                          </div>
                          {/* Segmented meter */}
                          {showLevel && (
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((seg) => (
                                <div 
                                  key={seg} 
                                  className="h-1 flex-1 rounded-sm transition-all duration-300"
                                  style={{ 
                                    backgroundColor: seg <= value ? (c.primary || '#EA580C') : '#475569' 
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Languages */}
              {data.languages && data.languages.length > 0 && (
                <div className="space-y-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] px-2.5 py-1 bg-white/10 rounded-md inline-block">
                    Idiomas
                  </span>
                  <div className="space-y-2.5 pl-1">
                    {data.languages.map((l, idx) => (
                      <div key={l.id || `lang-${idx}`} className="flex justify-between items-center text-[10px] font-bold text-slate-200">
                        <span>{l.name}</span>
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider bg-white/10 text-slate-300">{l.level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column (65% width) */}
            <div className="w-[65%] p-10 space-y-8 bg-white">
              
              {/* Experience */}
              {data.experience.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-gray-100">
                    <Briefcase size={14} style={{ color: c.primary }} />
                    <EditableTitle as="h3" className="text-sm font-extrabold uppercase tracking-[0.25em] text-slate-800"  defaultText="Experiência" text={getSectionTitle(data, 'experience', 'Experiência')} onSave={onChange ? (v) => handleTitleChange('experience', v) : undefined} />
                  </div>
                  <div className="space-y-5">
                    {data.experience.map((ex, idx) => (
                      <div key={ex.id || `exp-${idx}`} className={`space-y-1.5 ${data.styleConfig?.showTimeline !== false ? 'pl-3 border-l-2' : ''}`} style={data.styleConfig?.showTimeline !== false ? { borderLeftColor: c.primary } : {}}>
                        <div className="flex justify-between items-baseline gap-2">
                          <h4 className="text-xs font-bold text-slate-900 leading-tight">{ex.position}</h4>
                          <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-tight shrink-0">{ex.startDate} - {ex.current ? (data.language === 'en' ? 'Present' : 'Presente') : ex.endDate}</span>
                        </div>
                        <p className="text-[9.5px] font-black uppercase tracking-wider" style={{ color: c.primary }}>{ex.company}</p>
                        <p className="text-[11px] leading-relaxed text-gray-500 whitespace-pre-line pt-0.5">{renderText(ex.description)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {data.education.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-gray-100">
                    <GraduationCap size={14} style={{ color: c.primary }} />
                    <EditableTitle as="h3" className="text-sm font-extrabold uppercase tracking-[0.25em] text-slate-800"  defaultText="Formação Académica" text={getSectionTitle(data, 'education', 'Formação Académica')} onSave={onChange ? (v) => handleTitleChange('education', v) : undefined} />
                  </div>
                  <div className="space-y-4">
                    {data.education.map((e, idx) => (
                      <div key={e.id || `edu-${idx}`} className={`space-y-1 relative ${data.styleConfig?.showTimeline !== false ? 'pl-3 border-l-2' : ''}`} style={data.styleConfig?.showTimeline !== false ? { borderLeftColor: c.primary } : {}}>
                        <div className="flex justify-between items-baseline">
                          <h4 className="text-xs font-bold text-slate-900 leading-tight">{e.degree}</h4>
                          <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest shrink-0">{e.startDate} - {e.endDate}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-semibold">{e.institution}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CUSTOM SECTIONS */}
              {data.customSections?.map((cs, idx) => (
                <div key={cs.id || `cs-${idx}`} className="space-y-4">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-gray-100">
                    <span className="w-2.5 h-2.5 shrink-0" style={{ backgroundColor: c.primary }}></span>
                    <h3 className="text-sm font-extrabold uppercase tracking-[0.25em] text-slate-800">{cs.title}</h3>
                  </div>
                  <div className="space-y-5">
                    {cs.items.map((item, idxx) => (
                      <div key={item.id || `csi-${idxx}`} className={`space-y-1.5 ${data.styleConfig?.showTimeline !== false ? 'pl-3 border-l-2' : ''}`} style={data.styleConfig?.showTimeline !== false ? { borderLeftColor: c.primary } : {}}>
                        <div className="flex justify-between items-baseline gap-2">
                          <h4 className="text-xs font-bold text-slate-900 leading-tight">{item.name}</h4>
                        </div>
                        {item.description && <p className="text-[11px] leading-relaxed text-gray-500 whitespace-pre-line pt-0.5">{renderText(item.description)}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Certifications & Awards */}
              {data.certifications && data.certifications.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-gray-100">
                    <Award size={14} style={{ color: c.primary }} />
                    <h3 className="text-sm font-extrabold uppercase tracking-[0.25em] text-slate-800">Certidões & Prêmios</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {data.certifications.map((cVal, idx) => (
                      <div key={cVal.id || `cert-${idx}`} className={`space-y-0.5 relative ${data.styleConfig?.showTimeline !== false ? 'pl-3 border-l border-gray-100' : ''}`}>
                        {data.styleConfig?.showTimeline !== false && <div className="absolute -left-[1.5px] top-1.5 w-1 h-1 rounded-full" style={{ backgroundColor: c.primary }}></div>}
                        <h4 className="text-[10.5px] font-bold text-slate-800 leading-tight">{cVal.name}</h4>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{cVal.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
          
          {/* Bottom footer accent line */}
          <div className="h-4 w-full bg-slate-900"></div>
        </div>
      )}

      {theme.layout === 'custom-t11' && (
        <div className="flex flex-row w-full min-h-[1122px] h-auto bg-white text-left font-sans overflow-visible relative">
          
          {/* Left Main Content Block (63% width) */}
          <div className="w-[63%] bg-white p-10 flex flex-col justify-between space-y-8">
            <div className="space-y-8">
              {/* Profile/Photo section at the top of the white block */}
              <div className="flex items-center gap-5">
                {data.styleConfig?.showPhoto !== false && data.personalInfo.photo && (
                  <img 
                    src={data.personalInfo.photo} 
                    referrerPolicy="no-referrer" 
                    className="object-cover object-top border-4 shadow-md shrink-0 rounded-full" 
                    style={{ 
                      borderColor: c.primary,
                      width: `${data.personalInfo.photoSize || 85}px`,
                      height: `${data.personalInfo.photoSize || 85}px`
                    }} 
                  />
                )}
                <div className="space-y-1">
                  <h1 className="text-3xl font-black text-slate-900 leading-none tracking-tight uppercase">{data.personalInfo.fullName }</h1>
                  <p className="text-xs font-extrabold uppercase tracking-widest" style={{ color: c.primary }}>{data.personalInfo.title }</p>
                </div>
              </div>

              {/* Summary */}
              {data.personalInfo.summary && (
                <div className="space-y-3 pt-2">
                  {/* Kelly style orange segment title bar */}
                  <div className="text-white text-[10px] font-black uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-sm inline-block leading-none" style={{ backgroundColor: c.primary }}>
                    Sobre Mim
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 font-serif italic pr-2 font-medium">
                    {renderText(data.personalInfo.summary)}
                  </p>
                </div>
              )}

              {/* Education (Kelly Style layout block: Year on left, Content on right) */}
              {data.education.length > 0 && (
                <div className="space-y-4">
                  <div className="text-white text-[10px] font-black uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-sm inline-block leading-none" style={{ backgroundColor: c.primary }}>
                    Formação
                  </div>
                  <div className="space-y-4 pl-1">
                    {data.education.map((e, idx) => (
                      <div key={e.id || `edu-${idx}`} className="flex flex-row gap-4 items-start">
                        {/* Year box on left */}
                        <div className="w-[85px] text-[8.5px] font-black uppercase text-center py-1 rounded bg-orange-50 shrink-0 border border-orange-100" style={{ color: c.primary, backgroundColor: `${c.primary}10`, borderColor: `${c.primary}20` }}>
                          {e.startDate} - {e.endDate}
                        </div>
                        {/* Course & school on right */}
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-slate-900 leading-tight">{e.degree}</h4>
                          <p className="text-[10px] text-gray-500 font-semibold">{e.institution}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience (Kelly Style layout block: Year on left, Content on right) */}
              {data.experience.length > 0 && (
                <div className="space-y-4">
                  <div className="text-white text-[10px] font-black uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-sm inline-block leading-none" style={{ backgroundColor: c.primary }}>
                    Experiência Profissional
                  </div>
                  <div className="space-y-5 pl-1">
                    {data.experience.map((ex, idx) => (
                      <div key={ex.id || `exp-${idx}`} className="flex flex-row gap-4 items-start">
                        {/* Year box on left */}
                        <div className="w-[85px] text-[8px] font-black uppercase text-center py-1 rounded shrink-0 border" style={{ color: c.primary, backgroundColor: `${c.primary}10`, borderColor: `${c.primary}20` }}>
                          {ex.startDate} - {ex.current ? "PRES." : ex.endDate}
                        </div>
                        {/* Details on right */}
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-baseline gap-2">
                            <h4 className="text-xs font-bold text-slate-900 leading-tight">{ex.position}</h4>
                          </div>
                          <p className="text-[9.5px] font-black uppercase tracking-wider" style={{ color: c.primary }}>{ex.company}</p>
                          <p className="text-[11px] leading-relaxed text-gray-500 whitespace-pre-line mt-1">{renderText(ex.description)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CUSTOM SECTIONS */}
              {data.customSections?.map((cs, idx) => (
                <div key={cs.id || `cs-${idx}`} className="space-y-4">
                  <div className="text-white text-[10px] font-black uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-sm inline-block leading-none" style={{ backgroundColor: c.primary }}>
                    {cs.title}
                  </div>
                  <div className="space-y-5 pl-1">
                    {cs.items.map((item, idxx) => (
                      <div key={item.id || `csi-${idxx}`} className="flex flex-row gap-4 items-start">
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-baseline gap-2">
                            <h4 className="text-xs font-bold text-slate-900 leading-tight">{item.name}</h4>
                          </div>
                          {item.description && <p className="text-[11px] leading-relaxed text-gray-500 whitespace-pre-line mt-1">{renderText(item.description)}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Accent colored minimal footer credit */}
            <div className="text-[7.5px] font-bold text-slate-400 tracking-wide pt-4">
              Currículo Gerado Automatizado • CV LAB Angola
            </div>
          </div>

          {/* Right Column / Dark Sidebar (37% width, rich charcoal block) */}
          <div className="w-[37%] p-8 bg-zinc-900 text-white flex flex-col justify-between shrink-0 space-y-8">
            <div className="space-y-8">
              {/* Contact Block */}
              <div className="space-y-4">
                <span className="text-[9.5px] font-black uppercase tracking-[0.25em] border-b border-zinc-700 pb-1.5 block text-slate-300">
                  Contacto
                </span>
                <div className="space-y-3.5 pl-1">
                  {data.personalInfo.phone && (
                    <div className="flex items-center gap-2.5 text-[10px] font-bold text-zinc-300">
                      <Phone size={11} className="shrink-0" style={{ color: c.primary }} />
                      <span>{data.personalInfo.phone}</span>
                    </div>
                  )}
                  {data.personalInfo.email && (
                    <div className="flex items-center gap-2.5 text-[10px] font-bold text-zinc-300 break-all">
                      <Mail size={11} className="shrink-0" style={{ color: c.primary }} />
                      <span>{data.personalInfo.email}</span>
                    </div>
                  )}
                  {data.personalInfo.location && (
                    <div className="flex items-center gap-2.5 text-[10px] font-bold text-zinc-300">
                      <MapPin size={11} className="shrink-0" style={{ color: c.primary }} />
                      <span>{data.personalInfo.location}</span>
                    </div>
                  )}
                  {data.personalInfo.website && (
                    <div className="flex items-center gap-2.5 text-[10px] font-bold text-zinc-300 break-all">
                      <Globe size={11} className="shrink-0" style={{ color: c.primary }} />
                      <span>{data.personalInfo.website}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills with custom professional horizontal meters */}
              {data.skills.length > 0 && (
                <div className="space-y-4">
                  <span className="text-[9.5px] font-black uppercase tracking-[0.25em] border-b border-zinc-700 pb-1.5 block text-slate-300">
                    Competências
                  </span>
                  <div className="space-y-3.5 pl-1">
                    {data.skills.map((s, idx) => {
                      const value = s.level === 'Especialista' ? 100 : s.level === 'Avançado' ? 80 : s.level === 'Intermédio' ? 60 : s.level === 'Básico' ? 40 : s.level === 'Iniciante' ? 20 : 0;
                      const showLevel = s.level && s.level !== 'Ocultar';
                      return (
                        <div key={s.id || `skill-${idx}`} className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-bold text-zinc-300">
                            <span>{s.name}</span>
                          </div>
                          {showLevel && (
                            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden p-0.5">
                              <div 
                                className="h-full rounded-full transition-all duration-500"
                                style={{ 
                                  backgroundColor: c.primary,
                                  width: `${value}%`
                                }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Languages List */}
              {data.languages && data.languages.length > 0 && (
                <div className="space-y-4">
                  <span className="text-[9.5px] font-black uppercase tracking-[0.25em] border-b border-zinc-700 pb-1.5 block text-slate-300">
                    Idiomas
                  </span>
                  <div className="space-y-3 pl-1">
                    {data.languages.map((l, idx) => (
                      <div key={l.id || `lang-${idx}`} className="flex justify-between items-center text-[10px] font-bold text-zinc-300">
                        <span>{l.name}</span>
                        <span className="text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider bg-zinc-800 text-slate-400">{l.level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Awards if any in sidebar */}
              {data.certifications && data.certifications.length > 0 && (
                <div className="space-y-4">
                  <span className="text-[9.5px] font-black uppercase tracking-[0.25em] border-b border-zinc-700 pb-1.5 block text-slate-300">
                    Prêmios
                  </span>
                  <div className="space-y-3.5 pl-1">
                    {data.certifications.map((cVal, idx) => (
                      <div key={cVal.id || `cert-${idx}`} className={`space-y-0.5 relative ${data.styleConfig?.showTimeline !== false ? 'pl-3 border-l border-zinc-800' : ''}`}>
                        {data.styleConfig?.showTimeline !== false && <div className="absolute -left-[4px] top-1.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.primary }}></div>}
                        <h4 className="text-[10px] font-bold text-slate-200 leading-tight">{cVal.name}</h4>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{cVal.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Accent orange visual block on bottom right */}
            <div className="h-2 w-12 rounded" style={{ backgroundColor: c.primary }}></div>
          </div>

        </div>
      )}

      {theme.layout === 'custom-t12' && (
        <div className="flex flex-col w-full min-h-[1122px] h-auto bg-[#FFFDFB] text-left font-serif p-12 overflow-visible relative">
          {/* Top minimal hair line accent */}
          <div className="w-full h-1 mb-8" style={{ backgroundColor: c.primary }} />

          {/* Centered top name card */}
          <div className="text-center space-y-4 pb-8 border-b border-gray-100">
            {data.styleConfig?.showPhoto !== false && data.personalInfo.photo && (
              <div className="mx-auto overflow-hidden rounded-full border mb-4" style={{ width: `${data.personalInfo.photoSize || 80}px`, height: `${data.personalInfo.photoSize || 80}px`, borderColor: c.primary }}>
                <img src={data.personalInfo.photo} referrerPolicy="no-referrer" className="object-cover object-top w-full h-full" />
              </div>
            )}
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 font-serif leading-none">{data.personalInfo.fullName }</h1>
            <p className="text-xs tracking-[0.25em] font-sans font-black uppercase" style={{ color: c.primary }}>{data.personalInfo.title }</p>
            
            {/* Dynamic centered contact row */}
            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-1.5 pt-2 text-[10px] text-gray-500 font-sans font-bold">
              {data.personalInfo.phone && <span className="flex items-center gap-1"><Phone size={10} style={{ color: c.primary }} /> {data.personalInfo.phone}</span>}
              {data.personalInfo.email && <span className="flex items-center gap-1"><Mail size={10} style={{ color: c.primary }} /> {data.personalInfo.email}</span>}
              {data.personalInfo.location && <span className="flex items-center gap-1"><MapPin size={10} style={{ color: c.primary }} /> {data.personalInfo.location}</span>}
              {data.personalInfo.website && <span className="flex items-center gap-1"><Globe size={10} style={{ color: c.primary }} /> {data.personalInfo.website}</span>}
            </div>
          </div>

          {/* Summary / Profile Section */}
          {data.personalInfo.summary && (
            <div className="py-6 border-b border-gray-100 max-w-3xl mx-auto text-center">
              <p className="text-xs leading-relaxed text-slate-600 font-medium italic">
                "{renderText(data.personalInfo.summary)}"
              </p>
            </div>
          )}

          {/* Main sections arranged in an elegant typography column */}
          <div className="grid grid-cols-12 gap-8 pt-8 flex-1">
            {/* Left Column (Skills & Languages) */}
            <div className="col-span-4 space-y-6 select-none">
              {/* Skills/Competences */}
              {data.skills.length > 0 && (
                <div className="space-y-3">
                  <EditableTitle as="h3" className="text-xs font-black uppercase tracking-widest font-sans border-b pb-1 text-slate-800"  style={{ borderColor: c.primary }} defaultText="Competências" text={getSectionTitle(data, 'skills', 'Competências')} onSave={onChange ? (v) => handleTitleChange('skills', v) : undefined} />
                  <div className="space-y-2">
                    {data.skills.map((s, idx) => (
                      <div key={s.id || `skill-${idx}`} className="flex justify-between items-baseline font-sans text-[10px]">
                        <span className="font-bold text-slate-700">{s.name}</span>
                        {s.level && s.level !== 'Ocultar' && <span className="text-[8px] font-bold text-slate-400 capitalize">{s.level}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages */}
              {data.languages && data.languages.length > 0 && (
                <div className="space-y-3 pt-2">
                  <EditableTitle as="h3" className="text-xs font-black uppercase tracking-widest font-sans border-b pb-1 text-slate-800"  style={{ borderColor: c.primary }} defaultText="Idiomas" text={getSectionTitle(data, 'languages', 'Idiomas')} onSave={onChange ? (v) => handleTitleChange('languages', v) : undefined} />
                  <div className="space-y-2">
                    {data.languages.map((l, idx) => (
                      <div key={l.id || `lang-${idx}`} className="flex justify-between items-baseline font-sans text-[10px]">
                        <span className="font-bold text-slate-700">{l.name}</span>
                        <span className="text-[8px] font-black tracking-wider uppercase text-slate-400">{l.level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column (Experience & Education) */}
            <div className="col-span-8 space-y-8">
              {/* Experience */}
              {data.experience.length > 0 && (
                <div className="space-y-4">
                  <EditableTitle as="h3" className="text-xs font-black uppercase tracking-widest font-sans border-b pb-1 text-slate-800"  style={{ borderColor: c.primary }} defaultText="Experiência Profissional" text={getSectionTitle(data, 'experience', 'Experiência Profissional')} onSave={onChange ? (v) => handleTitleChange('experience', v) : undefined} />
                  <div className="space-y-6">
                    {data.experience.map((ex, idx) => (
                      <div key={ex.id || `exp-${idx}`} className="space-y-1.5">
                        <div className="flex justify-between items-baseline">
                          <h4 className="text-xs font-extrabold text-slate-950 font-serif">{ex.position}</h4>
                          <span className="text-[9px] font-black font-sans text-slate-400 shrink-0">{ex.startDate} - {ex.current ? (data.language === 'en' ? 'PRESENT' : 'PRESENTE') : ex.endDate}</span>
                        </div>
                        <p className="text-[10px] font-bold tracking-wide font-sans text-slate-500 uppercase">{ex.company}</p>
                        <p className="text-[11px] leading-relaxed text-slate-600 whitespace-pre-line font-medium pt-0.5">{renderText(ex.description)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {data.education.length > 0 && (
                <div className="space-y-4">
                  <EditableTitle as="h3" className="text-xs font-black uppercase tracking-widest font-sans border-b pb-1 text-slate-800"  style={{ borderColor: c.primary }} defaultText="Formação Académica" text={getSectionTitle(data, 'education', 'Formação Académica')} onSave={onChange ? (v) => handleTitleChange('education', v) : undefined} />
                  <div className="space-y-4">
                    {data.education.map((e, idx) => (
                      <div key={e.id || `edu-${idx}`} className="space-y-1">
                        <div className="flex justify-between items-baseline">
                          <h4 className="text-xs font-extrabold text-slate-950 font-serif">{e.degree}</h4>
                          <span className="text-[9px] font-black font-sans text-slate-400 shrink-0">{e.startDate} - {e.endDate}</span>
                        </div>
                        <p className="text-[10px] font-bold font-sans text-slate-500">{e.institution}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CUSTOM SECTIONS */}
              {data.customSections?.map((cs, idx) => (
                <div key={cs.id || `cs-${idx}`} className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest font-sans border-b pb-1 text-slate-800" style={{ borderColor: c.primary }}>{cs.title}</h3>
                  <div className="space-y-6">
                    {cs.items.map((item, idxx) => (
                      <div key={item.id || `csi-${idxx}`} className="space-y-1.5">
                        <div className="flex justify-between items-baseline">
                          <h4 className="text-xs font-extrabold text-slate-950 font-serif">{item.name}</h4>
                        </div>
                        {item.description && <p className="text-[11px] leading-relaxed text-slate-600 whitespace-pre-line font-medium pt-0.5">{renderText(item.description)}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Certifications & Awards */}
              {data.certifications && data.certifications.length > 0 && (
                <div className="space-y-4">
                  <EditableTitle as="h3" className="text-xs font-black uppercase tracking-widest font-sans border-b pb-1 text-slate-800"  style={{ borderColor: c.primary }} defaultText="Certificações & Prêmios" text={getSectionTitle(data, 'certifications', 'Certificações & Prêmios')} onSave={onChange ? (v) => handleTitleChange('certifications', v) : undefined} />
                  <div className="grid grid-cols-2 gap-4">
                    {data.certifications.map((cVal, idx) => (
                      <div key={cVal.id || `cert-${idx}`} className="space-y-0.5">
                        <h4 className="text-[10.5px] font-bold text-slate-800 font-serif leading-tight">{cVal.name}</h4>
                        <p className="text-[8px] font-black font-sans text-slate-400 uppercase tracking-widest">{cVal.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Elegant minimalist bottom footer */}
          <div className="border-t border-slate-100 pt-6 mt-12 text-center text-[8px] font-bold font-sans tracking-widest text-slate-400">
             CURRÍCULO PROFISSIONAL • {data.personalInfo.fullName ? data.personalInfo.fullName.toUpperCase() : "CV"}
          </div>
        </div>
      )}

      {theme.layout === 'custom-t13' && (
        <div className="flex flex-col w-full min-h-[1122px] h-auto bg-slate-50/50 text-left font-sans overflow-visible relative font-sans">
          
          {/* Top Banner Block */}
          <div className="px-12 py-10 text-white flex justify-between items-center bg-slate-950 relative overflow-hidden shrink-0">
            {/* Visual background accents */}
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-10" style={{ backgroundColor: c.primary }} />
            <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full opacity-5" style={{ backgroundColor: c.primary }} />

            <div className="space-y-2 z-10 font-sans">
              <h1 className="text-4xl font-extrabold tracking-tight uppercase leading-none">{data.personalInfo.fullName }</h1>
              <p className="text-xs font-black uppercase tracking-[0.25em]" style={{ color: c.primary }}>{data.personalInfo.title }</p>
            </div>

            {data.styleConfig?.showPhoto !== false && data.personalInfo.photo && (
              <div 
                className="w-20 h-20 rounded-2xl overflow-hidden border-2 z-10 bg-black/20"
                style={{ borderColor: c.primary }}
              >
                <img src={data.personalInfo.photo} referrerPolicy="no-referrer" className="object-cover object-top w-full h-full" />
              </div>
            )}
          </div>

          {/* Accent Line */}
          <div className="h-2 w-full" style={{ backgroundColor: c.primary }} />

          {/* Body structure with dual panel layout */}
          <div className="flex flex-row flex-1 p-8 gap-8">
            {/* Side Panel (Skills, Languages, Contact) */}
            <div className="w-[32%] space-y-6 shrink-0">
              
              {/* Contact Card */}
              <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-xs font-mono font-black uppercase tracking-widest text-slate-800 border-b pb-1.5" style={{ borderBottomColor: c.primary }}>{data.language === 'en' ? 'Contact' : 'Contacto'}</h3>
                <div className="space-y-2.5">
                  {data.personalInfo.phone && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 animate-fade-in">
                      <Phone size={11} className="shrink-0" style={{ color: c.primary }} />
                      <span className="truncate">{data.personalInfo.phone}</span>
                    </div>
                  )}
                  {data.personalInfo.email && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                      <Mail size={11} className="shrink-0" style={{ color: c.primary }} />
                      <span className="break-all">{data.personalInfo.email}</span>
                    </div>
                  )}
                  {data.personalInfo.location && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                      <MapPin size={11} className="shrink-0" style={{ color: c.primary }} />
                      <span className="truncate">{data.personalInfo.location}</span>
                    </div>
                  )}
                  {data.personalInfo.website && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                      <Globe size={11} className="shrink-0" style={{ color: c.primary }} />
                      <span className="break-all">{data.personalInfo.website}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills */}
              {data.skills.length > 0 && (
                <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4 select-none">
                  <EditableTitle as="h3" className="text-xs font-mono font-black uppercase tracking-widest text-slate-800 border-b pb-1.5"  style={{ borderBottomColor: c.primary }} defaultText="Competências" text={getSectionTitle(data, 'skills', 'Competências')} onSave={onChange ? (v) => handleTitleChange('skills', v) : undefined} />
                  <div className="space-y-3">
                    {data.skills.map((s, idx) => {
                      const showLevel = s.level && s.level !== 'Ocultar';
                      const value = s.level === 'Especialista' ? '100%' : s.level === 'Avançado' ? '80%' : s.level === 'Intermédio' ? '60%' : s.level === 'Básico' ? '40%' : s.level === 'Iniciante' ? '20%' : '0%';
                      return (
                        <div key={s.id || `skill-${idx}`} className="space-y-1 font-sans">
                          <div className="flex justify-between items-baseline text-[10px] font-bold text-slate-700">
                            <span>{s.name}</span>
                            {showLevel && <span className="text-[8px] opacity-70 uppercase tracking-tight">{s.level}</span>}
                          </div>
                          {showLevel && (
                            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-300" style={{ backgroundColor: c.primary, width: value }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Languages */}
              {data.languages && data.languages.length > 0 && (
                <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3 font-sans">
                  <EditableTitle as="h3" className="text-xs font-mono font-black uppercase tracking-widest text-slate-800 border-b pb-1.5"  style={{ borderBottomColor: c.primary }} defaultText="Idiomas" text={getSectionTitle(data, 'languages', 'Idiomas')} onSave={onChange ? (v) => handleTitleChange('languages', v) : undefined} />
                  <div className="space-y-2 font-sans">
                    {data.languages.map((l, idx) => (
                      <div key={l.id || `lang-${idx}`} className="flex justify-between items-baseline text-[10px] font-bold text-slate-700 font-sans font-sans">
                        <span>{l.name}</span>
                        <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 font-sans">{l.level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Main pane containing summary, experience and education */}
            <div className="w-[68%] space-y-6 font-sans">
              
              {/* Summary Card */}
              {data.personalInfo.summary && (
                <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-2.5">
                  <EditableTitle as="h3" className="text-xs font-mono font-black uppercase tracking-widest text-slate-800"  defaultText="Resumo Profissional" text={getSectionTitle(data, 'summary', 'Resumo Profissional')} onSave={onChange ? (v) => handleTitleChange('summary', v) : undefined} />
                  <p className="text-xs leading-relaxed text-slate-600 font-medium">
                    {renderText(data.personalInfo.summary)}
                  </p>
                </div>
              )}

              {/* Experience Card */}
              {data.experience.length > 0 && (
                <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4 font-sans">
                  <EditableTitle as="h3" className="text-xs font-mono font-black uppercase tracking-widest text-slate-800 border-b pb-2"  style={{ borderBottomColor: c.primary }} defaultText="Experiência de Trabalho" text={getSectionTitle(data, 'experience', 'Experiência de Trabalho')} onSave={onChange ? (v) => handleTitleChange('experience', v) : undefined} />
                  <div className="space-y-4">
                    {data.experience.map((ex, idx) => (
                      <div key={ex.id || `exp-${idx}`} className={`space-y-1 relative ${data.styleConfig?.showTimeline !== false ? 'pl-4 border-l-2' : ''}`} style={data.styleConfig?.showTimeline !== false ? { borderLeftColor: c.primary } : {}}>
                        <div className="flex justify-between items-baseline gap-2">
                          <h4 className="text-xs font-extrabold text-slate-900 leading-tight">{ex.position}</h4>
                          <span className="text-[8px] font-black font-mono text-slate-400 uppercase tracking-tight shrink-0">{ex.startDate} - {ex.current ? (data.language === 'en' ? 'PRESENT' : 'PRESENTE') : ex.endDate}</span>
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: c.primary }}>{ex.company}</p>
                        <p className="text-[10.5px] leading-relaxed text-slate-600 whitespace-pre-line mt-1">{renderText(ex.description)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education Card */}
              {data.education.length > 0 && (
                <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4 font-sans">
                  <EditableTitle as="h3" className="text-xs font-mono font-black uppercase tracking-widest text-slate-800 border-b pb-2"  style={{ borderBottomColor: c.primary }} defaultText="Educação" text={getSectionTitle(data, 'education', 'Educação')} onSave={onChange ? (v) => handleTitleChange('education', v) : undefined} />
                  <div className="space-y-4">
                    {data.education.map((e, idx) => (
                      <div key={e.id || `edu-${idx}`} className={`space-y-1 relative ${data.styleConfig?.showTimeline !== false ? 'pl-4 border-l-2' : ''}`} style={data.styleConfig?.showTimeline !== false ? { borderLeftColor: c.primary } : {}}>
                        <div className="flex justify-between items-baseline font-sans">
                          <h4 className="text-xs font-extrabold text-slate-900 leading-tight">{e.degree}</h4>
                          <span className="text-[8px] font-black font-mono text-slate-400 uppercase tracking-tight shrink-0">{e.startDate} - {e.endDate}</span>
                        </div>
                        <p className="text-[9.5px] font-bold text-slate-500">{e.institution}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CUSTOM SECTIONS */}
              {data.customSections?.map((cs, idx) => (
                <div key={cs.id || `cs-${idx}`} className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4 font-sans">
                  <h3 className="text-xs font-mono font-black uppercase tracking-widest text-slate-800 border-b pb-2" style={{ borderBottomColor: c.primary }}>{cs.title}</h3>
                  <div className="space-y-4">
                    {cs.items.map((item, idxx) => (
                      <div key={item.id || `csi-${idxx}`} className={`space-y-1 relative ${data.styleConfig?.showTimeline !== false ? 'pl-4 border-l-2' : ''}`} style={data.styleConfig?.showTimeline !== false ? { borderLeftColor: c.primary } : {}}>
                        <div className="flex justify-between items-baseline font-sans">
                          <h4 className="text-xs font-extrabold text-slate-900 leading-tight">{item.name}</h4>
                        </div>
                        {item.description && <p className="text-[10.5px] leading-relaxed text-slate-600 whitespace-pre-line mt-1">{renderText(item.description)}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Certifications and Awards */}
              {data.certifications && data.certifications.length > 0 && (
                <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <EditableTitle as="h3" className="text-xs font-mono font-black uppercase tracking-widest text-slate-800 border-b pb-2"  style={{ borderBottomColor: c.primary }} defaultText="Prémios & Certificações" text={getSectionTitle(data, 'certifications', 'Prémios & Certificações')} onSave={onChange ? (v) => handleTitleChange('certifications', v) : undefined} />
                  <div className="grid grid-cols-2 gap-4">
                    {data.certifications.map((cVal, idx) => (
                      <div key={cVal.id || `cert-${idx}`} className="space-y-1 font-sans">
                        <h4 className="text-[10px] font-bold text-slate-800 leading-tight">{cVal.name}</h4>
                        <p className="text-[7.5px] font-black tracking-widest text-slate-400 uppercase font-mono">{cVal.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Graphical Minimal Footer Block */}
          <div className="h-6 w-full mt-auto bg-slate-950 flex items-center justify-between px-8 text-[7.5px] text-slate-500 font-mono font-black uppercase tracking-widest shrink-0 font-mono">
            <span>CV LAB AUTOMATED GENERATOR</span>
            <span style={{ color: c.primary }}>● COMPLIANT WEB DESIGNS</span>
          </div>

        </div>
      )}
      </div>

      {/* Dynamic Visual A4 Page cutoff border */}
      <div 
        className="absolute left-0 right-0 border-b-2 border-dashed border-red-500/70 pointer-events-none z-[100] print:hidden" 
        style={{ top: '1122px', height: '0px' }}
      >
        <span className="absolute right-4 -top-3 bg-red-600 text-[8px] font-black uppercase text-white px-2 py-0.5 rounded shadow flex items-center gap-1 select-none">
          ⚠️ FIM DA PÁGINA A4 (RODAPÉ)
        </span>
      </div>
    </div>
  );
});


// --- Main Application ---

export default function App() {
  const { user, isAdmin } = useAuth();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [contactEmail, setContactEmail] = useState('');

  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthModeLogin, setIsAuthModeLogin] = useState(false);

  const [view, _setView] = useState<'landing' | 'editor' | 'faq' | 'about' | 'terms' | 'tips' | 'showcase' | 'admin' | 'profile' | 'my-resumes'>('landing');
  const [showAuthModalAlert, setShowAuthModalAlert] = useState(false);
  const [isCountedAsReal, setIsCountedAsReal] = useState(false);
  const [cvPrice, setCvPrice] = useState(2000);

  useEffect(() => {
    // Active cache-busting: wipe out stale or corrupted AI caches from user's localStorage
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("cv_labs_gcache_") || key.startsWith("cv_lab_gcache_"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      console.log(`[Cache Buster] Cleared ${keysToRemove.length} stale AI Cache keys.`);
    } catch (e) {
      console.warn("Could not wipe stale localStorage cache keys:", e);
    }

    if (!db) return;
    const metricsRef = doc(db, 'admin_settings', 'metrics');
    const unsub = onSnapshot(metricsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.cvPrice !== undefined) {
          setCvPrice(Number(data.cvPrice));
        }
      }
    });
    return () => unsub();
  }, []);

  const setView = (newView: 'landing' | 'editor' | 'faq' | 'about' | 'terms' | 'tips' | 'showcase' | 'admin' | 'profile' | 'my-resumes') => {
    const restrictedViews = ['editor', 'admin', 'profile', 'my-resumes'];
    if (restrictedViews.includes(newView)) {
      const adminEmails = [
        'ronalmaferreira04@icloud.com',
        'sumodemanga50@gmail.com',
        'm26101342@gmail.com'
      ];
      const hasAccess = user && user.email && adminEmails.includes(user.email.toLowerCase());
      if (!hasAccess) {
        setShowAuthModalAlert(true);
        return;
      }
    }
    _setView(newView);
  };

  const handleToggleRealCVCount = async (checked: boolean) => {
    setIsCountedAsReal(checked);
    if (!db) return;
    try {
      const metricsRef = doc(db, 'admin_settings', 'metrics');
      const metricsSnap = await getDoc(metricsRef);
      if (metricsSnap.exists()) {
        const curData = metricsSnap.data();
        const currentPrice = curData.cvPrice !== undefined ? Number(curData.cvPrice) : 2000;
        const diffCount = checked ? 1 : -1;
        const diffRevenue = checked ? currentPrice : -currentPrice;
        await updateDoc(metricsRef, {
          realCVsCount: Math.max(0, (curData.realCVsCount || 0) + diffCount),
          realRevenue: Math.max(0, (curData.realRevenue || 0) + diffRevenue)
        });
      } else {
        await setDoc(metricsRef, {
          realCVsCount: checked ? 10 : 9,
          realRevenue: checked ? 20000 : 18000,
          meetingLink: 'https://meet.google.com/abc-defg-hij',
          cvPrice: 2000
        });
      }
    } catch (e) {
      console.error("Erro ao atualizar contagem de CVs reais:", e);
    }
  };

  const handleLogoClick = () => {
    const adminEmails = [
      'ronalmaferreira04@icloud.com',
      'sumodemanga50@gmail.com',
      'm26101342@gmail.com'
    ];
    const hasAccess = user && user.email && adminEmails.includes(user.email.toLowerCase());
    if (hasAccess) {
      setView('editor');
    } else {
      setShowAuthModalAlert(true);
    }
  };
  const [activeStep, setActiveStep] = useState(0);
  const [originalResumeData, setOriginalResumeData] = useState<ResumeData | null>(() => {
    try {
      const saved = localStorage.getItem('cv_lab_original_data');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [originalLetter, setOriginalLetter] = useState<string | null>(() => {
    return localStorage.getItem('cv_lab_original_letter') || null;
  });
  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    try {
      const saved = localStorage.getItem('cv_lab_data');
      return saved ? JSON.parse(saved) : INITIAL_RESUME_DATA;
    } catch (e) {
      console.error("Error loading saved data:", e);
      return INITIAL_RESUME_DATA;
    }
  });
  const [loading, setLoading] = useState(false);
  const [optimizingId, setOptimizingId] = useState<string | null>(null);
  const [isCoverLetterMode, setIsCoverLetterMode] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState(() => {
    const saved = localStorage.getItem('cv_lab_letter');
    return saved || `Prezado(a) Diretor(a) de Recursos Humanos,

É com grande entusiasmo que apresento minha candidatura. Ao longo do meu percurso profissional e académico, tenho desenvolvido competências sólidas que acredito estarem em perfeito alinhamento com os desafios propostos pela vossa prestigiada organização.

Minha trajetória é marcada pela dedicação, foco em resultados e rápida adaptação a novas metodologias. A possibilidade de contribuir de forma imediata e significativa para o sucesso contínuo da sua empresa é algo que me motiva profundamente, agregando o meu conhecimento técnico à vossa visão institucional.

Considero-me um profissional orientado para soluções e com grande capacidade de trabalhar de forma colaborativa em equipas dinâmicas.

Agradeço desde já a atenção demonstrada em analisar o meu currículo em anexo e coloco-me à disposição para uma entrevista, onde poderei detalhar como a minha experiência será útil para as vossas futuras iniciativas.`;
  });
  const [tempSkill, setTempSkill] = useState("");
  const [tempLanguage, setTempLanguage] = useState("");
  const [tempLanguageLevel, setTempLanguageLevel] = useState("Fluente");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState("");
  const [rawText, setRawText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [template, setTemplate] = useState<TemplateType>(() => {
    return (localStorage.getItem('cv_lab_template') as TemplateType) || 't1_executive';
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('cv_lab_data', JSON.stringify(resumeData));
    }, 500);
    return () => clearTimeout(timer);
  }, [resumeData]);

  useEffect(() => {
    localStorage.setItem('cv_lab_template', template);
  }, [template]);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('cv_lab_letter', generatedLetter);
    }, 500);
    return () => clearTimeout(timer);
  }, [generatedLetter]);
  const [previewScale, setPreviewScale] = useState(0.85);
  const [showAlignGuides, setShowAlignGuides] = useState(false);
  const [activeVisualTab, setActiveVisualTab] = useState<'sizes' | 'reorder' | 'alignment'>('sizes');

  const moveExperience = (index: number, direction: 'up' | 'down') => {
    const newExp = [...resumeData.experience];
    if (direction === 'up' && index > 0) {
      const temp = newExp[index];
      newExp[index] = newExp[index - 1];
      newExp[index - 1] = temp;
    } else if (direction === 'down' && index < newExp.length - 1) {
      const temp = newExp[index];
      newExp[index] = newExp[index + 1];
      newExp[index + 1] = temp;
    }
    setResumeData(prev => ({ ...prev, experience: newExp }));
  };

  const moveEducation = (index: number, direction: 'up' | 'down') => {
    const newEdu = [...resumeData.education];
    if (direction === 'up' && index > 0) {
      const temp = newEdu[index];
      newEdu[index] = newEdu[index - 1];
      newEdu[index - 1] = temp;
    } else if (direction === 'down' && index < newEdu.length - 1) {
      const temp = newEdu[index];
      newEdu[index] = newEdu[index + 1];
      newEdu[index + 1] = temp;
    }
    setResumeData(prev => ({ ...prev, education: newEdu }));
  };

  const moveSkill = (index: number, direction: 'up' | 'down') => {
    const newSkills = [...resumeData.skills];
    if (direction === 'up' && index > 0) {
      const temp = newSkills[index];
      newSkills[index] = newSkills[index - 1];
      newSkills[index - 1] = temp;
    } else if (direction === 'down' && index < newSkills.length - 1) {
      const temp = newSkills[index];
      newSkills[index] = newSkills[index + 1];
      newSkills[index + 1] = temp;
    }
    setResumeData(prev => ({ ...prev, skills: newSkills }));
  };

  const handleAutoAlign = () => {
    const element = document.getElementById(isCoverLetterMode ? 'cover-letter-content' : 'resume-content');
    if (!element) return;
    
    const currentHeight = element.scrollHeight;
    
    const currentStyles = resumeData.styleConfig || {
      fontSize: 13,
      titleSize: 26,
      sectionSpacing: 25,
      itemSpacing: 10,
      margins: 30,
      lineHeight: 1.4,
      alignment: 'left',
      fontFamily: 'sans'
    };

    if (currentHeight <= 1122) {
      if (currentHeight < 850) {
        setResumeData(prev => ({
          ...prev,
          styleConfig: {
            ...prev.styleConfig,
            fontSize: 13.5,
            titleSize: 28,
            sectionSpacing: 28,
            itemSpacing: 12,
            margins: 35,
            lineHeight: 1.45,
            alignment: prev.styleConfig?.alignment || 'left',
            fontFamily: prev.styleConfig?.fontFamily || 'sans'
          }
        }));
      }
      return;
    }

    // Calcular taxa de compressão exata para fazer caber abaixo de 1115px (limite seguro da folha A4)
    const ratio = Math.max(0.68, Math.min(0.95, 1115 / currentHeight));
    
    const newFontSize = Number(Math.max(10, Math.min(15, (currentStyles.fontSize || 13) * ratio)).toFixed(1));
    const newTitleSize = Math.round(Math.max(18, Math.min(36, (currentStyles.titleSize || 26) * ratio)));
    const newSectionSpacing = Math.round(Math.max(8, Math.min(30, (currentStyles.sectionSpacing || 25) * ratio)));
    const newItemSpacing = Math.round(Math.max(3, Math.min(18, (currentStyles.itemSpacing || 10) * ratio)));
    const newMargins = Math.round(Math.max(12, Math.min(45, (currentStyles.margins || 30) * ratio)));
    const newLineHeight = Number(Math.max(1.15, Math.min(1.5, (currentStyles.lineHeight || 1.4) * ratio)).toFixed(2));

    setResumeData(prev => ({
      ...prev,
      styleConfig: {
        fontSize: newFontSize,
        titleSize: newTitleSize,
        sectionSpacing: newSectionSpacing,
        itemSpacing: newItemSpacing,
        margins: newMargins,
        lineHeight: newLineHeight,
        alignment: prev.styleConfig?.alignment || 'left',
        fontFamily: prev.styleConfig?.fontFamily || 'sans'
      }
    }));
  };

  const [resumeHeight, setResumeHeight] = useState(1122);
  const [isAutoFit, setIsAutoFit] = useState(true);

  // Auto-fit previewScale on desktop resize if dynamic auto-fit is enabled
  useEffect(() => {
    const autoFit = () => {
      if (!isAutoFit) return;
      if (window.innerWidth >= 1024) {
        const sidebarWidth = window.innerWidth >= 1280 ? 600 : 500;
        const availableWidth = window.innerWidth - sidebarWidth - 48; // subtract side-padding
        const optScale = availableWidth / 794;
        const fittedScale = Math.min(1.05, Math.max(0.45, optScale));
        setPreviewScale(fittedScale);
      } else {
        const availableWidth = window.innerWidth - 32;
        const optScale = availableWidth / 794;
        setPreviewScale(Math.min(1.0, Math.max(0.4, optScale)));
      }
    };

    autoFit();
    window.addEventListener('resize', autoFit);
    return () => window.removeEventListener('resize', autoFit);
  }, [view, isAutoFit]);

  // Monitor and measure the actual height of the rendered content (Resume or Cover Letter)
  useEffect(() => {
    const handleMeasure = () => {
      const element = document.getElementById(isCoverLetterMode ? 'cover-letter-content' : 'resume-content');
      if (element) {
        // Fallback to min-height 1122
        const measured = Math.max(1122, element.scrollHeight);
        setResumeHeight(measured);
      } else {
        setResumeHeight(1122);
      }
    };

    // Measure on load and when dependency changes
    const timer = setTimeout(handleMeasure, 200);
    
    // Also attach to window resize/render triggers
    window.addEventListener('resize', handleMeasure);

    // Dynamic resize observing the element
    let resizeObserver: ResizeObserver | null = null;
    const targetElement = document.getElementById(isCoverLetterMode ? 'cover-letter-content' : 'resume-content');
    if (targetElement && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        handleMeasure();
      });
      resizeObserver.observe(targetElement);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleMeasure);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [resumeData, template, isCoverLetterMode, generatedLetter, view, showPreviewModal]);

  const [currentBanner, setCurrentBanner] = useState(0);

  const banners = [
    "https://i.supaimg.com/6bc04951-8cbe-4706-9f0c-a01f9ea9a6c4/d25d88cc-8de9-4afc-8385-0ed21b0e333b.png",
    "https://i.supaimg.com/6bc04951-8cbe-4706-9f0c-a01f9ea9a6c4/4406a25d-b692-476b-955d-409d5a851e46.jpg"
  ];

  useEffect(() => {
    console.log("PDFJS Initial Check:", !!pdfjsLib, "Version:", (pdfjsLib as any).version);
  }, []);

  const nextBanner = () => setCurrentBanner((prev) => (prev + 1) % banners.length);
  const prevBanner = () => setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const isDesktop = width >= 1024;
      
      if (isDesktop && !showPreviewModal) {
        // Layout lado-a-lado no PC: subtrai a largura correspondente do editor sidebar
        const sidebarWidth = width >= 1280 ? 600 : 500;
        const availableWidth = width - sidebarWidth - 64; // Margem e padding confortáveis
        const scale = availableWidth / 794;
        setPreviewScale(Math.min(scale, 1));
      } else {
        // Layout modal no mobile/tablet
        const availableWidth = width - 40; // 20px padding de cada lado
        const scale = availableWidth / 794;
        setPreviewScale(Math.min(scale, 1));
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showPreviewModal]);

  // Presence & Visitor Tracking
  useEffect(() => {
    if (!db) return;
    const trackVisitor = async () => {
      try {
        const trackingId = localStorage.getItem('cv_lab_visitor_id') || `visitor_${Math.random().toString(36).substring(2, 11)}`;
        
        if (!localStorage.getItem('cv_lab_visitor_id')) {
          localStorage.setItem('cv_lab_visitor_id', trackingId);
        }

        // Always check if doc exists to be robust
        const visitorRef = doc(db, 'visitors', trackingId);
        const visitorSnap = await getDoc(visitorRef);
        
        if (!visitorSnap.exists()) {
          await setDoc(visitorRef, {
            visitorId: trackingId,
            firstSeen: new Date().toISOString(),
            userAgent: navigator.userAgent
          }, { merge: true });
        }
      } catch (e) {
        console.warn("Visitor tracking prevented by environment/rules", e);
      }
    };

    const updatePresence = async () => {
      try {
        const trackingId = user?.uid || localStorage.getItem('cv_lab_visitor_id');
        if (!trackingId) return;

        await setDoc(doc(db, 'presence', trackingId), {
          userId: trackingId,
          email: user?.email || (user?.isAnonymous ? 'Anónimo (Guest)' : 'Visitante'),
          isAnonymous: user ? user.isAnonymous : true,
          lastSeen: new Date().toISOString(),
          view: view
        }, { merge: true });
      } catch (err) {
        console.warn("Presence update failed (expected if guest auth disabled):", err);
      }
    };

    trackVisitor();
    updatePresence();
    const interval = setInterval(updatePresence, 30000); 
    return () => clearInterval(interval);
  }, [user, view]);

  useEffect(() => {
    let interval: any;
    if (view === 'landing') {
      interval = setInterval(() => {
        nextBanner();
      }, 4500);
    }
    return () => clearInterval(interval);
  }, [view]); // Only track view changes

  // Firebase Order Listener
  useEffect(() => {
    if (!currentOrderId || !db) return;
    const unsubscribe = onSnapshot(doc(db, 'orders', currentOrderId), (docSnap) => {
        if (docSnap.exists()) {
            const status = docSnap.data().status;
            setOrderStatus(status);
            if (status === 'approved') {
                // Execute download
                setShowPaymentModal(false);
                executeDownloadPdf();
                setCurrentOrderId(null);
            }
        }
    });
    return unsubscribe;
  }, [currentOrderId]);

  const [tempDownloadData, setTempDownloadData] = useState<{
    data: any;
    type: 'resume' | 'cover_letter';
    templateId: TemplateType;
    filename: string;
  } | null>(null);

  const loadHtml2Pdf = async (): Promise<any> => {
    if ((window as any).html2pdf) return (window as any).html2pdf;
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.crossOrigin = 'anonymous';
      script.onload = () => resolve((window as any).html2pdf);
      script.onerror = (e) => reject(e);
      document.head.appendChild(script);
    });
  };

  const downloadHtmlDocumentAsPdf = async (
    data: any, 
    type: 'resume' | 'cover_letter', 
    templateId: TemplateType, 
    filename: string,
    setLocalGenerating?: (status: boolean) => void
  ) => {
    if (setLocalGenerating) setLocalGenerating(true);
    setIsDownloading(true);
    
    let originalGetComputedStyle: typeof window.getComputedStyle | null = null;
    try {
      console.log(`Iniciando geração de PDF para ${filename}...`);
      
      originalGetComputedStyle = window.getComputedStyle;
      
      // Override standard getComputedStyle during printing to intercept modern Tailwind v4 colors containing oklab/oklch
      window.getComputedStyle = function (el: Element, pseudoElt?: string | null) {
        const style = originalGetComputedStyle!(el, pseudoElt);
        return new Proxy(style, {
          get(target, prop) {
            if (prop === 'getPropertyValue') {
              return function (propertyName: string) {
                if (propertyName && propertyName.startsWith('--')) {
                  const val = target.getPropertyValue(propertyName);
                  if (typeof val === 'string' && (val.includes('oklab') || val.includes('oklch'))) {
                    return '';
                  }
                  return val;
                }
                const val = target.getPropertyValue(propertyName);
                if (typeof val === 'string') {
                  if (val.includes('oklab') || val.includes('oklch')) {
                    return val.replace(/oklab\([^)]+\)/g, 'rgba(0,0,0,0)').replace(/oklch\([^)]+\)/g, 'rgba(0,0,0,0)');
                  }
                }
                return val;
              };
            }
            
            // Critical fix: accessing property directly on target instead of using Reflect.get with proxy receiver prevents Illegal Invocation
            const value = target[prop as any] as any;
            if (typeof value === 'function') {
              return value.bind(target);
            }
            if (typeof prop === 'string') {
              if (prop.startsWith('--')) {
                if (typeof value === 'string' && (value.includes('oklab') || value.includes('oklch'))) {
                  return '';
                }
                return value;
              }
            }
            if (typeof value === 'string') {
              if (value.includes('oklab') || value.includes('oklch')) {
                return value.replace(/oklab\([^)]+\)/g, 'rgba(0,0,0,0)').replace(/oklch\([^)]+\)/g, 'rgba(0,0,0,0)');
              }
            }
            return value;
          }
        }) as CSSStyleDeclaration;
      };

      // Set state to trigger offscreen render
      setTempDownloadData({
        data,
        type,
        templateId,
        filename
      });

      // Give React 1000ms to completely mount and lay out the DOM cleanly, including all sub-layouts
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const html2pdf = await loadHtml2Pdf();
      const container = document.getElementById('temp-download-container');
      if (!container) throw new Error("Recipiente temporário de renderização não foi encontrado.");
      
      const element = container.querySelector(type === 'cover_letter' ? '#cover-letter-content' : '#resume-content') as HTMLElement;
      if (!element) throw new Error("O elemento renderizado do PDF não foi encontrado no recipiente.");

      // Ensure all images are loaded completely before capturing
      const images = Array.from(element.querySelectorAll('img'));
      await Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve; // Continue even if an image fails to load
        });
      }));

      // Forçar dimensões absolutas da folha A4 para garantir saída estrita em exatamente 1 única página
      element.style.width = '794px';
      element.style.height = '1122px';
      element.style.minHeight = '1122px';
      element.style.maxHeight = '1122px';
      element.style.overflow = 'hidden';

      const actualHeight = 1122;

      const opt = {
        margin: 0,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2.2, 
          useCORS: true, 
          letterRendering: true,
          logging: false,
          scrollX: 0,
          scrollY: 0,
          windowWidth: 794,
          windowHeight: actualHeight
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Generate & Download the PDF capturing the perfect 794x1122 element directly (not the parent container)
      await html2pdf().from(element).set(opt).save();
      console.log("PDF gerado e baixado com sucesso!");
    } catch (err: any) {
      console.error("Erro na conversão para PDF:", err);
      alert("Houve um erro ao gerar o PDF de alta definição: " + (err.message || err));
    } finally {
      if (originalGetComputedStyle) {
        window.getComputedStyle = originalGetComputedStyle;
      }
      setTempDownloadData(null);
      setIsDownloading(false);
      if (setLocalGenerating) setLocalGenerating(false);
    }
  };

  // Actual download function replacing old handleDownloadPdf
  const executeDownloadPdf = async () => {
    const filename = isCoverLetterMode 
      ? 'Carta_Apresentacao.pdf' 
      : `${resumeData.personalInfo.fullName.replace(/\s+/g, '_')}_Curriculo.pdf`;

    const data = isCoverLetterMode 
      ? { content: generatedLetter, personalInfo: resumeData.personalInfo, themeColor: resumeData.themeColor, language: resumeData.language } 
      : resumeData;

    await downloadHtmlDocumentAsPdf(data, isCoverLetterMode ? 'cover_letter' : 'resume', template, filename);
  };

  const handleDownloadPdf = () => {
    executeDownloadPdf();
  };

  const handlePrint = () => {
    window.print();
  };

  const createOrder = async () => {
    if (!db) {
        alert("O serviço de banco de dados não está configurado. Por favor, configure o Firebase.");
        return;
    }
    if (!user || user.isAnonymous) {
        setShowAuthModal(true);
        return;
    }
    if (!contactEmail) return;

    setLoading(true);
    const orderData = {
        ownerId: user.uid,
        status: 'pending',
        documentType: 'combo',
        documentData: {
            resume: { ...resumeData, template },
            coverLetter: {
                content: generatedLetter,
                personalInfo: resumeData.personalInfo,
                themeColor: resumeData.themeColor
            }
        },
        contactEmail: contactEmail,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    try {
        const orderRef = await addDoc(collection(db, 'orders'), orderData);
        setCurrentOrderId(orderRef.id);
        setOrderStatus('pending');
        
        await addDoc(collection(db, 'mail'), {
            to: ['suportecvlab@gmail.com'],
            message: {
                subject: `🚨 NOVO COMBO - ${orderData.contactEmail}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
                        <div style="background-color: #0D8ABC; color: white; padding: 20px; text-align: center;">
                            <h2 style="margin: 0;">Novo Combo Profissional</h2>
                        </div>
                        <div style="padding: 30px; color: #333;">
                            <p><b>Usuário:</b> ${orderData.contactEmail}</p>
                            <p><b>Tipo:</b> Combo (CV + Carta)</p>
                            <p><b>ID do Pedido:</b> <code style="background: #f4f4f4; padding: 2px 6px; border-radius: 4px;">${orderRef.id}</code></p>
                            <p><b>Data:</b> ${new Date().toLocaleString('pt-AO')}</p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                            <p style="font-size: 14px; color: #666;">Acesse o Painel Administrativo para validar o comprovativo e liberar o acesso ao combo.</p>
                            <a href="${window.location.origin}/admin" style="display: inline-block; background-color: #0D8ABC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">Ver Pedidos no Painel</a>
                        </div>
                    </div>
                `
            }
        });

        const waMessage = encodeURIComponent(`Olá CV LAB, fiz o pedido de emissão (ID: ${orderRef.id}) e aqui está o meu comprovativo de pagamento.`);
        window.open(`https://wa.me/+244954748806?text=${waMessage}`, '_blank');
        
    } catch(e) {
        console.error(e);
        alert("Erro ao processar o pedido. Tente novamente.");
    } finally {
        setLoading(false);
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

  const handleCombinedImport = async () => {
    if (!rawText.trim() && !selectedFile) {
      alert("Por favor, selecione um arquivo PDF ou introduza algum texto para analisar.");
      return;
    }
    
    setIsImporting(true);
    let combinedText = rawText.trim();
    let pdfImage: string | undefined = undefined;

    try {
      if (selectedFile) {
        setImportProgress("Lendo arquivo PDF...");
        console.log("Iniciando extração de texto do PDF...");
        const pdfData = await extractTextFromPDF(selectedFile);
        console.log("PDF processado. Texto:", !!pdfData.text, "Imagem Fallback:", !!pdfData.image);
        
        if (!pdfData.text.trim() && !pdfData.image) {
          throw new Error("Não foi possível extrair informação do PDF selecionado.");
        }
        
        if (combinedText) {
          combinedText = `[INFORMAÇÃO ADICIONAL FORNECIDA PELO USUÁRIO]:\n${combinedText}\n\n[CONTEÚDO DO CV EM PDF]:\n${pdfData.text}`;
        } else {
          combinedText = pdfData.text;
        }
        pdfImage = pdfData.image;
      }
      
      setImportProgress("IA organizando os seus dados...");
      console.log("Enviando dados combinados para a Gemini AI...");
      const parsedData = await parseResumeFromText(combinedText, pdfImage);
      console.log("Dados processados recebidos:", parsedData);
      
      // Update resume data
      setResumeData(prev => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          fullName: parsedData.personalInfo?.fullName || prev.personalInfo.fullName,
          title: parsedData.personalInfo?.title || prev.personalInfo.title,
          email: parsedData.personalInfo?.email || prev.personalInfo.email,
          phone: parsedData.personalInfo?.phone || prev.personalInfo.phone,
          location: parsedData.personalInfo?.location || prev.personalInfo.location,
          summary: parsedData.personalInfo?.summary || prev.personalInfo.summary
        },
        experience: parsedData.experience?.length ? parsedData.experience : prev.experience,
        education: parsedData.education?.length ? parsedData.education : prev.education,
        skills: parsedData.skills?.length ? parsedData.skills : prev.skills,
        languages: parsedData.languages?.length ? parsedData.languages : prev.languages,
        interests: parsedData.interests?.length ? parsedData.interests : prev.interests,
        certifications: parsedData.certifications?.length ? parsedData.certifications : prev.certifications
      }));
      
      setActiveStep(1); // Jump to first data step after import
      setRawText("");
      setSelectedFile(null);
    } catch (error: any) {
      console.error("Erro na importação combinada:", error);
      alert("Erro ao importar dados: " + error.message);
    } finally {
      setIsImporting(false);
      setImportProgress("");
    }
  };

  const addExperience = () => {
    const id = Math.random().toString(36).substring(7);
    setResumeData(prev => ({
      ...prev,
      experience: [...(prev.experience || []), { id, company: '', position: '', startDate: '', endDate: '', description: '', current: false }]
    }));
  };

  const removeExperience = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      experience: (prev.experience || []).filter(ex => ex.id !== id)
    }));
  };

  const addSkill = (name: string) => {
    if (!name.trim()) return;
    const id = Math.random().toString(36).substring(7);
    setResumeData(prev => ({
      ...prev,
      skills: [...(prev.skills || []), { id, name, level: 'Intermédio' }]
    }));
  };

  const addLanguage = (name: string, level: string = 'Fluente') => {
    if (!name.trim()) return;
    const id = Math.random().toString(36).substring(7);
    setResumeData(prev => ({
      ...prev,
      languages: [...(prev.languages || []), { id, name, level }]
    }));
  };

  const addEducation = () => {
    const id = Math.random().toString(36).substring(7);
    setResumeData(prev => ({
      ...prev,
      education: [...(prev.education || []), { id, institution: '', degree: '', field: '', startDate: '', endDate: '' }]
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
      alert("O sistema não conseguiu sugerir mudanças significativas. Verifique:\n1. Se o texto inserido tem detalhes suficientes.\n2. Se o motor de processamento está configurado no seu ambiente de deploy.");
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
        experience: (data.experience || []).map((e: any) => ({ ...e, id: Math.random().toString(36).substring(7) })),
        education: (data.education || []).map((e: any) => ({ ...e, id: Math.random().toString(36).substring(7) })),
        skills: (data.skills || []).map((s: string) => ({ name: s, id: Math.random().toString(36).substring(7), level: 'Intermédio' })),
        languages: (data.languages || []).map((s: string) => ({ name: s, id: Math.random().toString(36).substring(7), level: 'Fluente' }))
      }));
      alert("Currículo gerado com sucesso! Você pode ajustar os detalhes agora.");
    } catch (err) {
      alert("Erro ao auto-completar. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  const handleTranslateToEnglish = async () => {
    if (!resumeData.personalInfo.fullName && (resumeData.experience || []).length === 0 && (resumeData.education || []).length === 0 && (resumeData.skills || []).length === 0) {
      alert("O seu currículo está vazio. Preencha algumas informações antes de traduzir!");
      return;
    }
    
    const confirmTranslate = window.confirm("Pretende mesmo traduzir o seu currículo para o Inglês de forma automática usando Inteligência Artificial?");
    if (!confirmTranslate) return;

    setIsTranslating(true);
    setLoading(true);

    // Guardar cópia de segurança antes de traduzir
    const backupResume = { ...resumeData };
    const backupLetter = generatedLetter;
    setOriginalResumeData(backupResume);
    setOriginalLetter(backupLetter);
    localStorage.setItem('cv_lab_original_data', JSON.stringify(backupResume));
    localStorage.setItem('cv_lab_original_letter', backupLetter);

    try {
      const translatedData = await translateResumeToEnglish(resumeData);
      setResumeData(translatedData);
      localStorage.setItem('cv_lab_data', JSON.stringify(translatedData));

      // Se houver uma carta gerada, traduzi-la também para Inglês
      if (backupLetter && backupLetter.trim().length > 10) {
        try {
          const translatedLetter = await translateLetterToEnglish(backupLetter);
          setGeneratedLetter(translatedLetter);
          localStorage.setItem('cv_lab_letter', translatedLetter);
        } catch (letterErr) {
          console.warn("Falha ao traduzir a carta de apresentação:", letterErr);
        }
      }

      alert("O seu currículo (e carta de apresentação) foram traduzidos com sucesso para a versão Inglesa!");
    } catch (error: any) {
      console.error(error);
      alert("Houve um erro técnico ao traduzir o currículo. Verifique se a sua chave API do Gemini está configurada.");
    } finally {
      setIsTranslating(false);
      setLoading(false);
    }
  };

  const handleTranslateToSpanish = async () => {
    if (!resumeData.personalInfo.fullName && (resumeData.experience || []).length === 0 && (resumeData.education || []).length === 0 && (resumeData.skills || []).length === 0) {
      alert("O seu currículo está vazio. Preencha algumas informações antes de traduzir!");
      return;
    }
    
    const confirmTranslate = window.confirm("Pretende mesmo traduzir o seu currículo para o Espanhol de forma automática usando Inteligência Artificial?");
    if (!confirmTranslate) return;

    setIsTranslating(true);
    setLoading(true);

    // Guardar cópia de segurança antes de traduzir
    const backupResume = { ...resumeData };
    const backupLetter = generatedLetter;
    setOriginalResumeData(backupResume);
    setOriginalLetter(backupLetter);
    localStorage.setItem('cv_lab_original_data', JSON.stringify(backupResume));
    localStorage.setItem('cv_lab_original_letter', backupLetter);

    try {
      const translatedData = await translateResumeToSpanish(resumeData);
      setResumeData(translatedData);
      localStorage.setItem('cv_lab_data', JSON.stringify(translatedData));

      // Se houver uma carta gerada, traduzi-la também para Espanhol
      if (backupLetter && backupLetter.trim().length > 10) {
        try {
          const translatedLetter = await translateLetterToSpanish(backupLetter);
          setGeneratedLetter(translatedLetter);
          localStorage.setItem('cv_lab_letter', translatedLetter);
        } catch (letterErr) {
          console.warn("Falha ao traduzir a carta de apresentação:", letterErr);
        }
      }

      alert("O seu currículo (e carta de apresentação) foram traduzidos com sucesso para a versão Espanhola!");
    } catch (error: any) {
      console.error(error);
      alert("Houve um erro técnico ao traduzir o currículo. Verifique se a sua chave API do Gemini está configurada.");
    } finally {
      setIsTranslating(false);
      setLoading(false);
    }
  };

  const handleRevertToOriginal = () => {
    if (!originalResumeData) {
      alert("Não foi detetada nenhuma versão original guardada.");
      return;
    }

    const confirmRevert = window.confirm("Deseja reverter o currículo e a carta de apresentação para a versão original em Português?");
    if (!confirmRevert) return;

    setResumeData(originalResumeData);
    localStorage.setItem('cv_lab_data', JSON.stringify(originalResumeData));

    if (originalLetter) {
      setGeneratedLetter(originalLetter);
      localStorage.setItem('cv_lab_letter', originalLetter);
    }

    // Limpar backups após reverter com sucesso
    setOriginalResumeData(null);
    setOriginalLetter(null);
    localStorage.removeItem('cv_lab_original_data');
    localStorage.removeItem('cv_lab_original_letter');

    alert("Revertido com sucesso para a versão original em Português!");
  };


  const handleClearResumeData = () => {
    const confirmClear = window.confirm("Deseja mesmo eliminar/limpar todos os dados inseridos no currículo? Esta ação é irreversível!");
    if (!confirmClear) return;
    
    setResumeData(INITIAL_RESUME_DATA);
    setGeneratedLetter("");
    localStorage.removeItem('cv_lab_data');
    localStorage.removeItem('cv_lab_letter');
    setActiveStep(0);
    alert("Todos os dados do currículo foram eliminados.");
  };


  if (view === 'landing') {
    return (
      <div className="min-h-screen hero-gradient flex flex-col">
        <nav className="h-24 px-6 md:px-12 flex items-center justify-between glass sticky top-0 z-50">
          <div className="flex-1">
            <div className="cursor-pointer inline-block" onClick={handleLogoClick}>
              <img 
                src="https://i.supaimg.com/6bc04951-8cbe-4706-9f0c-a01f9ea9a6c4/f7862e8c-46f6-4d82-a9e0-b9cb52c6fc4f.png" 
                alt="CV LAB" 
                className="h-10 md:h-12 w-auto object-contain"
                referrerPolicy="no-referrer" 
              />
            </div>
          </div>

          <div className="flex-[2] hidden lg:flex flex-col items-center gap-2">
            <Button 
              onClick={() => setView('editor')} 
              className="bg-primary-blue hover:bg-deep-blue text-white px-8 h-11 text-xs uppercase tracking-[0.2em] font-black shadow-lg shadow-primary-blue/20 transition-all hover:scale-105 active:scale-95"
            >
              Criar Meu Currículo
            </Button>
            <div className="flex items-center gap-6 text-[9px] font-black tracking-widest text-text-muted uppercase">
              <button onClick={() => setView('tips')} className="hover:text-primary-blue transition-colors">Dicas</button>
              <button onClick={() => setView('showcase')} className="hover:text-primary-blue transition-colors">Exemplos</button>
              <button onClick={() => setView('about')} className="hover:text-primary-blue transition-colors">Sobre Nós</button>
              <button onClick={() => setView('faq')} className="hover:text-primary-blue transition-colors">FAQ</button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-end gap-4">
            {user && user.email !== 'anonymous' ? (
                <button 
                  onClick={() => setView('profile')}
                  className="flex items-center gap-2 group transition-all p-1 pr-3 rounded-full hover:bg-white/40"
                >
                  <img 
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || 'U')}&background=0D8ABC&color=fff`} 
                    className="w-9 h-9 rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-110" 
                    alt="Avatar" 
                    referrerPolicy="no-referrer" 
                  />
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-[10px] font-black text-deep-blue uppercase leading-tight">Meu Perfil</span>
                    <span className="text-[8px] text-primary-blue font-bold tracking-tighter">Ver Central</span>
                  </div>
                </button>
              ) : (
                <button onClick={() => setView('editor')} className="text-xs font-black text-primary-blue uppercase tracking-widest px-4 py-2 hover:bg-white/50 rounded-xl transition-all border border-primary-blue/10">Criar currículo</button>
              )}
          </div>
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

        <main className="flex-1 flex flex-col items-center max-w-7xl mx-auto w-full pt-12 md:pt-20">
          <div className="flex flex-col md:flex-row items-center px-6 md:px-12 gap-16 w-full">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex-1 flex flex-col gap-8"
            >
              <h1 className="text-6xl md:text-8xl font-black text-deep-blue leading-[0.85] tracking-tighter">
                CV + Carta que <span className="text-primary-blue italic">abre portas.</span>
              </h1>
              <p className="text-xl text-text-muted leading-relaxed font-medium max-w-lg">
                O seu combo profissional completo (Currículo + Carta de Apresentação) por apenas <span className="text-deep-blue font-black underline decoration-primary-blue/30">{cvPrice.toLocaleString()} Kzs</span>. 
                Design premium e tecnologia validada por recrutadores.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button onClick={() => setView('editor')} className="px-10 h-16 text-lg uppercase tracking-tight shadow-2xl shadow-primary-blue/30">Criar meu currículo</Button>
                <Button variant="outline" onClick={() => setView('showcase')} className="px-10 h-16 text-lg uppercase tracking-tight border-border-main text-text-main hover:bg-bg-main">Ver Modelos</Button>
              </div>
              <div className="flex items-center gap-6 pt-4 border-t border-border-main mt-4">
                <div className="flex -space-x-3">
                  {[
                    "https://images.unsplash.com/photo-1522529599102-193c0bc76f27?w=100&h=100&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&h=100&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1507152832244-10d45c7eda57?w=100&h=100&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=100&h=100&fit=crop&q=80"
                  ].map((url, i) => (
                    <img key={i} src={url} alt="User" className="w-10 h-10 rounded-full border-2 border-white ring-1 ring-border-main object-cover" referrerPolicy="no-referrer" />
                  ))}
                </div>
                <div className="text-xs font-bold text-text-muted">
                   <p className="text-deep-blue font-black tracking-tight">+500 usuários</p>
                   <p className="opacity-70">Confiam na nossa plataforma</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex-1 w-full flex flex-col items-center justify-center relative"
            >
               <div className="relative w-full aspect-square md:aspect-[4/5] max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden group border border-border-main">
                  <img 
                    src="https://i.postimg.cc/F788kyTm/1776760689134.jpg" 
                    alt="Resume Preview" 
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110"
                    style={{ imageRendering: '-webkit-optimize-contrast' }}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-deep-blue/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-8 left-8 right-8 text-white">
                    <p className="font-black text-2xl leading-tight mb-2 tracking-tighter">Design de Nível Executivo</p>
                    <p className="text-xs opacity-80 font-medium">Aprovado em triagens de empresas globais.</p>
                  </div>
                  <div className="absolute top-6 right-6 bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-white text-[10px] font-black tracking-widest border border-white/20">PREMIUM</div>
               </div>
               
               {/* Floating elements - Redesigned for elite business look */}
               <motion.div 
                 animate={{ y: [0, -10, 0] }}
                 transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                 className="absolute -top-10 -right-10 p-5 bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 flex items-center gap-4 z-10"
               >
                 <div className="w-12 h-12 bg-primary-blue/5 text-primary-blue rounded-full flex items-center justify-center shadow-inner">
                   <div className="bg-primary-blue text-white p-1.5 rounded-lg shadow-lg">
                     <FileText size={18} strokeWidth={2.5} />
                   </div>
                 </div>
                 <div className="flex flex-col">
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-0.5">Padrão Elite</p>
                   <p className="text-[15px] font-black text-deep-blue leading-tight italic">Validado p/ Recrutamento</p>
                 </div>
               </motion.div>
            </motion.div>
          </div>

          {/* Stats Bar */}
          <section className="w-full py-16 px-6 mt-16 bg-white border-y border-gray-100 shadow-sm">
            <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
              {[
                { label: "Currículos Criados", val: "1.250+" },
                { label: "Taxa de Entrevistas", val: "92%" },
                { label: "Modelos Exclusivos", val: "8" },
                { label: "Profissionais Colocados", val: "340+" }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center justify-center p-4 rounded-2xl hover:bg-bg-main transition-colors duration-300">
                  <h3 className="text-4xl md:text-5xl font-black text-deep-blue tracking-tighter mb-1">
                    {stat.val}
                  </h3>
                  <div className="h-1 w-8 bg-primary-blue/30 rounded-full mb-3"></div>
                  <p className="text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-[0.25em] text-center">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Features Section */}
          <section className="py-24 px-6 w-full max-w-7xl mx-auto">
            <div className="text-center space-y-4 mb-20">
               <h2 className="text-4xl md:text-6xl font-black text-deep-blue tracking-tighter">Eficiência que você sente no <span className="text-primary-blue italic">primeiro clique.</span></h2>
               <p className="text-text-muted font-medium max-w-2xl mx-auto">Desenvolvemos cada detalhe para que sua jornada até a mesa do recrutador seja o mais curta possível.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { 
                  title: "Otimização Semântica", 
                  desc: "Nosso sistema analisa e aprimora seus textos com linguagem executiva focada em impacto e resultados reais.", 
                  icon: Settings,
                  color: "bg-primary-blue text-white shadow-primary-blue/20"
                },
                { 
                  title: "Exportação em Alta Definição", 
                  desc: "PDFs gerados com precisão matemática para garantir que nenhum pixel saia do lugar na impressão.", 
                  icon: FileText,
                  color: "bg-deep-blue text-white shadow-deep-blue/20"
                },
                { 
                  title: "Privacidade Garantida", 
                  desc: "Seus dados pessoais pertencem a você. Processamos suas informações de forma segura e local sempre que possível.", 
                  icon: CheckCircle,
                  color: "bg-soft-blue text-primary-blue border border-primary-blue/10"
                }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="p-10 rounded-[40px] bg-white border border-border-main hover:shadow-2xl transition-all group"
                >
                  <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center mb-8 shadow-xl group-hover:scale-110 transition-transform`}>
                    <item.icon size={28} />
                  </div>
                  <h3 className="text-2xl font-black text-deep-blue tracking-tight mb-4">
                    {item.title}
                  </h3>
                  <p className="text-text-muted leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Testimonials */}
          <section className="w-full bg-deep-blue py-24 px-6 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(0,102,255,0.1),transparent)]"></div>
             <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row gap-16 items-center">
                <div className="flex-1 space-y-8">
                   <h2 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tighter">O que dizem os <span className="text-primary-blue italic">Líderes.</span></h2>
                   <p className="text-white/60 text-lg font-medium leading-relaxed">Milhares de profissionais de Angola e do mundo ja garantiram suas posições usando nossa tecnologia.</p>
                   <Button onClick={() => setView('editor')} className="bg-white text-deep-blue hover:bg-gray-100 h-16 px-10 uppercase tracking-widest text-xs">Junte-se a eles</Button>
                </div>
                <div className="flex-1 w-full grid grid-cols-1 gap-6">
                   {[
                      {
                        name: "Ana Silva",
                        role: "Diretora de Marketing",
                        testimonial: "A CV LAB transformou completamente meu currículo. A estruturação e a formatação sugeridas foram o divisor de águas para minha contratação."
                      },
                      {
                        name: "Ricardo Mendes",
                        role: "Engenheiro de Dados",
                        testimonial: "Interface incrível, rápida e o resultado final é de um nível executivo que eu não conseguiria fazer sozinho no Word."
                      }
                   ].map((t, i) => (
                      <div key={i} className="bg-white/10 backdrop-blur-lg border border-white/10 p-8 rounded-[32px] text-white">
                         <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-full bg-primary-blue flex items-center justify-center font-black text-xl">
                               {t.name.charAt(0)}
                            </div>
                            <div>
                               <p className="font-bold text-lg">{t.name}</p>
                               <p className="text-[10px] font-black uppercase tracking-widest text-primary-blue">{t.role}</p>
                            </div>
                         </div>
                         <p className="text-white/80 font-medium leading-relaxed italic italic-font italic-style">"{t.testimonial}"</p>
                      </div>
                   ))}
                </div>
             </div>
          </section>

          {/* Trusted Logos (Simulated for high-end look) */}
          <div className="py-20 px-6 w-full border-t border-gray-100 bg-white">
            <div className="max-w-7xl mx-auto">
              <p className="text-center text-[11px] font-bold text-gray-400 uppercase tracking-[0.4em] mb-12">Empresas onde nossos usuários foram contratados</p>
              <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
                {['UNITEL', 'SONANGOL', 'BAI', 'BFA', 'ENSA', 'AFRICELL', 'CARRINHO'].map(brand => (
                  <span key={brand} className="text-xl md:text-2xl font-black tracking-tighter text-deep-blue hover:text-primary-blue cursor-default">{brand}</span>
                ))}
              </div>
            </div>
          </div>
        </main>
        
        <motion.footer 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="bg-bg-main py-20 border-t border-border-main text-center flex flex-col items-center gap-10"
        >
           <div className="flex flex-col items-center gap-4">
              <img 
                src="https://i.supaimg.com/6bc04951-8cbe-4706-9f0c-a01f9ea9a6c4/f7862e8c-46f6-4d82-a9e0-b9cb52c6fc4f.png" 
                alt="CV LAB" 
                className="h-10 w-auto opacity-50"
                referrerPolicy="no-referrer" 
              />
              <p className="text-xs font-bold text-text-muted max-w-sm">Ferramenta definitiva para a criação de currículos profissionais de alto impacto em Angola.</p>
           </div>
           
           <div className="flex flex-wrap justify-center items-center gap-8 text-[10px] font-black text-text-muted uppercase tracking-widest">
              <button onClick={() => setView('tips')} className="hover:text-primary-blue transition-colors">Dicas</button>
              <button onClick={() => setView('showcase')} className="hover:text-primary-blue transition-colors">Exemplos</button>
              <button onClick={() => setView('about')} className="hover:text-primary-blue transition-colors">Sobre Nós</button>
              <button onClick={() => setView('faq')} className="hover:text-primary-blue transition-colors">FAQ</button>
              <button onClick={() => setView('terms')} className="hover:text-primary-blue transition-colors">Termos</button>
              <a href="https://www.facebook.com/share/18jr2KKfK1/" target="_blank" rel="noopener noreferrer" className="hover:text-primary-blue transition-colors">Facebook</a>
              <a href="https://www.instagram.com/cvlabvisaodecarreira?igsh=YWZpb2RuNXFrajhx" target="_blank" rel="noopener noreferrer" className="hover:text-primary-blue transition-colors">Instagram</a>
              <a href="https://www.tiktok.com/@cv.lab.viso.de.ca?_r=1&_t=ZS-95gvLuKq4As" target="_blank" rel="noopener noreferrer" className="hover:text-primary-blue transition-colors">TikTok</a>
           </div>
           
           <div className="w-14 h-1.5 bg-border-main rounded-full"></div>
           
           <div className="flex flex-col items-center gap-2">
             <Button onClick={() => setView('editor')} className="px-12 h-14 text-sm uppercase tracking-tight">Criar Meu Currículo Agora</Button>
             <p className="text-[9px] text-text-muted opacity-40 uppercase tracking-widest mt-2">© 2026 CV LAB. Todos os direitos reservados para Lab Digital.</p>
           </div>
        </motion.footer>
      </div>
    );
  }

  if (view === 'faq' || view === 'about' || view === 'terms' || view === 'tips' || view === 'showcase' || view === 'admin' || view === 'profile' || view === 'my-resumes') {
    return (
      <div className="min-h-screen hero-gradient flex flex-col">
        <nav className="h-24 px-6 md:px-12 flex items-center justify-between glass sticky top-0 z-50">
          <div className="flex-1">
            <button onClick={handleLogoClick} className="flex items-center">
              <img 
                src="https://i.supaimg.com/6bc04951-8cbe-4706-9f0c-a01f9ea9a6c4/f7862e8c-46f6-4d82-a9e0-b9cb52c6fc4f.png" 
                alt="CV LAB" 
                className="h-10 md:h-12 w-auto object-contain"
                referrerPolicy="no-referrer" 
              />
            </button>
          </div>

          <div className="flex-[2] flex flex-col items-center gap-1.5">
            <Button 
              onClick={() => setView('editor')} 
              className="bg-primary-blue hover:bg-deep-blue text-white px-6 md:px-8 h-10 md:h-11 text-[10px] md:text-xs uppercase tracking-[0.2em] font-black shadow-lg shadow-primary-blue/20 transition-all hover:scale-105 active:scale-95 rounded-full"
            >
              Criar CV
            </Button>
            <div className="hidden lg:flex items-center gap-6 text-[9px] font-black tracking-widest text-text-muted uppercase">
              <button onClick={() => setView('tips')} className="hover:text-primary-blue transition-colors">Dicas</button>
              <button onClick={() => setView('showcase')} className="hover:text-primary-blue transition-colors">Exemplos</button>
              <button onClick={() => setView('about')} className="hover:text-primary-blue transition-colors">Sobre Nós</button>
              <button onClick={() => setView('faq')} className="hover:text-primary-blue transition-colors">FAQ</button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-end gap-4">
             {user && user.email !== 'anonymous' ? (
                <button 
                  onClick={() => setView('profile')}
                  className="flex items-center gap-2 group transition-all p-1 pr-3 rounded-full hover:bg-white/40"
                >
                  <img 
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || 'U')}&background=0D8ABC&color=fff`} 
                    className="w-9 h-9 rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-110" 
                    alt="Avatar" 
                    referrerPolicy="no-referrer" 
                  />
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-[10px] font-black text-deep-blue uppercase leading-tight">Meu Perfil</span>
                    <span className="text-[8px] text-primary-blue font-bold tracking-tighter">Ver Central</span>
                  </div>
                </button>
              ) : (
                <button onClick={() => setView('editor')} className="text-xs font-black text-primary-blue uppercase tracking-widest px-4 py-2 hover:bg-white/50 rounded-xl transition-all border border-primary-blue/10">Criar currículo</button>
              )}
          </div>
        </nav>
        
        <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-16">
          {(view !== 'admin' && view !== 'profile' && view !== 'my-resumes') && (
            <button onClick={() => setView('landing')} className="text-primary-blue text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
              <ChevronLeft size={16} /> Voltar
            </button>
          )}

          {view === 'my-resumes' && <MyResumesPage user={user} setView={setView} onRequestDownload={downloadHtmlDocumentAsPdf} />}

          {view === 'profile' && <ProfilePage user={user} isAdmin={isAdmin} setView={setView} onLogout={logOut} onRequestDownload={downloadHtmlDocumentAsPdf} />}

          {view === 'admin' && <AdminPanel setView={setView} />}

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
                  <p className="text-white/80 text-sm font-medium">Nosso sistema pode revisar seu currículo atual e sugerir melhorias específicas para o seu perfil profissional.</p>
                </div>
                <Button onClick={() => setView('editor')} className="bg-white text-primary-blue hover:bg-white/90 shrink-0 h-14 px-8 uppercase tracking-widest text-xs">Criar meu currículo</Button>
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
                  { name: "Modelo Executivo", desc: "Perfeito para cargos de gestão e liderança.", img: "https://i.supaimg.com/6bc04951-8cbe-4706-9f0c-a01f9ea9a6c4/4fe98738-3a04-404b-ae2e-6d1533cd27ef.jpg" },
                  { name: "Modelo Criativo", desc: "Ideal para designers, publicidade e artes.", img: "https://i.supaimg.com/6bc04951-8cbe-4706-9f0c-a01f9ea9a6c4/2ab532fe-f8f0-431f-9042-30442f1c617d.jpg" },
                  { name: "Modelo Minimalista", desc: "Foco total no conteúdo e experiências.", img: "https://i.supaimg.com/6bc04951-8cbe-4706-9f0c-a01f9ea9a6c4/5f13c796-6b4e-49f4-9f75-af155f179f7a.jpg" },
                  { name: "Modelo Académico", desc: "Estruturado para investigadores e professores.", img: "https://i.supaimg.com/6bc04951-8cbe-4706-9f0c-a01f9ea9a6c4/6dcf83ae-ea5d-413f-b326-64577ba5053f.jpg" }
                ].map((item, idx) => (
                  <motion.div 
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-[32px] border border-border-main overflow-hidden shadow-sm hover:shadow-2xl transition-all cursor-pointer group"
                    onClick={() => setView('editor')}
                  >
                    <div className="aspect-[3/4] overflow-hidden relative bg-gray-50 flex items-center justify-center">
                      <img 
                        src={item.img} 
                        alt={item.name} 
                        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105" 
                        style={{ imageRendering: '-webkit-optimize-contrast' }}
                      />
                      <div className="absolute inset-0 bg-deep-blue/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="bg-white text-primary-blue px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-xl">Usar este Modelo</span>
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
                    q: "Como o sistema melhora meu currículo?",
                    a: "Nosso mecanismo avançado analisa as suas experiências brutas e as reescreve utilizando verbos de ação e métricas de impacto. Ele ajusta o tom para ser mais executivo e garante que as palavras-chave certas para o seu setor estejam presentes, aumentando suas chances em sistemas de triagem automáticos (ATS)."
                  },
                  {
                    q: "Quanto custa o serviço?",
                    a: `A criação e o download do combo completo (Currículo Profissional + Carta de Apresentação) têm o custo único de ${cvPrice.toLocaleString()} Kzs. Este valor inclui a otimização de texto, templates premium e suporte para activação via WhatsApp.`
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
                    q: "Como funciona a entrega?",
                    a: "Após preencher seus dados, você faz o pedido de liberação. Assim que o comprovativo for enviado para o nosso WhatsApp, o download do PDF em alta definição é liberado instantaneamente na sua área de pedidos."
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
                  { label: "Sistema Integrado", desc: "Textos otimizados pelo nosso motor próprio para soar como um executivo sênior." },
                  { label: "Foco no Candidato", desc: "Ferramenta gratuita e acessível para impulsionar talentos locais." }
                ].map((stat, i) => (
                  <div key={i} className="space-y-2 p-6 bg-white rounded-3xl border border-border-main shadow-sm">
                    <h4 className="text-lg font-black text-primary-blue uppercase tracking-tight">{stat.label}</h4>
                    <p className="text-sm text-text-muted font-medium">{stat.desc}</p>
                  </div>
                ))}
              </div>

              <div className="bg-deep-blue text-white p-12 rounded-[40px] text-center space-y-6 shadow-2xl relative overflow-hidden">
                <h3 className="text-3xl font-black relative z-10">Pronto para dar o próximo passo?</h3>
                <p className="text-white/70 max-w-xl mx-auto font-medium relative z-10">
                  Junte-se a milhares de profissionais que já transformaram suas carreiras com a ajuda da CV LAB.
                </p>
                <div className="relative z-10 pt-4">
                  <Button onClick={() => setView('editor')} className="bg-white text-primary-blue hover:bg-white/90 px-12 h-16 text-lg">Criar meu currículo</Button>
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
                
                <h3 className="font-bold text-primary-blue">2. Uso de Algoritmos de Otimização</h3>
                <p>O serviço utiliza ferramentas de processamento avançado para gerar textos otimizados. Não garantimos contratações, mas sim a formatação e estruturação correta do texto.</p>

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

  const currentTheme = TEMPLATES[template];
  const c = { ...currentTheme.colors, primary: resumeData.themeColor || currentTheme.colors.primary };

  return (
    <div className="min-h-screen bg-bg-main flex flex-col md:flex-row justify-start md:h-screen md:overflow-y-auto md:overflow-x-hidden print:bg-white print:h-auto print:overflow-visible">
      
      {/* Payment Modal Overlay */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 bg-deep-blue/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative overflow-hidden"
            >
               <button onClick={() => setShowPaymentModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full p-2">
                 <X size={20} />
               </button>
               
               <div className="w-16 h-16 bg-primary-blue/10 text-primary-blue flex items-center justify-center rounded-2xl mb-6 mx-auto">
                 <CreditCard size={32} />
               </div>
               
               <h2 className="text-2xl font-black text-deep-blue text-center mb-2 tracking-tight">Combo (CV + Carta): {cvPrice.toLocaleString()} Kzs</h2>
               <p className="text-sm text-text-muted text-center mb-6 font-medium">O pagamento único de {cvPrice.toLocaleString()} Kzs libera tanto o seu Currículo quanto a sua Carta de Apresentação simultaneamente.</p>

                {orderStatus === 'pending' ? (
                  <div className="text-center space-y-6">
                     <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 p-5 rounded-2xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-bl-full -mr-4 -mt-4"></div>
                       <p className="text-amber-800 font-bold text-sm mb-1">Aguardando Validação</p>
                       <p className="text-xs text-amber-700">ID do Pedido: <span className="font-mono bg-white/50 px-2 py-0.5 rounded ml-1">{currentOrderId}</span></p>
                     </div>
                     
                     <p className="text-sm text-gray-600 font-medium leading-relaxed">Seu pedido foi registado com sucesso! Envie agora o comprovativo para o nosso WhatsApp para liberação imediata.</p>
                     
                     <Button onClick={() => window.open(`https://wa.me/+244954748806?text=${encodeURIComponent(`Olá CV LAB, fiz o pedido de emissão (ID: ${currentOrderId}) e aqui está o meu comprovativo de pagamento.`)}`, '_blank')} className="w-full bg-gradient-to-r from-[#25D366] to-[#1DA851] hover:from-[#128C7E] hover:to-[#128C7E] shadow-lg shadow-green-500/30 h-14 rounded-xl text-white font-bold text-sm tracking-wide group">
                       <MessageCircle size={18} className="group-hover:scale-110 transition-transform" /> ENVIAR COMPROVATIVO AGORA
                     </Button>

                     <div className="flex items-center justify-center gap-2 mt-4 text-[10px] uppercase font-bold tracking-widest text-gray-400">
                       <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}><Settings size={12} /></motion.div>
                       Aguardando Liberação do ADM...
                     </div>
                  </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); createOrder(); }} className="space-y-5">
                     <Input 
                        label="Seu Email de Contacto" 
                        type="email" 
                        required 
                        value={contactEmail} 
                        onChange={setContactEmail} 
                        icon={Mail} 
                        placeholder="exemplo@email.com" 
                     />
                     
                     <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 flex flex-col gap-4">
                        <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-wider text-center">Dados para Pagamento Seguros</h3>
                        
                        <div className="flex items-center gap-4 bg-white py-3 px-4 rounded-xl border border-gray-100 shadow-sm hover:border-primary-blue/30 transition-colors">
                          <img src="https://i.supaimg.com/6bc04951-8cbe-4706-9f0c-a01f9ea9a6c4/1c1795b0-8faf-4c4d-a939-e439d7e7903e.png" alt="Multicaixa Express" className="h-8 w-12 object-contain" referrerPolicy="no-referrer" />
                          <div className="text-left flex-1">
                             <p className="text-gray-400 font-bold text-[10px] uppercase tracking-wider mb-0.5">Telefone (Express)</p>
                             <p className="font-black text-gray-900 text-base leading-none">954 748 806</p>
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-xs hover:border-primary-blue/30 transition-colors">
                           <p className="text-gray-400 font-bold text-[10px] uppercase tracking-wider mb-1.5 flex items-center justify-between">Transferência Bancária <CreditCard size={14} className="text-primary-blue/50" /></p>
                           <p className="font-mono text-gray-900 font-black mb-1 text-[12px] bg-gray-50 p-1.5 rounded text-center tracking-wider">AO06 0040 0000 8217 7395 1016 7</p>
                           <p className="text-gray-500 font-medium text-[11px] text-center mt-2 uppercase">Jelson Monteiro Francisco</p>
                        </div>
                     </div>

                     <Button type="submit" disabled={loading} className="w-full h-14 rounded-xl bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white shadow-xl shadow-gray-900/20 mt-4 tracking-wide text-sm font-bold border-0">
                       {loading ? (
                         <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>GERANDO PEDIDO...</span>
                         </div>
                       ) : "JÁ PAGUEI, PROSSEGUIR"}
                     </Button>
                  </form>
                )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Required Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 bg-deep-blue/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="bg-white rounded-[40px] shadow-2xl p-10 max-w-sm w-full relative overflow-hidden text-center space-y-6"
            >
               <button onClick={() => setShowAuthModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full p-2">
                 <X size={20} />
               </button>
               
               <div className="w-16 h-16 bg-primary-blue/10 text-primary-blue flex items-center justify-center rounded-3xl mx-auto">
                 <User size={32} />
               </div>
               
               <div className="space-y-1">
                 <h2 className="text-xl font-black text-deep-blue tracking-tight">{isAuthModeLogin ? "Fazer Login" : "Criar Conta"}</h2>
                 <p className="text-xs text-text-muted font-medium leading-relaxed">Guarde seu progresso na nuvem e aceda de qualquer dispositivo.</p>
               </div>
               
               <div className="space-y-3 pt-2 text-left">
                  {authError && <p className="text-red-500 text-[10px] text-center font-bold bg-red-50 p-2 rounded-lg">{authError}</p>}
                  {!isAuthModeLogin && (
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1 mb-1 block">Nome</label>
                      <input type="text" value={authName} onChange={e => setAuthName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/50" placeholder="Seu nome" />
                    </div>
                  )}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1 mb-1 block">Email</label>
                    <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/50" placeholder="exemplo@email.com" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1 mb-1 block">Senha rápida</label>
                    <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/50" placeholder="••••••••" />
                  </div>
                  <Button 
                    className="w-full h-12 bg-primary-blue text-white hover:bg-deep-blue rounded-xl text-sm font-black shadow-lg shadow-primary-blue/20"
                    onClick={async () => {
                       setAuthError('');
                       if (!authEmail || !authPassword) {
                          setAuthError("Preencha todos os campos.");
                          return;
                       }
                       if (!auth) {
                          setAuthError("Erro crítico: As credenciais do Firebase (API Key, etc.) não estão configuradas na aplicação. Insira-as no ficheiro src/lib/firebase.ts ou nas Definições.");
                          return;
                       }
                       try {
                          if (isAuthModeLogin) {
                             await signInWithEmailAndPassword(auth, authEmail, authPassword);
                          } else {
                             const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
                             if (authName) {
                               await updateProfile(userCredential.user, { displayName: authName });
                             }
                          }
                          setShowAuthModal(false);
                          setShowPaymentModal(true);
                          setContactEmail(auth?.currentUser?.email || authEmail);
                       } catch (e: any) {
                          if (e.code === 'auth/email-already-in-use') setAuthError("Email já cadastrado. Tente fazer login.");
                          else if (e.code === 'auth/weak-password') setAuthError("A senha deve ter pelo menos 6 caracteres.");
                          else if (e.code === 'auth/invalid-credential') setAuthError("Email ou senha incorretos.");
                          else setAuthError("Erro na autenticação. Verifique se ativou Email/Senha no Firebase Console.");
                          console.error(e);
                       }
                    }}
                  >
                    {isAuthModeLogin ? "Entrar na Conta" : "Criar Conta Rápida"}
                  </Button>
               </div>

               <div className="relative flex items-center py-2">
                 <div className="flex-grow border-t border-gray-200"></div>
                 <span className="flex-shrink-0 mx-4 text-gray-400 text-[10px] font-bold uppercase tracking-widest">OU</span>
                 <div className="flex-grow border-t border-gray-200"></div>
               </div>

               <div className="space-y-3">
                 <Button 
                   onClick={async () => {
                     const u = await loginWithGoogle();
                     setShowAuthModal(false);
                     if (u && (!u.isAnonymous || u.isAnonymous === undefined)) {
                        setShowPaymentModal(true);
                        setContactEmail(u.email || '');
                     }
                   }} 
                   className="w-full h-12 bg-white border-2 border-gray-200 hover:bg-gray-50 font-black rounded-xl text-sm text-gray-900 shadow-none"
                 >
                   <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 mr-2" />
                   Continuar com Google
                 </Button>
                 
                 <div className="flex justify-between items-center text-xs px-2 pt-2">
                    <button 
                      onClick={() => setIsAuthModeLogin(!isAuthModeLogin)}
                      className="font-bold text-primary-blue hover:underline"
                    >
                      {isAuthModeLogin ? "Quero criar uma conta" : "Já tenho uma conta"}
                    </button>
                    <button 
                      onClick={() => setShowAuthModal(false)}
                      className="font-bold text-gray-400 hover:text-gray-600"
                    >
                      Cancelar
                    </button>
                 </div>
               </div>

               <div className="pt-4 border-t border-gray-100 flex items-center justify-center gap-2">
                 <Shield size={14} className="text-green-500" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Segurança de Dados Garantida</span>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Access Restriction Alert Modal */}
      <AnimatePresence>
        {showAuthModalAlert && (
          <div className="fixed inset-0 bg-deep-blue/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="bg-white rounded-[40px] shadow-2xl p-10 max-w-md w-full relative overflow-hidden text-center space-y-6 border border-slate-100"
            >
               <button onClick={() => setShowAuthModalAlert(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full p-2">
                 <X size={20} />
               </button>
               
               <div className="w-20 h-20 bg-red-50 text-red-500 flex items-center justify-center rounded-[2rem] mx-auto shadow-inner">
                 <Shield size={40} className="animate-pulse" />
               </div>
               
               <div className="space-y-2">
                 <h2 className="text-2xl font-black text-deep-blue tracking-tight">🔒 Acesso Exclusivo</h2>
                 <p className="text-xs text-text-muted font-medium leading-relaxed max-w-sm mx-auto">
                   O CV LAB agora opera como uma solução privada e exclusiva para membros autorizados da nossa equipa.
                 </p>
               </div>

               <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left space-y-1">
                 <span className="text-[10px] uppercase font-black tracking-wider text-amber-800">Status de Ligação:</span>
                 {user && !user.isAnonymous ? (
                   <p className="text-xs font-semibold text-amber-900">
                     Sua conta atual (<strong className="underline">{user.email}</strong>) não possui permissão para aceder ao editor ou ferramentas.
                   </p>
                 ) : (
                   <p className="text-xs font-semibold text-amber-900">
                     Você está navegando como Convidado. O site opera apenas como vitrina oficial.
                   </p>
                 )}
               </div>
               
               <div className="space-y-3">
                 <Button 
                   className="w-full h-14 bg-gradient-to-r from-primary-blue to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 font-bold rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20"
                   onClick={async () => {
                     try {
                       const loggedInUser = await loginWithGoogle();
                       // Check if the newly logged in user is admin
                       const adminEmails = [
                         'ronalmaferreira04@icloud.com',
                         'sumodemanga50@gmail.com',
                         'm26101342@gmail.com'
                       ];
                       const u = loggedInUser || auth?.currentUser;
                       if (u && u.email && adminEmails.includes(u.email.toLowerCase())) {
                         setShowAuthModalAlert(false);
                         _setView('editor');
                       } else if (u && u.email) {
                           alert("O seu email (" + u.email + ") não tem permissões de administrador. Acesso negado.");
                       }
                     } catch(ecc) {
                       console.error(ecc);
                     }
                   }}
                 >
                   Fazer Login como Membro
                 </Button>
                 
                 <button 
                   onClick={() => setShowAuthModalAlert(false)}
                   className="text-xs font-black text-text-muted hover:text-deep-blue uppercase tracking-widest pt-2 block mx-auto transition-colors"
                 >
                   Voltar à Vitrina
                 </button>
               </div>

               <div className="pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-gray-400">
                 <span className="text-[8px] font-black uppercase tracking-widest">© 2026 CV LAB ANGOLA • LAB DIGITAL</span>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar Editor */}
      <aside className={`w-full max-w-3xl mx-auto md:max-w-none md:mx-0 md:w-[380px] lg:w-[460px] xl:w-[540px] bg-white border-r border-border-main flex flex-col shadow-2xl z-30 print:hidden shrink-0 ${showPreviewModal ? 'hidden' : 'flex'}`}>
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
            <Button variant="outline" className="h-9 px-4 text-xs font-bold md:hidden" onClick={() => setShowPreviewModal(true)} icon={ExternalLink}>Ver currículo</Button>
            <Button className="h-9 px-4 text-xs font-bold flex bg-primary-blue text-white hover:bg-[#0052cc] rounded-full shadow-md" onClick={handlePrint} icon={Printer}>Imprimir</Button>
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
              <div className="flex items-start justify-between flex-wrap gap-4 border-b border-gray-100 pb-4">
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-deep-blue tracking-tight">{editorSteps[activeStep].title}</h2>
                  <div className="h-1 w-12 bg-primary-blue rounded-full"></div>
                </div>
                
                <div className="flex gap-2">
                  {originalResumeData && (
                    <button
                      onClick={handleRevertToOriginal}
                      title="Voltar à Versão Original em Português"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs transition-all border border-emerald-100/30 select-none shadow-sm cursor-pointer"
                    >
                      <RotateCcw size={14} />
                      <span>Versão Portuguesa (PT)</span>
                    </button>
                  )}
                  <button
                    onClick={handleTranslateToEnglish}
                    disabled={isTranslating}
                    title="Traduzir Currículo para Inglês com IA"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition-all border border-indigo-100/30 disabled:opacity-50 select-none shadow-sm cursor-pointer"
                  >
                    <Languages size={14} className={isTranslating ? "animate-spin" : ""} />
                    <span>{isTranslating ? "Traduzindo..." : "Versão Inglesa (IA)"}</span>
                  </button>
                  <button
                    onClick={handleTranslateToSpanish}
                    disabled={isTranslating}
                    title="Traduzir Currículo para Espanhol com IA"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-xl text-xs transition-all border border-amber-100/30 disabled:opacity-50 select-none shadow-sm cursor-pointer"
                  >
                    <Languages size={14} className={isTranslating ? "animate-spin" : ""} />
                    <span>{isTranslating ? "Traduzindo..." : "Versão Espanhola (IA)"}</span>
                  </button>
                  <button
                    onClick={handleClearResumeData}
                    title="Limpar todos os dados do Currículo"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition-all border border-red-100/30 select-none shadow-sm cursor-pointer"
                  >
                    <RotateCcw size={14} />
                    <span>Limpar Tudo</span>
                  </button>
                </div>
              </div>

              {activeStep === 0 && ( /* Personal info */
                <div className="space-y-6">
                  {/* AI Import Block */}
                  <div className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] shadow-xl shadow-blue-500/20 relative overflow-hidden group mb-4">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full -ml-16 -mb-16 blur-xl"></div>
                    
                    {/* Tabs navigation */}
                    <div className="relative z-10 space-y-5">
                        <div className="space-y-1 text-center md:text-left mb-6">
                            <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 justify-center md:justify-start">
                              <Sparkles size={24} className="text-white fill-white/20 animate-pulse" />
                              Importação Mágica IA
                            </h3>
                            <p className="text-blue-100 text-xs font-semibold max-w-2xl mx-auto md:mx-0">
                                Envie o seu currículo em PDF, escreva os seus dados soltos no campo de texto, ou faça os dois simultaneamente. A IA organizará tudo com inteligência no formato certo.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {/* PDF Column */}
                           <div className="bg-white/10 rounded-2xl p-4 border border-white/20 flex flex-col justify-between">
                              <div className="space-y-1 mb-4">
                                <h4 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2"><Upload size={14}/> Arquivo PDF (Opcional)</h4>
                                <p className="text-blue-100/70 text-[10px]">Escolha um arquivo PDF com o seu currículo antigo ou base.</p>
                              </div>
                              
                              <label className={`w-full group/btn relative flex items-center justify-center gap-2 bg-white/20 text-white px-4 py-4 rounded-xl border border-white/30 font-bold text-xs uppercase tracking-widest hover:bg-white/30 active:scale-95 transition-all cursor-pointer ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}>
                                 {selectedFile ? (
                                    <span className="truncate max-w-[200px] text-[10px]">{selectedFile.name} (Trocar)</span>
                                 ) : (
                                    <>Selecionar Arquivo PDF</>
                                 )}
                                 <input type="file" accept=".pdf,application/pdf" className="hidden" disabled={isImporting} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                              </label>
                           </div>

                           {/* Text Column */}
                           <div className="bg-white/10 rounded-2xl p-4 border border-white/20 flex flex-col">
                              <div className="space-y-1 mb-3">
                                <h4 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2"><Type size={14}/> Dados Soltos (Opcional)</h4>
                                <p className="text-blue-100/70 text-[10px]">Cole informações soltas, links, ou notas que não estão no PDF.</p>
                              </div>
                              <textarea
                                rows={4}
                                value={rawText}
                                onChange={(e) => setRawText(e.target.value)}
                                placeholder="Pode colar informações soltas ou adicionais aqui..."
                                className="w-full bg-white/5 border border-white/10 hover:border-white/20 rounded-xl p-3 text-white placeholder-blue-100/40 text-[11px] focus:ring-2 focus:ring-white focus:outline-none resize-none font-medium leading-relaxed flex-1 transition-all"
                                disabled={isImporting}
                              />
                           </div>
                        </div>

                        <button
                          onClick={handleCombinedImport}
                          disabled={isImporting || (!rawText.trim() && !selectedFile)}
                          className={`w-full flex items-center justify-center gap-2 bg-white text-blue-700 hover:bg-blue-50 active:scale-95 transition-all text-sm font-black uppercase tracking-widest px-8 py-4 rounded-2xl shadow-xl shadow-black/10 mt-2 ${isImporting || (!rawText.trim() && !selectedFile) ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                          {isImporting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                              <span>{importProgress}</span>
                            </>
                          ) : (
                            <>
                              <Zap size={18} className="fill-blue-700/20" />
                              <span>FUNDIR E ORGANIZAR DADOS</span>
                            </>
                          )}
                        </button>
                    </div>
                  </div>

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
                       <h4 className="font-black uppercase text-[11px] tracking-widest text-white/90">Assistente de Conteúdo</h4>
                    </div>
                    <p className="text-xs text-white/70 font-medium leading-relaxed">Otimize seu tempo! Receba sugestões de alto impacto para preencher seu resumo e histórico profissional com base no cargo informado.</p>
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
                  {(resumeData.experience || []).map((ex, i) => (
                    <div key={ex.id || `exp-${i}`} className="p-5 bg-bg-main rounded-2xl border border-border-main space-y-5 relative group">
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
                  {(resumeData.education || []).map((ed, i) => (
                    <div key={ed.id || `edu-${i}`} className="p-5 bg-bg-main rounded-2xl border border-border-main space-y-5">
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
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary-blue">{resumeData.language === 'en' ? 'Skills' : 'Habilidades'}</h3>
                    <div className="flex gap-2">
                       <Input 
                         placeholder="Ex: Marketing Digital" 
                         value={tempSkill}
                         onChange={setTempSkill}
                       />
                       <Button onClick={() => {
                         if (!tempSkill.trim()) return;
                         addSkill(tempSkill);
                         setTempSkill("");
                       }}>Adicionar</Button>
                    </div>
                    
                    <div className="space-y-4">
                       {resumeData.skills && resumeData.skills.length > 0 && (
                         <div className="space-y-3">
                           <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider pl-1">Minhas Habilidades e Pontuação</label>
                           <div className="space-y-3">
                              {(resumeData.skills || []).map((s, idx) => {
                                const isHidden = s.level === 'Ocultar';
                                const currentDots = s.level === 'Especialista' ? 5 : s.level === 'Avançado' ? 4 : s.level === 'Intermédio' ? 3 : s.level === 'Básico' ? 2 : s.level === 'Iniciante' ? 1 : 0;

                                return (
                                  <div key={s.id || `sk-item-${idx}`} className="flex flex-col gap-3 bg-white p-4 rounded-2xl border border-border-main shadow-sm transition-all hover:shadow-md">
                                    <div className="flex items-center gap-3.5">
                                      <div className="flex-1">
                                        <input 
                                          type="text"
                                          placeholder="Nome da habilidade"
                                          value={s.name || ""} 
                                          onChange={(e) => {
                                            const updated = [...(resumeData.skills || [])];
                                            updated[idx] = { ...updated[idx], name: e.target.value };
                                            setResumeData(prev => ({ ...prev, skills: updated }));
                                          }}
                                          className="w-full text-xs font-bold text-gray-800 bg-transparent border-b border-dashed border-gray-200 focus:border-primary-blue focus:outline-none py-1"
                                        />
                                      </div>
                                      
                                      <button 
                                        type="button"
                                        onClick={() => setResumeData(p => ({...p, skills: (p.skills || []).filter(sk => sk.id !== s.id)}))}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors bg-gray-50 hover:bg-red-50/50"
                                        title="Remover Habilidade"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>

                                    <div className="flex items-center justify-between gap-4 pt-1 border-t border-gray-50">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] uppercase font-black tracking-wider text-gray-400">Nível (Pontos):</span>
                                        <div className="flex gap-1.5">
                                          {[1, 2, 3, 4, 5].map(dot => {
                                            const active = dot <= currentDots && !isHidden;
                                            return (
                                              <button
                                                key={dot}
                                                type="button"
                                                onClick={() => {
                                                  const newLevelString = dot === 5 ? 'Especialista' : dot === 4 ? 'Avançado' : dot === 3 ? 'Intermédio' : dot === 2 ? 'Básico' : 'Iniciante';
                                                  const updated = [...(resumeData.skills || [])];
                                                  updated[idx] = { ...updated[idx], level: newLevelString };
                                                  setResumeData(prev => ({ ...prev, skills: updated }));
                                                }}
                                                className={`w-4 h-4 rounded-full transition-transform active:scale-125 ${active ? 'bg-primary-blue shadow-sm' : 'bg-gray-100 hover:bg-gray-200'}`}
                                                style={active ? { backgroundColor: resumeData.themeColor || '#1B2A4A' } : {}}
                                                title={`Definir como nível ${dot}`}
                                                disabled={isHidden}
                                              />
                                            );
                                          })}
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = [...(resumeData.skills || [])];
                                          if (isHidden) {
                                            updated[idx] = { ...updated[idx], level: 'Intermédio' };
                                          } else {
                                            updated[idx] = { ...updated[idx], level: 'Ocultar' };
                                          }
                                          setResumeData(prev => ({ ...prev, skills: updated }));
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                                          isHidden 
                                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                        }`}
                                      >
                                        {isHidden ? 'Oculto (Mostrar)' : 'Ocultar Pontos'}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                           </div>
                         </div>
                       )}
                    </div>
                  </div>

                  <div className="space-y-6 pt-6 border-t border-border-main">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary-blue">{resumeData.language === 'en' ? 'Languages' : 'Idiomas'}</h3>
                    <div className="flex flex-col gap-3.5 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                      <div className="grid grid-cols-2 gap-3">
                         <Input 
                           placeholder="Ex: Inglês" 
                           value={tempLanguage}
                           onChange={setTempLanguage}
                           label="Idioma"
                         />
                         <Input 
                           placeholder="Ex: Fluente, Nativo..." 
                           value={tempLanguageLevel}
                           onChange={setTempLanguageLevel}
                           label="Nível"
                         />
                      </div>
                      <Button onClick={() => {
                        if (!tempLanguage.trim()) return;
                        addLanguage(tempLanguage, tempLanguageLevel || 'Fluente');
                        setTempLanguage("");
                        setTempLanguageLevel("Fluente");
                      }} className="w-full">Adicionar Idioma</Button>
                    </div>

                    {resumeData.languages && resumeData.languages.length > 0 && (
                      <div className="space-y-3">
                        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider pl-1">Idiomas de Trabalho e Níveis</label>
                        <div className="space-y-3">
                           {(resumeData.languages || []).map((l, idx) => (
                             <div key={l.id || `la-${idx}`} className="flex items-end gap-3.5 bg-white p-3.5 rounded-2xl border border-border-main shadow-sm">
                               <div className="flex-1">
                                 <Input 
                                   label="Idioma"
                                   placeholder="Idioma" 
                                   value={l.name || ""} 
                                   onChange={(newVal) => {
                                     const updated = [...(resumeData.languages || [])];
                                     updated[idx] = { ...updated[idx], name: newVal };
                                     setResumeData(prev => ({ ...prev, languages: updated }));
                                   }}
                                 />
                               </div>
                               <div className="w-[120px]">
                                 <Input 
                                   label="Nível"
                                   placeholder="Nível" 
                                   value={l.level || ""} 
                                   onChange={(newVal) => {
                                     const updated = [...(resumeData.languages || [])];
                                     updated[idx] = { ...updated[idx], level: newVal };
                                     setResumeData(prev => ({ ...prev, languages: updated }));
                                   }}
                                 />
                               </div>
                               <button 
                                 onClick={() => setResumeData(p => ({...p, languages: (p.languages || []).filter(lk => lk.id !== l.id)}))}
                                 className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 hover:text-red-600 bg-gray-50 hover:bg-red-50/50 mb-[1px]"
                                 title="Remover"
                               >
                                 <Trash2 size={16} />
                               </button>
                             </div>
                           ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6 pt-6 border-t border-border-main">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary-blue flex justify-between items-center">
                       Seções Personalizadas
                       <Button variant="secondary" onClick={() => {
                          setResumeData(prev => ({
                             ...prev,
                             customSections: [...(prev.customSections || []), {
                                id: Math.random().toString(36).substring(7),
                                title: 'Nova Seção',
                                items: [{
                                   id: Math.random().toString(36).substring(7),
                                   name: 'Item Título',
                                   description: ''
                                }]
                             }]
                          }));
                       }}><Plus size={14} className="mr-2" /> Adicionar Seção</Button>
                    </h3>
                    
                    {(resumeData.customSections || []).map((cs, sIdx) => (
                       <div key={cs.id || `cs-${sIdx}`} className="p-4 bg-white border border-border-main rounded-2xl space-y-4">
                          <div className="flex gap-3 items-end">
                             <div className="flex-1">
                               <Input 
                                 label="Título da Seção (Ex: Interesses, Cursos)" 
                                 value={cs.title} 
                                 onChange={(v) => {
                                    const updated = [...(resumeData.customSections || [])];
                                    updated[sIdx].title = v;
                                    setResumeData(p => ({...p, customSections: updated}));
                                 }} 
                               />
                             </div>
                             <button 
                               onClick={() => {
                                  const updated = [...(resumeData.customSections || [])];
                                  updated.splice(sIdx, 1);
                                  setResumeData(p => ({...p, customSections: updated}));
                               }}
                               className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 hover:text-red-600 bg-gray-50 hover:bg-red-50/50 mb-[1px]"
                             >
                               <Trash2 size={16} />
                             </button>
                          </div>
                          <div className="space-y-3 pl-4 border-l-2 border-gray-100">
                             {cs.items.map((item, iIdx) => (
                                <div key={item.id || `csi-${iIdx}`} className="flex gap-3 items-start">
                                   <div className="flex-1 space-y-3">
                                      <Input 
                                        placeholder="Título (Obrigatório)" 
                                        value={item.name} 
                                        onChange={(v) => {
                                           const updated = [...(resumeData.customSections || [])];
                                           updated[sIdx].items[iIdx].name = v;
                                           setResumeData(p => ({...p, customSections: updated}));
                                        }} 
                                      />
                                      <textarea 
                                        placeholder="Descrição (Opcional)" 
                                        className="w-full bg-gray-50/50 border border-border-main rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue transition-all font-medium text-sm text-text-primary resize-y min-h-[60px]"
                                        value={item.description || ''} 
                                        onChange={(e) => {
                                           const updated = [...(resumeData.customSections || [])];
                                           updated[sIdx].items[iIdx].description = e.target.value;
                                           setResumeData(p => ({...p, customSections: updated}));
                                        }} 
                                      />
                                   </div>
                                   <button 
                                     onClick={() => {
                                        const updated = [...(resumeData.customSections || [])];
                                        updated[sIdx].items.splice(iIdx, 1);
                                        setResumeData(p => ({...p, customSections: updated}));
                                     }}
                                     className="p-3 mt-1 text-red-400 hover:text-red-600 rounded-lg"
                                   >
                                     <X size={14} />
                                   </button>
                                </div>
                             ))}
                             <button 
                               className="text-xs font-bold text-primary-blue hover:underline py-1 flex items-center gap-1 opacity-80"
                               onClick={() => {
                                  const updated = [...(resumeData.customSections || [])];
                                  updated[sIdx].items.push({
                                     id: Math.random().toString(36).substring(7),
                                     name: '',
                                     description: ''
                                  });
                                  setResumeData(p => ({...p, customSections: updated}));
                               }}
                             >
                                <Plus size={12} /> Adicionar Item
                             </button>
                          </div>
                       </div>
                    ))}
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

                  <div className="p-6 bg-white border border-border-main rounded-3xl space-y-6">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-text-muted">Ajustes Avançados (Afeta alguns templates)</h4>
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <div className="flex justify-between text-[11px] font-bold text-gray-700 uppercase tracking-widest"><span>Espaçamento de Seções</span> <span>{resumeData.styleConfig?.sectionSpacing || 25}px</span></div>
                           <input type="range" min="10" max="40" step="1" value={resumeData.styleConfig?.sectionSpacing || 25} onChange={(e) => setResumeData(p => ({...p, styleConfig: {...(p.styleConfig||{}), sectionSpacing: Number(e.target.value)}}))} className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-blue" />
                        </div>
                        <div className="space-y-2">
                           <div className="flex justify-between text-[11px] font-bold text-gray-700 uppercase tracking-widest"><span>Espaçamento Interno</span> <span>{resumeData.styleConfig?.itemSpacing || 10}px</span></div>
                           <input type="range" min="4" max="24" step="1" value={resumeData.styleConfig?.itemSpacing || 10} onChange={(e) => setResumeData(p => ({...p, styleConfig: {...(p.styleConfig||{}), itemSpacing: Number(e.target.value)}}))} className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-blue" />
                        </div>
                        <div className="space-y-2">
                           <div className="flex justify-between text-[11px] font-bold text-gray-700 uppercase tracking-widest"><span>Margens da Folha</span> <span>{resumeData.styleConfig?.margins || 30}px</span></div>
                           <input type="range" min="10" max="60" step="1" value={resumeData.styleConfig?.margins || 30} onChange={(e) => setResumeData(p => ({...p, styleConfig: {...(p.styleConfig||{}), margins: Number(e.target.value)}}))} className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-blue" />
                        </div>
                        <div className="space-y-2">
                           <div className="flex justify-between text-[11px] font-bold text-gray-700 uppercase tracking-widest"><span>Espaçamento de Linha (Textos)</span> <span>{resumeData.styleConfig?.lineHeight || 1.4}</span></div>
                           <input type="range" min="1.0" max="2.5" step="0.05" value={resumeData.styleConfig?.lineHeight || 1.4} onChange={(e) => setResumeData(p => ({...p, styleConfig: {...(p.styleConfig||{}), lineHeight: Number(e.target.value)}}))} className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-blue" />
                        </div>
                        <div className="space-y-2">
                           <div className="flex justify-between text-[11px] font-bold text-gray-700 uppercase tracking-widest"><span>Tamanho do Nome</span> <span>{resumeData.styleConfig?.titleSize || 26}px</span></div>
                           <input type="range" min="16" max="48" step="1" value={resumeData.styleConfig?.titleSize || 26} onChange={(e) => setResumeData(p => ({...p, styleConfig: {...(p.styleConfig||{}), titleSize: Number(e.target.value)}}))} className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-blue" />
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                           <span className="text-[11px] font-bold text-gray-700 uppercase tracking-widest">Exibir Foto / Iniciais</span>
                           <label className="relative inline-flex items-center cursor-pointer">
                             <input type="checkbox" className="sr-only peer" checked={resumeData.styleConfig?.showPhoto ?? true} onChange={(e) => setResumeData(p => ({...p, styleConfig: {...(p.styleConfig||{}), showPhoto: e.target.checked}}))} />
                             <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-blue"></div>
                           </label>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                           <span className="text-[11px] font-bold text-gray-700 uppercase tracking-widest">Mostrar Linhas de Tempo (Pontos)</span>
                           <label className="relative inline-flex items-center cursor-pointer">
                             <input type="checkbox" className="sr-only peer" checked={resumeData.styleConfig?.showTimeline ?? true} onChange={(e) => setResumeData(p => ({...p, styleConfig: {...(p.styleConfig||{}), showTimeline: e.target.checked}}))} />
                             <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-blue"></div>
                           </label>
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
                      <h3 className="text-2xl font-black leading-tight">Documento Finalizado!</h3>
                      <p className="text-sm opacity-80 font-medium text-balance">O seu combo profissional (CV + Carta) está pronto para ser enviado.</p>
                      
                      <Button variant="outline" className="w-full text-white border-white hover:bg-white/10" onClick={() => { setIsCoverLetterMode(false); setShowPreviewModal(true); }} icon={ExternalLink}>Ver currículo</Button>
                      <Button className="w-full bg-white text-primary-blue hover:bg-white/90 h-12 text-sm font-black rounded-xl shadow-lg border-0" onClick={() => { setIsCoverLetterMode(false); setTimeout(handlePrint, 100); }} icon={Printer}>
                        Imprimir Currículo
                      </Button>

                      {/* Real CV Counting Switch Box */}
                      <div className="pt-2">
                        <label className="flex items-center gap-3.5 p-4 rounded-2xl bg-white/10 border border-white/15 cursor-pointer hover:bg-white/20 transition-all">
                          <input 
                            type="checkbox" 
                            checked={isCountedAsReal} 
                            onChange={(e) => handleToggleRealCVCount(e.target.checked)} 
                            className="w-5 h-5 accent-emerald-500 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer text-emerald-500 bg-white"
                          />
                          <div className="text-left">
                            <span className="block text-xs font-black text-white uppercase tracking-wider">Contabilizar CV Realizado</span>
                            <span className="block text-[10px] text-white/70 leading-normal">Marque para registar esta venda de {cvPrice.toLocaleString()} Kzs e atualizar o painel de faturamento em tempo real.</span>
                          </div>
                        </label>
                      </div>
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
                              <Button className="w-full bg-primary-blue text-white hover:bg-[#0052cc] h-12 text-sm font-black rounded-xl" onClick={() => { setIsCoverLetterMode(true); setTimeout(handlePrint, 100); }} icon={Printer}>
                                Imprimir Carta
                             </Button>
                             <Button className="w-full hidden" onClick={() => {}} disabled={isDownloading} icon={Download}>
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
                             <p className="text-xs text-text-muted font-medium leading-relaxed">Destaque sua candidatura! Gere uma carta estratégica e personalizada para a vaga dos seus sonhos.</p>
                             
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

      {/* Preview Section - Transformed to Modal explicitly on request/mobile, always visible and beautifully scaled on desktop/PC */}
      <main className={`flex-1 overflow-y-auto overflow-x-hidden w-full custom-scrollbar transition-all duration-300 print:flex print:bg-white print:p-0 print:m-0 print:overflow-visible flex-col items-center ${
        showPreviewModal 
          ? 'fixed inset-0 z-50 bg-bg-main/95 backdrop-blur-md pt-20 pb-8 px-2 flex' 
          : isDownloading 
            ? 'fixed top-0 left-0 z-[-50] flex opacity-100 pointer-events-none' 
            : 'hidden md:flex md:relative md:bg-[#EEF2F6] md:py-12 md:px-6 print:flex'
      }`}>
        
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
               <p className="font-black text-primary-blue text-[10px] tracking-[0.3em] uppercase animate-pulse">Sincronizando com o Sistema</p>
             </div>
          </div>
        )}

        {/* Top toolbar replacing the floating bottom bar */}
        <div className="w-full relative shrink-0 z-40 bg-white/90 backdrop-blur-md rounded-2xl px-4 py-3 flex flex-wrap items-center justify-center sm:justify-between gap-4 border border-gray-200/80 shadow-sm print:hidden mb-6 mt-2 max-w-[794px]">
          <div className="flex items-center gap-3">
             <button title="Diminuir Zoom" onClick={() => { setIsAutoFit(false); setPreviewScale(prev => Math.max(0.4, Number((prev - 0.05).toFixed(2)))); }} className="p-1.5 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors cursor-pointer text-gray-500 hover:text-gray-900"><Minus size={14} /></button>
             <span className="min-w-[48px] text-center font-mono text-gray-800 text-xs font-bold">{Math.round(previewScale * 100)}%</span>
             <button title="Aumentar Zoom" onClick={() => { setIsAutoFit(false); setPreviewScale(prev => Math.min(1.5, Number((prev + 0.05).toFixed(2)))); }} className="p-1.5 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors cursor-pointer text-gray-500 hover:text-gray-900"><Plus size={14} /></button>
          </div>
          
          <div className="h-5 w-px bg-gray-200 hidden sm:block"></div>

          <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-xl px-1.5 py-1">
            <button title="Diminuir Tamanho de Letra" onClick={() => setResumeData(prev => ({...prev, styleConfig: {...(prev.styleConfig || {fontSize:13}), fontSize: Math.max(8, Number(((prev.styleConfig?.fontSize || 13) - 0.5).toFixed(1)))} }))} className="p-1 hover:bg-slate-100 active:bg-slate-200 rounded-lg text-gray-500"><Minus size={11} /></button>
            <span className="min-w-[42px] text-center font-mono text-gray-800 text-[10px] tracking-wide flex items-center justify-center gap-1" title="Tamanho de Letra Atual">
              <Type size={10} className="text-gray-400" />
              <span>{(resumeData.styleConfig?.fontSize || 13).toFixed(1)}</span>
            </span>
            <button title="Aumentar Tamanho de Letra" onClick={() => setResumeData(prev => ({...prev, styleConfig: {...(prev.styleConfig || {fontSize:13}), fontSize: Math.min(22, Number(((prev.styleConfig?.fontSize || 13) + 0.5).toFixed(1)))} }))} className="p-1 hover:bg-slate-100 active:bg-slate-200 rounded-lg text-gray-500"><Plus size={11} /></button>
          </div>
          
          <div className="h-5 w-px bg-gray-200 hidden sm:block"></div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowAlignGuides(!showAlignGuides)}
              title={showAlignGuides ? "Desativar Modo de Alinhamento e Réguas" : "Ativar Modo de Alinhamento e Ajustes Finos"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${showAlignGuides ? 'bg-primary-blue text-white shadow-md shadow-primary-blue/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'}`}
            >
              <Grid size={14} className={showAlignGuides ? "text-white" : "text-gray-400"} />
              {showAlignGuides ? 'Modo de Medição: Ligado' : 'Ajustes de Layout'}
            </button>
            <button title="Descarga PDF" onClick={() => window.print()} className="p-2 bg-text-main text-white hover:bg-deep-blue rounded-xl shadow-lg transition-colors cursor-pointer"><Download size={14} /></button>
          </div>
        </div>

        {/* Page Limit Warning / Auto Align Trigger */}
        {!isCoverLetterMode && resumeHeight > 1125 && (
          <div className="w-full max-w-[794px] mb-6 bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in shadow-sm print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertCircle size={20} className="text-amber-600" />
              </div>
              <div className="text-left font-sans">
                <h4 className="text-xs font-black text-amber-900 uppercase tracking-wide">O conteúdo ultrapassa 1 página A4</h4>
                <p className="text-[11px] text-amber-700/80 font-bold leading-normal mt-0.5 animate-pulse">O currículo está longo demais e pode sofrer quebra de página imprópria na impressão.</p>
              </div>
            </div>
            <button 
              onClick={handleAutoAlign}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-600/10 transition-all cursor-pointer whitespace-nowrap font-sans"
            >
              <Zap size={14} className="animate-bounce text-amber-100" />
              Reorganizar Layout
            </button>
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
          className="flex justify-center w-full print:h-[1122px]"
          style={{ height: `${resumeHeight * previewScale}px` }}
        >
          <div 
            className="origin-top transition-all duration-700 print:shadow-none print:w-full shadow-[0_60px_120px_-20px_rgba(0,0,0,0.2)]"
            style={{ 
              transform: `scale(${previewScale})`,
              width: '794px',
              height: `${resumeHeight}px`,
              flexShrink: 0
            }}
          >
             <AnimatePresence mode="wait">
               {isCoverLetterMode ? (
                 <motion.div 
                   key="letter"
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="relative"
                 >
                    <button data-html2canvas-ignore="true" onClick={() => setIsCoverLetterMode(false)} className="absolute top-8 left-8 text-[10px] font-black uppercase text-primary-blue tracking-widest flex items-center gap-2 print:hidden z-10 group bg-soft-blue px-4 py-2 rounded-full hover:bg-primary-blue hover:text-white transition-all">
                       <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Voltar ao Editor
                    </button>
                    <CoverLetterRenderer content={generatedLetter} personalInfo={resumeData.personalInfo} themeColor={resumeData.themeColor} language={resumeData.language} onChangeContent={setGeneratedLetter} />
                 </motion.div>
               ) : (
                 <ResumeRenderer data={resumeData} templateId={template} showGuides={showAlignGuides} onChange={setResumeData} />
               )}
             </AnimatePresence>
          </div>
        </div>
      </main>

      {/* WhatsApp Support Floating Button - Only on Landing Page */}
      {((view as any) === 'landing' || (view as any) === '') && (
        <motion.a
          href="https://wa.me/+244954748806"
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

      {tempDownloadData && createPortal(
        <div 
          id="temp-download-container" 
          style={{ 
            position: 'fixed', 
            top: '0px', 
            left: '0px', 
            width: '794px', 
            height: 'auto', 
            minHeight: '1122px',
            overflow: 'visible',
            zIndex: 99999, // Render inside viewport with high z-index under the loading overlay
            pointerEvents: 'none',
            backgroundColor: '#ffffff'
          }}
        >
          {tempDownloadData.type === 'resume' ? (
            <ResumeRenderer 
              data={tempDownloadData.data} 
              templateId={tempDownloadData.templateId} 
            />
          ) : (
            <CoverLetterRenderer 
              content={tempDownloadData.data.content || tempDownloadData.data} 
              personalInfo={tempDownloadData.data.personalInfo} 
              themeColor={tempDownloadData.data.themeColor} 
              language={tempDownloadData.data.language}
            />
          )}
        </div>,
        document.body
      )}

      {isDownloading && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center z-[100000] text-white select-none">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-6"></div>
          <p className="text-xl font-black uppercase tracking-[0.2em] text-white">Preparando Alta Definição</p>
          <p className="text-xs text-slate-400 mt-2 font-bold tracking-wide uppercase">Organizando auto-escala e compilando página única perfeita...</p>
        </div>
      )}
    </div>
  );
}
