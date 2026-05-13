import { NextRequest } from "next/server";
import { db } from "@/db";
import { canaryNotifications } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const notifications = await db
      .select()
      .from(canaryNotifications)
      .orderBy(desc(canaryNotifications.createdAt));
    return Response.json({ ok: true, notifications });
  } catch (err) {
    console.error("GET /api/canary-notifications error:", err);
    return Response.json(
      { ok: false, error: { code: "SERVER_ERROR", message: String(err) } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vendor_id, type, message } = body;

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
      { ok: false, error: { code: "SERVER_ERROR", message: String(err) } },
      { status: 500 }
    );
  }
}
