import React, { useState, useEffect } from 'react';
import { 
  X, Search, Filter, Edit3, Download, Printer, Copy, Trash2, 
  User, Plus, CheckCircle, Clock, Calendar, DollarSign, Globe, 
  Award, FileText, Mail, Sparkles, RefreshCw, ChevronRight, ExternalLink, Stamp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResumeData, TemplateType, ServiceType, OFFICIAL_SERVICE_PRICES } from '../types';
import { db, collection, getDocs, doc, deleteDoc, query, onSnapshot } from '../lib/firebase';
import { OFFICIAL_HISTORICAL_DOCUMENTS } from '../data/historicalDocuments';

interface SavedClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadClientResume: (resumeData: ResumeData, template?: TemplateType, meta?: any) => void;
  onOpenNewRegistration: () => void;
  onDirectDownloadPdf?: (resumeData: ResumeData, template?: TemplateType) => void;
}

export const SavedClientsModal: React.FC<SavedClientsModalProps> = ({
  isOpen,
  onClose,
  onLoadClientResume,
  onOpenNewRegistration,
  onDirectDownloadPdf
}) => {
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState<'all' | 'cv_normal' | 'cv_english' | 'cv_europeu' | 'cover_letter'>('all');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load clients and documents from database and storage
  const fetchAllSavedClients = async () => {
    setLoading(true);
    try {
      let combinedDocs: any[] = [];
      const seenIds = new Set<string>();
      const seenNames = new Set<string>();

      // 1. Fetch from Firestore generated_documents
      if (db) {
        try {
          const snap = await getDocs(collection(db, 'generated_documents'));
          if (snap && snap.docs) {
            snap.docs.forEach((d: any) => {
              const data = d.data();
              const item = { id: d.id, ...data };
              combinedDocs.push(item);
              seenIds.add(d.id);
              if (data.candidateName) seenNames.add(data.candidateName.toLowerCase().trim());
            });
          }
        } catch (e) {
          console.warn("Firestore fetch warning:", e);
        }
      }

      // 2. Load official historical seeds if not present
      OFFICIAL_HISTORICAL_DOCUMENTS.forEach(histDoc => {
        if (!seenIds.has(histDoc.id) && !seenNames.has(histDoc.candidateName.toLowerCase().trim())) {
          combinedDocs.push({ ...histDoc });
          seenIds.add(histDoc.id);
          seenNames.add(histDoc.candidateName.toLowerCase().trim());
        }
      });

      // 3. Load from localStorage saved resumes if any
      try {
        const localSaved = localStorage.getItem('saved_client_resumes');
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          if (Array.isArray(parsed)) {
            parsed.forEach(p => {
              const name = p.candidateName || p.clientName || p.personalInfo?.fullName;
              if (name && !seenNames.has(name.toLowerCase().trim())) {
                combinedDocs.push(p);
                seenNames.add(name.toLowerCase().trim());
              }
            });
          }
        }
      } catch (errLocal) {
        console.warn("Local storage parse warning:", errLocal);
      }

      // Sort descending by date
      combinedDocs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setClientsList(combinedDocs);
    } catch (error) {
      console.error("Erro ao carregar clientes salvos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAllSavedClients();
    }
  }, [isOpen]);

  // Real-time listener for generated_documents if DB active
  useEffect(() => {
    if (!isOpen || !db) return;
    const unsub = onSnapshot(collection(db, 'generated_documents'), (snap: any) => {
      if (snap && snap.docs) {
        fetchAllSavedClients();
      }
    });
    return () => unsub();
  }, [isOpen]);

  // Delete client item
  const handleDeleteClient = async (id: string, name: string) => {
    if (!window.confirm(`Tem a certeza que deseja eliminar o currículo salvo de "${name}"?`)) {
      return;
    }
    try {
      if (db) {
        await deleteDoc(doc(db, 'generated_documents', id));
      }
      // Remove from local state
      setClientsList(prev => prev.filter(c => c.id !== id));
      // Remove from local storage
      try {
        const localSaved = localStorage.getItem('saved_client_resumes');
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          const filtered = parsed.filter((c: any) => c.id !== id);
          localStorage.setItem('saved_client_resumes', JSON.stringify(filtered));
        }
      } catch {}
    } catch (e) {
      console.error("Erro ao eliminar currículo:", e);
      alert("Erro ao eliminar registo.");
    }
  };

  // Helper to determine service badge
  const getServiceBadge = (item: any) => {
    const type = item.serviceType || (item.type === 'cover_letter' ? 'cover_letter' : 'cv_normal');
    const price = item.price || (type === 'cv_europeu' ? 5000 : type === 'cv_english' ? 3000 : 2000);
    
    if (type === 'cv_europeu' || (item.template && item.template.includes('europass'))) {
      return (
        <span className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
          <Award size={12} /> Europeu • {price.toLocaleString()} Kz
        </span>
      );
    }
    if (type === 'cv_english' || item.template === 't1_executive' && item.resumeData?.language === 'en') {
      return (
        <span className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
          <Globe size={12} /> Inglês • {price.toLocaleString()} Kz
        </span>
      );
    }
    if (type === 'cover_letter' || item.type === 'cover_letter') {
      return (
        <span className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
          <Mail size={12} /> Carta • {price.toLocaleString()} Kz
        </span>
      );
    }
    if (type === 'combo' || item.type === 'combo') {
      return (
        <span className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
          <Sparkles size={12} /> Combo • {price.toLocaleString()} Kz
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
        <FileText size={12} /> Normal • {price.toLocaleString()} Kz
      </span>
    );
  };

  // Filter clients
  const filteredClients = clientsList.filter(item => {
    const name = item.candidateName || item.clientName || item.personalInfo?.fullName || '';
    const title = item.candidateTitle || item.personalInfo?.title || item.letterSubject || '';
    const phone = item.candidatePhone || item.personalInfo?.phone || '';
    const query = searchQuery.toLowerCase();

    const matchesSearch = name.toLowerCase().includes(query) || 
                          title.toLowerCase().includes(query) || 
                          phone.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (serviceFilter === 'all') return true;
    if (serviceFilter === 'cv_europeu') {
      return item.serviceType === 'cv_europeu' || (item.template && item.template.includes('europass'));
    }
    if (serviceFilter === 'cv_english') {
      return item.serviceType === 'cv_english';
    }
    if (serviceFilter === 'cover_letter') {
      return item.serviceType === 'cover_letter' || item.type === 'cover_letter';
    }
    if (serviceFilter === 'cv_normal') {
      return !item.serviceType || item.serviceType === 'cv_normal' || item.type === 'cv';
    }
    return true;
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="saved-clients-modal-overlay"
        className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-3 md:p-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl shadow-2xl border border-blue-100 max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden text-slate-800"
        >
          {/* Header - White & Blue Executive */}
          <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-6 py-4 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner">
                <User size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Clientes & Currículos Salvos</h2>
                <p className="text-xs text-blue-100 font-medium">Aceda, edite e gere vias de todos os clientes a qualquer momento</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenNewRegistration();
                }}
                className="px-4 py-2 bg-white text-blue-800 hover:bg-blue-50 text-xs font-black uppercase tracking-wider rounded-xl shadow-md flex items-center gap-1.5 transition-all hover:scale-105"
              >
                <Plus size={16} /> Novo Atendimento
              </button>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Search, Filter Bar and Stats */}
          <div className="p-4 md:p-6 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar por nome, cargo ou telefone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              <button
                onClick={() => setServiceFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  serviceFilter === 'all'
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Todos ({clientsList.length})
              </button>
              <button
                onClick={() => setServiceFilter('cv_normal')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  serviceFilter === 'cv_normal'
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Normal (2.000 Kz)
              </button>
              <button
                onClick={() => setServiceFilter('cv_english')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  serviceFilter === 'cv_english'
                    ? 'bg-indigo-700 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Inglês (3.000 Kz)
              </button>
              <button
                onClick={() => setServiceFilter('cv_europeu')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  serviceFilter === 'cv_europeu'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Europeu (5.000 Kz)
              </button>
              <button
                onClick={() => setServiceFilter('cover_letter')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  serviceFilter === 'cover_letter'
                    ? 'bg-purple-700 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Cartas
              </button>

              <button
                onClick={fetchAllSavedClients}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors ml-auto"
                title="Recarregar lista"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 custom-scrollbar">
            {filteredClients.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <User size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-800">Nenhum cliente encontrado</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Registe um novo cliente ou ajuste os termos da sua pesquisa.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onOpenNewRegistration();
                  }}
                  className="px-5 py-2.5 bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-800 transition-all inline-flex items-center gap-1.5 mt-2"
                >
                  <Plus size={14} /> Registar Primeiro Atendimento
                </button>
              </div>
            ) : (
              filteredClients.map((client) => {
                const name = client.candidateName || client.clientName || client.personalInfo?.fullName || 'Sem Nome';
                const title = client.candidateTitle || client.personalInfo?.title || client.letterSubject || 'Profissional';
                const phone = client.candidatePhone || client.personalInfo?.phone || client.clientPhone || '—';
                const email = client.candidateEmail || client.personalInfo?.email || client.clientEmail || '—';
                const dateStr = client.createdAt ? new Date(client.createdAt).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
                const fullResume = client.resumeData || {
                  personalInfo: {
                    fullName: name,
                    title: title,
                    phone: phone !== '—' ? phone : '',
                    email: email !== '—' ? email : '',
                    location: 'Luanda, Angola',
                    summary: ''
                  },
                  experience: [],
                  education: [],
                  skills: []
                };

                return (
                  <motion.div
                    key={client.id}
                    layout
                    className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
                  >
                    {/* Client Main Info */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 flex items-center justify-center font-black text-sm shrink-0 border border-blue-200/60 shadow-sm">
                        {name.substring(0, 2).toUpperCase()}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900 truncate">{name}</h3>
                          {getServiceBadge(client)}
                        </div>

                        <p className="text-xs font-semibold text-blue-800 truncate">{title}</p>

                        <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium flex-wrap pt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock size={11} className="text-slate-400" /> {dateStr}
                          </span>
                          {phone !== '—' && (
                            <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                              {phone}
                            </span>
                          )}
                          {email !== '—' && (
                            <span className="truncate max-w-[180px] text-slate-600">
                              {email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 justify-end">
                      {/* 1. Botão Principal: EDITAR NO EDITOR */}
                      <button
                        onClick={() => {
                          onLoadClientResume(fullResume, client.template, client);
                          onClose();
                        }}
                        className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all hover:scale-105"
                        title="Carregar este currículo no Editor para continuar a edição"
                      >
                        <Edit3 size={13} />
                        <span>Editar no Editor</span>
                      </button>

                      {/* 2. Descarregar PDF direto se disponível */}
                      {onDirectDownloadPdf && (
                        <>
                          <button
                            onClick={() => {
                              const previewResume = {
                                ...fullResume,
                                styleConfig: {
                                  ...(fullResume.styleConfig || {}),
                                  watermarkEnabled: true,
                                  watermarkText: 'PRÉVIA DO CLIENTE • CV LAB'
                                }
                              };
                              onDirectDownloadPdf(previewResume, client.template);
                            }}
                            className="px-2.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors flex items-center gap-1 text-xs font-black border border-amber-300/80 shadow-xs"
                            title="Descarregar PDF de Prévia com Marca D'água para mandar ao cliente"
                          >
                            <Stamp size={13} />
                            <span className="hidden sm:inline">Prévia</span>
                          </button>

                          <button
                            onClick={() => onDirectDownloadPdf(fullResume, client.template)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors"
                            title="Descarregar PDF Final Limpo"
                          >
                            <Download size={15} />
                          </button>
                        </>
                      )}

                      {/* 3. Eliminar */}
                      <button
                        onClick={() => handleDeleteClient(client.id, name)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                        title="Eliminar este registo"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <span className="font-semibold text-slate-700">
              Total de Clientes no Sistema: <strong className="text-blue-800">{clientsList.length}</strong>
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Fechar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
