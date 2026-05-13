import { NextRequest } from "next/server";
import { db } from "@/db";
import { canaryNotifications } from "@/db/schema";
import { desc } from "drizzle-orm";

function sanitizeText(s: unknown, maxLen = 255): string | null {
  if (typeof s !== "string") return null;
  const trimmed = s.trim().slice(0, maxLen);
  return trimmed.length > 0 ? trimmed : null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10), 0);

    const notifications = await db
      .select()
      .from(canaryNotifications)
      .orderBy(desc(canaryNotifications.createdAt))
      .limit(limit)
      .offset(offset);

    return Response.json({ ok: true, notifications });
  } catch (err) {
    console.error("GET /api/canary-notifications error:", err);
    return Response.json(
      { ok: false, error: { code: "SERVER_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const type = sanitizeText(body.type, 100);
    const message = sanitizeText(body.message, 1000);
    const vendor_id = sanitizeText(body.vendor_id, 36);

    if (!type || !message) {
      return Response.json(
        { ok: false, error: { code: "MISSING_FIELDS", message: "type and message are required" } },
        { status: 400 }
      );
    }

    const [notification] = await db
      .insert(canaryNotifications)
      .values({
        vendorId: vendor_id ?? null,
        type,
        message,
        status: "unread",
      })
      .returning();

    return Response.json({ ok: true, notification }, { status: 201 });
  } catch (err) {
    console.error("POST /api/canary-notifications error:", err);
    return Response.json(
      { ok: false, error: { code: "SERVER_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
