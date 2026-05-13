import { NextRequest } from "next/server";
import { db } from "@/db";
import { canaryVendorDocuments, canaryVendors, canaryNotifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

function sanitizeText(s: unknown, maxLen = 255): string | null {
  if (typeof s !== "string") return null;
  const trimmed = s.trim().slice(0, maxLen);
  return trimmed.length > 0 ? trimmed : null;
}

function isValidHttpsUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const vendor_id = sanitizeText(body.vendor_id, 36);
    const document_name = sanitizeText(body.document_name);
    const document_url = sanitizeText(body.document_url, 2048);
    const document_type = sanitizeText(body.document_type);

    if (!vendor_id || !document_name || !document_url || !document_type) {
      return Response.json(
        { ok: false, error: { code: "MISSING_FIELDS", message: "vendor_id, document_name, document_url, and document_type are required" } },
        { status: 400 }
      );
    }

    if (!isValidHttpsUrl(document_url)) {
      return Response.json(
        { ok: false, error: { code: "INVALID_URL", message: "document_url must be a valid URL" } },
        { status: 400 }
      );
    }

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
      { ok: false, error: { code: "SERVER_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10), 0);

    const documents = await db
      .select()
      .from(canaryVendorDocuments)
      .orderBy(desc(canaryVendorDocuments.createdAt))
      .limit(limit)
      .offset(offset);

    return Response.json({ ok: true, documents });
  } catch (err) {
    console.error("GET /api/canary-vendor-documents error:", err);
    return Response.json(
      { ok: false, error: { code: "SERVER_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
