/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, ShieldAlert, Crown, ArrowRight, ArrowLeft, Info, RefreshCw, ExternalLink } from 'lucide-react';
import { AppLanguage } from '../types';

export interface AdSensePlaceholderProps {
  client?: string;
  slot?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  responsive?: boolean;
  minHeight?: number | string;
  className?: string;
  showStatusBadge?: boolean;
  lang?: AppLanguage | string;
  fallbackType?: 'sponsor' | 'pro_promo' | 'adblock_notice' | 'auto';
  onOpenCheckout?: () => void;
}

type AdStatus = 'loading' | 'filled' | 'unfilled' | 'blocked';

export default function AdSensePlaceholder({
  client = 'ca-pub-3312377428939400',
  slot = 'auto',
  format = 'auto',
  responsive = true,
  minHeight = 110,
  className = '',
  showStatusBadge = true,
  lang = 'ar',
  fallbackType = 'auto',
  onOpenCheckout
}: AdSensePlaceholderProps) {
  const adRef = useRef<HTMLModElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isPushed = useRef(false);

  const [adStatus, setAdStatus] = useState<AdStatus>('loading');
  const [isAdBlockDetected, setIsAdBlockDetected] = useState(false);

  const isAr = lang === 'ar';
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const minHeightStyle = typeof minHeight === 'number' ? `${minHeight}px` : minHeight;

  useEffect(() => {
    let timeoutId: any;
    let checkInterval: any;

    const testAdBlocker = () => {
      if (typeof window === 'undefined') return false;
      if ((window as any).isAdBlockActive) {
        setIsAdBlockDetected(true);
        setAdStatus('blocked');
        return true;
      }
      return false;
    };

    const initAdSense = () => {
      if (testAdBlocker()) return;

      if (!isPushed.current && adRef.current) {
        try {
          if (typeof window !== 'undefined') {
            const adsbygoogle = (window as any).adsbygoogle || [];
            adsbygoogle.push({});
            isPushed.current = true;
          }
        } catch (err: any) {
          console.debug('AdSense push caught:', err);
        }
      }

      // Check if the ad fills within 3 seconds
      let attempts = 0;
      checkInterval = setInterval(() => {
        attempts += 1;
        const ins = adRef.current;
        if (ins) {
          const status = ins.getAttribute('data-ad-status');
          const hasIframe = ins.querySelector('iframe') !== null;
          const height = ins.clientHeight;

          if (status === 'filled' || (hasIframe && height > 20)) {
            setAdStatus('filled');
            clearInterval(checkInterval);
            return;
          }

          if (status === 'unfilled') {
            setAdStatus('unfilled');
            clearInterval(checkInterval);
            return;
          }
        }

        if (attempts >= 12) {
          // Timeout elapsed without fill (common in staging preview URL or before approval)
          clearInterval(checkInterval);
          setAdStatus((prev) => (prev === 'loading' ? 'unfilled' : prev));
        }
      }, 250);
    };

    initAdSense();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [client, slot]);

  return (
    <div
      ref={containerRef}
      className={`w-full overflow-hidden my-3 rounded-2xl border transition-all relative ${
        adStatus === 'filled'
          ? 'bg-transparent border-stone-200/60 dark:border-stone-800'
          : 'bg-gradient-to-r from-amber-500/5 via-stone-100/80 to-amber-500/5 dark:from-stone-900/90 dark:via-[#171614] dark:to-stone-900/90 border-amber-500/20 dark:border-stone-800 shadow-2xs'
      } ${className}`}
      style={{ minHeight: minHeightStyle }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Top Header Tag */}
      {showStatusBadge && (
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-stone-200/50 dark:border-stone-800/60 text-[10px] text-stone-400 select-none">
          <div className="flex items-center gap-1.5">
            <Info className="w-3 h-3 text-[#c29b40]" />
            <span className="font-bold uppercase tracking-wider">
              {adStatus === 'filled'
                ? isAr ? 'إعلان ممول (Google AdSense)' : 'Sponsored Advertisement'
                : isAr ? 'منصة مجانية بالكامل 100%' : '100% Free Platform'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {adStatus === 'loading' && (
              <span className="flex items-center gap-1 text-[9px] text-amber-500 font-medium">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                <span>{isAr ? 'جاري التحميل...' : 'Loading...'}</span>
              </span>
            )}
            {adStatus === 'blocked' && (
              <span className="flex items-center gap-1 text-[9px] text-emerald-500 font-bold">
                <Sparkles className="w-3 h-3" />
                <span>{isAr ? 'وصول مجاني مفتوح' : 'Full Free Access'}</span>
              </span>
            )}
            {adStatus === 'unfilled' && (
              <span className="text-[9px] text-emerald-500 font-mono font-bold">
                {isAr ? 'مجاني ومتاح للجميع' : 'Always 100% Free'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="p-2 sm:p-3 flex flex-col items-center justify-center relative w-full" style={{ minHeight: minHeightStyle }}>
        
        {/* Real Google AdSense Tag */}
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{
            display: 'block',
            minWidth: '250px',
            minHeight: '90px',
            width: '100%'
          }}
          data-ad-client={client}
          data-ad-slot={slot !== 'auto' ? slot : undefined}
          data-ad-format={format}
          data-full-width-responsive={responsive ? 'true' : 'false'}
        />

        {/* Fallback View: Displayed when AdSense is unfilled, blocked, or in sandbox dev */}
        {adStatus !== 'filled' && (
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-start p-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#916a24] via-[#c29b40] to-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h5 className="text-xs font-black text-stone-900 dark:text-stone-100">
                    {isAr ? 'منصة ArabPrompt — مجانية بالكامل وغير محدودة' : 'ArabPrompt — 100% Free & Unlimited'}
                  </h5>
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-emerald-500 text-white">
                    {isAr ? 'مجاني 100%' : '100% Free'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 dark:text-stone-400 max-w-md">
                  {isAr
                    ? 'استمتع بهندسة الأوامر السينمائية وعكس البرومبت وتوليد الفيديو مجاناً بدون أي رسوم، بدون اشتراكات، وبدون الحاجة لإدخال أي مفتاح API.'
                    : 'Enjoy cinema prompt engineering, reverse prompts, and video generation completely free without any fees, subscriptions, or API keys.'}
                </p>
              </div>
            </div>

            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5 shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? 'مفتوح للجميع مجاناً' : 'Free for Everyone'}</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
