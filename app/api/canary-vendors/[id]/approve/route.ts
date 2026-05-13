import { NextRequest } from "next/server";
import { db } from "@/db";
import { canaryVendors, canaryNotifications } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { review_note } = body;

    // Check vendor exists
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
        reviewNote: review_note ?? null,
        reviewedBy: "admin",
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(canaryVendors.id, id))
      .returning();

    // Record approval notification
    await db.insert(canaryNotifications).values({
      vendorId: id,
      type: "vendor_approved",
      message: `Vendor ${vendor.companyName} has been approved. Note: ${review_note ?? "No note provided"}.`,
      status: "unread",
    });

    return Response.json({ ok: true, vendor });
  } catch (err) {
    console.error("POST /api/canary-vendors/[id]/approve error:", err);
    return Response.json(
      { ok: false, error: { code: "SERVER_ERROR", message: String(err) } },
      { status: 500 }
    );
  }
}
