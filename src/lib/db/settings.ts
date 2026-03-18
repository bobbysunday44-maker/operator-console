/* ── Settings Helper ──
 * Read API keys and config from the Setting table.
 * Workers use this instead of process.env so keys saved
 * via the UI are available without restart.
 */

import { prisma } from "./prisma";

export async function getSetting(key: string): Promise<string | null> {
  const setting = await prisma.setting.findUnique({ where: { key } });
  return setting?.value ?? process.env[key] ?? null;
}

export async function getRequiredSetting(key: string): Promise<string> {
  const value = await getSetting(key);
  if (!value) {
    throw new Error(`Setting "${key}" is not configured. Set it in Settings > API Keys.`);
  }
  return value;
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const settings = await prisma.setting.findMany();
  const result: Record<string, string> = {};
  for (const s of settings) {
    result[s.key] = s.value;
  }
  return result;
}
