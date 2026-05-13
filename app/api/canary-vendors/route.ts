import { NextRequest } from "next/server";
import { db } from "@/db";
import { canaryVendors, canaryNotifications } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vendor_email, company_name, category, risk_level } = body;

    if (!vendor_email || !company_name || !category) {
      return Response.json(
        { ok: false, error: { code: "MISSING_FIELDS", message: "vendor_email, company_name, and category are required" } },
        { status: 400 }
      );
    }

    const [vendor] = await db
      .insert(canaryVendors)
      .values({
        vendorEmail: vendor_email,
        companyName: company_name,
        category,
        riskLevel: risk_level ?? "medium",
        status: "pending",
      })
      .returning();

    // Record onboarding notification
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
      { ok: false, error: { code: "SERVER_ERROR", message: String(err) } },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const vendors = await db
      .select()
      .from(canaryVendors)
      .orderBy(desc(canaryVendors.createdAt));
    return Response.json({ ok: true, vendors });
  } catch (err) {
    console.error("GET /api/canary-vendors error:", err);
    return Response.json(
      { ok: false, error: { code: "SERVER_ERROR", message: String(err) } },
      { status: 500 }
    );
  }
}
