/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Sparkles,
  PieChart as PieChartIcon,
  Activity,
  Layers,
  Calendar,
  Flame,
  Zap,
  Clock,
  Download,
  RefreshCw,
  ArrowUpRight,
  CheckCircle2,
  PenTool,
  Clapperboard,
  Image as ImageIcon,
  Video,
  Lightbulb,
  BookOpen,
  LayoutTemplate,
  Film,
  Compass,
  Cpu,
  Sliders,
  Check,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { PromptHistoryItem, AppLanguage, ActiveTab } from '../types';
import {
  calculateUserAnalytics,
  exportAnalyticsCSV,
  UserAnalyticsSummary,
  DailyActivityPoint,
  CategoryMetric,
  FeatureUsageMetric,
  ModelUsageMetric
} from '../utils/userAnalyticsService';
import { showToast } from './ToastNotification';
import VisitorCounter from './VisitorCounter';

interface UserAnalyticsDashboardProps {
  lang: AppLanguage;
  history: PromptHistoryItem[];
  onNavigateTab: (tab: ActiveTab) => void;
  onSendToTester?: (promptText: string) => void;
}

export const UserAnalyticsDashboard: React.FC<UserAnalyticsDashboardProps> = ({
  lang,
  history,
  onNavigateTab,
  onSendToTester
}) => {
  const isAr = lang === 'ar';

  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');
  const [metricView, setMetricView] = useState<'prompts' | 'words'>('prompts');
  const [categoryChartType, setCategoryChartType] = useState<'bar' | 'pie'>('bar');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);

  // Calculate live analytics data
  const [analytics, setAnalytics] = useState<UserAnalyticsSummary>(() =>
    calculateUserAnalytics(history, timeRange, lang)
  );

  // Recalculate on props or timerange changes
  useEffect(() => {
    setAnalytics(calculateUserAnalytics(history, timeRange, lang));
  }, [history, timeRange, lang]);

  // Listen for live events dispatched when prompts are generated
  useEffect(() => {
    const handleLiveEvent = () => {
      setAnalytics(calculateUserAnalytics(history, timeRange, lang));
    };
    window.addEventListener('arabprompt-analytics-updated', handleLiveEvent);
    return () => {
      window.removeEventListener('arabprompt-analytics-updated', handleLiveEvent);
    };
  }, [history, timeRange, lang]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setAnalytics(calculateUserAnalytics(history, timeRange, lang));
      setIsRefreshing(false);
      showToast(isAr ? 'تم تحديث الرسوم والبيانات التحليلية بنجاح' : 'Analytics refreshed successfully', false);
    }, 400);
  };

  const handleExport = () => {
    exportAnalyticsCSV(analytics);
    showToast(isAr ? 'تم تصدير تقرير التحليلات كملف CSV' : 'Analytics exported as CSV file', false);
  };

  // Helper for Feature Icons
  const getFeatureIcon = (id: string) => {
    switch (id) {
      case 'builder': return <PenTool className="w-4 h-4" />;
      case 'cinema': return <Clapperboard className="w-4 h-4" />;
      case 'reverse': return <ImageIcon className="w-4 h-4" />;
      case 'drone': return <Video className="w-4 h-4" />;
      case 'ideas': return <Lightbulb className="w-4 h-4" />;
      case 'templates': return <LayoutTemplate className="w-4 h-4" />;
      case 'library': return <BookOpen className="w-4 h-4" />;
      case 'sequence': return <Film className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  // Custom Tooltip for Area Chart
  const CustomAreaTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: DailyActivityPoint = payload[0].payload;
      return (
        <div className="bg-[#1c1a16] text-white p-3.5 rounded-2xl shadow-xl border border-stone-800 text-xs space-y-1.5 z-50">
          <div className="font-bold text-amber-400 flex items-center justify-between gap-4 border-b border-stone-800 pb-1.5">
            <span>{data.label}</span>
            <span className="text-[10px] text-stone-400 font-mono">{data.date}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-stone-300">{isAr ? 'الأوامر المُولدة:' : 'Generated Prompts:'}</span>
            <span className="font-black text-white">{data.prompts}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-stone-300">{isAr ? 'الكلمات المهندسة:' : 'Words Generated:'}</span>
            <span className="font-bold text-amber-300 font-mono">{data.wordsGenerated.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-[11px]">
            <span className="text-stone-400">{isAr ? 'أوامر مطوّرة:' : 'Optimized:'}</span>
            <span className="font-bold text-emerald-400">{data.optimizedCount}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Category Chart
  const CustomCategoryTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1c1a16] text-white p-3 rounded-2xl shadow-xl border border-stone-800 text-xs space-y-1 z-50">
          <div className="font-bold text-amber-400">{isAr ? data.nameAr : data.nameEn}</div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-stone-300">{isAr ? 'عدد الأوامر:' : 'Prompts Count:'}</span>
            <span className="font-black text-white">{data.count}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-stone-300">{isAr ? 'نسبة الاستخدام:' : 'Usage Share:'}</span>
            <span className="font-black text-amber-400 font-mono">{data.percentage}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      
      {/* Top Banner & Control Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1c1a16] via-[#24211c] to-[#171613] text-stone-100 rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-800/80">
        <div className="absolute top-0 end-0 -mt-8 -me-8 w-64 h-64 bg-[#c29b40]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 start-0 -mb-8 -ms-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#c29b40]/20 text-amber-400 border border-[#c29b40]/40">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>{isAr ? 'لوحة البيانات والتحليلات' : 'Interactive Analytics'}</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{isAr ? 'تحديث حي ومباشر' : 'Live Real-time'}</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-stone-800 text-stone-300 border border-stone-700">
                <span>{isAr ? 'مجاني 100% للجميع' : '100% Free Forever'}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white font-sans flex items-center gap-2">
              <span>{isAr ? 'لوحة تحليلات استخدام المنصة' : 'User Platform Analytics Dashboard'}</span>
              <Activity className="w-6 h-6 text-[#c29b40] shrink-0" />
            </h1>

            <p className="text-xs sm:text-sm text-stone-400 max-w-2xl font-normal leading-relaxed">
              {isAr
                ? 'استكشف رسوماً بيانية تفاعلية دقيقة توضح معدلات استخدامك لميزات عرب برومبت، عدد الأوامر المُولدة، أكثر الأصناف استخداماً، ومعدل النشاط اليومي عبر Recharts.'
                : 'Explore interactive charts and metrics tracking feature usage rates, generated prompts volume, top categories, and daily activity rhythm powered by Recharts.'}
            </p>
          </div>

          {/* Quick Actions & Filters */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Time range selector */}
            <div className="inline-flex items-center p-1 rounded-2xl bg-stone-900/90 border border-stone-800 text-xs font-bold shadow-inner">
              <button
                type="button"
                onClick={() => setTimeRange('7d')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  timeRange === '7d'
                    ? 'bg-[#c29b40] text-stone-950 font-black shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {isAr ? '7 أيام' : '7 Days'}
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('30d')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  timeRange === '30d'
                    ? 'bg-[#c29b40] text-stone-950 font-black shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {isAr ? '30 يوماً' : '30 Days'}
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('all')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  timeRange === 'all'
                    ? 'bg-[#c29b40] text-stone-950 font-black shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {isAr ? 'الكل' : 'All'}
              </button>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-700/80 text-stone-200 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              title={isAr ? 'تحديث الإحصائيات' : 'Refresh Data'}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isAr ? 'تحديث' : 'Refresh'}</span>
            </button>

            {/* Export CSV Report */}
            <button
              type="button"
              onClick={handleExport}
              className="px-3.5 py-2 rounded-2xl bg-[#c29b40] hover:bg-[#b08b33] text-stone-950 text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-[#c29b40]/20 cursor-pointer"
              title={isAr ? 'تصدير التقرير التحليلي كملف CSV' : 'Export CSV Report'}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAr ? 'تصدير CSV' : 'Export CSV'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Metric 1: عدد الأوامر المُولدة (Total Generated Prompts) */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 border border-stone-200/90 dark:border-stone-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                {isAr ? 'عدد الأوامر المُولدة' : 'Total Generated Prompts'}
              </span>
              <div className="text-3xl sm:text-4xl font-black text-stone-900 dark:text-stone-100 font-mono tracking-tight">
                {analytics.totalGenerated.toLocaleString()}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
            <span className="text-emerald-700 dark:text-emerald-400 font-black flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{analytics.todayCount} {isAr ? 'اليوم' : 'today'}</span>
            </span>
            <span className="text-stone-500 dark:text-stone-400 font-medium">
              {analytics.optimizationRate}% {isAr ? 'معدل هندسي' : 'optimized'}
            </span>
          </div>
        </div>

        {/* Metric 2: أكثر الأصناف استخداماً (Most Used Category) */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 border border-stone-200/90 dark:border-stone-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                {isAr ? 'أكثر الأصناف استخداماً' : 'Most Used Category'}
              </span>
              <div className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 truncate max-w-[170px]" title={isAr ? analytics.mostUsedCategory.nameAr : analytics.mostUsedCategory.nameEn}>
                {isAr ? analytics.mostUsedCategory.nameAr : analytics.mostUsedCategory.nameEn}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20 group-hover:scale-105 transition-transform">
              <Flame className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
            <span className="font-mono font-black text-rose-700 dark:text-rose-400">
              {analytics.mostUsedCategory.percentage}% {isAr ? 'من مجمل الأوامر' : 'of total'}
            </span>
            <span className="text-stone-500 dark:text-stone-400 font-bold">
              {analytics.mostUsedCategory.count} {isAr ? 'أمر' : 'prompts'}
            </span>
          </div>
        </div>

        {/* Metric 3: معدل النشاط اليومي (Daily Activity Rate) */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 border border-stone-200/90 dark:border-stone-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                {isAr ? 'معدل النشاط اليومي' : 'Daily Activity Rate'}
              </span>
              <div className="text-3xl sm:text-4xl font-black text-stone-900 dark:text-stone-100 font-mono tracking-tight flex items-baseline gap-1">
                <span>{analytics.dailyAverage}</span>
                <span className="text-xs font-bold text-stone-400">{isAr ? 'أمر/يوم' : 'p/day'}</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20 group-hover:scale-105 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
            <span className="text-stone-500 dark:text-stone-400 font-medium truncate max-w-[150px]">
              {isAr ? 'ذروة النشاط:' : 'Peak:'} <span className="font-bold text-stone-800 dark:text-stone-200">{analytics.peakDayLabel}</span>
            </span>
            <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
              {analytics.peakDayCount} {isAr ? 'أمر' : 'pts'}
            </span>
          </div>
        </div>

        {/* Metric 4: الميزة المفضلة وتوفير الوقت */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 border border-stone-200/90 dark:border-stone-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                {isAr ? 'الميزة الأكثر إنتاجية' : 'Top Active Feature'}
              </span>
              <div className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 truncate max-w-[170px]" title={isAr ? analytics.mostUsedFeature.nameAr : analytics.mostUsedFeature.nameEn}>
                {isAr ? analytics.mostUsedFeature.nameAr : analytics.mostUsedFeature.nameEn}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:scale-105 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
            <span className="font-mono font-black text-emerald-700 dark:text-emerald-400">
              ~{analytics.totalWordsEstimated.toLocaleString()} {isAr ? 'كلمة مهندسة' : 'words'}
            </span>
            <span className="text-stone-500 dark:text-stone-400 font-medium">
              {analytics.mostUsedFeature.percentage}% {isAr ? 'مشاركة' : 'share'}
            </span>
          </div>
        </div>
      </div>

      {/* Chart 1: معدل النشاط اليومي وتوليد الأوامر عبر الزمن (Daily Activity Rhythm) */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-7 border border-stone-200/90 dark:border-stone-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#c29b40]/15 text-[#916a24] dark:text-amber-400 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100 font-sans">
                {isAr ? 'معدل النشاط اليومي وتوليد الأوامر' : 'Daily Activity & Generation Rhythm'}
              </h2>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {isAr
                ? 'رسم بياني يوضح وتيرة إنشاء الأوامر والكلمات المصوغة على مدار الأيام'
                : 'Timeline tracking prompt volume and synthesized word output over days'}
            </p>
          </div>

          {/* Metric toggle */}
          <div className="inline-flex items-center p-1 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs font-bold border border-stone-200/60 dark:border-stone-700">
            <button
              type="button"
              onClick={() => setMetricView('prompts')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                metricView === 'prompts'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-black'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              {isAr ? 'عدد الأوامر' : 'Prompts'}
            </button>
            <button
              type="button"
              onClick={() => setMetricView('words')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                metricView === 'words'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-black'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              {isAr ? 'الكلمات المهندسة' : 'Words'}
            </button>
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="h-72 sm:h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="promptGoldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c29b40" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#c29b40" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="wordsBlueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#78716c' }}
                axisLine={{ stroke: '#88888830' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#78716c' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomAreaTooltip />} />
              {metricView === 'prompts' ? (
                <Area
                  type="monotone"
                  dataKey="prompts"
                  stroke="#c29b40"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#promptGoldGradient)"
                  activeDot={{ r: 6, fill: '#c29b40', stroke: '#fff', strokeWidth: 2 }}
                />
              ) : (
                <Area
                  type="monotone"
                  dataKey="wordsGenerated"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#wordsBlueGradient)"
                  activeDot={{ r: 6, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Sub-legend */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#c29b40]" />
              <span>{isAr ? 'الأوامر المُولدة في اليوم' : 'Daily Prompts'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>{isAr ? 'أوامر مطابقة لمعايير الجودة (95%)' : 'High-Quality Engineered (95%)'}</span>
            </span>
          </div>
          <span className="font-mono text-stone-400 text-[11px]">
            {isAr ? 'المتوسط:' : 'Avg:'} {analytics.dailyAverage} {isAr ? 'أمر / يوم' : 'prompts / day'}
          </span>
        </div>
      </div>

      {/* Grid: 2 Columns (Left: أكثر الأصناف استخداماً - Right: معدل استخدام الميزات المختلفة) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        
        {/* Section 2: أكثر الأصناف استخداماً (Category Breakdown) */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-7 border border-stone-200/90 dark:border-stone-800 shadow-sm flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between gap-3 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100 font-sans">
                    {isAr ? 'أكثر الأصناف استخداماً' : 'Most Used Categories'}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {isAr ? 'توزيع الأوامر حسب مجالات الإنتاج والتوليد' : 'Distribution across creative and functional domains'}
                  </p>
                </div>
              </div>

              {/* Chart type toggle */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700">
                <button
                  type="button"
                  onClick={() => setCategoryChartType('bar')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    categoryChartType === 'bar' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs' : 'text-stone-400'
                  }`}
                  title={isAr ? 'مخطط أعمدة' : 'Bar Chart'}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryChartType('pie')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    categoryChartType === 'pie' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs' : 'text-stone-400'
                  }`}
                  title={isAr ? 'مخطط دائري' : 'Pie Chart'}
                >
                  <PieChartIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Recharts Bar or Pie Chart */}
            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {categoryChartType === 'bar' ? (
                  <BarChart
                    data={analytics.categoryBreakdown.slice(0, 6)}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#88888820" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#78716c' }} axisLine={false} tickLine={false} />
                    <YAxis
                      dataKey={isAr ? 'nameAr' : 'nameEn'}
                      type="category"
                      tick={{ fontSize: 11, fill: '#78716c' }}
                      axisLine={false}
                      tickLine={false}
                      width={90}
                    />
                    <Tooltip content={<CustomCategoryTooltip />} />
                    <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                      {analytics.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <PieChart>
                    <Tooltip content={<CustomCategoryTooltip />} />
                    <Pie
                      data={analytics.categoryBreakdown.slice(0, 6)}
                      dataKey="count"
                      nameKey={isAr ? 'nameAr' : 'nameEn'}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {analytics.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-pie-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Chips List */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
            {analytics.categoryBreakdown.slice(0, 6).map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-800 text-xs"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="font-semibold text-stone-700 dark:text-stone-300 truncate">
                    {isAr ? cat.nameAr : cat.nameEn}
                  </span>
                </div>
                <span className="font-mono font-black text-stone-900 dark:text-stone-100 text-[11px] shrink-0">
                  {cat.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: معدلات استخدام الميزات المختلفة (Feature Usage Rates) */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-7 border border-stone-200/90 dark:border-stone-800 shadow-sm flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between gap-3 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100 font-sans">
                    {isAr ? 'معدلات استخدام الميزات المختلفة' : 'Feature Usage Rates'}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {isAr ? 'نسبة تفاعل المستخدمين مع أدوات المنصة' : 'Engagement breakdown across tools and workspaces'}
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                {isAr ? '8 ميزات نشطة' : '8 Active Tools'}
              </span>
            </div>

            {/* Recharts Bar Chart of Features */}
            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.featureBreakdown.slice(0, 6)}
                  margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                  <XAxis
                    dataKey={isAr ? 'nameAr' : 'nameEn'}
                    tick={{ fontSize: 10, fill: '#78716c' }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    axisLine={{ stroke: '#88888830' }}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#78716c' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: any, _name: any, item: any) => [
                      `${value} ${isAr ? 'عملية' : 'actions'} (${item.payload.percentage}%)`,
                      isAr ? item.payload.nameAr : item.payload.nameEn
                    ]}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {analytics.featureBreakdown.map((entry, index) => (
                      <Cell key={`feat-cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick jump to feature cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
            {analytics.featureBreakdown.slice(0, 4).map((feat) => (
              <button
                key={feat.id}
                type="button"
                onClick={() => onNavigateTab(feat.id as ActiveTab)}
                className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/60 dark:border-stone-800 text-right rtl:text-right ltr:text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-white">
                  <div className="p-1 rounded-lg bg-white dark:bg-stone-900 shadow-2xs text-[#c29b40]">
                    {getFeatureIcon(feat.id)}
                  </div>
                  <span className="font-mono text-[10px] font-bold text-stone-400">{feat.percentage}%</span>
                </div>
                <div className="mt-1 font-bold text-[11px] text-stone-800 dark:text-stone-200 truncate">
                  {isAr ? feat.nameAr : feat.nameEn}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section 4: تفضيلات نماذج الذكاء الاصطناعي (AI Models Distribution) & التوصيات الذكية */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* AI Models Distribution */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-7 border border-stone-200/90 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100 font-sans">
                {isAr ? 'النماذج الأكثر استهدافاً' : 'Targeted AI Models'}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {isAr ? 'تفضيلات صياغة الأوامر لمختلف النماذج' : 'Calibrated model distribution'}
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {analytics.modelBreakdown.map((model) => (
              <div key={model.model} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: model.color }} />
                    <span>{model.nameEn}</span>
                  </span>
                  <span className="font-mono font-bold text-stone-500 dark:text-stone-400">
                    {model.count} ({model.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${model.percentage}%`, backgroundColor: model.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Prompt Engineering Recommendations */}
        <div className="lg:col-span-2 bg-gradient-to-br from-stone-50 to-[#faf7ee] dark:from-stone-900 dark:to-[#1f1d18] rounded-3xl p-6 sm:p-7 border border-[#c29b40]/30 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#c29b40] text-stone-950 flex items-center justify-center font-black">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100 font-sans">
                  {isAr ? 'رؤى وتحليلات لتحسين جودة أوامرك' : 'Smart Optimization Insights'}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {isAr ? 'توصيات مبنية على أنماط استخدامك الأكثر نشاطاً' : 'Actionable guidance tailored to your top categories'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('builder')}
              className="px-3 py-1.5 rounded-xl bg-[#c29b40] hover:bg-[#b08b33] text-stone-950 text-xs font-black transition-all flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <span>{isAr ? 'هندسة أمر جديد' : 'New Prompt'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-stone-850/80 border border-stone-200/70 dark:border-stone-800 space-y-1.5">
              <div className="flex items-center gap-2 text-[#916a24] dark:text-amber-400 text-xs font-black">
                <CheckCircle2 className="w-4 h-4" />
                <span>{isAr ? 'صنف الفن والسينما هو الأبرز' : 'Visual Arts & Cinema Synergy'}</span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                {isAr
                  ? 'بما أن صنف الفن والسينما يحظى بأعلى معدل نشاط، ننصح باستعمال محددات العدسة (35mm Anamorphic) ونسب الأبعاد (--ar 16:9) للحصول على أقصى دقة واقعية.'
                  : 'Since visual art and cinema dominate your volume, leverage anamorphic 35mm lens specs and aspect ratios (--ar 16:9) for photorealistic perfection.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 dark:bg-stone-850/80 border border-stone-200/70 dark:border-stone-800 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-black">
                <Zap className="w-4 h-4" />
                <span>{isAr ? 'معدل هندسة وتطوير مرتفع (95%)' : 'High Optimization Rate (95%)'}</span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                {isAr
                  ? 'الأوامر المطورة تعتمد هيكلية الـ Persona والـ Context والشروط المانعة (Negative Prompts)، مما يقلل الهلوسة في نماذج Gemini و ChatGPT.'
                  : 'Your prompts consistently utilize Persona, Context, and Negative constraints, reducing hallucinations across Gemini and ChatGPT.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 dark:bg-stone-850/80 border border-stone-200/70 dark:border-stone-800 space-y-1.5">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-black">
                <Clock className="w-4 h-4" />
                <span>{isAr ? 'ذروة التفاعل الأسبوعي' : 'Weekly Rhythm Peak'}</span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                {isAr
                  ? `أعلى معدل لتوليد الأوامر سُجّل يوم ${analytics.peakDayLabel} بواقع ${analytics.peakDayCount} أمر. يمكنك تفعيل الحفظ السحابي لضمان مزامنة كافة مسوداتك.`
                  : `Your highest generation activity occurred on ${analytics.peakDayLabel} with ${analytics.peakDayCount} prompts. Consider cloud sync to preserve all drafts.`}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 dark:bg-stone-850/80 border border-stone-200/70 dark:border-stone-800 space-y-1.5">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-xs font-black">
                <Sparkles className="w-4 h-4" />
                <span>{isAr ? 'استكشاف الهندسة العكسية' : 'Explore Reverse Prompting'}</span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                {isAr
                  ? 'جرّب أداة الهندسة العكسية للصور لاستخراج تفاصيل الإضاءة وزوايا الكاميرا تلقائياً من أي صورة مرجعية بضغطة زر واحدة.'
                  : 'Try our Reverse Prompting tool to extract camera angles, lighting setup, and aesthetic tokens automatically from any reference image.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Verified Live Visitors & Locations Section */}
      <div className="pt-2">
        <VisitorCounter lang={lang} variant="full" />
      </div>

    </div>
  );
};
