import { NextRequest } from "next/server";
import { db } from "@/db";
import { canaryVendors, canaryNotifications } from "@/db/schema";
import { eq } from "drizzle-orm";

function sanitizeText(s: unknown, maxLen = 255): string | null {
  if (typeof s !== "string") return null;
  const trimmed = s.trim().slice(0, maxLen);
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || typeof id !== "string" || id.length > 36) {
      return Response.json(
        { ok: false, error: { code: "INVALID_ID", message: "Invalid vendor ID" } },
        { status: 400 }
      );
    }

    const body = await req.json();
    // Sanitize review_note to prevent stored XSS — store as plain text only
    const review_note = sanitizeText(body.review_note, 1000);

    const [existing] = await db
      .select()
      .from(canaryVendors)
      .where(eq(canaryVendors.id, id))
      .limit(1);

    if (!existing) {
      return Response.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Vendor not found" } },
        { status: 404 }
      );
    }

    const [vendor] = await db
      .update(canaryVendors)
      .set({
        status: "approved",
        reviewNote: review_note,
        reviewedBy: "admin",
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(canaryVendors.id, id))
      .returning();

    // Sanitize message — never interpolate raw user input into HTML; stored as plain text
    const safeNote = review_note ?? "No note provided";
    await db.insert(canaryNotifications).values({
      vendorId: id,
      type: "vendor_approved",
      message: `Vendor ${vendor.companyName} has been approved. Note: ${safeNote}`,
      status: "unread",
    });

    return Response.json({ ok: true, vendor });
  } catch (err) {
    console.error("POST /api/canary-vendors/[id]/approve error:", err);
    return Response.json(
      { ok: false, error: { code: "SERVER_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
