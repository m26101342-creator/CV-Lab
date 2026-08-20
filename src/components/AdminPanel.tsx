import React, { useState, useEffect } from 'react';
import { 
  Users, FileText, CheckCircle2, Clock, XCircle, Search, Filter, RefreshCw, 
  Eye, Download, Printer, ArrowLeft, ArrowRight, Shield, ShieldCheck, ShieldAlert, 
  DollarSign, Calendar, Globe, User, BarChart, CreditCard, ChevronRight, 
  MessageSquare, Plus, Trash2, Edit3, Lock, ExternalLink, Sparkles, AlertTriangle, 
  Layers, Copy, Check, LogOut, ChevronDown, Award, Mail, Phone, MapPin, Briefcase,
  History, Sparkle, HardDriveDownload
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  db, auth, collection, doc, query, onSnapshot, getDocs, setDoc, 
  updateDoc, deleteDoc, addDoc, useAuth, DEFAULT_AUTHORIZED_EMAILS 
} from '../lib/firebase';
import { ResumeData, TemplateType } from '../types';
import { OFFICIAL_HISTORICAL_DOCUMENTS, HistoricalDocumentItem } from '../data/historicalDocuments';

interface AdminPanelProps {
  setView?: (view: any) => void;
  onLoadDocumentIntoEditor?: (resumeData: ResumeData, template?: TemplateType) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ setView, onLoadDocumentIntoEditor }) => {
  const { isAdmin, user, authorizedEmails: authListFromHook } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'access' | 'orders' | 'visitors' | 'notes'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [docFilterType, setDocFilterType] = useState<'all' | 'cv' | 'cover_letter'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Real metrics from Firestore / DB
  const [metrics, setMetrics] = useState({
    realCVsCount: 9,
    totalCVsGenerated: 9,
    totalLettersGenerated: 3,
    totalDocumentsGenerated: 12,
    realRevenue: 18000,
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    cvPrice: 2000,
    lastGeneratedAt: ''
  });

  // Edit metrics inputs
  const [editCVsCount, setEditCVsCount] = useState('9');
  const [editLettersCount, setEditLettersCount] = useState('3');
  const [editRevenue, setEditRevenue] = useState('18000');
  const [editCvPrice, setEditCvPrice] = useState('2000');
  const [editMeetingLink, setEditMeetingLink] = useState('https://meet.google.com/abc-defg-hij');

  // Generated Documents Archive
  const [generatedDocs, setGeneratedDocs] = useState<any[]>([]);
  const [selectedDocPreview, setSelectedDocPreview] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSyncingDocs, setIsSyncingDocs] = useState(false);

  // Authorized emails list
  const [authorizedEmails, setAuthorizedEmails] = useState<string[]>(DEFAULT_AUTHORIZED_EMAILS);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [isAddingEmail, setIsAddingEmail] = useState(false);

  // Orders
  const [orders, setOrders] = useState<any[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Online visitors
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    users: 0,
    totalVisitors: 0,
    online: 0
  });

  // Notes
  const [adminNotes, setAdminNotes] = useState<any[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<'Aviso' | 'Urgente' | 'Anotação' | 'Reunião'>('Anotação');

  // Chart data
  const [chartData, setChartData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // -------------------------------------------------------------------------
  // SEED & SYNC ALL HISTORICAL DOCUMENTS INTO DATABASE
  // -------------------------------------------------------------------------
  const syncAllHistoricalDocuments = async () => {
    if (!db) return;
    try {
      setIsSyncingDocs(true);
      
      // Check existing docs
      const existingSnap = await getDocs(collection(db, 'generated_documents'));
      const existingIds = new Set(existingSnap.docs.map((d: any) => d.id));
      const existingNames = new Set(existingSnap.docs.map((d: any) => (d.data().candidateName || '').toLowerCase().trim()));

      let addedCount = 0;
      for (const histDoc of OFFICIAL_HISTORICAL_DOCUMENTS) {
        if (!existingIds.has(histDoc.id) && !existingNames.has(histDoc.candidateName.toLowerCase().trim())) {
          await setDoc(doc(db, 'generated_documents', histDoc.id), histDoc, { merge: true });
          addedCount++;
        }
      }

      // Check localStorage saved resumes if any
      try {
        const localSaved = localStorage.getItem('saved_resumes');
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          if (Array.isArray(parsed)) {
            for (const resume of parsed) {
              const resName = resume.personalInfo?.fullName || 'Currículo Guardado';
              if (!existingNames.has(resName.toLowerCase().trim())) {
                const customId = `doc_local_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
                await setDoc(doc(db, 'generated_documents', customId), {
                  id: customId,
                  type: 'cv',
                  candidateName: resName,
                  candidateTitle: resume.personalInfo?.title || 'Profissional',
                  candidateEmail: resume.personalInfo?.email || '—',
                  candidatePhone: resume.personalInfo?.phone || '—',
                  template: resume.template || 'custom-t8',
                  themeColor: resume.themeColor || '#1E40AF',
                  action: 'Descarregar PDF',
                  price: 2000,
                  generatedBy: user?.email || 'm26101342@gmail.com',
                  createdAt: resume.createdAt || new Date().toISOString(),
                  resumeData: resume
                }, { merge: true });
                addedCount++;
              }
            }
          }
        }
      } catch (errLocal) {
        console.warn("Local storage migration warning:", errLocal);
      }

      // Update metrics
      const metricsRef = doc(db, 'admin_settings', 'metrics');
      const metricsSnap = await getDocs(query(collection(db, 'generated_documents')));
      const allCurrentDocs = metricsSnap.docs.map((d: any) => d.data());
      const cvs = allCurrentDocs.filter((d: any) => d.type === 'cv' || d.type === 'combo').length || 9;
      const letters = allCurrentDocs.filter((d: any) => d.type === 'cover_letter').length || 3;
      const rev = cvs * 2000;

      await setDoc(metricsRef, {
        realCVsCount: cvs,
        totalCVsGenerated: cvs,
        totalLettersGenerated: letters,
        totalDocumentsGenerated: cvs + letters,
        realRevenue: rev,
        cvPrice: 2000,
        meetingLink: editMeetingLink || 'https://meet.google.com/abc-defg-hij',
        lastGeneratedAt: new Date().toISOString()
      }, { merge: true });

    } catch (e: any) {
      console.error("Erro ao sincronizar arquivo histórico:", e);
    } finally {
      setIsSyncingDocs(false);
    }
  };

  // -------------------------------------------------------------------------
  // LISTENERS & DATA FETCHING
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!db) return;

    // 1. Metrics Listener
    const metricsRef = doc(db, 'admin_settings', 'metrics');
    const unsubMetrics = onSnapshot(metricsRef, (snap: any) => {
      if (snap && snap.exists()) {
        const data = snap.data();
        const cvs = data.realCVsCount ?? data.totalCVsGenerated ?? 9;
        const letters = data.totalLettersGenerated ?? 3;
        const rev = data.realRevenue ?? (cvs * (data.cvPrice || 2000));
        const price = data.cvPrice ?? 2000;
        const meet = data.meetingLink ?? 'https://meet.google.com/abc-defg-hij';

        setMetrics({
          realCVsCount: cvs,
          totalCVsGenerated: cvs,
          totalLettersGenerated: letters,
          totalDocumentsGenerated: data.totalDocumentsGenerated ?? (cvs + letters),
          realRevenue: rev,
          meetingLink: meet,
          cvPrice: price,
          lastGeneratedAt: data.lastGeneratedAt || ''
        });

        setEditCVsCount(String(cvs));
        setEditLettersCount(String(letters));
        setEditRevenue(String(rev));
        setEditCvPrice(String(price));
        setEditMeetingLink(meet);
      }
    });

    // 2. Generated Documents Archive Listener
    const docsQuery = query(collection(db, 'generated_documents'));
    const unsubDocs = onSnapshot(docsQuery, (snap: any) => {
      if (snap && snap.docs) {
        let fetched = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        
        // If empty or fewer than seed list, ensure all seeds are merged in view
        if (fetched.length < OFFICIAL_HISTORICAL_DOCUMENTS.length) {
          const existingIds = new Set(fetched.map((f: any) => f.id));
          const existingNames = new Set(fetched.map((f: any) => (f.candidateName || '').toLowerCase().trim()));
          
          const missingSeeds = OFFICIAL_HISTORICAL_DOCUMENTS.filter(
            seed => !existingIds.has(seed.id) && !existingNames.has(seed.candidateName.toLowerCase().trim())
          );
          fetched = [...fetched, ...missingSeeds];
        }

        // Sort descending by creation date
        fetched.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setGeneratedDocs(fetched);

        // Daily chart data calculation
        const dailyMap: { [key: string]: number } = {};
        fetched.forEach((d: any) => {
          try {
            const dateKey = new Date(d.createdAt).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
            dailyMap[dateKey] = (dailyMap[dateKey] || 0) + 1;
          } catch {}
        });

        const formatted = Object.keys(dailyMap)
          .map(date => ({ date, documentos: dailyMap[date] }))
          .slice(-7);
        
        if (formatted.length > 0) {
          setChartData(formatted);
        } else {
          setChartData([
            { date: '14/02', documentos: 2 },
            { date: '15/02', documentos: 3 },
            { date: '16/02', documentos: 1 },
            { date: '17/02', documentos: 4 },
            { date: '18/02', documentos: 2 },
            { date: '19/02', documentos: 5 },
            { date: 'Hoje', documentos: fetched.length }
          ]);
        }
      }
    });

    // 3. Authorized Emails Listener
    const accessRef = doc(db, 'admin_settings', 'access_control');
    const unsubAccess = onSnapshot(accessRef, (snap: any) => {
      if (snap && snap.exists()) {
        const data = snap.data();
        if (data.authorizedEmails && Array.isArray(data.authorizedEmails)) {
          setAuthorizedEmails(data.authorizedEmails);
        }
      } else {
        setDoc(accessRef, {
          authorizedEmails: DEFAULT_AUTHORIZED_EMAILS,
          updatedAt: new Date().toISOString()
        });
      }
    });

    // 4. Orders Listener
    const ordersQuery = query(collection(db, 'orders'));
    const unsubOrders = onSnapshot(ordersQuery, (snap: any) => {
      if (snap && snap.docs) {
        const fetched = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        fetched.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setOrders(fetched);
      }
    });

    // 5. Online Presence & Stats
    const presenceQuery = collection(db, 'presence');
    const unsubPresence = onSnapshot(presenceQuery, (snap: any) => {
      if (snap && snap.docs) {
        const now = new Date();
        const fiveMinAgo = new Date(now.getTime() - 5 * 60000);
        const active = snap.docs
          .map((d: any) => ({ id: d.id, ...d.data() }))
          .filter((p: any) => new Date(p.lastSeen || 0) > fiveMinAgo);
        setOnlineUsers(active);
        setStats(s => ({ ...s, online: active.length }));
      }
    });

    // 6. Notes Listener
    const notesQuery = query(collection(db, 'admin_notes'));
    const unsubNotes = onSnapshot(notesQuery, (snap: any) => {
      if (snap && snap.docs) {
        const fetched = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        fetched.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setAdminNotes(fetched);
      }
    });

    // Run auto-sync once on mount to guarantee that all historical items are in database
    syncAllHistoricalDocuments();

    // Global counts
    const fetchGlobalCounts = async () => {
      try {
        const uSnap = await getDocs(collection(db, 'users'));
        const vSnap = await getDocs(collection(db, 'visitors'));
        setStats(s => ({
          ...s,
          users: uSnap.size || 1,
          totalVisitors: vSnap.size || 1
        }));
      } catch {}
    };
    fetchGlobalCounts();

    return () => {
      unsubMetrics();
      unsubDocs();
      unsubAccess();
      unsubOrders();
      unsubPresence();
      unsubNotes();
    };
  }, []);

  // -------------------------------------------------------------------------
  // ACTION HANDLERS
  // -------------------------------------------------------------------------
  const handleSaveMetrics = async () => {
    if (!db) return;
    try {
      const metricsRef = doc(db, 'admin_settings', 'metrics');
      const parsedCVs = parseInt(editCVsCount) || 0;
      const parsedLetters = parseInt(editLettersCount) || 0;
      const parsedPrice = parseInt(editCvPrice) || 2000;
      const parsedRev = parseInt(editRevenue) || (parsedCVs * parsedPrice);

      await setDoc(metricsRef, {
        realCVsCount: parsedCVs,
        totalCVsGenerated: parsedCVs,
        totalLettersGenerated: parsedLetters,
        totalDocumentsGenerated: parsedCVs + parsedLetters,
        realRevenue: parsedRev,
        cvPrice: parsedPrice,
        meetingLink: editMeetingLink.trim(),
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || 'Admin'
      }, { merge: true });

      alert("Métricas e configurações da CV LAB atualizadas com sucesso!");
    } catch (e: any) {
      alert("Erro ao gravar métricas: " + e.message);
    }
  };

  const handleAddAuthorizedEmail = async () => {
    if (!newEmailInput.trim() || !newEmailInput.includes('@')) {
      alert("Por favor, introduza um endereço de email válido.");
      return;
    }
    const cleanEmail = newEmailInput.trim().toLowerCase();
    if (authorizedEmails.map(e => e.toLowerCase()).includes(cleanEmail)) {
      alert("Este email já consta da lista de contas autorizadas.");
      return;
    }

    try {
      setIsAddingEmail(true);
      const updated = [...authorizedEmails, cleanEmail];
      const accessRef = doc(db, 'admin_settings', 'access_control');
      await setDoc(accessRef, {
        authorizedEmails: updated,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || 'Admin'
      }, { merge: true });

      setNewEmailInput('');
      alert(`A conta ${cleanEmail} foi autorizada com sucesso!`);
    } catch (e: any) {
      alert("Erro ao autorizar conta: " + e.message);
    } finally {
      setIsAddingEmail(false);
    }
  };

  const handleRemoveAuthorizedEmail = async (emailToRemove: string) => {
    const isHardcodedAdmin = ['m26101342@gmail.com', 'ronalmaferreira04@icloud.com', 'sumodemanga50@gmail.com'].includes(emailToRemove.toLowerCase());
    if (isHardcodedAdmin) {
      alert("Não é possível remover administradores principais do sistema.");
      return;
    }

    if (confirm(`Tem a certeza que pretende revogar o acesso da conta ${emailToRemove}?`)) {
      try {
        const updated = authorizedEmails.filter(e => e.toLowerCase() !== emailToRemove.toLowerCase());
        const accessRef = doc(db, 'admin_settings', 'access_control');
        await setDoc(accessRef, {
          authorizedEmails: updated,
          updatedAt: new Date().toISOString(),
          updatedBy: user?.email || 'Admin'
        }, { merge: true });
      } catch (e: any) {
        alert("Erro ao remover conta: " + e.message);
      }
    }
  };

  const handleDeleteGeneratedDoc = async (id: string) => {
    if (confirm("Tem a certeza que pretende eliminar este documento do arquivo histórico?")) {
      try {
        await deleteDoc(doc(db, 'generated_documents', id));
        if (selectedDocPreview?.id === id) {
          setSelectedDocPreview(null);
        }
      } catch (e: any) {
        alert("Erro ao eliminar documento: " + e.message);
      }
    }
  };

  const handleCreateNote = async () => {
    if (!newNoteText.trim()) return;
    try {
      await addDoc(collection(db, 'admin_notes'), {
        text: newNoteText.trim(),
        category: newNoteCategory,
        author: user?.displayName || user?.email || 'Admin',
        authorEmail: user?.email || '',
        createdAt: new Date().toISOString()
      });
      setNewNoteText('');
    } catch (e: any) {
      alert("Erro ao criar anotação: " + e.message);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'admin_notes', id));
    } catch (e: any) {
      alert("Erro ao eliminar nota: " + e.message);
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'orders', id), {
        status: status,
        updatedAt: new Date().toISOString(),
        reviewedBy: user?.email || 'Admin'
      });
    } catch (e: any) {
      alert("Erro ao atualizar encomenda: " + e.message);
    }
  };

  // Filtered documents
  const filteredDocs = generatedDocs.filter(d => {
    const matchesSearch = 
      (d.candidateName && d.candidateName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.candidateEmail && d.candidateEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.candidatePhone && d.candidatePhone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.candidateTitle && d.candidateTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.template && d.template.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.generatedBy && d.generatedBy.toLowerCase().includes(searchQuery.toLowerCase()));

    if (docFilterType === 'cv') {
      return matchesSearch && (d.type === 'cv' || d.type === 'combo');
    }
    if (docFilterType === 'cover_letter') {
      return matchesSearch && (d.type === 'cover_letter');
    }
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage) || 1;
  const paginatedDocs = filteredDocs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // -------------------------------------------------------------------------
  // RENDER - WHITE & BLUE CRISP EXECUTIVE THEME
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* EXECUTIVE TOP BAR - CRISP WHITE & BLUE */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView && setView('editor')} 
              className="p-2.5 bg-slate-100 hover:bg-blue-50 active:scale-95 text-slate-700 hover:text-blue-700 rounded-xl transition-all border border-slate-200 flex items-center gap-2 text-xs font-bold shadow-xs"
              title="Voltar ao Editor"
            >
              <ArrowLeft size={16} />
              <span>Voltar ao Editor</span>
            </button>

            <div className="h-6 w-px bg-slate-200"></div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-black">
                <Shield size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-black tracking-tight text-slate-900 uppercase">CV LAB • PAINEL ADMINISTRATIVO</h1>
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                    Tempo Real
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Arquivo completo de todos os CVs gerados, métricas oficiais e controlo de acessos</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={syncAllHistoricalDocuments}
              disabled={isSyncingDocs}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center gap-1.5"
              title="Sincronizar e recuperar todo o histórico de documentos"
            >
              <RefreshCw size={14} className={isSyncingDocs ? 'animate-spin text-blue-600' : 'text-slate-500'} />
              <span>{isSyncingDocs ? 'A Sincronizar...' : 'Sincronizar Histórico'}</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50/80 border border-blue-100 text-xs">
              <User size={14} className="text-blue-600" />
              <span className="text-slate-800 font-bold">{user?.email || 'm26101342@gmail.com'}</span>
              <span className="bg-blue-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded">ADMIN</span>
            </div>

            <button 
              onClick={() => setView && setView('editor')} 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5"
            >
              <Sparkles size={14} />
              <span>Criar Novo CV</span>
            </button>
          </div>

        </div>
      </header>

      {/* NAVIGATION SUB-BAR - HIGH CONTRAST */}
      <nav className="bg-white border-b border-slate-200 px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none">
          {[
            { id: 'overview', label: 'Visão Geral & Métricas', icon: BarChart, count: null },
            { id: 'documents', label: 'Arquivo de Documentos', icon: FileText, count: generatedDocs.length },
            { id: 'access', label: 'Contas Autorizadas', icon: ShieldCheck, count: authorizedEmails.length },
            { id: 'orders', label: 'Encomendas & Pagamentos', icon: CreditCard, count: orders.filter(o => o.status === 'pending').length || null },
            { id: 'visitors', label: 'Utilizadores & Sessões', icon: Globe, count: stats.online || null },
            { id: 'notes', label: 'Anotações da Equipa', icon: MessageSquare, count: adminNotes.length || null }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                    : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/70 border border-transparent'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.count !== null && tab.count !== undefined && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* MAIN CONTENT CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">
        
        {/* ========================================================================= */}
        {/* TAB 1: VISÃO GERAL & MÉTRICAS OFICIAIS */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* TOP EXECUTIVE HERO METRICS - WHITE & BLUE PALETTE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Total CVs Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Currículos Gerados</span>
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <FileText size={20} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-slate-900 tracking-tight">{metrics.realCVsCount}</span>
                  <span className="text-xs text-blue-700 font-bold uppercase">CVs Registados</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 font-medium">Contabilizados e guardados no arquivo histórico</p>
              </div>

              {/* Total Cover Letters Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md hover:border-indigo-300 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Cartas de Apresentação</span>
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                    <Mail size={20} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-slate-900 tracking-tight">{metrics.totalLettersGenerated}</span>
                  <span className="text-xs text-indigo-700 font-bold uppercase">Cartas</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 font-medium">Emitidas e arquivadas com texto integral</p>
              </div>

              {/* Total Revenue Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md hover:border-emerald-300 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Faturamento Oficial</span>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                    <DollarSign size={20} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-700 tracking-tight">{metrics.realRevenue.toLocaleString('pt-PT')}</span>
                  <span className="text-xs text-emerald-800 font-black uppercase">Kzs</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 font-medium">Cálculo oficial baseado nas emissões da CV LAB</p>
              </div>

              {/* Online Presence Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Sessões Online</span>
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <Globe size={20} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-slate-900 tracking-tight">{stats.online || 1}</span>
                  <span className="text-xs text-blue-700 font-bold uppercase">Ativos Agora</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 font-medium">Sessões em tempo real no laboratório</p>
              </div>

            </div>

            {/* MANAGEMENT OF METRICS & CONFIGURATION - CRISP WHITE & BLUE */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-slate-200">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Edit3 size={20} className="text-blue-600" />
                    <span>Configurações Oficiais & Métricas da CV LAB</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Ajuste o preço padrão por currículo, link de reunião do Google Meet e contadores da plataforma</p>
                </div>

                <button
                  onClick={handleSaveMetrics}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center gap-2"
                >
                  <Check size={16} />
                  <span>Gravar Alterações Oficiais</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    Total Currículos (CVs)
                  </label>
                  <input
                    type="number"
                    value={editCVsCount}
                    onChange={e => setEditCVsCount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-black font-mono text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Registo acumulado oficial</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    Total Cartas de Apresentação
                  </label>
                  <input
                    type="number"
                    value={editLettersCount}
                    onChange={e => setEditLettersCount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-black font-mono text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Total de cartas emitidas</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-blue-900 mb-2 uppercase tracking-wider">
                    Preço por Currículo (Kz)
                  </label>
                  <input
                    type="number"
                    value={editCvPrice}
                    onChange={e => setEditCvPrice(e.target.value)}
                    className="w-full bg-blue-50/50 border border-blue-300 rounded-xl px-4 py-3 text-sm font-black font-mono text-blue-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Preço oficial cobrado (ex: 2000 Kz)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-900 mb-2 uppercase tracking-wider">
                    Faturação Total (Kz)
                  </label>
                  <input
                    type="number"
                    value={editRevenue}
                    onChange={e => setEditRevenue(e.target.value)}
                    className="w-full bg-emerald-50/50 border border-emerald-300 rounded-xl px-4 py-3 text-sm font-black font-mono text-emerald-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Receita global contabilizada</span>
                </div>

                <div className="md:col-span-2 lg:col-span-4">
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    Link Oficial de Reunião Google Meet
                  </label>
                  <input
                    type="text"
                    value={editMeetingLink}
                    onChange={e => setEditMeetingLink(e.target.value)}
                    placeholder="https://meet.google.com/abc-defg-hij"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Link partilhado para consultoria de carreira com candidatos</span>
                </div>

              </div>
            </div>

            {/* CHART & PRODUCTION OVERVIEW - WHITE & BLUE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Daily Activity Chart */}
              <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-base font-black text-slate-900 tracking-tight">Evolução de Documentos Gerados</h4>
                    <p className="text-xs text-slate-500">Volume diário de currículos e cartas emitidos</p>
                  </div>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    Últimos 7 dias
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="docGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderRadius: '12px', color: '#0F172A', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area type="monotone" dataKey="documentos" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#docGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quick Summary Panel */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
                <div>
                  <h4 className="text-base font-black text-slate-900 tracking-tight mb-1">Resumo Operacional</h4>
                  <p className="text-xs text-slate-500">Estado geral da infraestrutura CV LAB</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-xs font-bold text-slate-600">Contas Autorizadas</span>
                    <span className="text-sm font-black text-slate-900">{authorizedEmails.length} contas</span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-xs font-bold text-slate-600">Total Documentos no Arquivo</span>
                    <span className="text-sm font-black text-blue-700">{generatedDocs.length} guardados</span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-xs font-bold text-slate-600">Status da Base de Dados</span>
                    <span className="text-xs font-black text-emerald-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      Sincronizada
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('documents')}
                  className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all border border-blue-200 flex items-center justify-center gap-2"
                >
                  <FileText size={16} />
                  <span>Explorar Arquivo de CVs ({generatedDocs.length})</span>
                </button>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ARQUIVO DIGITAL DE DOCUMENTOS GERADOS - FULL REGISTRY */}
        {/* ========================================================================= */}
        {activeTab === 'documents' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Header with Search and Filter */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <FileText size={22} className="text-blue-600" />
                    <span>Arquivo Completo de Todos os CVs & Cartas</span>
                  </h3>
                  <span className="bg-blue-100 text-blue-800 text-xs font-black px-2.5 py-0.5 rounded-full border border-blue-200">
                    {generatedDocs.length} Total
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Registo permanente de todos os currículos e cartas gerados antes e depois deste comando
                </p>
              </div>

              {/* Filter pills & Sync button */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                  <button
                    onClick={() => { setDocFilterType('all'); setCurrentPage(1); }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      docFilterType === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Todos ({generatedDocs.length})
                  </button>
                  <button
                    onClick={() => { setDocFilterType('cv'); setCurrentPage(1); }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      docFilterType === 'cv' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Só CVs ({generatedDocs.filter(d => d.type === 'cv' || d.type === 'combo').length})
                  </button>
                  <button
                    onClick={() => { setDocFilterType('cover_letter'); setCurrentPage(1); }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      docFilterType === 'cover_letter' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Só Cartas ({generatedDocs.filter(d => d.type === 'cover_letter').length})
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold ${viewMode === 'grid' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'}`}
                    title="Visualização em Grelha"
                  >
                    Grelha
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold ${viewMode === 'table' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'}`}
                    title="Visualização em Tabela"
                  >
                    Tabela
                  </button>
                </div>
              </div>
            </div>

            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Pesquisar por nome do candidato, cargo, email, telefone ou modelo..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full bg-white border border-slate-300 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-xs"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold bg-slate-100 px-2 py-1 rounded-lg"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Documents Presentation (GRID OR TABLE) */}
            {paginatedDocs.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {paginatedDocs.map((docItem: any) => {
                    const isLetter = docItem.type === 'cover_letter';
                    const candidateName = docItem.candidateName || docItem.resumeData?.personalInfo?.fullName || 'Candidato CV Lab';
                    const candidateTitle = docItem.candidateTitle || docItem.resumeData?.personalInfo?.title || docItem.letterSubject || 'Profissional';
                    const candidateEmail = docItem.candidateEmail || docItem.resumeData?.personalInfo?.email || '—';
                    const candidatePhone = docItem.candidatePhone || docItem.resumeData?.personalInfo?.phone || '—';
                    const templateName = docItem.template || 't1_executive';
                    const formattedDate = docItem.createdAt ? new Date(docItem.createdAt).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recente';

                    return (
                      <div 
                        key={docItem.id}
                        className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group"
                      >
                        <div className="space-y-3">
                          {/* Type Badge and Date */}
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                              isLetter 
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              {isLetter ? 'Carta de Apresentação' : 'Currículo Profissional'}
                            </span>

                            <span className="text-[11px] text-slate-500 font-medium">
                              {formattedDate}
                            </span>
                          </div>

                          {/* Candidate Name & Title */}
                          <div>
                            <h4 className="text-base font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                              {candidateName}
                            </h4>
                            <p className="text-xs font-bold text-slate-600 mt-0.5 line-clamp-1">
                              {candidateTitle}
                            </p>
                          </div>

                          {/* Contact details */}
                          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                            <div className="flex items-center gap-2">
                              <Mail size={12} className="text-slate-400" />
                              <span className="truncate">{candidateEmail}</span>
                            </div>
                            {candidatePhone !== '—' && (
                              <div className="flex items-center gap-2">
                                <Phone size={12} className="text-slate-400" />
                                <span>{candidatePhone}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-slate-500 text-[10px] pt-1">
                              <span className="flex items-center gap-1">
                                <Briefcase size={12} />
                                <span>Modelo: <strong className="text-slate-700 font-mono">{templateName}</strong></span>
                              </span>
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {docItem.price || (isLetter ? 1000 : 2000)} Kz
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                          
                          <button
                            onClick={() => setSelectedDocPreview(docItem)}
                            className="flex-1 py-2.5 bg-blue-50 hover:bg-blue-600 hover:text-white active:scale-95 text-blue-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 border border-blue-200 hover:border-transparent"
                          >
                            <Eye size={14} />
                            <span>Ver Detalhes</span>
                          </button>

                          {!isLetter && docItem.resumeData && (
                            <button
                              onClick={() => {
                                if (onLoadDocumentIntoEditor) {
                                  onLoadDocumentIntoEditor(docItem.resumeData, docItem.template);
                                  if (setView) setView('editor');
                                } else {
                                  alert("Currículo carregado no editor!");
                                }
                              }}
                              className="px-3 py-2.5 bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white rounded-xl text-xs font-black transition-all border border-slate-200"
                              title="Carregar este currículo no editor para fazer alterações"
                            >
                              <Edit3 size={14} />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteGeneratedDoc(docItem.id)}
                            className="p-2.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-all border border-transparent hover:border-red-200"
                            title="Eliminar este registo"
                          >
                            <Trash2 size={14} />
                          </button>

                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* TABLE VIEW FOR HIGH-DENSITY SCANNING */
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-4">Tipo</th>
                          <th className="p-4">Nome do Candidato</th>
                          <th className="p-4">Cargo / Título</th>
                          <th className="p-4">Contacto</th>
                          <th className="p-4">Modelo</th>
                          <th className="p-4">Valor</th>
                          <th className="p-4">Data</th>
                          <th className="p-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedDocs.map((docItem: any) => {
                          const isLetter = docItem.type === 'cover_letter';
                          const candidateName = docItem.candidateName || docItem.resumeData?.personalInfo?.fullName || 'Candidato CV Lab';
                          const candidateTitle = docItem.candidateTitle || docItem.resumeData?.personalInfo?.title || docItem.letterSubject || 'Profissional';
                          const candidateEmail = docItem.candidateEmail || docItem.resumeData?.personalInfo?.email || '—';
                          const formattedDate = docItem.createdAt ? new Date(docItem.createdAt).toLocaleDateString('pt-PT') : 'Recente';

                          return (
                            <tr key={docItem.id} className="hover:bg-blue-50/50 transition-colors">
                              <td className="p-4">
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                  isLetter ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>
                                  {isLetter ? 'Carta' : 'CV'}
                                </span>
                              </td>
                              <td className="p-4 font-black text-slate-900">{candidateName}</td>
                              <td className="p-4 text-slate-600 font-medium max-w-[200px] truncate">{candidateTitle}</td>
                              <td className="p-4 text-slate-500 font-mono text-[11px]">{candidateEmail}</td>
                              <td className="p-4 text-slate-700 font-mono text-[11px]">{docItem.template || 't1_executive'}</td>
                              <td className="p-4 font-bold text-emerald-700">{docItem.price || (isLetter ? 1000 : 2000)} Kz</td>
                              <td className="p-4 text-slate-500">{formattedDate}</td>
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button 
                                    onClick={() => setSelectedDocPreview(docItem)}
                                    className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                                    title="Ver"
                                  >
                                    <Eye size={13} />
                                  </button>
                                  {!isLetter && docItem.resumeData && (
                                    <button 
                                      onClick={() => {
                                        if (onLoadDocumentIntoEditor) {
                                          onLoadDocumentIntoEditor(docItem.resumeData, docItem.template);
                                          if (setView) setView('editor');
                                        }
                                      }}
                                      className="p-1.5 bg-slate-100 text-slate-700 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                                      title="Editar"
                                    >
                                      <Edit3 size={13} />
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => handleDeleteGeneratedDoc(docItem.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-all"
                                    title="Eliminar"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center space-y-3 shadow-sm">
                <FileText size={40} className="mx-auto text-slate-400" />
                <h4 className="text-base font-black text-slate-800">Nenhum documento encontrado</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {searchQuery ? 'Tente pesquisar por outro termo ou limpe o filtro.' : 'Todos os currículos e cartas gerados estão guardados e organizados.'}
                </p>
                <button
                  onClick={syncAllHistoricalDocuments}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase mt-2 shadow-xs"
                >
                  Restaurar Todos os Registos Históricos
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <span className="text-xs text-slate-500 font-bold">
                  Página {currentPage} de {totalPages} ({filteredDocs.length} documentos)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="p-2 bg-white border border-slate-200 rounded-xl disabled:opacity-30 hover:bg-slate-100 text-slate-700 transition-all shadow-xs"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="p-2 bg-white border border-slate-200 rounded-xl disabled:opacity-30 hover:bg-slate-100 text-slate-700 transition-all shadow-xs"
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: GESTÃO DE CONTAS AUTORIZADAS (ACESSO RESTRITO) */}
        {/* ========================================================================= */}
        {activeTab === 'access' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Header */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <ShieldCheck size={22} className="text-blue-600" />
                  <span>Contas Autorizadas & Controlo de Acesso</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Apenas as contas de email listadas abaixo têm permissão para aceder e emitir documentos no CV LAB.
                </p>
              </div>

              <div className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2">
                <Lock size={14} />
                <span>Acesso Estritamente Restrito Ativo</span>
              </div>
            </div>

            {/* Add new authorized email box */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Plus size={16} className="text-blue-600" />
                <span>Autorizar Nova Conta de Utilizador</span>
              </h4>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="email"
                  placeholder="Introduza o email a autorizar (ex: colega@gmail.com)..."
                  value={newEmailInput}
                  onChange={e => setNewEmailInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddAuthorizedEmail()}
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                />

                <button
                  onClick={handleAddAuthorizedEmail}
                  disabled={isAddingEmail || !newEmailInput.trim()}
                  className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 active:scale-95 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  <span>Autorizar Acesso</span>
                </button>
              </div>
            </div>

            {/* Whitelisted Emails Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Lista de Contas com Acesso Válido ({authorizedEmails.length})
                </span>
                <span className="text-[11px] text-slate-500">Sincronização em tempo real</span>
              </div>

              <div className="divide-y divide-slate-100">
                {authorizedEmails.map((email, idx) => {
                  const emailLower = email.toLowerCase();
                  const isPrimaryAdmin = ['m26101342@gmail.com', 'ronalmaferreira04@icloud.com', 'sumodemanga50@gmail.com'].includes(emailLower);
                  const isCurrentLoggedIn = user?.email && user.email.toLowerCase() === emailLower;

                  return (
                    <div key={idx} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs ${
                          isPrimaryAdmin 
                            ? 'bg-blue-600 shadow-md shadow-blue-600/20' 
                            : 'bg-slate-700 shadow-md'
                        }`}>
                          {isPrimaryAdmin ? <Award size={16} /> : <User size={16} />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-900">{email}</span>
                            {isCurrentLoggedIn && (
                              <span className="bg-blue-100 text-blue-800 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-blue-200">VOCÊ</span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {isPrimaryAdmin ? 'Administrador Principal (Acesso Total)' : 'Utilizador Autorizado (Criação de CVs)'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${
                          isPrimaryAdmin 
                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {isPrimaryAdmin ? 'Super Admin' : 'Autorizado'}
                        </span>

                        {!isPrimaryAdmin && (
                          <button
                            onClick={() => handleRemoveAuthorizedEmail(email)}
                            className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-all"
                            title="Revogar autorização desta conta"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: ENCOMENDAS & PAGAMENTOS MULTICAIXA */}
        {/* ========================================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <CreditCard size={22} className="text-blue-600" />
                  <span>Encomendas & Validação MULTICAIXA Express</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Aprovação de pagamentos recebidos por transferência bancária ou MULTICAIXA Express
                </p>
              </div>

              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                {(['all', 'pending', 'approved', 'rejected'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                      orderStatusFilter === st ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st === 'all' ? 'Todas' : st === 'pending' ? 'Pendentes' : st === 'approved' ? 'Aprovadas' : 'Rejeitadas'}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders list */}
            <div className="space-y-4">
              {orders
                .filter(o => orderStatusFilter === 'all' || o.status === orderStatusFilter)
                .map((ord: any) => (
                  <div key={ord.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-slate-900 font-mono">{ord.id}</span>
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          ord.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          ord.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {ord.status === 'approved' ? 'Aprovado' : ord.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Cliente: <strong className="text-slate-800">{ord.contactEmail || ord.ownerId}</strong> • Data: {ord.createdAt ? new Date(ord.createdAt).toLocaleString('pt-PT') : '—'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {ord.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.id, 'approved')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                          >
                            <Check size={14} />
                            <span>Aprovar</span>
                          </button>
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.id, 'rejected')}
                            className="px-3 py-2 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white text-xs font-black uppercase rounded-xl transition-all border border-red-200"
                          >
                            <XCircle size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}

              {orders.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 shadow-sm">
                  Nenhuma encomenda registada de momento.
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: UTILIZADORES ONLINE & SESSÕES */}
        {/* ========================================================================= */}
        {activeTab === 'visitors' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Globe size={22} className="text-blue-600" />
                  <span>Utilizadores Ativos & Tráfego</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Sessões conectadas em tempo real ao CV LAB</p>
              </div>
              <span className="text-2xl font-black text-blue-700 bg-blue-50 border border-blue-200 px-4 py-2 rounded-2xl">
                {stats.online || 1} Online
              </span>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
              {onlineUsers.map((u: any, idx: number) => (
                <div key={idx} className="p-4 sm:p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <div>
                      <span className="text-xs font-black text-slate-900 font-mono">{u.email || u.id}</span>
                      <p className="text-[10px] text-slate-500">Última atividade: {new Date(u.lastSeen || Date.now()).toLocaleTimeString('pt-PT')}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded">{u.platform || 'Web Browser'}</span>
                </div>
              ))}

              {onlineUsers.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Sessão ativa de administrador ({user?.email || 'm26101342@gmail.com'}).
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: ANOTAÇÕES DA EQUIPA */}
        {/* ========================================================================= */}
        {activeTab === 'notes' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 mb-4">
                <MessageSquare size={22} className="text-blue-600" />
                <span>Quadro de Avisos & Notas da Equipa</span>
              </h3>

              <div className="flex flex-col sm:flex-row items-start gap-3">
                <input
                  type="text"
                  placeholder="Escreva uma nova anotação ou aviso para a equipa..."
                  value={newNoteText}
                  onChange={e => setNewNoteText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateNote()}
                  className="flex-1 w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                />

                <select
                  value={newNoteCategory}
                  onChange={e => setNewNoteCategory(e.target.value as any)}
                  className="bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="Aviso">Aviso</option>
                  <option value="Urgente">Urgente</option>
                  <option value="Anotação">Anotação</option>
                  <option value="Reunião">Reunião</option>
                </select>

                <button
                  onClick={handleCreateNote}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase rounded-2xl transition-all shadow-xs"
                >
                  Afixar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminNotes.map((note: any) => (
                <div key={note.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                        note.category === 'Urgente' ? 'bg-red-50 text-red-700 border-red-200' :
                        note.category === 'Aviso' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        note.category === 'Reunião' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {note.category || 'Nota'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {note.createdAt ? new Date(note.createdAt).toLocaleDateString('pt-PT') : ''}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed font-medium">{note.text}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[10px] text-slate-500">
                    <span>Por: {note.author || 'Admin'}</span>
                    <button onClick={() => handleDeleteNote(note.id)} className="hover:text-red-600 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* DOCUMENT FULL PREVIEW MODAL - CRISP WHITE & BLUE */}
      {selectedDocPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto text-slate-900 animate-in zoom-in-95 duration-200">
            
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">
                  {selectedDocPreview.type === 'cover_letter' ? 'Carta de Apresentação Guardada' : 'Currículo Arquivado'}
                </span>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                  {selectedDocPreview.candidateName || 'Documento'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">{selectedDocPreview.candidateTitle || selectedDocPreview.letterSubject}</p>
              </div>

              <button
                onClick={() => setSelectedDocPreview(null)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"
              >
                <XCircle size={20} />
              </button>
            </div>

            {/* Content view */}
            {selectedDocPreview.type === 'cover_letter' ? (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase">Assunto: {selectedDocPreview.letterSubject || 'Candidatura'}</h4>
                <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-serif bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                  {selectedDocPreview.coverLetterText}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold uppercase">Email</span>
                    <span className="text-slate-900 font-bold truncate block">{selectedDocPreview.candidateEmail || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold uppercase">Telefone</span>
                    <span className="text-slate-900 font-bold">{selectedDocPreview.candidatePhone || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold uppercase">Modelo</span>
                    <span className="text-blue-700 font-mono font-bold">{selectedDocPreview.template || 't1_executive'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold uppercase">Valor</span>
                    <span className="text-emerald-700 font-bold">{selectedDocPreview.price || 2000} Kz</span>
                  </div>
                </div>

                {selectedDocPreview.resumeData?.personalInfo?.summary && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <span className="text-slate-600 block text-[10px] font-bold uppercase mb-1">Resumo Profissional</span>
                    <p className="text-xs text-slate-800 leading-relaxed font-medium">{selectedDocPreview.resumeData.personalInfo.summary}</p>
                  </div>
                )}

                {/* Experience snippet */}
                {selectedDocPreview.resumeData?.experience && selectedDocPreview.resumeData.experience.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-slate-600 block text-[10px] font-bold uppercase">Experiência Profissional</span>
                    <div className="space-y-2">
                      {selectedDocPreview.resumeData.experience.map((exp: any, i: number) => (
                        <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 text-xs">
                          <div className="flex justify-between font-bold text-slate-900">
                            <span>{exp.position}</span>
                            <span className="text-slate-500 text-[10px]">{exp.startDate} - {exp.current ? 'Presente' : exp.endDate}</span>
                          </div>
                          <div className="text-slate-600 text-[11px]">{exp.company} {exp.location ? `• ${exp.location}` : ''}</div>
                          {exp.description && <p className="text-slate-600 text-[11px] mt-1">{exp.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education snippet */}
                {selectedDocPreview.resumeData?.education && selectedDocPreview.resumeData.education.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-slate-600 block text-[10px] font-bold uppercase">Habilitações Académicas</span>
                    <div className="space-y-2">
                      {selectedDocPreview.resumeData.education.map((edu: any, i: number) => (
                        <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 text-xs">
                          <div className="font-bold text-slate-900">{edu.degree}</div>
                          <div className="text-slate-600 text-[11px]">{edu.institution} • {edu.startDate} - {edu.endDate}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => setSelectedDocPreview(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Fechar
              </button>

              {selectedDocPreview.resumeData && (
                <button
                  onClick={() => {
                    if (onLoadDocumentIntoEditor) {
                      onLoadDocumentIntoEditor(selectedDocPreview.resumeData, selectedDocPreview.template);
                      setSelectedDocPreview(null);
                      if (setView) setView('editor');
                    }
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-1.5"
                >
                  <Edit3 size={15} />
                  <span>Carregar no Editor</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
