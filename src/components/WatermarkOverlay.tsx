import React from 'react';
import { Stamp } from 'lucide-react';

export interface WatermarkOverlayProps {
  enabled?: boolean;
  text?: string;
  opacity?: number;
  color?: string;
}

export const WatermarkOverlay: React.FC<WatermarkOverlayProps> = ({
  enabled = false,
  text = 'PRÉVIA DO CLIENTE • CV LAB',
  opacity = 0.22,
  color = '#DC2626',
}) => {
  if (!enabled) return null;

  const displayText = text || 'PRÉVIA DO CLIENTE • CV LAB';

  return (
    <div 
      className="absolute inset-0 pointer-events-none z-50 overflow-hidden select-none flex flex-col items-center justify-around py-12"
      style={{ minHeight: '1122px', height: '100%', width: '100%' }}
    >
      {/* Top Banner Bar */}
      <div 
        className="w-full py-1.5 px-4 text-center text-[10px] font-black tracking-[0.25em] uppercase border-y border-dashed"
        style={{
          color: color,
          borderColor: color,
          backgroundColor: `${color}0D`,
          opacity: Math.min(1, (opacity || 0.22) + 0.1)
        }}
      >
        <span>✦ DOCUMENTO DE PRÉVIA • PROIBIDA REPRODUÇÃO SEM AUTORIZAÇÃO • CV LAB ✦</span>
      </div>

      {/* Giant Diagonal Center Stamp */}
      <div 
        className="transform -rotate-[32deg] flex flex-col items-center justify-center gap-4 whitespace-nowrap transition-all duration-300"
        style={{ color: color, opacity: opacity || 0.22 }}
      >
        <div 
          className="border-4 border-dashed px-10 py-5 rounded-3xl text-[36px] font-black tracking-widest uppercase shadow-sm flex items-center gap-3 backdrop-blur-[1px]"
          style={{ borderColor: color, backgroundColor: 'rgba(255,255,255,0.4)' }}
        >
          <Stamp className="w-10 h-10 shrink-0" />
          <span>{displayText}</span>
        </div>
        <div 
          className="text-[11px] font-extrabold tracking-[0.3em] uppercase bg-white/90 px-5 py-1 rounded-full shadow-xs border"
          style={{ borderColor: color }}
        >
          VERSÃO DE APRECIAÇÃO PARA O CLIENTE • CV LAB ANGOLA
        </div>
      </div>

      {/* Bottom Security Footer Bar */}
      <div 
        className="w-full py-1.5 px-4 text-center text-[10px] font-black tracking-[0.25em] uppercase border-y border-dashed"
        style={{
          color: color,
          borderColor: color,
          backgroundColor: `${color}0D`,
          opacity: Math.min(1, (opacity || 0.22) + 0.1)
        }}
      >
        <span>✦ CV LAB AUTOMATED CLIENT PREVIEW SYSTEM • WWW.CVLAB.AO ✦</span>
      </div>
    </div>
  );
};
