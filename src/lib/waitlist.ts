import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), ".data", "waitlist.json");

// Display seed so the counter doesn't start at zero pre-launch.
const SEED_COUNT = 1_284;

type WaitlistEntry = {
  email: string;
  joinedAt: string;
};

async function readEntries(): Promise<WaitlistEntry[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as WaitlistEntry[];
  } catch {
    return [];
  }
}

export async function getWaitlistCount(): Promise<number> {
  const entries = await readEntries();
  return SEED_COUNT + entries.length;
}

export async function addToWaitlist(
  email: string
): Promise<{ added: boolean; count: number }> {
  const entries = await readEntries();
  const normalized = email.trim().toLowerCase();

  if (entries.some((entry) => entry.email === normalized)) {
    return { added: false, count: SEED_COUNT + entries.length };
  }

  entries.push({ email: normalized, joinedAt: new Date().toISOString() });
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(entries, null, 2), "utf8");

  return { added: true, count: SEED_COUNT + entries.length };
}
