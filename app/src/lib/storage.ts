/**
 * 数据访问层
 * 实现《数据库设计说明书》第 6 章 Repository 接口契约
 */

import type { Database } from '@/types';

const STORAGE_KEY = 'salesflow:db';
export const DB_VERSION = 1;

export class StorageError extends Error {}

function readRaw(): Database | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Database;
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.users)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function loadDb(): Database | null {
  return readRaw();
}

export function saveDb(db: Database): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    // NFR-R-02：写入失败不得静默失败
    throw new StorageError(
      `本地存储写入失败：${e instanceof Error ? e.message : String(e)}。可能是存储容量已满，请在系统管理中导出备份后重置数据。`,
    );
  }
}

export function clearDb(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export const SESSION_KEY = 'salesflow:session';

export interface Session {
  userId: string;
  loginAt: string;
}

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function saveSession(s: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
