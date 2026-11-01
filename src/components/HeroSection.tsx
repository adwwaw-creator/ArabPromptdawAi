/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, Crown, Zap, Shield, Film, CheckCircle2, ExternalLink } from 'lucide-react';
import { AppLanguage } from '../types';

interface HeroSectionProps {
  lang: AppLanguage;
  onGetStarted?: () => void;
  onOpenVisualLibrary?: () => void;
}

export default function HeroSection({ lang, onGetStarted }: HeroSectionProps) {
  const isAr = lang === 'ar';

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 my-2">
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-stone-900 via-[#1c1a16] to-stone-900 text-white shadow-xl border border-[#c29b40]/30 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 end-0 -mt-8 -me-8 w-40 h-40 bg-[#c29b40]/20 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-2 text-center md:text-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c29b40]/20 border border-[#c29b40]/40 text-amber-300 text-[11px] font-black">
              <Crown className="w-3.5 h-3.5 text-[#c29b40]" />
              <span>{isAr ? 'منصة عربية احترافية مجانية بالكامل 100% | جودة سينمائية فائقة' : '100% Free Professional Platform | Cinematic Ultra-HD AI'}</span>
            </div>
            
            <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
              {isAr ? 'أدوات هندسة الأوامر الرقمية والسينمائية المتقدمة للجميع مجاناً' : 'Cinematic & Digital Prompt Engineering Tools — Free for Everyone'}
            </h3>
            
            <p className="text-xs text-stone-300 max-w-2xl leading-relaxed">
              {isAr 
                ? 'استمتع بخوادم سريعة، صياغة برومبتات مزدوجة (مباشرة وهندسية)، استوديو سينمائي متكامل، وبدون أي إعلانات أو متطلبات دفع.'
                : 'Experience reserved low-latency AI models, dual-mode prompts, 4K screenplay studio, and a 100% free, ad-free workflow.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap justify-center">
            {onGetStarted && (
              <button
                type="button"
                onClick={onGetStarted}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#916a24] via-[#c29b40] to-amber-500 hover:opacity-95 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAr ? 'ابدأ في مهندس الأوامر' : 'Launch Prompt Engineer'}</span>
              </button>
            )}

            <a
              href="https://adwwaw-creator.github.io/PromteFree/"
              target="_blank"
              rel="noopener noreferrer"
              id="hero-promtefree-link"
              className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 hover:text-white font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title={isAr ? 'PromteFree — أداة برومبت فري المجانية' : 'PromteFree — Free Tool'}
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>PromteFree</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-600 text-white font-black leading-none">
                {isAr ? 'مجاني ↗' : 'Free ↗'}
              </span>
            </a>
          </div>
        </div>

        {/* Perks pill list */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 mt-3 border-t border-white/10 text-[11px] text-stone-300">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{isAr ? 'خوادم معالجة مخصصة' : 'Reserved GPU Compute'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{isAr ? 'خالٍ تماماً من الإعلانات' : '100% Ad-Free'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{isAr ? 'دعم كامل لنماذج Gemini 2026' : 'Gemini 2026 Models'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{isAr ? 'تشفير وحفظ سحابي' : 'Encrypted Cloud Sync'}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
