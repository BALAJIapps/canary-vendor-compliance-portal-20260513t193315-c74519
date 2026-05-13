import { NextRequest } from "next/server";
import { db } from "@/db";
import { canaryVendorDocuments, canaryVendors, canaryNotifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vendor_id, document_name, document_url, document_type } = body;

    if (!vendor_id || !document_name || !document_url || !document_type) {
      return Response.json(
        { ok: false, error: { code: "MISSING_FIELDS", message: "vendor_id, document_name, document_url, and document_type are required" } },
        { status: 400 }
      );
    }

    // Verify vendor exists
    const [vendor] = await db
      .select()
      .from(canaryVendors)
      .where(eq(canaryVendors.id, vendor_id))
      .limit(1);

    if (!vendor) {
      return Response.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Vendor not found" } },
        { status: 404 }
      );
    }

    const [document] = await db
      .insert(canaryVendorDocuments)
      .values({
        vendorId: vendor_id,
        documentName: document_name,
        documentUrl: document_url,
        documentType: document_type,
      })
      .returning();

    // Record document notification
    await db.insert(canaryNotifications).values({
      vendorId: vendor_id,
      type: "document_uploaded",
      message: `Document "${document_name}" uploaded for vendor ${vendor.companyName}.`,
      status: "unread",
    });

    return Response.json({ ok: true, document }, { status: 201 });
  } catch (err) {
    console.error("POST /api/canary-vendor-documents error:", err);
    return Response.json(
      { ok: false, error: { code: "SERVER_ERROR", message: String(err) } },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const documents = await db
      .select()
      .from(canaryVendorDocuments)
      .orderBy(desc(canaryVendorDocuments.createdAt));
    return Response.json({ ok: true, documents });
  } catch (err) {
    console.error("GET /api/canary-vendor-documents error:", err);
    return Response.json(
      { ok: false, error: { code: "SERVER_ERROR", message: String(err) } },
      { status: 500 }
    );
  }
}
