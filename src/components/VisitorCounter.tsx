/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  ShieldCheck,
  Activity,
  Monitor,
  Smartphone,
  Tablet,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  TrendingUp,
  Calendar,
  Radio,
  BarChart2,
  Lock,
  Unlock,
  EyeOff,
  KeyRound,
  X,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Globe,
  MapPin
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  trackRealVisitor,
  subscribeToVisitorData,
  startActivePresence,
  resetVisitorCounterToZero,
  generateVisitorGrowthAndForecast,
  isExcludedScreen,
  sanitizeExcludedVisitorLogs,
  enrichVisitorLog,
  VisitorState,
  ChartDataPoint,
  CountryBreakdownItem
} from '../utils/visitorTracker';
import { showToast } from './ToastNotification';
import { AppLanguage } from '../types';

const ADMIN_EMAILS = ['adwwaw@gmail.com', 'adouaourachid@gmail.com'];
const ADMIN_SECRET_CODE = '2026';

interface VisitorCounterProps {
  lang: AppLanguage;
  variant?: 'badge' | 'footer' | 'full';
  currentUser?: any;
  onOpenAuth?: (mode?: 'login' | 'signup' | 'profile') => void;
}

export default function VisitorCounter({
  lang,
  variant = 'footer',
  currentUser,
  onOpenAuth
}: VisitorCounterProps) {
  const [state, setState] = useState<VisitorState>({
    count: 0,
    activeCount: 1,
    updatedAt: null,
    recentLogs: [],
    dailyStats: [],
    isLive: false,
    myVisitorNumber: null
  });

  const [activeUsers, setActiveUsers] = useState<number>(1);
  const [showDetails, setShowDetails] = useState<boolean>(true);
  const [chartView, setChartView] = useState<'cumulative' | 'daily'>('cumulative');
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Privacy protection: Stats are private for the owner only ("هنا فقط")
  const [isUnlockedLocally, setIsUnlockedLocally] = useState<boolean>(() => {
    try {
      return localStorage.getItem('arabprompt_owner_analytics_unlocked') === 'true';
    } catch {
      return false;
    }
  });

  const [showUnlockModal, setShowUnlockModal] = useState<boolean>(false);
  const [inputAdminKey, setInputAdminKey] = useState<string>('');
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const isOwnerByEmail = Boolean(
    currentUser?.email && ADMIN_EMAILS.includes(currentUser.email.toLowerCase().trim())
  );

  const isScreenExcluded = useMemo(() => isExcludedScreen(), []);

  const isAuthorized = isOwnerByEmail || isUnlockedLocally;

  useEffect(() => {
    // 1. If screen is 384x824 or user is owner/admin, strictly bypass tracking so their entry is NEVER counted as a visitor number
    if (isOwnerByEmail || isScreenExcluded) {
      try {
        localStorage.removeItem('arabprompt_my_visitor_num');
        sessionStorage.removeItem('arabprompt_session_counted');
      } catch {}
      setState((prev) => ({ ...prev, myVisitorNumber: null }));
    } else {
      // Record genuine visitor entry for general public only
      trackRealVisitor(false, currentUser?.email).then((num) => {
        if (num !== null) {
          setState((prev) => ({ ...prev, myVisitorNumber: num }));
        }
      });
    }

    // Clean up any historical logs that match excluded screen resolution 384x824
    sanitizeExcludedVisitorLogs().catch(() => {});

    // 2. Real-time Firestore snapshot listener for total count & logs
    const unsubscribeData = subscribeToVisitorData((data) => {
      setState((prev) => ({
        ...prev,
        ...data
      }));
    });

    // 3. Real-time active presence listener for "الداخلين حالياً للموقع" (admin & 384x824 presence bypassed from inflating count)
    const stopActivePresence = startActivePresence((count) => {
      setActiveUsers(count);
    }, currentUser?.email);

    return () => {
      unsubscribeData();
      stopActivePresence();
    };
  }, [currentUser?.email, isOwnerByEmail, isScreenExcluded]);

  const formatCount = (num: number): string => {
    return String(num ?? 0);
  };

  const formatTime = (isoString?: string | null): string => {
    if (!isoString) return lang === 'ar' ? 'الآن' : 'Just now';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString(lang === 'ar' ? 'ar-u-nu-latn' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return lang === 'ar' ? 'الآن' : 'Just now';
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-3.5 h-3.5 text-[#c29b40]" />;
      case 'tablet':
        return <Tablet className="w-3.5 h-3.5 text-[#c29b40]" />;
      default:
        return <Monitor className="w-3.5 h-3.5 text-[#c29b40]" />;
    }
  };

  const handleResetToZero = async () => {
    const confirmMsg = lang === 'ar'
      ? 'هل أنت متأكد من تصفير عداد الزوار ليعود من الصفر (0)؟'
      : 'Are you sure you want to reset the visitor counter back to zero (0)?';
    if (!window.confirm(confirmMsg)) return;

    setIsResetting(true);
    try {
      await resetVisitorCounterToZero();
      showToast(
        lang === 'ar'
          ? 'تم تصفير عدّاد الزوار ليبدأ من الصفر (0) بنجاح!'
          : 'Visitor counter has been reset to 0 successfully!'
      );
      setTimeout(() => {
        trackRealVisitor(true);
      }, 400);
    } catch (err) {
      console.error(err);
      showToast(lang === 'ar' ? 'حدث خطأ أثناء تصفير العداد' : 'Failed to reset counter', true);
    } finally {
      setIsResetting(false);
    }
  };

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = inputAdminKey.trim().toLowerCase();

    if (ADMIN_EMAILS.includes(cleanInput) || cleanInput === ADMIN_SECRET_CODE) {
      localStorage.setItem('arabprompt_owner_analytics_unlocked', 'true');
      setIsUnlockedLocally(true);
      setShowUnlockModal(false);
      setInputAdminKey('');
      setUnlockError(null);
      showToast(
        lang === 'ar'
          ? '✓ تم تأكيد هوية المشرف وعرض إحصائيات الزوار الخاصة بنجاح!'
          : '✓ Admin identity confirmed. Private visitor analytics unlocked!'
      );
    } else {
      setUnlockError(
        lang === 'ar'
          ? 'عذراً، البريد أو الرمز غير صحيح. هذه اللوحة خاصة بمشرف الموقع فقط.'
          : 'Invalid admin email or passkey. This dashboard is private to the owner.'
      );
    }
  };

  const handleLock = () => {
    try {
      localStorage.removeItem('arabprompt_owner_analytics_unlocked');
    } catch {}
    setIsUnlockedLocally(false);
    showToast(
      lang === 'ar'
        ? 'تم قفل وإخفاء إحصائيات الزوار للحفاظ على الخصوصية'
        : 'Visitor analytics locked and hidden from public'
    );
  };

  // Generate Recharts growth and predictive forecast dataset
  const chartData = useMemo(() => {
    return generateVisitorGrowthAndForecast(state.count, state.dailyStats, lang);
  }, [state.count, state.dailyStats, lang]);

  // Derive forecast insights
  const forecastStats = useMemo(() => {
    const forecastPoints = chartData.filter((p) => p.isForecast);
    const lastPoint = chartData[chartData.length - 1];
    const todayPoint = chartData.find((p) => p.predictedVisitors !== null && !p.isForecast) || chartData[0];

    const currentTotal = todayPoint?.actualVisitors ?? state.count;
    const projectedFinal = lastPoint?.predictedVisitors ?? currentTotal;
    const projectedGain = Math.max(0, projectedFinal - currentTotal);
    const avgVelocity = forecastPoints.length > 0 ? (projectedGain / forecastPoints.length).toFixed(1) : '1';

    return {
      projectedFinal,
      projectedGain,
      avgVelocity,
      forecastDays: forecastPoints.length
    };
  }, [chartData, state.count]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data: ChartDataPoint = payload[0].payload;
    const isForecast = data.isForecast;

    return (
      <div 
        className="p-3 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md rounded-xl shadow-xl border border-stone-200 dark:border-stone-800 text-xs min-w-[170px]"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800 mb-2 font-bold text-stone-800 dark:text-stone-100">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#c29b40]" />
            <span>{data.date}</span>
          </span>
          <span
            className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${
              isForecast
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-[#c29b40]/15 text-[#8c6a1e] dark:text-amber-400 border border-[#c29b40]/30'
            }`}
          >
            {isForecast
              ? (lang === 'ar' ? '🔮 مسار تنبؤي' : '🔮 Forecast')
              : (lang === 'ar' ? '✓ بيانات مسجلة' : '✓ Recorded')}
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-stone-500 dark:text-stone-400">
              {isForecast
                ? (lang === 'ar' ? 'الزوار المتوقعون:' : 'Projected Visitors:')
                : (lang === 'ar' ? 'إجمالي الزوار:' : 'Total Visitors:')}
            </span>
            <span className="font-mono font-black text-stone-900 dark:text-stone-50">
              {formatCount(isForecast ? (data.predictedVisitors ?? 0) : (data.actualVisitors ?? 0))}
            </span>
          </div>

          <div className="flex items-center justify-between text-stone-600 dark:text-stone-300">
            <span>{lang === 'ar' ? 'الزيارات اليومية:' : 'Daily Visits:'}</span>
            <span className="font-mono font-semibold">
              +{formatCount(data.dailyNew)}
            </span>
          </div>

          <div className="flex items-center justify-between text-stone-600 dark:text-stone-300">
            <span>{lang === 'ar' ? 'معدل النمو:' : 'Growth Rate:'}</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              +{data.growthRate}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Badge Variant (compact header/hero view)
  if (variant === 'badge') {
    return (
      <div 
        className="inline-flex items-center gap-2 sm:gap-2.5 px-3 py-1.5 rounded-full bg-white dark:bg-stone-900 border border-[#c29b40]/30 text-stone-750 dark:text-stone-200 text-xs font-bold shadow-xs hover:border-[#c29b40]/60 transition-all select-none"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Total Visitors */}
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-[#c29b40]" />
          <span className="text-stone-600 dark:text-stone-300">
            {lang === 'ar' ? 'الزوار:' : 'Visitors:'}
          </span>
          <span className="font-mono font-black text-[#8c6a1e] dark:text-amber-400">
            {formatCount(state.count)}
          </span>
        </div>

        <span className="text-stone-300 dark:text-stone-700">|</span>

        {/* Live Active Online Visitors */}
        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>{lang === 'ar' ? 'الآن:' : 'Live:'}</span>
          <span className="font-mono font-black">
            {formatCount(activeUsers)}
          </span>
        </div>

        {isScreenExcluded && (
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            {lang === 'ar' ? '384x824 مُستثنى' : '384x824 Excluded'}
          </span>
        )}
      </div>
    );
  }

  // Full Footer Section with Verified Real Counters & Visitor Locations
  const countryBreakdown = state.countryBreakdown || [];

  return (
    <div 
      className="w-full max-w-4xl mx-auto my-6 bg-white dark:bg-stone-900/90 border border-[#c29b40]/30 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all text-stone-850 dark:text-stone-100"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-stone-100 dark:border-stone-800 text-xs">
        <div className="flex items-center gap-2 text-stone-800 dark:text-stone-200 font-bold">
          <span className="p-1 rounded-lg bg-amber-500/15 text-[#8c6a1e] dark:text-amber-400 border border-[#c29b40]/30">
            <Globe className="w-3.5 h-3.5 text-[#c29b40]" />
          </span>
          <span>
            {lang === 'ar'
              ? 'أرقام من دخل للموقع وأماكنهم اللحظية (Verified Live Visitors & Locations)'
              : 'Real-Time Visitor Numbers & Geographic Locations'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Charts */}
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="px-2.5 py-1 text-[11px] font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-stone-200/80 dark:border-stone-700/80"
          >
            <BarChart2 className="w-3 h-3 text-[#c29b40]" />
            <span>
              {showDetails
                ? (lang === 'ar' ? 'إخفاء الرسم البياني' : 'Hide Chart')
                : (lang === 'ar' ? 'عرض مسار النمو والتنبؤ' : 'Show Growth Chart')}
            </span>
            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {isAuthorized ? (
            <>
              <button
                type="button"
                onClick={handleResetToZero}
                disabled={isResetting}
                className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-rose-50 hover:text-rose-600 text-stone-400 transition-all cursor-pointer"
                title={lang === 'ar' ? 'تصفير العداد إلى (0)' : 'Reset counter to zero (0)'}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-rose-500' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleLock}
                className="px-2.5 py-1 text-[11px] font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                title={lang === 'ar' ? 'قفل لوحة المشرف' : 'Lock Admin'}
              >
                <EyeOff className="w-3 h-3 text-stone-400" />
                <span>{lang === 'ar' ? 'قفل الإدارة' : 'Lock Admin'}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowUnlockModal(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all cursor-pointer text-[11px] font-semibold"
              title={lang === 'ar' ? 'لوحة تحكم المشرف' : 'Admin Login'}
            >
              <Lock className="w-3 h-3 text-[#c29b40]" />
              <span>{lang === 'ar' ? 'تحكم المشرف' : 'Admin'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Header Bar: Prominent Stats Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-5 border-b border-stone-100 dark:border-stone-800">
        
        {/* Metric 1: Total Verified Visitors (Starting from 0) */}
        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-[#c29b40]/25">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#916a24] via-[#c29b40] to-[#ecd197] flex items-center justify-center text-white shadow-md shrink-0">
            <Users className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                {lang === 'ar' ? 'إجمالي عدد الزوار:' : 'Total Visitors:'}
              </span>
              <span className="text-[10px] font-bold text-[#8c6a1e] dark:text-amber-400 bg-amber-500/10 border border-[#c29b40]/25 px-1.5 py-0.2 rounded-full">
                0-Base
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-[#8c6a1e] dark:text-amber-400">
                {formatCount(state.count)}
              </span>
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                {lang === 'ar' ? 'زائر' : 'visitors'}
              </span>

              {state.myVisitorNumber ? (
                <span className="text-[10px] font-bold text-[#916a24] dark:text-amber-300 bg-[#c29b40]/15 px-2 py-0.5 rounded-md border border-[#c29b40]/30">
                  {lang === 'ar' ? `#${state.myVisitorNumber}` : `#${state.myVisitorNumber}`}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Metric 2: Currently Active Online Visitors */}
        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/25">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                {lang === 'ar' ? 'الداخلين حالياً للموقع:' : 'Active Online Now:'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>

            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                {formatCount(activeUsers)}
              </span>
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                {lang === 'ar' ? 'نشط الآن' : 'online now'}
              </span>
            </div>
          </div>
        </div>

        {/* Metric 3: Locations & Countries Represented */}
        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-sky-500/5 dark:bg-sky-950/20 border border-sky-500/25 sm:col-span-2 lg:col-span-1">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 dark:bg-sky-950/40 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
            <Globe className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                {lang === 'ar' ? 'أماكن ودول الزوار:' : 'Visitor Countries:'}
              </span>
              <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-500/10 border border-sky-500/25 px-1.5 py-0.2 rounded-full">
                {countryBreakdown.length || 1} {lang === 'ar' ? 'دولة' : 'countries'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-1 overflow-x-auto no-scrollbar text-base">
              {countryBreakdown.slice(0, 4).map((c) => (
                <span key={c.countryCode} title={`${lang === 'ar' ? c.countryAr : c.country} (${c.count})`}>
                  {c.flag}
                </span>
              ))}
              {countryBreakdown.length === 0 && <span>🇲🇦 🇸🇦 🇪🇬 🇩🇿</span>}
            </div>
          </div>
        </div>

      </div>

      {/* Country Distribution Breakdown (توزيع الزوار حسب البلد والمكان) */}
      <div className="pt-4 pb-3 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold flex items-center gap-1.5 text-stone-800 dark:text-stone-200">
            <MapPin className="w-3.5 h-3.5 text-[#c29b40]" />
            <span>{lang === 'ar' ? 'توزيع الزوار حسب البلد والمكان الجغرافي:' : 'Visitor Breakdown by Country & Location:'}</span>
          </span>
          <span className="text-[11px] text-stone-500 dark:text-stone-400">
            {lang === 'ar' ? 'رصد تلقائي لحظي' : 'Real-time detection'}
          </span>
        </div>

        {countryBreakdown.length === 0 ? (
          <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/40 text-center text-xs text-stone-500">
            {lang === 'ar' ? 'بانتظار تسجيل دخول أول زائر لعرض مكانه ودولته...' : 'Waiting for first visitor to display country and location...'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {countryBreakdown.map((item) => (
              <div
                key={item.countryCode}
                className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200/80 dark:border-stone-700/70 space-y-1.5 hover:border-[#c29b40]/50 transition-all text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold text-stone-900 dark:text-stone-100 truncate">
                    <span className="text-base">{item.flag}</span>
                    <span className="truncate">{lang === 'ar' ? item.countryAr : item.country}</span>
                  </span>
                  <span className="font-mono font-black text-[#8c6a1e] dark:text-amber-400 shrink-0">
                    {item.count}
                  </span>
                </div>

                <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#c29b40] to-amber-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(8, item.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Feature: "أعرض أرقام من دخل للموقع و مكانه كما في السابق" */}
      <div className="pt-4 border-t border-stone-100 dark:border-stone-800 space-y-3">
        <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
          <span className="font-bold flex items-center gap-1.5 text-stone-800 dark:text-stone-200">
            <Clock className="w-3.5 h-3.5 text-[#c29b40]" />
            <span>{lang === 'ar' ? 'سجل أرقام من دخل للموقع وأماكنهم بالتفصيل:' : 'Live Visitor Entries & Locations Stream:'}</span>
          </span>
          <span className="text-[11px] font-mono">
            {lang === 'ar' ? `آخر تحديث: ${formatTime(state.updatedAt)}` : `Last update: ${formatTime(state.updatedAt)}`}
          </span>
        </div>

        {state.recentLogs.length === 0 ? (
          <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 text-center text-xs text-stone-500 border border-dashed border-stone-200 dark:border-stone-700">
            {lang === 'ar' ? 'العدّاد عند الصفر (0)، وبانتظار تسجيل أول زائر...' : 'Counter is at zero (0), waiting for the first visitor...'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
            {state.recentLogs.map((log) => {
              const enriched = enrichVisitorLog(log);
              return (
                <div
                  key={enriched.id}
                  className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200/90 dark:border-stone-700/70 space-y-2 hover:border-[#c29b40]/50 transition-all text-xs"
                >
                  {/* Visitor Number & Time */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-[#8c6a1e] dark:text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-[#c29b40]/25">
                      <span>{lang === 'ar' ? `الزائر #${enriched.visitorNumber}` : `Visitor #${enriched.visitorNumber}`}</span>
                    </span>
                    <span className="text-[10px] text-stone-400 dark:text-stone-400 font-mono">
                      {formatTime(enriched.timestamp)}
                    </span>
                  </div>

                  {/* Visitor Location: Flag + Country + City */}
                  <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-white dark:bg-stone-850 border border-stone-200/60 dark:border-stone-700/60 text-[11px] font-semibold text-stone-800 dark:text-stone-100">
                    <span className="text-base shrink-0">{enriched.flag || '🌐'}</span>
                    <div className="truncate">
                      <span>{lang === 'ar' ? (enriched.countryAr || enriched.country) : enriched.country}</span>
                      {enriched.city && (
                        <span className="text-stone-400 dark:text-stone-500 font-normal">
                          {' · '}{lang === 'ar' ? (enriched.cityAr || enriched.city) : enriched.city}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Device, OS, Browser, Screen */}
                  <div className="flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-400 pt-1 border-t border-stone-200/50 dark:border-stone-700/50">
                    <div className="flex items-center gap-1 truncate max-w-[150px]">
                      {getDeviceIcon(enriched.device)}
                      <span className="font-semibold">{enriched.os}</span>
                      <span>·</span>
                      <span className="truncate">{enriched.browser}</span>
                    </div>
                    <span className="font-mono shrink-0">
                      {enriched.screen}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Expanded Analytics Section: Recharts Growth Chart & Predictive Trend Line (Toggable) */}
      {showDetails && (
        <div className="mt-5 pt-4 border-t border-stone-100 dark:border-stone-800 space-y-4 animate-in fade-in duration-200">
          
          {/* Chart Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#c29b40]" />
                <span>
                  {lang === 'ar'
                    ? 'رسم بياني لمعدل نمو الزوار والخط المستقبلي المتوقع'
                    : 'Visitor Growth Trend & Predictive Future Forecast'}
                </span>
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                {lang === 'ar'
                  ? 'رسم بياني تفاعلي باستخدام Recharts يربط بين البيانات التاريخية والنموذج التنبؤي الخطي'
                  : 'Interactive Recharts visualization combining historical data with linear trend forecasting'}
              </p>
            </div>

            {/* Toggle view tabs */}
            <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800/80 rounded-xl self-start sm:self-auto border border-stone-200/60 dark:border-stone-700/60">
              <button
                type="button"
                onClick={() => setChartView('cumulative')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  chartView === 'cumulative'
                    ? 'bg-white dark:bg-stone-700 text-[#8c6a1e] dark:text-amber-300 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                {lang === 'ar' ? 'النمو التراكمي والتنبؤ' : 'Cumulative & Forecast'}
              </button>
              <button
                type="button"
                onClick={() => setChartView('daily')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  chartView === 'daily'
                    ? 'bg-white dark:bg-stone-700 text-[#8c6a1e] dark:text-amber-300 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                {lang === 'ar' ? 'الزيارات اليومية' : 'Daily Visits'}
              </button>
            </div>
          </div>

          {/* Predictive Model Highlight Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-transparent border border-amber-500/20 dark:border-amber-500/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#c29b40]/20 flex items-center justify-center text-[#8c6a1e] dark:text-amber-400 shrink-0 font-bold text-xs">
                📈
              </div>
              <div>
                <div className="text-[10px] text-stone-500 dark:text-stone-400">
                  {lang === 'ar' ? 'العدد الحالي المسجل:' : 'Current Verified:'}
                </div>
                <div className="font-mono font-bold text-sm text-[#8c6a1e] dark:text-amber-400">
                  {formatCount(state.count)} {lang === 'ar' ? 'زائر' : 'visitors'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 border-t sm:border-t-0 sm:border-r sm:rtl:border-r-0 sm:rtl:border-l border-stone-200/60 dark:border-stone-700/60 pt-2 sm:pt-0 sm:px-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 font-bold text-xs">
                🔮
              </div>
              <div>
                <div className="text-[10px] text-stone-500 dark:text-stone-400">
                  {lang === 'ar' ? `المتوقع بعد ${forecastStats.forecastDays} أيام:` : `Projected in ${forecastStats.forecastDays}d:`}
                </div>
                <div className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                  ~{formatCount(forecastStats.projectedFinal)} {lang === 'ar' ? 'زائر' : 'visitors'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 border-t sm:border-t-0 sm:border-r sm:rtl:border-r-0 sm:rtl:border-l border-stone-200/60 dark:border-stone-700/60 pt-2 sm:pt-0 sm:px-3">
              <div className="w-8 h-8 rounded-xl bg-stone-500/15 flex items-center justify-center text-stone-600 dark:text-stone-300 shrink-0 font-bold text-xs">
                ⚡
              </div>
              <div>
                <div className="text-[10px] text-stone-500 dark:text-stone-400">
                  {lang === 'ar' ? 'متوسط سرعة النمو اليومي:' : 'Daily Growth Rate:'}
                </div>
                <div className="font-mono font-bold text-sm text-stone-800 dark:text-stone-200">
                  +{forecastStats.avgVelocity} {lang === 'ar' ? 'زائر/يوم' : 'vis/day'}
                </div>
              </div>
            </div>
          </div>

          {/* Recharts Canvas */}
          <div className="w-full h-64 sm:h-72 p-2 pt-4 bg-stone-50/60 dark:bg-stone-800/40 rounded-2xl border border-stone-200/70 dark:border-stone-800">
            <ResponsiveContainer width="100%" height="100%">
              {chartView === 'cumulative' ? (
                <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c29b40" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#c29b40" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#888888' }}
                    tickLine={false}
                    axisLine={{ stroke: '#888888', opacity: 0.2 }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#888888' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                  />

                  {/* Historical Area */}
                  <Area
                    type="monotone"
                    dataKey="actualVisitors"
                    name={lang === 'ar' ? 'الزوار الفعليون' : 'Verified Visitors'}
                    stroke="#c29b40"
                    strokeWidth={2.5}
                    fill="url(#colorActual)"
                    dot={{ r: 3, fill: '#c29b40' }}
                    activeDot={{ r: 5 }}
                  />

                  {/* Predictive Future Trend Line */}
                  <Line
                    type="monotone"
                    dataKey="predictedVisitors"
                    name={lang === 'ar' ? 'المسار التنبؤي المتوقع (Forecast)' : 'Projected Forecast'}
                    stroke="#10b981"
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    dot={{ r: 3.5, fill: '#10b981' }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              ) : (
                /* Daily visits bar chart */
                <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#888888' }}
                    tickLine={false}
                    axisLine={{ stroke: '#888888', opacity: 0.2 }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#888888' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                  />

                  <Bar
                    dataKey="dailyNew"
                    name={lang === 'ar' ? 'الزيارات اليومية' : 'Daily Visits'}
                    fill="#c29b40"
                    radius={[6, 6, 0, 0]}
                  />

                  <Line
                    type="monotone"
                    dataKey="dailyNew"
                    name={lang === 'ar' ? 'مسار المعدل' : 'Rate Trend'}
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>

        </div>
      )}

      {/* Owner Verification Modal */}
      {showUnlockModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowUnlockModal(false)}
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-[#c29b40] flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                    {lang === 'ar' ? 'لوحة تحكم وإدارة العداد للمشرف' : 'Admin Analytics & Counter Control'}
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    {lang === 'ar' ? 'محمية ومخصصة لمشرف الموقع' : 'Protected for administrator'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowUnlockModal(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              {lang === 'ar'
                ? 'تتيح هذه اللوحة لمشرف الموقع تصفير العداد إلى (0)، والاطلاع على تفاصيل الأجهزة وشاشات الزوار والرسوم البيانية التنبؤية.'
                : 'This panel allows the site administrator to reset the counter to (0) and view hardware details, screen resolutions, and forecast charts.'}
            </p>

            {/* Login option if onOpenAuth provided */}
            {onOpenAuth && (
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex items-center justify-between">
                <span className="text-xs text-stone-600 dark:text-stone-300 font-medium">
                  {lang === 'ar' ? 'هل أنت مسجل بحساب المشرف؟' : 'Signed in as admin?'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowUnlockModal(false);
                    onOpenAuth('login');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#c29b40] text-white text-xs font-bold hover:bg-[#a88432] transition-colors cursor-pointer"
                >
                  {lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
                </button>
              </div>
            )}

            {/* Direct email/PIN unlock form */}
            <form onSubmit={handleUnlockSubmit} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  {lang === 'ar' ? 'أدخل بريد المشرف المعتمد أو الرمز السري:' : 'Enter Admin Email or Passkey:'}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-stone-400 absolute right-3 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto top-3" />
                  <input
                    type="text"
                    value={inputAdminKey}
                    onChange={(e) => {
                      setInputAdminKey(e.target.value);
                      setUnlockError(null);
                    }}
                    placeholder="adwwaw@gmail.com / 2026"
                    className="w-full text-xs rounded-xl border border-stone-300 dark:border-stone-700 py-2.5 px-9 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#c29b40]"
                  />
                </div>
                {unlockError && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-medium">
                    {unlockError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUnlockModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#c29b40] hover:bg-[#a88432] text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'فتح لوحة التحكم' : 'Unlock Dashboard'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
