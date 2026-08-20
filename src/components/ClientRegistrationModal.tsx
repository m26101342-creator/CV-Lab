import React, { useState } from 'react';
import { 
  X, CheckCircle, DollarSign, User, Phone, Mail, FileText, 
  Globe, Award, CreditCard, Sparkles, ShieldCheck, Tag, ArrowRight,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ServiceType, 
  OFFICIAL_SERVICE_PRICES, 
  ClientRegistrationData, 
  ResumeData, 
  INITIAL_RESUME_DATA, 
  TemplateType 
} from '../types';

interface ClientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmRegistration: (data: ClientRegistrationData) => void;
  initialServiceType?: ServiceType;
}

export const ClientRegistrationModal: React.FC<ClientRegistrationModalProps> = ({
  isOpen,
  onClose,
  onConfirmRegistration,
  initialServiceType = 'cv_normal'
}) => {
  const [selectedService, setSelectedService] = useState<ServiceType>(initialServiceType);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('+244 ');
  const [clientEmail, setClientEmail] = useState('');
  const [customPrice, setCustomPrice] = useState<number>(OFFICIAL_SERVICE_PRICES[initialServiceType].defaultPrice);
  const [paymentMethod, setPaymentMethod] = useState<'express' | 'transfer' | 'cash' | 'tpa' | 'other'>('express');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('paid');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSelectService = (type: ServiceType) => {
    setSelectedService(type);
    setCustomPrice(OFFICIAL_SERVICE_PRICES[type].defaultPrice);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      setErrorMessage('Por favor, informe o nome do cliente.');
      return;
    }

    const serviceDef = OFFICIAL_SERVICE_PRICES[selectedService];
    
    // Create base resume data pre-populated with customer info
    const newResumeData: ResumeData = {
      ...INITIAL_RESUME_DATA,
      personalInfo: {
        ...INITIAL_RESUME_DATA.personalInfo,
        fullName: clientName.trim(),
        phone: clientPhone.trim() !== '+244' && clientPhone.trim() !== '+244 ' ? clientPhone.trim() : '',
        email: clientEmail.trim(),
        location: 'Luanda, Angola'
      },
      language: serviceDef.language,
      styleConfig: {
        ...INITIAL_RESUME_DATA.styleConfig,
        showEuropassSeal: selectedService === 'cv_europeu'
      }
    };

    const registrationData: ClientRegistrationData = {
      id: `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientEmail: clientEmail.trim(),
      serviceType: selectedService,
      price: Number(customPrice) || serviceDef.defaultPrice,
      paymentMethod,
      paymentStatus,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      template: serviceDef.suggestedTemplate,
      resumeData: newResumeData
    };

    onConfirmRegistration(registrationData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="client-registration-modal-overlay" 
        className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl shadow-2xl border border-blue-100 max-w-2xl w-full overflow-hidden my-6 text-slate-800"
        >
          {/* Top Header - White and Blue Executive theme */}
          <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-6 py-5 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner">
                <FileText size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Registo de Atendimento & Base Contábil</h2>
                <p className="text-xs text-blue-100 font-medium">Defina o tipo de documento e valor antes de iniciar o CV</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-semibold flex items-center gap-2">
                <X size={16} className="text-red-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. Escolha do Tipo de Serviço / CV com Preços Oficiais */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                <Tag size={14} className="text-blue-600" />
                1. Selecione o Tipo de Serviço & Preço
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* CV Normal - 2.000 Kz */}
                <button
                  type="button"
                  onClick={() => handleSelectService('cv_normal')}
                  className={`p-4 rounded-2xl text-left border-2 transition-all flex flex-col justify-between relative ${
                    selectedService === 'cv_normal'
                      ? 'border-blue-600 bg-blue-50/80 shadow-md shadow-blue-500/10 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-blue-800">Normal</span>
                      {selectedService === 'cv_normal' && (
                        <CheckCircle size={16} className="text-blue-600" />
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-800 leading-tight">CV Profissional</p>
                    <p className="text-[11px] text-slate-500 leading-snug">Padrão nacional executivo em português</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-baseline justify-between">
                    <span className="text-[11px] text-slate-400 font-bold">Valor</span>
                    <span className="text-base font-black text-blue-700">2.000 Kz</span>
                  </div>
                </button>

                {/* CV em Inglês - 3.000 Kz */}
                <button
                  type="button"
                  onClick={() => handleSelectService('cv_english')}
                  className={`p-4 rounded-2xl text-left border-2 transition-all flex flex-col justify-between relative ${
                    selectedService === 'cv_english'
                      ? 'border-indigo-600 bg-indigo-50/80 shadow-md shadow-indigo-500/10 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-indigo-800 flex items-center gap-1">
                        <Globe size={12} /> Em Inglês
                      </span>
                      {selectedService === 'cv_english' && (
                        <CheckCircle size={16} className="text-indigo-600" />
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-800 leading-tight">English Resume</p>
                    <p className="text-[11px] text-slate-500 leading-snug">Estruturado em inglês internacional</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-baseline justify-between">
                    <span className="text-[11px] text-slate-400 font-bold">Valor</span>
                    <span className="text-base font-black text-indigo-700">3.000 Kz</span>
                  </div>
                </button>

                {/* CV Europeu - 5.000 Kz */}
                <button
                  type="button"
                  onClick={() => handleSelectService('cv_europeu')}
                  className={`p-4 rounded-2xl text-left border-2 transition-all flex flex-col justify-between relative ${
                    selectedService === 'cv_europeu'
                      ? 'border-emerald-600 bg-emerald-50/80 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                        <Award size={12} /> Europeu
                      </span>
                      {selectedService === 'cv_europeu' && (
                        <CheckCircle size={16} className="text-emerald-600" />
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-800 leading-tight">Padrão Europass</p>
                    <p className="text-[11px] text-slate-500 leading-snug">Selo oficial e normas europeias</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-baseline justify-between">
                    <span className="text-[11px] text-slate-400 font-bold">Valor</span>
                    <span className="text-base font-black text-emerald-700">5.000 Kz</span>
                  </div>
                </button>
              </div>

              {/* Serviços Complementares: Carta de Apresentação e Combo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleSelectService('cover_letter')}
                  className={`px-4 py-2.5 rounded-xl text-left border transition-all flex items-center justify-between ${
                    selectedService === 'cover_letter'
                      ? 'border-purple-600 bg-purple-50 text-purple-950 font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 text-xs font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Mail size={15} className="text-purple-600" />
                    <span>Carta de Apresentação (1.500 Kz)</span>
                  </div>
                  {selectedService === 'cover_letter' && <CheckCircle size={14} className="text-purple-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectService('combo')}
                  className={`px-4 py-2.5 rounded-xl text-left border transition-all flex items-center justify-between ${
                    selectedService === 'combo'
                      ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 text-xs font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={15} className="text-amber-600" />
                    <span>Combo Completo (CV + Carta) (3.500 Kz)</span>
                  </div>
                  {selectedService === 'combo' && <CheckCircle size={14} className="text-amber-600" />}
                </button>
              </div>
            </div>

            {/* 2. Dados do Cliente / Candidato */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                <User size={14} className="text-blue-600" />
                2. Informações do Cliente & Contacto
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Completo do Cliente <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Ex: João Baptista Silva"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all pl-9 text-slate-900 font-medium"
                    />
                    <User size={16} className="absolute left-3 top-3 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="+244 923 456 789"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all pl-9 text-slate-900 font-medium font-mono"
                    />
                    <Phone size={16} className="absolute left-3 top-3 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email do Cliente (Opcional)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="cliente@email.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all pl-9 text-slate-900 font-medium"
                    />
                    <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Valor Cobrado (Kz) <span className="text-slate-400 font-normal">(Base Contábil)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(Number(e.target.value))}
                      className="w-full bg-blue-50/50 border border-blue-200 rounded-xl px-3.5 py-2.5 text-sm font-black text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all pl-9 font-mono"
                    />
                    <DollarSign size={16} className="absolute left-3 top-3 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Forma de Pagamento & Notas */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Método de Pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="express">Multicaixa Express (954 748 806)</option>
                    <option value="transfer">Transferência Bancária (BFA)</option>
                    <option value="cash">Dinheiro em Mão</option>
                    <option value="tpa">TPA / Cartão</option>
                    <option value="other">Outro Método</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estado do Pagamento
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentStatus('paid')}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        paymentStatus === 'paid'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <CheckCircle size={14} /> Pago
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentStatus('pending')}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        paymentStatus === 'pending'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <ShieldCheck size={14} /> Pendente
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notas / Observações Rápidas (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Candidatura para vaga de Petróleo / Engenharia"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-blue-600" />
                <span>Registo contábil e CV salvos automaticamente.</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors w-full sm:w-auto text-center"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
                >
                  <span>Iniciar CV ({customPrice.toLocaleString()} Kz)</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
