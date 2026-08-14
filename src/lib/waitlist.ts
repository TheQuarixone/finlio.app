import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Display seed so the counter doesn't start at zero pre-launch.
const SEED_COUNT = 1_284;

// Contacts are stored in Resend (workspace-level, no audience needed) instead
// of a local JSON file. A local file can't be relied on in production: the
// serverless filesystem is read-only outside /tmp, and /tmp itself doesn't
// persist across invocations or instances, so every write there either
// throws or silently disappears.
export async function getWaitlistCount(): Promise<number> {
  const { data } = await resend.contacts.list();
  return SEED_COUNT + (data?.data.length ?? 0);
}

export async function addToWaitlist(
  email: string
): Promise<{ added: boolean; count: number }> {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const normalized = email.trim().toLowerCase();

  const { data: existing, error: lookupError } = await resend.contacts.get({
    email: normalized,
  });

  if (lookupError && lookupError.name !== "not_found") {
    throw new Error(lookupError.message);
  }

  if (existing) {
    return { added: false, count: await getWaitlistCount() };
  }

  const { error } = await resend.contacts.create({ email: normalized });

  if (error) {
    throw new Error(error.message);
  }

  return { added: true, count: await getWaitlistCount() };
}
