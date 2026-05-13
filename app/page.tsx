"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  FileCheck,
  Bell,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

type Vendor = {
  id: string;
  vendorEmail: string;
  companyName: string;
  category: string;
  riskLevel: string;
  status: string;
  reviewNote?: string | null;
  createdAt: string;
};

type VendorDocument = {
  id: string;
  vendorId: string;
  documentName: string;
  documentUrl: string;
  documentType: string;
  createdAt: string;
};

type Notification = {
  id: string;
  vendorId?: string | null;
  type: string;
  message: string;
  status: string;
  createdAt: string;
};

function statusBadge(status: string) {
  switch (status) {
    case "approved":
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
    case "rejected":
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
    default:
      return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
  }
}

function riskBadge(risk: string) {
  switch (risk) {
    case "high":
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />High</Badge>;
    case "low":
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Low</Badge>;
    default:
      return <Badge variant="secondary">Medium</Badge>;
  }
}

/** Compliance score: % of vendors approved out of total */
function ComplianceBar({ approved, total }: { approved: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((approved / total) * 100);
  const color = pct >= 80 ? "var(--vs-success)" : pct >= 50 ? "var(--vs-warning)" : "var(--vs-danger)";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--vs-parchment-row)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-sm font-semibold tabular-nums" style={{ color, minWidth: 36 }}>{pct}%</span>
      <span className="text-xs" style={{ color: "var(--vs-muted)" }}>compliant</span>
    </div>
  );
}

/** Animated pulse dot for pending items */
function PulseDot() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: "var(--vs-ember)" }} />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: "var(--vs-ember)" }} />
    </span>
  );
}

export default function HomePage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [documents, setDocuments] = useState<VendorDocument[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [vendorEmail, setVendorEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [category, setCategory] = useState("");
  const [riskLevel, setRiskLevel] = useState("medium");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");

  const [docVendorId, setDocVendorId] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [docSubmitting, setDocSubmitting] = useState(false);
  const [docSubmitMsg, setDocSubmitMsg] = useState("");

  const [approveVendorId, setApproveVendorId] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [approving, setApproving] = useState(false);
  const [approveMsg, setApproveMsg] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      const [vRes, dRes, nRes] = await Promise.all([
        fetch("/api/canary-vendors"),
        fetch("/api/canary-vendor-documents"),
        fetch("/api/canary-notifications"),
      ]);
      const [vData, dData, nData] = await Promise.all([
        vRes.ok ? vRes.json() : { ok: false, vendors: [] },
        dRes.ok ? dRes.json() : { ok: false, documents: [] },
        nRes.ok ? nRes.json() : { ok: false, notifications: [] },
      ]);
      if (vData.ok) setVendors(vData.vendors);
      if (dData.ok) setDocuments(dData.documents);
      if (nData.ok) setNotifications(nData.notifications);
    } catch (e) {
      console.error("fetchAll error", e);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleVendorSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMsg("");
    try {
      const res = await fetch("/api/canary-vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor_email: vendorEmail, company_name: companyName, category, risk_level: riskLevel }),
      });
      const data = await res.json();
      if (data.ok) {
        setSubmitMsg(`${companyName} queued for compliance review.`);
        setVendorEmail(""); setCompanyName(""); setCategory(""); setRiskLevel("medium");
        await fetchAll();
      } else {
        setSubmitMsg(data.error?.message ?? "Submission failed");
      }
    } catch {
      setSubmitMsg("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDocSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDocSubmitting(true);
    setDocSubmitMsg("");
    try {
      const res = await fetch("/api/canary-vendor-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor_id: docVendorId, document_name: documentName, document_url: documentUrl, document_type: documentType }),
      });
      const data = await res.json();
      if (data.ok) {
        setDocSubmitMsg(`"${documentName}" added to compliance file.`);
        setDocVendorId(""); setDocumentName(""); setDocumentUrl(""); setDocumentType("");
        await fetchAll();
      } else {
        setDocSubmitMsg(data.error?.message ?? "Document save failed");
      }
    } catch {
      setDocSubmitMsg("Network error. Please try again.");
    } finally {
      setDocSubmitting(false);
    }
  }

  async function handleApprove(vendorId: string, note: string) {
    setApproving(true);
    setApproveMsg("");
    try {
      const res = await fetch(`/api/canary-vendors/${vendorId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_note: note }),
      });
      const data = await res.json();
      if (data.ok) {
        setApproveMsg("Vendor cleared for onboarding.");
        setApproveVendorId(""); setReviewNote("");
        await fetchAll();
      } else {
        setApproveMsg(data.error?.message ?? "Approval failed");
      }
    } catch {
      setApproveMsg("Network error. Please try again.");
    } finally {
      setApproving(false);
    }
  }

  async function handleReject(vendorId: string) {
    try {
      const res = await fetch(`/api/canary-vendors/${vendorId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_note: "Rejected by admin" }),
      });
      await res.json();
      await fetchAll();
    } catch {
      console.error("reject error");
    }
  }

  const pendingVendors = vendors.filter((v) => v.status === "pending");
  const approvedVendors = vendors.filter((v) => v.status === "approved");
  const unreadNotifs = notifications.filter((n) => n.status === "unread").length;

  return (
    <div className="vs-page min-h-screen">
      {/* Header — distinctive: Oswald display font for brand name, ember accent rule */}
      <header className="vs-header px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg" style={{ background: "var(--vs-ember)" }}>
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold tracking-tighter leading-none" style={{ fontFamily: "Oswald, Georgia, serif", fontSize: "1.5rem", letterSpacing: "-0.02em" }}>
                VendorShield
              </h1>
              <p className="text-xs opacity-50 mt-0.5">Know every vendor before they touch your stack</p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            {/* Compliance score pill — distinctive product-specific element */}
            {vendors.length > 0 && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                <TrendingUp className="h-3.5 w-3.5" style={{ color: "var(--vs-ember)" }} />
                <span className="text-xs font-medium opacity-80">
                  {Math.round((approvedVendors.length / vendors.length) * 100)}% cleared
                </span>
              </div>
            )}
            {pendingVendors.length > 0 && (
              <div className="flex items-center gap-2">
                <PulseDot />
                <span className="text-xs opacity-70">{pendingVendors.length} awaiting review</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-sm opacity-70">
              <Bell className="h-4 w-4" />
              <span>{unreadNotifs}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Compliance score bar — unique to this product */}
      {vendors.length > 0 && (
        <div className="px-6 py-3" style={{ background: "var(--vs-forest)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <span className="text-xs font-medium opacity-50 shrink-0" style={{ color: "white" }}>Portfolio compliance</span>
            <ComplianceBar approved={approvedVendors.length} total={vendors.length} />
          </div>
        </div>
      )}

      <main className="px-6 py-6 max-w-7xl mx-auto space-y-8">

        {/* Dashboard Metrics */}
        <section aria-label="dashboard">
          <h2 className="vs-section-heading text-xs font-semibold uppercase tracking-widest mb-3 opacity-60">Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="vs-card">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="vs-stat-label text-xs font-medium uppercase tracking-wide">Total Vendors</p>
                    <p className="vs-section-heading text-3xl font-bold mt-1">{vendors.length}</p>
                  </div>
                  <Building2 className="vs-section-heading h-5 w-5 mt-1" />
                </div>
              </CardContent>
            </Card>
            <Card className="vs-card">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="vs-stat-label text-xs font-medium uppercase tracking-wide">Pending Review</p>
                    <p className="text-3xl font-bold mt-1 text-amber-600">{pendingVendors.length}</p>
                  </div>
                  <Clock className="text-amber-600 h-5 w-5 mt-1" />
                </div>
              </CardContent>
            </Card>
            <Card className="vs-card">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="vs-stat-label text-xs font-medium uppercase tracking-wide">Approved</p>
                    <p className="text-3xl font-bold mt-1 text-emerald-700">{approvedVendors.length}</p>
                  </div>
                  <CheckCircle className="text-emerald-700 h-5 w-5 mt-1" />
                </div>
              </CardContent>
            </Card>
            <Card className="vs-card">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="vs-stat-label text-xs font-medium uppercase tracking-wide">Documents</p>
                    <p className="vs-icon-accent text-3xl font-bold mt-1">{documents.length}</p>
                  </div>
                  <FileCheck className="vs-icon-accent h-5 w-5 mt-1" />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Vendor Registration */}
        <section aria-label="vendor onboarding">
          <h2 className="vs-section-heading text-xs font-semibold uppercase tracking-widest mb-3 opacity-60">Vendor Registration</h2>
          <div className="grid md:grid-cols-[1fr_1.4fr] gap-6">
            <Card className="vs-card">
              <CardHeader>
                <CardTitle className="vs-section-heading flex items-center gap-2 text-base">
                  <Building2 className="vs-icon-accent h-5 w-5" />
                  Register Vendor
                </CardTitle>
                <p className="text-sm" style={{ color: "var(--vs-subtle)" }}>Add a new vendor to your compliance pipeline</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVendorSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="vendor_email" className="text-sm font-medium">Vendor Email</Label>
                    <Input id="vendor_email" type="email" placeholder="vendor@company.com" value={vendorEmail} onChange={(e) => setVendorEmail(e.target.value)} required className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="company_name" className="text-sm font-medium">Company Name</Label>
                    <Input id="company_name" placeholder="Acme Supplies" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                    <Input id="category" placeholder="Logistics, SaaS, Manufacturing..." value={category} onChange={(e) => setCategory(e.target.value)} required className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="risk_level" className="text-sm font-medium">Risk Level</Label>
                    <select id="risk_level" value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} className="vs-select mt-1 w-full rounded-md border px-3 py-2 text-sm">
                      <option value="low">Low — standard review</option>
                      <option value="medium">Medium — enhanced review</option>
                      <option value="high">High — full due diligence</option>
                    </select>
                  </div>
                  <Button type="submit" disabled={submitting} className="vs-btn-primary w-full font-medium">
                    {submitting ? "Queuing for review..." : "Register Vendor"}
                  </Button>
                  {submitMsg && (
                    <p className="text-sm mt-2" role="status" style={{ color: submitMsg.includes("failed") || submitMsg.includes("error") ? "var(--vs-danger)" : "var(--vs-success)" }}>
                      {submitMsg}
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>

            <Card className="vs-card">
              <CardHeader>
                <CardTitle className="vs-section-heading text-base">Vendor Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                {vendors.length === 0 ? (
                  <div className="py-8 text-center">
                    <Building2 className="h-8 w-8 mx-auto mb-2 opacity-20" style={{ color: "var(--vs-forest)" }} />
                    <p className="text-sm" style={{ color: "var(--vs-muted)" }}>No vendors in pipeline yet.</p>
                    <p className="text-xs mt-1" style={{ color: "var(--vs-muted)" }}>Register your first vendor to begin compliance tracking.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vendors.slice(0, 8).map((v) => (
                      <div key={v.id} className="vs-row-divider flex items-center justify-between py-2 last:border-0">
                        <div className="flex items-center gap-2.5">
                          {v.status === "pending" && <PulseDot />}
                          {v.status === "approved" && <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />}
                          {v.status === "rejected" && <span className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" />}
                          <div>
                            <p className="vs-section-heading text-sm font-medium">{v.companyName}</p>
                            <p className="text-xs" style={{ color: "var(--vs-muted)" }}>{v.vendorEmail} &middot; {v.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {riskBadge(v.riskLevel)}
                          {statusBadge(v.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Document Management */}
        <section aria-label="document upload">
          <h2 className="vs-section-heading text-xs font-semibold uppercase tracking-widest mb-3 opacity-60">Document Management</h2>
          <div className="grid md:grid-cols-[1fr_1.4fr] gap-6">
            <Card className="vs-card">
              <CardHeader>
                <CardTitle className="vs-section-heading flex items-center gap-2 text-base">
                  <Upload className="vs-icon-accent h-5 w-5" />
                  Upload &amp; Record Document
                </CardTitle>
                <p className="text-sm" style={{ color: "var(--vs-subtle)" }}>Attach compliance evidence to a vendor file</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDocSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="doc_vendor" className="text-sm font-medium">Vendor</Label>
                    <select id="doc_vendor" value={docVendorId} onChange={(e) => setDocVendorId(e.target.value)} className="vs-select mt-1 w-full rounded-md border px-3 py-2 text-sm" required>
                      <option value="">Select vendor...</option>
                      {vendors.map((v) => (<option key={v.id} value={v.id}>{v.companyName}</option>))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="document_name" className="text-sm font-medium">Document Name</Label>
                    <Input id="document_name" placeholder="insurance.pdf" value={documentName} onChange={(e) => setDocumentName(e.target.value)} required className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="document_url" className="text-sm font-medium">Document URL</Label>
                    <Input id="document_url" placeholder="https://example.com/doc.pdf" value={documentUrl} onChange={(e) => setDocumentUrl(e.target.value)} required className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="document_type" className="text-sm font-medium">Document Type</Label>
                    <Input id="document_type" placeholder="insurance, contract, license..." value={documentType} onChange={(e) => setDocumentType(e.target.value)} required className="mt-1" />
                  </div>
                  <Button type="submit" disabled={docSubmitting} className="vs-btn-primary w-full font-medium">
                    {docSubmitting ? "Filing document..." : "Save Document"}
                  </Button>
                  {docSubmitMsg && (
                    <p className="text-sm mt-2" role="status" style={{ color: docSubmitMsg.includes("failed") || docSubmitMsg.includes("error") ? "var(--vs-danger)" : "var(--vs-success)" }}>
                      {docSubmitMsg}
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>

            <Card className="vs-card">
              <CardHeader>
                <CardTitle className="vs-section-heading text-base">Compliance File</CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="py-8 text-center">
                    <FileCheck className="h-8 w-8 mx-auto mb-2 opacity-20" style={{ color: "var(--vs-forest)" }} />
                    <p className="text-sm" style={{ color: "var(--vs-muted)" }}>No documents on file yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.slice(0, 10).map((d) => (
                      <div key={d.id} className="vs-row-divider flex items-start gap-3 py-2 last:border-0">
                        <FileCheck className="vs-icon-accent h-4 w-4 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="vs-section-heading text-sm font-medium truncate">{d.documentName}</p>
                          <p className="text-xs" style={{ color: "var(--vs-muted)" }}>{d.documentType}</p>
                        </div>
                        <a href={d.documentUrl} target="_blank" rel="noreferrer noopener" className="vs-doc-link text-xs underline shrink-0">View</a>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Admin Approval */}
        <section aria-label="admin approval">
          <h2 className="vs-section-heading text-xs font-semibold uppercase tracking-widest mb-3 opacity-60">Admin Approval</h2>
          <div className="space-y-4">
            <Card className="vs-card">
              <CardHeader>
                <CardTitle className="vs-section-heading flex items-center gap-2 text-base">
                  <ShieldCheck className="vs-icon-accent h-5 w-5" />
                  Clear or Reject Vendor
                </CardTitle>
                <p className="text-xs" style={{ color: "var(--vs-muted)" }}>
                  Cleared vendors are added to the approved supply chain. Rejections are recorded with full audit trail.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-[1fr_2fr_auto_auto] gap-3 items-end">
                  <div>
                    <Label htmlFor="approve_vendor" className="text-sm font-medium">Vendor</Label>
                    <select id="approve_vendor" value={approveVendorId} onChange={(e) => setApproveVendorId(e.target.value)} className="vs-select mt-1 w-full rounded-md border px-3 py-2 text-sm">
                      <option value="">Select vendor...</option>
                      {vendors.filter((v) => v.status === "pending").map((v) => (
                        <option key={v.id} value={v.id}>{v.companyName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="review_note" className="text-sm font-medium">Reviewer Note</Label>
                    <Input id="review_note" placeholder="e.g. Approved for canary — docs verified" value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} className="mt-1" />
                  </div>
                  <Button onClick={() => approveVendorId && handleApprove(approveVendorId, reviewNote)} disabled={approving || !approveVendorId} className="vs-btn-success" aria-label="Approve vendor">
                    {approving ? "Clearing..." : "Approve"}
                  </Button>
                  <Button onClick={() => approveVendorId && handleReject(approveVendorId)} disabled={approving || !approveVendorId} variant="destructive" aria-label="Reject vendor">
                    Reject
                  </Button>
                </div>
                {approveMsg && (
                  <p className="text-sm mt-3" role="status" style={{ color: approveMsg.includes("failed") || approveMsg.includes("error") ? "var(--vs-danger)" : "var(--vs-success)" }}>
                    {approveMsg}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="vs-card">
              <CardHeader>
                <CardTitle className="vs-section-heading text-base">Review Queue</CardTitle>
              </CardHeader>
              <CardContent>
                {vendors.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--vs-muted)" }}>No vendors to review.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="vs-row-divider" style={{ borderBottomWidth: 2 }}>
                          <th className="vs-section-heading text-left py-2 pr-4 font-medium">Company</th>
                          <th className="vs-section-heading text-left py-2 pr-4 font-medium">Category</th>
                          <th className="vs-section-heading text-left py-2 pr-4 font-medium">Risk</th>
                          <th className="vs-section-heading text-left py-2 pr-4 font-medium">Status</th>
                          <th className="vs-section-heading text-left py-2 pr-4 font-medium">Docs</th>
                          <th className="vs-section-heading text-left py-2 font-medium">Note</th>
                          <th className="vs-section-heading text-left py-2 pl-4 font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendors.map((v) => {
                          const vendorDocs = documents.filter((d) => d.vendorId === v.id);
                          return (
                            <tr key={v.id} className="vs-row-divider">
                              <td className="py-2 pr-4">
                                <p className="vs-section-heading font-medium">{v.companyName}</p>
                                <p className="text-xs" style={{ color: "var(--vs-muted)" }}>{v.vendorEmail}</p>
                              </td>
                              <td className="py-2 pr-4" style={{ color: "var(--vs-subtle)" }}>{v.category}</td>
                              <td className="py-2 pr-4">{riskBadge(v.riskLevel)}</td>
                              <td className="py-2 pr-4">{statusBadge(v.status)}</td>
                              <td className="py-2 pr-4">
                                <span className="vs-mono-chip text-xs font-mono px-2 py-0.5 rounded">{vendorDocs.length}</span>
                              </td>
                              <td className="py-2 pr-4 text-xs" style={{ color: "var(--vs-subtle)", maxWidth: 160 }}>
                                {v.reviewNote ?? <span style={{ color: "var(--vs-muted)" }}>&mdash;</span>}
                              </td>
                              <td className="py-2 pl-4 text-xs" style={{ color: "var(--vs-muted)" }}>
                                {new Date(v.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Notifications */}
        <section aria-label="notifications activity">
          <h2 className="vs-section-heading text-xs font-semibold uppercase tracking-widest mb-3 opacity-60">Notification Activity</h2>
          <Card className="vs-card">
            <CardHeader>
              <CardTitle className="vs-section-heading flex items-center gap-2 text-base">
                <Bell className="vs-icon-accent h-5 w-5" />
                Audit Trail &amp; Notifications
              </CardTitle>
              <p className="text-xs" style={{ color: "var(--vs-muted)" }}>Every vendor action is logged for compliance audit.</p>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="py-8 text-center">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" style={{ color: "var(--vs-forest)" }} />
                  <p className="text-sm" style={{ color: "var(--vs-muted)" }}>No activity yet. Events appear here as vendors move through compliance.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.slice(0, 15).map((n) => (
                    <div key={n.id} className="vs-row-divider flex items-start gap-3 py-2 last:border-0">
                      <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${n.status === "unread" ? "vs-notif-dot-active" : "vs-notif-dot-read"}`} />
                      <div className="flex-1">
                        <p className="text-sm" style={{ color: "var(--vs-text)" }}>{n.message}</p>
                        <p className="text-xs mt-0.5 font-mono" style={{ color: "var(--vs-muted)" }}>{n.type} &middot; {new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                      {n.status === "unread" && <Badge variant="outline" className="text-xs shrink-0">New</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

      </main>
    </div>
  );
}
