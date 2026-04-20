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
  Facebook,
  Instagram,
  Shield
} from 'lucide-react';
import { AdSenseUnit } from './components/AdSenseUnit';
import { ResumeData, INITIAL_RESUME_DATA, TemplateType } from './types.ts';
import { optimizeResumeText, generateCoverLetter, generateFullResume } from './services/geminiService.ts';
import html2pdf from 'html2pdf.js';
import { auth, db, useAuth, loginWithGoogle, logOut } from './lib/firebase';
import { collection, addDoc, onSnapshot, doc, query, where, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';

// --- UI Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, icon: Icon }: any) => {
  const base = "px-6 py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm";
  const variants: any = {
    primary: "bg-primary-blue text-white shadow-sm hover:bg-primary-blue/90 border border-transparent shadow-primary-blue/10 h-11",
    secondary: "bg-white text-text-main border border-border-main shadow-sm hover:bg-gray-50 h-11",
    outline: "border border-primary-blue text-primary-blue hover:bg-soft-blue h-11",
    ghost: "text-text-muted hover:text-text-main hover:bg-bg-main h-11",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 h-11 border border-red-100",
    none: ""
  };

  return (
    <button onClick={onClick} className={`${base} ${variants[variant] || ''} ${className}`} disabled={disabled}>
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
};

const Input = ({ label, value, onChange, placeholder, type = 'text', icon: Icon, disabled = false, ...props }: any) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-[11px] font-semibold text-gray-700 pl-1">{label}</label>}
    <div className="relative group">
      {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-primary-blue" size={16} />}
      <input
        {...props}
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full bg-white border border-gray-200 rounded-lg px-4 h-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue transition-all shadow-sm ${Icon ? 'pl-10' : ''} ${disabled ? 'opacity-50 bg-gray-50' : ''}`}
      />
    </div>
  </div>
);

const TextArea = ({ label, value, onChange, placeholder, onOptimize, isOptimizing }: any) => (
  <div className="flex flex-col gap-1.5 w-full relative">
    <div className="flex justify-between items-center px-1">
      {label && <label className="text-[11px] font-semibold text-gray-700">{label}</label>}
      {onOptimize && (
        <button 
          onClick={onOptimize}
          disabled={isOptimizing}
          className={`text-[10px] font-bold text-primary-blue flex items-center gap-1.5 transition-all bg-soft-blue px-2.5 py-1 rounded-md border border-primary-blue/10 ${isOptimizing ? 'opacity-80 scale-95 cursor-wait' : 'hover:opacity-80 hover:bg-primary-blue/10'}`}
        >
          {isOptimizing ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
              <Plus size={10} />
            </motion.div>
          ) : (
            <Plus size={10} />
          )}
          {isOptimizing ? 'OTIMIZANDO...' : 'MELHORAR TEXTO'}
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
        className={`w-full bg-white border border-gray-200 rounded-lg p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue transition-all resize-y shadow-sm min-h-[140px] ${isOptimizing ? 'opacity-50' : ''}`}
      />
      {isOptimizing && (
        <div className="absolute inset-0 bg-white/40 flex items-center justify-center rounded-lg backdrop-blur-[1px] animate-pulse">
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
  t3_modern: { name: 'Corporate Clean', layout: 'custom-t3', colors: { primary: '#2D3748', text: '#4A5568', heading: '#1A202C', soft: '#F7FAFC', lines: '#E2E8F0', dark: '#1A202C' } },
  t4_barnabas: { name: 'Sidebar Limpa', layout: 'custom-t4', colors: { primary: '#2D313A', text: '#3E4249', heading: '#333333', soft: '#2D313A', lines: '#E5E7EB' } },
  t5_jonathan: { name: 'Escritor Arches', layout: 'custom-t5', colors: { primary: '#4A4C53', text: '#555555', heading: '#222222', soft: '#F3F4F6', lines: '#D1D5DB' } }
};

// --- Helpers ---
const renderText = (str: string) => str ? str.replace(/\*/g, '') : '';

const ProfilePage = ({ user, isAdmin, setView, onLogout }: { user: any, isAdmin: boolean, setView: (v: any) => void, onLogout: () => void }) => {
    if (!user || user.email === 'anonymous') return (
        <div className="p-20 text-center space-y-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={40} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-black text-deep-blue">Acesso Restrito</h2>
            <p className="text-text-muted">Você está navegando como convidado. Entre com sua conta Google para salvar seus currículos.</p>
            <Button onClick={loginWithGoogle} className="px-8 shadow-xl">Entrar com Google</Button>
        </div>
    );

    return (
        <div className="max-w-xl mx-auto py-10 px-6 space-y-8">
            <div className="bg-white p-8 rounded-[32px] shadow-2xl border border-border-main text-center space-y-6">
                <div className="relative inline-block">
                    <img 
                        src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || 'U')}&background=0D8ABC&color=fff`} 
                        className="w-24 h-24 rounded-full border-4 border-white shadow-xl mx-auto" 
                        alt="Avatar"
                        referrerPolicy="no-referrer"
                    />
                    {isAdmin && (
                        <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg uppercase tracking-widest border-2 border-white">
                            Admin
                        </div>
                    )}
                </div>
                
                <div>
                    <h2 className="text-2xl font-black text-deep-blue">{user.displayName || 'Usuário'}</h2>
                    <p className="text-sm font-medium text-text-muted">{user.email}</p>
                </div>

                <div className="pt-4 space-y-3">
                    {isAdmin && (
                        <Button 
                            onClick={() => setView('admin')} 
                            className="w-full h-14 bg-red-500 hover:bg-red-600 border-transparent text-white shadow-xl flex items-center justify-center gap-2 font-black uppercase text-xs tracking-widest"
                        >
                            <Shield size={18} /> Aceder ao Painel Administrativo
                        </Button>
                    )}
                    
                    <Button 
                        variant="outline" 
                        onClick={() => setView('my-resumes')} 
                        className="w-full h-14 border-border-main text-deep-blue hover:bg-bg-main flex items-center justify-center gap-2 font-black uppercase text-xs tracking-widest"
                    >
                        <FileText size={18} /> Meus Currículos e Pedidos
                    </Button>

                    <button 
                        onClick={onLogout}
                        className="w-full py-4 text-xs font-black text-red-500 uppercase tracking-widest hover:bg-red-50 rounded-2xl transition-colors mt-6"
                    >
                        Sair da Conta
                    </button>
                </div>
            </div>
        </div>
    );
};

const CoverLetterRenderer = ({ content, personalInfo, themeColor }: { content: string; personalInfo: any; themeColor?: string }) => {
  const c = { primary: themeColor || '#1B2A4A' };
  const info = personalInfo || {};
  
  return (
    <div 
      id="cover-letter-content"
      className="bg-white h-[1122px] w-[794px] p-20 relative flex flex-col font-sans text-left shadow-2xl overflow-hidden"
    >
       {/* Minimalist Professional Header */}
       <div className="flex justify-between items-start border-b-2 pb-8 mb-10 mt-4" style={{ borderColor: `${c.primary}30` }}>
         <div className="space-y-1.5 max-w-[60%]">
           <h1 className="text-[32px] font-black tracking-tight leading-none" style={{ color: c.primary }}>
             {info.fullName || 'Seu Nome'}
           </h1>
           <p className="text-gray-500 font-bold tracking-[0.1em] text-[11px] uppercase">
             {info.title || 'Seu Cargo'}
           </p>
         </div>
         <div className="text-right space-y-2 text-gray-500 font-medium text-[11px] bg-gray-50/50 p-4 rounded-xl border border-gray-100">
           {info.email && <div className="flex items-center justify-end gap-2 text-gray-700"><span>{info.email}</span><Mail size={12} className="opacity-60"/></div>}
           {info.phone && <div className="flex items-center justify-end gap-2 text-gray-700"><span>{info.phone}</span><Phone size={12} className="opacity-60"/></div>}
           {info.location && <div className="flex items-center justify-end gap-2 text-gray-700"><span>{info.location}</span><MapPin size={12} className="opacity-60"/></div>}
         </div>
       </div>

       <div className="flex justify-between items-end mb-12 text-[12px] uppercase tracking-widest font-bold text-gray-400">
         <span>Ref: Candidatura Espontânea</span>
         <span>Luanda, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
       </div>
       
       <div className="flex-1 text-justify whitespace-pre-line text-[14px] leading-[2.1] text-gray-700 font-medium px-4">
          {content ? content.replace(/\*/g, '') : ''}
       </div>

       <div className="mt-20 pt-10 flex flex-col justify-end items-end pr-4">
          <div className="text-right">
             <p className="text-[11px] text-gray-400 uppercase tracking-widest mb-4">Atentamente,</p>
             <p className="text-[18px] font-black italic tracking-tighter" style={{ color: c.primary }}>
                {info.fullName || 'Seu Nome'}
             </p>
          </div>
       </div>
    </div>
  );
};

const MyResumesPage = ({ user, setView }: { user: any, setView: (v: any) => void }) => {
    const [myOrders, setMyOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [printingOrder, setPrintingOrder] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState<string | null>(null);

    useEffect(() => {
        if (!user || user.email === 'anonymous') return;
        
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

    const downloadPDF = async (order: any) => {
        if (isGenerating) return;
        setIsGenerating(order.id);
        setPrintingOrder(order);
        
        // Short delay to ensure React renders the hidden component
        setTimeout(async () => {
             const element = document.getElementById('my-resumes-print-renderer');
             if (!element) {
                 setIsGenerating(null);
                 setPrintingOrder(null);
                 return;
             }
             
             const opt = {
                margin: 0,
                filename: `${order.documentType === 'resume' ? 'Curriculo' : 'Carta'}_CVLAB_${order.id}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2, 
                    useCORS: true, 
                    letterRendering: true, 
                    backgroundColor: '#ffffff',
                    scrollY: 0,
                    scrollX: 0
                },
                jsPDF: { unit: 'px', format: [794, 1122] as [number, number], orientation: 'portrait' as const, compress: true }
              };
              
              try {
                  await html2pdf().set(opt).from(element).save();
              } catch (err) {
                  console.error("Erro ao gerar PDF:", err);
                  alert("Erro ao baixar o documento. Por favor, tente novamente.");
              } finally {
                  setIsGenerating(null);
                  setPrintingOrder(null);
              }
        }, 1000);
    };

    if (loading) return <div className="p-20 text-center"><div className="animate-spin w-8 h-8 border-4 border-primary-blue border-t-transparent rounded-full mx-auto"></div></div>;

    return (
        <div className="max-w-4xl mx-auto py-10 px-6 space-y-8 relative">
            <header className="space-y-2">
                <h2 className="text-3xl font-black text-deep-blue text-center md:text-left">Meus Currículos</h2>
                <p className="text-sm text-text-muted text-center md:text-left">Acompanhe o estado dos seus pedidos de liberação e PDF.</p>
            </header>

            <div className="grid gap-4">
                {myOrders.map(order => (
                    <div key={order.id} className="bg-white p-6 rounded-3xl border border-border-main shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-primary-blue/30">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${order.status === 'approved' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}></span>
                                <span className="text-[10px] uppercase font-black tracking-widest text-text-muted">Pedido {order.id.slice(0, 8)}...</span>
                            </div>
                            <h3 className="font-black text-lg text-deep-blue">
                                {order.documentType === 'resume' ? 'Currículo Profissional' : 'Carta de Apresentação'}
                            </h3>
                            <p className="text-[11px] text-text-muted font-bold opacity-60">Solicitado em {new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] ${
                                order.status === 'approved' 
                                ? 'bg-green-50 text-green-600' 
                                : 'bg-amber-50 text-amber-600'
                            }`}>
                                {order.status === 'approved' ? 'Aprovado' : 'Pendente de Aprovação'}
                            </div>
                            
                            {order.status === 'approved' && (
                                <Button 
                                    size="sm" 
                                    onClick={() => downloadPDF(order)} 
                                    disabled={!!isGenerating}
                                    className="bg-primary-blue text-white hover:bg-deep-blue h-12 px-8 rounded-2xl shadow-xl shadow-primary-blue/20 w-full sm:w-auto"
                                >
                                   {isGenerating === order.id ? (
                                       <div className="flex items-center gap-2">
                                           <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                           <span>Baixando...</span>
                                       </div>
                                   ) : (
                                       <><Download size={16} className="mr-2" /> Baixar PDF</>
                                   )}
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
                
                {myOrders.length === 0 && (
                    <div className="bg-white p-20 rounded-[48px] border border-border-main text-center space-y-6 shadow-sm">
                        <div className="w-20 h-20 bg-soft-blue/20 rounded-3xl flex items-center justify-center mx-auto">
                            <FileText size={40} className="text-primary-blue/30" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-deep-blue">Nenhum currículo ainda</h3>
                            <p className="text-sm text-text-muted max-w-xs mx-auto">Sua jornada para o emprego ideal começa com um currículo impecável.</p>
                        </div>
                        <Button onClick={() => setView('editor')} className="px-10 h-14 rounded-2xl">Criar Meu Primeiro CV</Button>
                    </div>
                )}
            </div>

            {/* Hidden Renderer for PDF generation */}
            <AnimatePresence>
                {printingOrder && (
                    <div className="fixed top-0 left-0 z-[-500] opacity-0 pointer-events-none" style={{ width: '794px', height: '1122px' }}>
                        <div id="my-resumes-print-renderer">
                            {printingOrder.documentType === 'resume' ? (
                                <ResumeRenderer data={printingOrder.documentData} templateId={printingOrder.documentData.template || 't1_executive'} />
                            ) : (
                                <CoverLetterRenderer 
                                    content={printingOrder.documentData.content} 
                                    personalInfo={printingOrder.documentData.personalInfo} 
                                    themeColor={printingOrder.documentData.themeColor} 
                                />
                            )}
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const AdminPanel = () => {
    const { isAdmin } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({ users: 0, pending: 0, approved: 0 });
    const [page, setPage] = useState(1);
    const itemsPerPage = 8;
    
    useEffect(() => {
        if (!isAdmin) return;
        
        // Fetch all orders to keep stats and search accurate
        const q = query(collection(db, 'orders'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            let pendingCount = 0;
            let approvedCount = 0;
            const fetchedOrders = snapshot.docs.map(doc => {
                const data: any = {id: doc.id, ...doc.data()};
                if (data.status === 'pending') pendingCount++;
                if (data.status === 'approved') approvedCount++;
                return data;
            });
            
            setStats(s => ({ ...s, pending: pendingCount, approved: approvedCount }));
            setOrders(fetchedOrders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }, (error) => {
            console.error("Firestore listener error:", error);
            if (error.code === 'permission-denied') {
                alert("Acesso negado ao banco de dados. Verifique se sua conta tem permissões de administrador.");
            }
        });

        // Fast simple snapshot for user count
        const fetchUsers = async () => {
            const usersSnap = await getDocs(collection(db, 'users'));
            setStats(s => ({ ...s, users: usersSnap.size }));
        };
        fetchUsers();

        return unsubscribe;
    }, [isAdmin]);

    const approveOrder = async (order: any) => {
        if (!window.confirm("Liberar PDF para este pedido?")) return;
        try {
            const orderRef = doc(db, 'orders', order.id);
            await updateDoc(orderRef, { 
               status: 'approved',
               updatedAt: new Date().toISOString()
            });

            // Send notification email to the user
            await addDoc(collection(db, 'mail'), {
                to: [order.contactEmail],
                message: {
                    subject: `Seu documento está pronto para download! - CV LAB`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.6;">
                            <div style="background-color: #0D8ABC; padding: 30px; text-align: center; border-radius: 16px 16px 0 0;">
                                <h1 style="color: white; margin: 0; font-size: 24px;">CV LAB - Angola</h1>
                            </div>
                            <div style="padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px; background-color: #ffffff;">
                                <h2 style="color: #111827; margin-top: 0;">Olá! Ótimas notícias.</h2>
                                <p>O seu pedido de <b>${order.documentType === 'resume' ? 'Currículo Profissional' : 'Carta de Apresentação'}</b> foi analisado e aprovado com sucesso.</p>
                                <p>Você já pode baixar o seu documento em alta definição diretamente na sua central de currículos.</p>
                                
                                <div style="margin: 40px 0; text-align: center;">
                                    <a href="https://cvlab.app/my-resumes" style="background-color: #0D8ABC; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(13, 138, 188, 0.2);">Aceder aos Meus Currículos</a>
                                </div>
                                
                                <div style="background-color: #f9fafb; padding: 20px; border-radius: 12px; font-size: 14px;">
                                    <p style="margin: 0; color: #6b7280;"><b>ID do Pedido:</b> ${order.id}</p>
                                    <p style="margin: 5px 0 0 0; color: #6b7280;"><b>Email de Contacto:</b> ${order.contactEmail}</p>
                                </div>
                                
                                <p style="margin-top: 30px; font-size: 14px; color: #4b5563;">
                                    Agradecemos por escolher a CV LAB. Desejamos muito sucesso na sua jornada profissional!
                                </p>
                            </div>
                            <div style="padding: 20px; text-align: center; font-size: 12px; color: #9ca3af;">
                                <p>© 2026 CV LAB. Todos os direitos reservados.</p>
                                <p>Esta é uma notificação automática, por favor não responda.</p>
                            </div>
                        </div>
                    `
                }
            });

            alert("Pedido aprovado e notificação enviada com sucesso!");
        } catch (error: any) {
            console.error("Error approving order:", error);
            alert(`Erro ao aprovar pedido: ${error.message || 'Erro desconhecido'}`);
        }
    };

    if (!isAdmin) return <div className="p-20 text-center font-bold text-red-500">Acesso Restrito: Suas permissões são insuficientes para aceder o painel.</div>;

    const filteredOrders = orders.filter(o => 
        (searchQuery ? o.id.toLowerCase().includes(searchQuery.toLowerCase()) || (o.contactEmail && o.contactEmail.toLowerCase().includes(searchQuery.toLowerCase())) : true)
    );

    // Filter by pending only if not searching
    const displayOrders = searchQuery ? filteredOrders : filteredOrders.filter(o => o.status === 'pending');
    
    // Pagination logic
    const totalPages = Math.ceil(displayOrders.length / itemsPerPage);
    const paginatedOrders = displayOrders.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    return (
        <div className="p-4 md:p-10 max-w-6xl mx-auto flex-1 w-full bg-bg-main min-h-screen space-y-8">
            <header>
                <h1 className="text-3xl font-black text-deep-blue">Painel Administrativo</h1>
                <p className="text-sm text-text-muted">Gestão de acessos, downloads e métricas da plataforma CV LAB.</p>
            </header>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-border-main flex flex-col items-center text-center">
                    <span className="text-[10px] uppercase tracking-widest text-text-muted font-black mb-1">Usuários</span>
                    <span className="text-4xl font-black text-primary-blue">{stats.users}</span>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-border-main flex flex-col items-center text-center">
                    <span className="text-[10px] uppercase tracking-widest text-text-muted font-black mb-1">Pendentes</span>
                    <span className="text-4xl font-black text-amber-500">{stats.pending}</span>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-border-main flex flex-col items-center text-center">
                    <span className="text-[10px] uppercase tracking-widest text-text-muted font-black mb-1">Aprovados</span>
                    <span className="text-4xl font-black text-green-600">{stats.approved}</span>
                </div>
            </div>

            <div className="bg-white rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-deep-blue">Pedidos de Liberação</h2>
                        <p className="text-xs text-text-muted">{displayOrders.length} registros encontrados</p>
                    </div>
                    <div className="relative w-full md:w-80">
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={e => {setSearchQuery(e.target.value); setPage(1);}}
                            placeholder="Pesquisar por Email ou ID..." 
                            className="w-full pl-4 pr-10 py-3 text-sm border border-gray-100 bg-bg-main rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-blue/5 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-bg-main/50 text-[10px] font-black uppercase tracking-widest text-text-muted">
                            <tr>
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4">ID Pedido</th>
                                <th className="px-6 py-4">Email Contacto</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {paginatedOrders.map(o => (
                                <tr key={o.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-deep-blue">{new Date(o.createdAt).toLocaleDateString()}</span>
                                            <span className="text-[10px] text-gray-400">{new Date(o.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="font-mono text-[11px] bg-gray-100 px-2 py-1 rounded-md text-gray-600 group-hover:bg-gray-200 transition-colors">{o.id}</span>
                                    </td>
                                    <td className="px-6 py-5 font-medium">{o.contactEmail}</td>
                                    <td className="px-6 py-5 text-center">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                                            o.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
                                        }`}>
                                            {o.status === 'pending' ? 'Pendente' : 'Aprovado'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        {o.status === 'pending' ? (
                                            <Button 
                                                onClick={() => approveOrder(o)}
                                                className="bg-green-600 hover:bg-green-700 text-white h-9 px-4 text-[10px] uppercase font-black tracking-widest rounded-xl transition-all hover:scale-105 shadow-md shadow-green-600/10"
                                            >
                                                Liberar PDF
                                            </Button>
                                        ) : (
                                            <span className="text-green-600 inline-flex items-center gap-1 font-bold text-xs"><CheckCircle size={14}/> Pronto</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {displayOrders.length === 0 && (
                    <div className="p-20 text-center text-text-muted font-medium italic">
                        Nenhum pedido pendente encontrado.
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="p-6 border-t border-gray-50 flex items-center justify-center gap-2">
                        <button 
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="p-2 border border-gray-100 rounded-xl disabled:opacity-30 hover:bg-bg-main"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs font-black px-4">Página {page} de {totalPages}</span>
                        <button 
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="p-2 border border-gray-100 rounded-xl disabled:opacity-30 hover:bg-bg-main"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ResumeRenderer = ({ data, templateId }: { data: ResumeData; templateId: TemplateType }) => {
  const theme = TEMPLATES[templateId] || TEMPLATES.t1_executive;
  const c = { ...theme.colors, primary: data.themeColor || theme.colors.primary };

  return (
    <div className={`bg-white h-[1122px] w-[794px] relative overflow-hidden print:shadow-none`} id="resume-content" style={{ color: '#1f2937' }}>
      
      {/* Dynamic Layout Styles */}
      {theme.layout === 'custom-t1' && (
        <div className="t1" style={{ '--primary': c.primary } as any}>
          <div className="t1-left">
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
            {/* T1 Sidebar sections with improved alignment */}
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '32px' }}>
              <div style={{ marginBottom: '32px' }}>
                <div className="t1-section-title">Contacto</div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {data.personalInfo.email && <div className="t1-contact-item"><span className="t1-contact-icon"><Mail style={{ width: '12px', height: '12px' }} /></span><span className="t1-contact-text">{data.personalInfo.email}</span></div>}
                  {data.personalInfo.phone && <div className="t1-contact-item"><span className="t1-contact-icon"><Phone style={{ width: '12px', height: '12px' }} /></span><span className="t1-contact-text">{data.personalInfo.phone}</span></div>}
                  {data.personalInfo.location && <div className="t1-contact-item"><span className="t1-contact-icon"><MapPin style={{ width: '12px', height: '12px' }} /></span><span className="t1-contact-text">{data.personalInfo.location}</span></div>}
                </div>
              </div>
              
              {data.education.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <div className="t1-section-title">Formação</div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {data.education.map((e, idx) => (
                      <div key={e.id} className="t1-edu-item" style={{ marginBottom: idx === data.education.length - 1 ? 0 : '18px' }}>
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
                  <div className="t1-section-title">Habilidades</div>
                  <div>
                    {data.skills.map(s => (
                       <span key={s.id} className="t1-skill-tag">{s.name}</span>
                    ))}
                  </div>
                </div>
              )}

              {data.languages && data.languages.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <div className="t1-section-title">Idiomas</div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {data.languages.map((l, idx) => (
                       <div key={l.id} className="flex justify-between items-center text-[12px] opacity-90" style={{ marginBottom: idx === data.languages.length - 1 ? 0 : '12px' }}>
                         <span className="font-bold">{l.name}</span>
                         <span className="opacity-60 italic text-[10px] uppercase font-black tracking-widest">{l.level}</span>
                       </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="t1-right">
             <div className="t1-name mb-1">{data.personalInfo.fullName || "Seu Nome"}</div>
             <div className="t1-title mb-4">{data.personalInfo.title || "Cargo Desejado"}</div>
             <div className="t1-divider"></div>
             {data.personalInfo.summary && <div className="t1-bio leading-relaxed">{renderText(data.personalInfo.summary)}</div>}

             {data.experience.length > 0 && (
                <div className="t1-right-section">
                  <div className="t1-right-title">Experiência Profissional</div>
                  <div className="flex flex-col gap-6">
                    {data.experience.map(ex => (
                      <div key={ex.id} className="t1-exp-item">
                        <div className="flex flex-col items-center pt-1.5 flex-shrink-0">
                          <div className="t1-exp-dot"></div>
                          <div className="flex-1 w-0.5 bg-gray-100 my-1"></div>
                        </div>
                        <div className="t1-exp-body">
                           <div className="t1-exp-role font-bold">{ex.position} | <span style={{color: '#4b5563', fontSize: '13px', fontWeight: '500'}}>{ex.company}</span></div>
                           <div className="t1-exp-period text-gray-400 mt-0.5 uppercase tracking-tighter font-black text-[10px]">{ex.startDate} - {ex.current ? "Presente" : ex.endDate}</div>
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
                   <div className="flex flex-col gap-3">
                     {data.personalInfo.email && <div className="t2-contact-row"><span className="t2-contact-icon flex items-center justify-center flex-shrink-0"><Mail size={14}/></span> <span className="t2-contact-text">{data.personalInfo.email}</span></div>}
                     {data.personalInfo.phone && <div className="t2-contact-row"><span className="t2-contact-icon flex items-center justify-center flex-shrink-0"><Phone size={14}/></span> <span className="t2-contact-text">{data.personalInfo.phone}</span></div>}
                     {data.personalInfo.location && <div className="t2-contact-row"><span className="t2-contact-icon flex items-center justify-center flex-shrink-0"><MapPin size={14}/></span> <span className="t2-contact-text">{data.personalInfo.location}</span></div>}
                   </div>
                </div>
                
                {data.education.length > 0 && (
                  <div className="t2-section">
                     <div className="t2-section-title">Formação</div>
                     <div className="flex flex-col gap-4">
                       {data.education.map(e => (
                         <div key={e.id} className="t2-edu-item">
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
                     <div className="t2-section-title">Habilidades</div>
                     <div className="flex flex-wrap gap-2">
                       {data.skills.map(s => (
                         <div key={s.id} className="t2-skill-item px-3 py-1 bg-white border border-gray-100 rounded shadow-sm text-xs font-bold text-gray-700">
                           {s.name}
                         </div>
                       ))}
                     </div>
                  </div>
                )}
                
                {data.languages && data.languages.length > 0 && (
                  <div className="t2-section">
                     <div className="t2-section-title">Idiomas</div>
                     <div className="flex flex-col gap-2">
                       {data.languages.map(l => (
                         <div key={l.id} className="flex justify-between items-center text-[12px]">
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
                     <div className="t2-section-title">Experiência Profissional</div>
                     <div className="flex flex-col gap-8">
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
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {theme.layout === 'custom-t3' && (
        <div className="t3" style={{ '--primary': c.primary, '--primary-light': c.lines, '--heading': c.heading } as any}>
           <div className="t3-header">
              <div className="t3-name">{data.personalInfo.fullName || "Seu Nome"}</div>
              <div className="t3-title">{data.personalInfo.title || "Cargo Desejado"}</div>
              {data.personalInfo.summary && <div className="t3-bio">{renderText(data.personalInfo.summary)}</div>}
              
              <div className="t3-contact-row">
                {data.personalInfo.email && <div className="t3-contact-item"><Mail size={12} className="t3-contact-icon"/> {data.personalInfo.email}</div>}
                {data.personalInfo.phone && <div className="t3-contact-item"><Phone size={12} className="t3-contact-icon"/> {data.personalInfo.phone}</div>}
                {data.personalInfo.location && <div className="t3-contact-item"><MapPin size={12} className="t3-contact-icon"/> {data.personalInfo.location}</div>}
              </div>
           </div>
           
           <div className="t3-body">
              <div className="t3-left">                 
                 {data.education.length > 0 && (
                   <div>
                     <div className="t3-section-title">Formação Académica</div>
                     {data.education.map(e => (
                       <div key={e.id} className="t3-edu-item">
                          <div className="t3-edu-school">{e.institution}</div>
                          <div className="t3-edu-degree">{e.degree}</div>
                          <div className="t3-edu-year">{e.startDate} - {e.endDate}</div>
                       </div>
                     ))}
                   </div>
                 )}

                 {data.skills.length > 0 && (
                   <div>
                      <div className="t3-section-title">Habilidades</div>
                      <div>
                        {data.skills.map(s => (
                           <div key={s.id} className="t3-skill-item">
                              <span className="t3-skill-label">{s.name}</span>
                              <span className="t3-skill-level">{s.level}</span>
                           </div>
                        ))}
                      </div>
                   </div>
                 )}

                 {data.languages && data.languages.length > 0 && (
                   <div>
                      <div className="t3-section-title">Idiomas</div>
                      <div>
                        {data.languages.map(l => (
                           <div key={l.id} className="t3-skill-item">
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
                      <div className="t3-section-title">Experiência Profissional</div>
                      {data.experience.map(ex => (
                         <div key={ex.id} className="t3-exp-item">
                            <div className="t3-exp-header">
                               <div className="t3-exp-company">{ex.company}</div>
                               <div className="t3-exp-period">{ex.startDate} - {ex.current ? "Presente" : ex.endDate}</div>
                            </div>
                            <div className="t3-exp-role">{ex.position}</div>
                            <div className="t3-exp-desc">{renderText(ex.description)}</div>
                         </div>
                      ))}
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {theme.layout === 'custom-t4' && (
        <div className="flex w-full h-[1122px] bg-white text-left font-sans overflow-hidden relative border border-gray-100">
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
             )}
             <div className="p-10 flex flex-col gap-10 flex-1">
                <div>
                   <h1 className="text-[38px] font-black leading-[1.1] mb-2">{data.personalInfo.fullName.replace(' ', '\n')}</h1>
                   <p className="text-sm tracking-[0.2em] uppercase font-semibold text-white/70 mt-4">{data.personalInfo.title}</p>
                </div>
                <div>
                   <h3 className="text-xl font-bold mb-5 pb-2 text-white border-b-2 border-white/20 inline-block pr-6">Contacto</h3>
                     <div className="flex flex-col text-[13px] opacity-90">
                       {data.personalInfo.email && <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}><Mail style={{ width: '16px', height: '16px', marginRight: '12px', opacity: 0.7 }}/> {data.personalInfo.email}</div>}
                       {data.personalInfo.phone && <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}><Phone style={{ width: '16px', height: '16px', marginRight: '12px', opacity: 0.7 }}/> {data.personalInfo.phone}</div>}
                       {data.personalInfo.location && <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}><MapPin style={{ width: '16px', height: '16px', marginRight: '12px', opacity: 0.7 }}/> {data.personalInfo.location}</div>}
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
                       <div key={ex.id} className="flex gap-4">
                          <div className="flex flex-col items-center pt-2">
                             <div className="w-3 h-3 rounded-full border-2 border-gray-200"></div>
                             <div className="w-0.5 flex-1 bg-gray-50 my-1"></div>
                          </div>
                          <div className="flex-1">
                             <h4 className="text-[16px] font-bold mb-1" style={{ color: '#1f2937' }}>{ex.position}</h4>
                             <div className="flex justify-between items-center mb-4">
                                <span className="text-[13px] font-bold tracking-tight uppercase" style={{ color: '#4b5563' }}>{ex.company}</span>
                                <span className="text-[11px] font-black bg-gray-100 px-2 py-1 rounded" style={{ color: '#6b7280' }}>{ex.startDate} - {ex.current ? "Presente" : ex.endDate}</span>
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
        <div className="flex w-full h-[1122px] bg-[#FAFAFA] text-left font-sans overflow-hidden relative">
           <div className="w-[34%] flex flex-col relative z-20 pt-16" style={{ backgroundColor: c.soft || '#F3F4F6' }}>
             {/* Decorative header shape - simplified for PDF consistency */}
             <div className="absolute top-0 left-0 right-0 h-48 bg-white" style={{ borderRadius: '0 0 100px 100px', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}></div>
             
             <div className="relative z-30 w-full flex flex-col items-center px-10">
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
                
                <div className="w-full mb-10">
                  <div className="mb-6 border-b-2 pb-2" style={{ borderColor: `${c.primary}40` }}>
                     <h3 className="text-[12px] font-black uppercase tracking-[0.2em]" style={{ color: c.primary }}>Contacto</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', fontSize: '13px', width: '100%', fontWeight: '500', color: '#374151' }}>
                     {data.personalInfo.phone && <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}><Phone style={{ opacity: 0.7, width: '16px', height: '16px', marginRight: '12px', flexShrink: 0 }} color={c.primary}/> <span>{data.personalInfo.phone}</span></div>}
                     {data.personalInfo.email && <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}><Mail style={{ opacity: 0.7, width: '16px', height: '16px', marginRight: '12px', flexShrink: 0 }} color={c.primary}/> <span className="break-all">{data.personalInfo.email}</span></div>}
                     {data.personalInfo.location && <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}><MapPin style={{ opacity: 0.7, width: '16px', height: '16px', marginRight: '12px', flexShrink: 0 }} color={c.primary}/> <span>{data.personalInfo.location}</span></div>}
                  </div>
                </div>

                {data.skills.length > 0 && (
                  <div className="w-full mb-10">
                    <div className="mb-6 border-b-2 pb-2" style={{ borderColor: `${c.primary}40` }}>
                       <h3 className="text-[12px] font-black uppercase tracking-[0.2em]" style={{ color: c.primary }}>Habilidades</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                       {data.skills.map(s => (
                         <div key={s.id} className="font-semibold text-[13px] flex items-center gap-2" style={{ color: '#374151' }}>
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
                       <h3 className="text-[12px] font-black uppercase tracking-[0.2em]" style={{ color: c.primary }}>Formação</h3>
                    </div>
                    <div className="flex flex-col gap-6" style={{ color: '#374151' }}>
                       {data.education.map(e => (
                         <div key={e.id}>
                            <div className="font-black mb-1 text-[13px] leading-tight" style={{ color: c.primary }}>{e.institution}</div>
                            <div className="font-medium text-[13px]">{e.degree}</div>
                            <div className="text-[11px] font-bold opacity-60 mt-1 uppercase tracking-wider">{e.startDate} - {e.endDate}</div>
                         </div>
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
                   <h2 className="text-[18px] font-black uppercase tracking-[0.15em] mb-6 border-b pb-4" style={{ color: '#111827', borderColor: '#F3F4F6' }}>Experiência Profissional</h2>
                   <div className="flex flex-col gap-8">
                     {data.experience.map(ex => (
                       <div key={ex.id} className="flex gap-4">
                          <div className="flex flex-col items-center pt-2">
                             <div className="w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: c.primary }}></div>
                             <div className="w-0.5 flex-1 bg-gray-50 my-1"></div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-baseline mb-1">
                               <h4 className="text-[17px] font-black text-gray-900 tracking-tight">{ex.position}</h4>
                               <span className="text-[11px] font-bold px-3 py-1 bg-gray-100 rounded-lg text-gray-500">{ex.startDate} - {ex.current ? "Presente" : ex.endDate}</span>
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
           </div>
        </div>
      )}
    </div>
  );
};


// --- Main Application ---

export default function App() {
  const { user, isAdmin } = useAuth();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [contactEmail, setContactEmail] = useState('');

  const [view, setView] = useState<'landing' | 'editor' | 'faq' | 'about' | 'terms' | 'tips' | 'showcase' | 'admin' | 'profile' | 'my-resumes'>('landing');
  const [activeStep, setActiveStep] = useState(0);
  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    const saved = localStorage.getItem('cv_lab_data');
    return saved ? JSON.parse(saved) : INITIAL_RESUME_DATA;
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

  useEffect(() => {
    localStorage.setItem('cv_lab_letter', generatedLetter);
  }, [generatedLetter]);
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

  // Firebase Order Listener
  useEffect(() => {
    if (!currentOrderId) return;
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

  // Actual download function replacing old handleDownloadPdf
  const executeDownloadPdf = async () => {
    // Determine the element early so we know it exists
    const elementId = isCoverLetterMode ? 'cover-letter-content' : 'resume-content';
    const element = document.getElementById(elementId);
    if (!element) return;

    setIsDownloading(true);

    try {
      // Force scroll to top and wait for fonts
      window.scrollTo(0, 0);
      await document.fonts.ready;

      // We explicitly instruct html2canvas to capture exactly at 794x1122
      // No state previewScale change needed, eliminating race conditions.
      const opt = {
        margin:       0,
        filename:     isCoverLetterMode ? 'Carta_Apresentacao.pdf' : `${resumeData.personalInfo.fullName.replace(/\s+/g, '_')}_Curriculo.pdf`,
        image:        { type: 'jpeg' as const, quality: 1 },
        html2canvas:  { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
          scrollY: 0,
          scrollX: 0,
          width: 794,
          height: 1122,
          windowWidth: 794,
          windowHeight: 1122,
          logging: false,
          backgroundColor: '#FFFFFF',
          onclone: (clonedDoc: any) => {
            const clonedElement = clonedDoc.getElementById(elementId);
            if (clonedElement) {
               // Force exact dimensions and flatten visual layers
               clonedElement.style.transform = 'none';
               clonedElement.style.transition = 'none';
               clonedElement.style.width = '794px';
               clonedElement.style.height = '1122px';
               clonedElement.style.position = 'relative';
               clonedElement.style.overflow = 'hidden';
               
               const children = clonedElement.getElementsByTagName('*');
               for (let i = 0; i < children.length; i++) {
                 children[i].style.transition = 'none';
                 children[i].style.animation = 'none';
               }
            }
          }
        },
        // Using 'px' with exactly [794, 1122] ensures 1 single page without any spillover
        jsPDF: { unit: 'px', format: [794, 1122] as [number, number], orientation: 'portrait' as const, compress: true }
      };
      
      await html2pdf().set(opt).from(element).save();

    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadPdf = () => {
    setShowPaymentModal(true);
    setContactEmail(user?.email && user.email !== 'anonymous' ? user.email : '');
  };

  const createOrder = async () => {
    if (!user) {
        alert("Autenticação necessária. Se não deseja criar conta, o Administrador precisa ativar o login 'Anônimo' no Firebase Console. Por favor, tente clicar na Logo duas vezes para tentar logar via Google.");
        return;
    }
    if (!contactEmail) return;

    const orderData = {
        ownerId: user.uid,
        status: 'pending',
        documentType: isCoverLetterMode ? 'cover_letter' : 'resume',
        documentData: isCoverLetterMode ? { 
            content: generatedLetter,
            personalInfo: resumeData.personalInfo,
            themeColor: resumeData.themeColor
        } : resumeData,
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
                subject: `Novo Pedido de Currículo - ID: ${orderRef.id}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                        <h2 style="color: #0D8ABC;">Novo Pedido de Currículo / Carta</h2>
                        <p>Um novo pedido foi feito por <b>${orderData.contactEmail}</b>.</p>
                        <p><b>ID do Pedido:</b> ${orderRef.id}</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                        <h3 style="color: #555;">Dados do Documento Associado:</h3>
                        <pre style="background-color: #f4f4f4; padding: 15px; border-radius: 8px; font-size: 13px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word;">${JSON.stringify(orderData.documentData, null, 2)}</pre>
                        <br/>
                        <p>Acesse o <a href="https://cvlab.app/admin" style="color: #0D8ABC;">painel administrativo</a> (ou clique no botão no site) para verificar os comprovativos e aprovar o download.</p>
                    </div>
                `
            }
        });

        const waMessage = encodeURIComponent(`Olá CV LAB, fiz o pedido de emissão (ID: ${orderRef.id}) e aqui está o meu comprovativo de pagamento.`);
        window.open(`https://wa.me/244954748806?text=${waMessage}`, '_blank');
        
    } catch(e) {
        console.error(e);
        alert("Erro ao processar o pedido. Tente novamente.");
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
        <nav className="h-24 px-6 md:px-12 flex items-center justify-between glass sticky top-0 z-50">
          <div className="flex-1">
            <div className="cursor-pointer inline-block" onClick={() => setView('landing')}>
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
                <button onClick={loginWithGoogle} className="text-xs font-black text-primary-blue uppercase tracking-widest px-4 py-2 hover:bg-white/50 rounded-xl transition-all border border-primary-blue/10">Entrar</button>
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
                Crie um CV que <span className="text-primary-blue italic">abre portas.</span>
              </h1>
              <p className="text-xl text-text-muted leading-relaxed font-medium max-w-lg">
                A plataforma mais inteligente para profissionais que não aceitam o genérico.
                Gere currículos e cartas de apresentação com design premium e tecnologia de ponta.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button onClick={() => setView('editor')} className="px-10 h-16 text-lg uppercase tracking-tight shadow-2xl shadow-primary-blue/30">Criar CV Gratuitamente</Button>
                <Button variant="outline" onClick={() => setView('showcase')} className="px-10 h-16 text-lg uppercase tracking-tight border-border-main text-text-main hover:bg-bg-main">Ver Modelos</Button>
              </div>
              <div className="flex items-center gap-6 pt-4 border-t border-border-main mt-4">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <img key={i} src={`https://picsum.photos/seed/user${i}/100/100`} alt="User" className="w-10 h-10 rounded-full border-2 border-white ring-1 ring-border-main" referrerPolicy="no-referrer" />
                  ))}
                </div>
                <div className="text-xs font-bold text-text-muted">
                   <p className="text-deep-blue font-black tracking-tight">+15 mil usuários</p>
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
                    src="https://i.supaimg.com/6bc04951-8cbe-4706-9f0c-a01f9ea9a6c4/4406a25d-b692-476b-955d-409d5a851e46.jpg" 
                    alt="Resume Preview" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
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

        {/* Floating WhatsApp Button - Already handled at landing page logic level or consolidate here if needed */}
      </div>
    );
  }

  if (view === 'faq' || view === 'about' || view === 'terms' || view === 'tips' || view === 'showcase' || view === 'admin' || view === 'profile' || view === 'my-resumes') {
    return (
      <div className="min-h-screen hero-gradient flex flex-col">
        <nav className="h-24 px-6 md:px-12 flex items-center justify-between glass sticky top-0 z-50">
          <div className="flex-1">
            <button onClick={() => setView('landing')} className="flex items-center">
              <img 
                src="https://i.supaimg.com/6bc04951-8cbe-4706-9f0c-a01f9ea9a6c4/f7862e8c-46f6-4d82-a9e0-b9cb52c6fc4f.png" 
                alt="CV LAB" 
                className="h-10 md:h-12 w-auto object-contain"
                referrerPolicy="no-referrer" 
              />
            </button>
          </div>

          <div className="flex-[2] hidden lg:flex flex-col items-center gap-2">
            <Button 
              onClick={() => setView('editor')} 
              className="bg-primary-blue hover:bg-deep-blue text-white px-8 h-11 text-xs uppercase tracking-[0.2em] font-black shadow-lg shadow-primary-blue/20 transition-all hover:scale-105 active:scale-95"
            >
              Criar Novo Currículo
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
                <button onClick={loginWithGoogle} className="text-xs font-black text-primary-blue uppercase tracking-widest px-4 py-2 hover:bg-white/50 rounded-xl transition-all border border-primary-blue/10">Entrar</button>
              )}
          </div>
        </nav>
        
        <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-16">
          {(view !== 'admin' && view !== 'profile' && view !== 'my-resumes') && (
            <button onClick={() => setView('landing')} className="text-primary-blue text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
              <ChevronLeft size={16} /> Voltar
            </button>
          )}

          {view === 'my-resumes' && <MyResumesPage user={user} setView={setView} />}

          {view === 'profile' && <ProfilePage user={user} isAdmin={isAdmin} setView={setView} onLogout={logOut} />}

          {view === 'admin' && <AdminPanel />}

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
                    q: "Como o sistema melhora meu currículo?",
                    a: "Nosso mecanismo avançado analisa as suas experiências brutas e as reescreve utilizando verbos de ação e métricas de impacto. Ele ajusta o tom para ser mais executivo e garante que as palavras-chave certas para o seu setor estejam presentes, aumentando suas chances em sistemas de triagem automáticos (ATS)."
                  },
                  {
                    q: "O download do currículo é realmente gratuito?",
                    a: "Sim. A criação do currículo e a exportação para PDF são totalmente gratuitas. Nós acreditamos que a base da sua carreira não deve ter custos proibitivos. Oferecemos serviços premium opcionais, como a geração de cartas de apresentação personalizadas pelo sistema."
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
                    a: "Para gerar uma carta de apresentação premium, solicitamos um pagamento único de 1150 Kzs. Este valor cobre o processamento avançado do sistema para criar um texto altamente persuasivo e formatado especificamente para a vaga que você deseja."
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
    <div className="min-h-screen bg-bg-main flex flex-col md:flex-row justify-center md:h-screen md:overflow-hidden print:bg-white print:h-auto print:overflow-visible">
      
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
               
               <h2 className="text-2xl font-black text-deep-blue text-center mb-2 tracking-tight">Liberar PDF do Currículo</h2>
               <p className="text-sm text-text-muted text-center mb-6 font-medium">Após fazer o pedido, envie o comprovativo para o nosso suporte no WhatsApp para liberação imediata.</p>

               {orderStatus === 'pending' ? (
                 <div className="text-center space-y-6">
                    <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl">
                      <p className="text-yellow-700 font-bold text-sm mb-1">Aguardando Pagamento</p>
                      <p className="text-xs text-yellow-600">ID do Pedido: <span className="font-mono">{currentOrderId}</span></p>
                    </div>
                    
                    <p className="text-xs text-gray-500 font-medium">Se você ainda não enviou o comprovativo, envie para o nosso WhatsApp:</p>
                    
                    <Button onClick={() => window.open(`https://wa.me/244954748806?text=${encodeURIComponent(`Olá CV LAB, fiz o pedido de emissão (ID: ${currentOrderId}) e aqui está o meu comprovativo de pagamento.`)}`, '_blank')} className="w-full bg-[#25D366] hover:bg-[#128C7E] shadow-none h-12 text-white">
                      <MessageCircle size={18} /> Enviar Comprovativo
                    </Button>

                    <div className="flex items-center justify-center gap-2 mt-4 text-[10px] uppercase font-bold tracking-widest text-gray-400">
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}><Settings size={12} /></motion.div>
                      Aguardando Liberação do ADM...
                    </div>
                 </div>
               ) : (
                 <form onSubmit={(e) => { e.preventDefault(); createOrder(); }} className="space-y-4">
                    <Input 
                       label="Seu Email de Contacto" 
                       type="email" 
                       required 
                       value={contactEmail} 
                       onChange={setContactEmail} 
                       icon={Mail} 
                       placeholder="exemplo@email.com" 
                    />
                    
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mt-4 flex flex-col gap-3">
                       <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Dados para Pagamento</h3>
                       
                       <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                         <img src="https://i.supaimg.com/6bc04951-8cbe-4706-9f0c-a01f9ea9a6c4/1c1795b0-8faf-4c4d-a939-e439d7e7903e.png" alt="Multicaixa Express" className="h-8 w-12 object-contain" referrerPolicy="no-referrer" />
                         <div className="text-xs">
                            <p className="text-gray-500 font-medium leading-none mb-1">Multicaixa Express</p>
                            <p className="font-black text-gray-800 text-sm leading-none">954748806</p>
                         </div>
                       </div>

                       <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm text-xs">
                          <p className="text-gray-500 font-medium mb-1">Transferência Bancária</p>
                          <p className="font-mono text-gray-800 font-bold mb-0.5 text-[11px]">IBAN: 0040 0000 82177395101 67</p>
                          <p className="text-gray-600 font-medium text-[11px]">Jelson Monteiro Francisco</p>
                       </div>
                    </div>

                    <Button type="submit" className="w-full h-12 text-base shadow-xl shadow-primary-blue/20 mt-2">
                      Já Paguei, Enviar Comprovativo
                    </Button>
                 </form>
               )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
      <main className={`flex-1 overflow-y-auto overflow-x-hidden w-full custom-scrollbar transition-all duration-300 print:flex print:bg-white print:p-0 print:m-0 print:overflow-visible flex-col items-center ${showPreviewModal ? 'fixed inset-0 z-50 bg-bg-main/95 backdrop-blur-md pt-20 pb-8 px-2 flex' : isDownloading ? 'fixed top-0 left-0 z-[-50] flex opacity-100 pointer-events-none' : 'hidden print:flex'}`}>
        
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
          style={{ height: showPreviewModal ? `${1122 * previewScale}px` : 'auto' }}
        >
          <div 
            className={`origin-top transition-all duration-700 print:shadow-none print:w-full shadow-[0_60px_120px_-20px_rgba(0,0,0,0.2)]`}
            style={{ 
              transform: showPreviewModal ? `scale(${previewScale})` : 'none',
              width: '794px',
              height: '1122px',
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
                    <CoverLetterRenderer content={generatedLetter} personalInfo={resumeData.personalInfo} themeColor={resumeData.themeColor} />
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
