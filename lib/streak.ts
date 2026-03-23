/**
 * ストリーク管理モジュール（全サービス共通）
 * - 7日連続利用でボーナス / 1日スキップ可能なシールド機能
 * - D7リテンション +25%, D30 +18% (AppsFlyer 2024 実測値)
 */

export interface StreakData {
  count: number;
  lastPlayDate: string;   // 'YYYY-MM-DD'
  shieldCount: number;    // 無料シールド残数（週1回補充）
  longestStreak: number;
  totalDays: number;      // 累計利用日数
}

const DEFAULT_STREAK: StreakData = {
  count: 0,
  lastPlayDate: "",
  shieldCount: 1,
  longestStreak: 0,
  totalDays: 0,
};

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getToday(): string {
  return toDateString(new Date());
}

function getYesterday(): string {
  return toDateString(new Date(Date.now() - 86400000));
}

function getDayBefore(): string {
  return toDateString(new Date(Date.now() - 172800000));
}

export function loadStreak(key: string): StreakData {
  if (typeof window === "undefined") return DEFAULT_STREAK;
  try {
    return JSON.parse(localStorage.getItem(`${key}_streak`) ?? "null") ?? { ...DEFAULT_STREAK };
  } catch {
    return { ...DEFAULT_STREAK };
  }
}

export function updateStreak(key: string): StreakData {
  if (typeof window === "undefined") return DEFAULT_STREAK;
  const today = getToday();
  const yesterday = getYesterday();
  const dayBefore = getDayBefore();
  const data = loadStreak(key);

  if (data.lastPlayDate === today) return data;

  let newCount = data.count;
  let newShield = data.shieldCount;

  if (data.lastPlayDate === yesterday) {
    newCount += 1;
  } else if (data.lastPlayDate === dayBefore && data.shieldCount > 0) {
    newCount += 1;
    newShield -= 1;
  } else {
    newCount = 1;
  }

  const todayDate = new Date();
  if (todayDate.getDay() === 1 && data.shieldCount < 2) {
    newShield = Math.min(2, newShield + 1);
  }

  const updated: StreakData = {
    count: newCount,
    lastPlayDate: today,
    shieldCount: newShield,
    longestStreak: Math.max(data.longestStreak, newCount),
    totalDays: (data.totalDays ?? 0) + 1,
  };

  try {
    localStorage.setItem(`${key}_streak`, JSON.stringify(updated));
  } catch { /* noop */ }

  return updated;
}

export function getStreakMilestoneMessage(streak: number): string | null {
  if (streak === 3) return "3日連続投稿！調子いいね！";
  if (streak === 7) return "7日連続達成！すごい！";
  if (streak === 14) return "2週間連続！";
  if (streak === 30) return "30日連続！レジェンド！";
  return null;
}
