/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebaseAuth';

export type SubscriptionPlan = 'free' | 'lite' | 'pro' | 'studio';

export interface UserSubscription {
  plan: SubscriptionPlan;
  status: 'active' | 'cancelled' | 'trial' | 'unpaid';
  billingCycle: 'monthly' | 'annual';
  startDate: string;
  renewalDate: string;
  dailyUsageCount: number;
  lastUsageDate: string;
  bonusPromptsToday?: number;
  transactionId?: string;
  paymentMethod?: string;
}

const STORAGE_KEY = 'arabi_prompt_user_subscription';

// 100% Free platform: All limits unlocked unconditionally
export const PLAN_LIMITS = {
  free: {
    nameAr: 'المنصة مجانية بالكامل للجميع',
    nameEn: '100% Free Platform for Everyone',
    maxDailyPrompts: 999999,
    maxCinemaProjects: 999999,
    hasFaceAnchor: true,
    hasShareSequence: true,
    hasVideoReverser: true,
    hasExportPdf: true,
    hasApiAccess: true,
    hasAds: false,
    isPaidOnly: false,
    priceMonthly: 0,
    priceAnnual: 0,
  },
  lite: {
    nameAr: 'المنصة مجانية بالكامل (Lite)',
    nameEn: '100% Free (Lite)',
    maxDailyPrompts: 999999,
    maxCinemaProjects: 999999,
    hasFaceAnchor: true,
    hasShareSequence: true,
    hasVideoReverser: true,
    hasExportPdf: true,
    hasApiAccess: true,
    hasAds: false,
    isPaidOnly: false,
    priceMonthly: 0,
    priceAnnual: 0,
  },
  pro: {
    nameAr: 'المنصة مجانية بالكامل (Pro Creator)',
    nameEn: '100% Free (Pro Creator)',
    maxDailyPrompts: 999999,
    maxCinemaProjects: 999999,
    hasFaceAnchor: true,
    hasShareSequence: true,
    hasVideoReverser: true,
    hasExportPdf: true,
    hasApiAccess: true,
    hasAds: false,
    isPaidOnly: false,
    priceMonthly: 0,
    priceAnnual: 0,
  },
  studio: {
    nameAr: 'المنصة مجانية بالكامل (Studio)',
    nameEn: '100% Free (Studio)',
    maxDailyPrompts: 999999,
    maxCinemaProjects: 999999,
    hasFaceAnchor: true,
    hasShareSequence: true,
    hasVideoReverser: true,
    hasExportPdf: true,
    hasApiAccess: true,
    hasAds: false,
    isPaidOnly: false,
    priceMonthly: 0,
    priceAnnual: 0,
  }
};

const DEFAULT_SUBSCRIPTION: UserSubscription = {
  plan: 'pro',
  status: 'active',
  billingCycle: 'annual',
  startDate: new Date().toISOString(),
  renewalDate: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(),
  dailyUsageCount: 0,
  lastUsageDate: new Date().toISOString().split('T')[0]
};

/**
 * Checks if the user is an active subscriber (always true on 100% free platform)
 */
export function isPaidSubscriber(_sub?: UserSubscription): boolean {
  return true;
}

/**
 * Retrieve active subscription from localStorage
 */
export function getSubscription(): UserSubscription {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SUBSCRIPTION;
    const parsed = JSON.parse(raw) as UserSubscription;
    parsed.status = 'active';
    parsed.plan = 'pro';
    return parsed;
  } catch {
    return DEFAULT_SUBSCRIPTION;
  }
}

export function saveSubscriptionLocally(sub: UserSubscription): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sub));
    window.dispatchEvent(new CustomEvent('subscription-updated', { detail: sub }));
  } catch (err) {
    console.warn('Failed to save subscription locally:', err);
  }
}

/**
 * Persist subscription to Firestore if user is authenticated
 */
export async function syncSubscriptionToFirestore(userId: string, sub: UserSubscription): Promise<void> {
  if (!userId) return;
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      plan: 'pro',
      subscriptionStatus: 'active',
      billingCycle: 'annual',
      renewalDate: sub.renewalDate,
      dailyUsageCount: sub.dailyUsageCount,
      lastUsageDate: sub.lastUsageDate,
      lastActive: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Failed to sync subscription to Firestore:', err);
  }
}

/**
 * Upgrades or activates a subscription (free)
 */
export async function upgradeSubscription(
  plan: SubscriptionPlan = 'pro',
  billingCycle: 'monthly' | 'annual' = 'annual',
  paymentMethod: string = 'free',
  userId?: string
): Promise<UserSubscription> {
  const updated: UserSubscription = {
    plan,
    status: 'active',
    billingCycle,
    startDate: new Date().toISOString(),
    renewalDate: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(),
    dailyUsageCount: 0,
    lastUsageDate: new Date().toISOString().split('T')[0],
    transactionId: 'FREE_ACCESS',
    paymentMethod
  };

  saveSubscriptionLocally(updated);

  if (userId) {
    await syncSubscriptionToFirestore(userId, updated);
  }

  return updated;
}

/**
 * Check if the user is allowed to make a generation (always allowed on 100% free platform)
 */
export function checkGenerationQuota(): { 
  allowed: boolean; 
  remaining: number; 
  max: number; 
  plan: SubscriptionPlan;
  isPaid: boolean;
  requiresSubscription: boolean;
} {
  return {
    allowed: true,
    remaining: 999999,
    max: 999999,
    plan: 'pro',
    isPaid: true,
    requiresSubscription: false
  };
}

/**
 * Record generation usage
 */
export function recordGenerationUsage(userId?: string): {
  thresholdReached: 80 | 90 | 100 | null;
  used: number;
  remaining: number;
  max: number;
} {
  const sub = getSubscription();
  sub.dailyUsageCount = (sub.dailyUsageCount || 0) + 1;
  sub.lastUsageDate = new Date().toISOString().split('T')[0];
  saveSubscriptionLocally(sub);

  if (userId) {
    syncSubscriptionToFirestore(userId, sub).catch(() => {});
  }

  return {
    thresholdReached: null,
    used: sub.dailyUsageCount,
    remaining: 999999,
    max: 999999
  };
}

export async function cancelSubscription(userId?: string): Promise<UserSubscription> {
  const sub = getSubscription();
  return sub;
}

export interface UsageStats {
  plan: SubscriptionPlan;
  planNameAr: string;
  planNameEn: string;
  dailyUsageCount: number;
  maxDailyPrompts: number;
  bonusPromptsToday: number;
  remainingRequests: number;
  percentUsed: number;
  percentRemaining: number;
  isUnlimited: boolean;
  isNearLimit: boolean;
  isLimitReached: boolean;
  isPaid: boolean;
  timeUntilReset: string;
  statusLevel: 'normal' | 'warning' | 'critical' | 'unlimited' | 'unpaid';
}

export function getTimeUntilMidnightReset(): string {
  return '00:00:00';
}

export function claimAdRewardBonus(): { success: boolean; newRemaining: number; totalBonusToday: number } {
  return { success: true, newRemaining: 999999, totalBonusToday: 0 };
}

/**
 * Computes real-time usage statistics (unlimited free access for everyone)
 */
export function getUsageStats(_subParam?: UserSubscription): UsageStats {
  return {
    plan: 'pro',
    planNameAr: 'مجاني بالكامل للجميع',
    planNameEn: '100% Free for Everyone',
    dailyUsageCount: 0,
    maxDailyPrompts: 999999,
    bonusPromptsToday: 0,
    remainingRequests: 999999,
    percentUsed: 0,
    percentRemaining: 100,
    isUnlimited: true,
    isNearLimit: false,
    isLimitReached: false,
    isPaid: true,
    timeUntilReset: '00:00:00',
    statusLevel: 'unlimited'
  };
}
