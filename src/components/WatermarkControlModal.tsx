import React from 'react';
import { X, Stamp, Check, Sliders, AlertTriangle, Eye, RefreshCw, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResumeStyleConfig } from '../types';

interface WatermarkControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  styleConfig?: ResumeStyleConfig;
  onChangeStyleConfig: (newConfig: ResumeStyleConfig) => void;
}

export const WATERMARK_PRESETS = [
  { label: 'Prévia do Cliente', text: 'PRÉVIA DO CLIENTE • CV LAB' },
  { label: 'Amostra de Exemplo', text: 'AMOSTRA • CV LAB ANGOLA' },
  { label: 'Pendente Pagamento', text: 'PENDENTE DE PAGAMENTO' },
  { label: 'Rascunho Não Oficial', text: 'RASCUNHO • USO INTERNO' },
  { label: 'Apenas Apreciação', text: 'APENAS PARA APRECIAÇÃO' },
];

export const WATERMARK_COLORS = [
  { id: 'red', name: 'Vermelho Alerta', hex: '#DC2626', bg: 'bg-red-500' },
  { id: 'blue', name: 'Azul Corporativo', hex: '#2563EB', bg: 'bg-blue-600' },
  { id: 'amber', name: 'Âmbar Comercial', hex: '#D97706', bg: 'bg-amber-600' },
  { id: 'slate', name: 'Cinza Discreto', hex: '#475569', bg: 'bg-slate-600' },
  { id: 'emerald', name: 'Verde Aprovação', hex: '#059669', bg: 'bg-emerald-600' },
];

export const WatermarkControlModal: React.FC<WatermarkControlModalProps> = ({
  isOpen,
  onClose,
  styleConfig = {},
  onChangeStyleConfig
}) => {
  if (!isOpen) return null;

  const isEnabled = styleConfig.watermarkEnabled ?? false;
  const currentText = styleConfig.watermarkText || 'PRÉVIA DO CLIENTE • CV LAB';
  const currentColor = styleConfig.watermarkColor || '#DC2626';
  const currentOpacity = styleConfig.watermarkOpacity ?? 0.22;

  const handleToggle = (enabled: boolean) => {
    onChangeStyleConfig({
      ...styleConfig,
      watermarkEnabled: enabled
    });
  };

  const handleTextChange = (text: string) => {
    onChangeStyleConfig({
      ...styleConfig,
      watermarkText: text
    });
  };

  const handleColorChange = (hex: string) => {
    onChangeStyleConfig({
      ...styleConfig,
      watermarkColor: hex
    });
  };

  const handleOpacityChange = (opacity: number) => {
    onChangeStyleConfig({
      ...styleConfig,
      watermarkOpacity: opacity
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 relative text-slate-800"
        >
          {/* Modal Header */}
          <div className="bg-slate-900 text-white p-6 relative overflow-hidden flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Stamp size={24} />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>Marca D'água para Envio ao Cliente</span>
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  Proteja a prévia do documento antes da entrega final
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Status Switcher Banner */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
              isEnabled 
                ? 'bg-amber-50 border-amber-200 text-amber-900' 
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  isEnabled ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-200 text-slate-500'
                }`}>
                  <Stamp size={20} />
                </div>
                <div>
                  <span className="block text-xs font-black uppercase tracking-wider">
                    {isEnabled ? 'Marca D\'água Ativada' : 'Marca D\'água Desativada'}
                  </span>
                  <span className="block text-[11px] text-slate-500 font-medium leading-tight">
                    {isEnabled 
                      ? 'Visível na prévia e em todos os arquivos PDF baixados.' 
                      : 'O documento será gerado limpo e sem selo de prévia.'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggle(!isEnabled)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all shadow-sm ${
                  isEnabled
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20'
                    : 'bg-slate-900 hover:bg-black text-white'
                }`}
              >
                {isEnabled ? '✓ Ativa (ON)' : 'Ativar (OFF)'}
              </button>
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-600 block">
                Textos Rápidos Sugeridos (Presets)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {WATERMARK_PRESETS.map((preset) => (
                  <button
                    key={preset.text}
                    type="button"
                    onClick={() => {
                      handleTextChange(preset.text);
                      if (!isEnabled) handleToggle(true);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      currentText === preset.text
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Text Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-600 block">
                Texto Personalizado da Marca D'água
              </label>
              <input
                type="text"
                value={currentText}
                onChange={(e) => {
                  handleTextChange(e.target.value);
                  if (!isEnabled) handleToggle(true);
                }}
                placeholder="Ex: PRÉVIA DO CLIENTE • CV LAB"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Color Chooser */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-600 block">
                Cor da Marca D'água
              </label>
              <div className="grid grid-cols-5 gap-2">
                {WATERMARK_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleColorChange(c.hex)}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      currentColor === c.hex 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-amber-400' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full ${c.bg} shadow-inner border border-white/40`} />
                    <span className="text-[10px] font-bold truncate w-full text-center">{c.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity Slider */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Opacidade / Transparência</span>
                <span className="font-mono bg-slate-200 px-2 py-0.5 rounded text-[11px]">
                  {Math.round(currentOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.08"
                max="0.50"
                step="0.02"
                value={currentOpacity}
                onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>Discreto (8%)</span>
                <span>Médio (22%)</span>
                <span>Forte (50%)</span>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleToggle(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Desativar Marca D'água
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              Concluído
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
