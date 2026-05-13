import { NextRequest } from "next/server";
import { db } from "@/db";
import { canaryVendors, canaryNotifications } from "@/db/schema";
import { desc } from "drizzle-orm";

const VALID_RISK_LEVELS = ["low", "medium", "high"] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeText(s: unknown, maxLen = 255): string | null {
  if (typeof s !== "string") return null;
  const trimmed = s.trim().slice(0, maxLen);
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const vendor_email = sanitizeText(body.vendor_email, 254);
    const company_name = sanitizeText(body.company_name);
    const category = sanitizeText(body.category);
    const risk_level = sanitizeText(body.risk_level) ?? "medium";

    if (!vendor_email || !EMAIL_RE.test(vendor_email)) {
      return Response.json(
        { ok: false, error: { code: "INVALID_EMAIL", message: "A valid vendor_email is required" } },
        { status: 400 }
      );
    }
    if (!company_name) {
      return Response.json(
        { ok: false, error: { code: "MISSING_FIELDS", message: "company_name is required" } },
        { status: 400 }
      );
    }
    if (!category) {
      return Response.json(
        { ok: false, error: { code: "MISSING_FIELDS", message: "category is required" } },
        { status: 400 }
      );
    }
    if (!VALID_RISK_LEVELS.includes(risk_level as (typeof VALID_RISK_LEVELS)[number])) {
      return Response.json(
        { ok: false, error: { code: "INVALID_RISK_LEVEL", message: "risk_level must be low, medium, or high" } },
        { status: 400 }
      );
    }

    const [vendor] = await db
      .insert(canaryVendors)
      .values({
        vendorEmail: vendor_email,
        companyName: company_name,
        category,
        riskLevel: risk_level,
        status: "pending",
      })
      .returning();

    await db.insert(canaryNotifications).values({
      vendorId: vendor.id,
      type: "vendor_onboarded",
      message: `New vendor ${company_name} submitted for compliance review.`,
      status: "unread",
    });

    return Response.json({ ok: true, vendor }, { status: 201 });
  } catch (err) {
    console.error("POST /api/canary-vendors error:", err);
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

    const vendors = await db
      .select()
      .from(canaryVendors)
      .orderBy(desc(canaryVendors.createdAt))
      .limit(limit)
      .offset(offset);

    return Response.json({ ok: true, vendors });
  } catch (err) {
    console.error("GET /api/canary-vendors error:", err);
    return Response.json(
      { ok: false, error: { code: "SERVER_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
