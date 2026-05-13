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

export default function HomePage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [documents, setDocuments] = useState<VendorDocument[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<"onboard" | "documents" | "admin" | "dashboard">("onboard");

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
        setSubmitMsg(`Vendor ${companyName} submitted for review.`);
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
        setDocSubmitMsg(`Document "${documentName}" recorded successfully.`);
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
        setApproveMsg("Vendor approved successfully.");
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

  const pendingVendors = vendors.filter((v) => v.status === "pending");
  const approvedVendors = vendors.filter((v) => v.status === "approved");
  const totalDocs = documents.length;
  const unreadNotifs = notifications.filter((n) => n.status === "unread").length;

  return (
    <div className="min-h-screen" style={{ background: "#f5f4ef", color: "#111827", fontFamily: "Ubuntu, system-ui, sans-serif" }}>
      <header style={{ background: "#072C2C", color: "#f5f4ef" }} className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-7 w-7" style={{ color: "#FF5F03" }} />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">VendorShield</h1>
            <p className="text-xs opacity-60">Compliance &amp; Vendor Management Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm opacity-75">
            <Bell className="h-4 w-4" />
            <span>{unreadNotifs} new</span>
          </div>
          <Badge style={{ background: "#FF5F03", color: "white", border: "none" }}>
            {vendors.length} Vendors
          </Badge>
        </div>
      </header>

      <nav className="px-6 pt-4 flex gap-1 border-b" style={{ borderColor: "#ddd8cc" }}>
        {(["onboard", "documents", "admin", "dashboard"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            aria-pressed={activeTab === tab}
            className="px-4 py-2 text-sm font-medium rounded-t transition-colors"
            style={{
              background: activeTab === tab ? "#072C2C" : "transparent",
              color: activeTab === tab ? "#f5f4ef" : "#555",
              borderBottom: activeTab === tab ? "2px solid #FF5F03" : "2px solid transparent",
            }}
          >
            {tab === "onboard" ? "Register Vendor" : tab === "admin" ? "Admin Approval" : tab === "documents" ? "Documents" : "Dashboard"}
          </button>
        ))}
      </nav>

      <main className="px-6 py-6 max-w-6xl mx-auto">

        {activeTab === "onboard" && (
          <div className="grid md:grid-cols-[1fr_1.4fr] gap-6">
            <Card style={{ background: "white", border: "1px solid #ddd8cc" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base" style={{ color: "#072C2C" }}>
                  <Building2 className="h-5 w-5" style={{ color: "#FF5F03" }} />
                  Vendor Onboarding
                </CardTitle>
                <p className="text-sm" style={{ color: "#666" }}>Register a new vendor for compliance review</p>
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
                    <select id="risk_level" value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" style={{ borderColor: "#ddd8cc", background: "white" }}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full font-medium" style={{ background: "#072C2C", color: "white" }}>
                    {submitting ? "Submitting..." : "Register Vendor"}
                  </Button>
                  {submitMsg && (
                    <p className="text-sm mt-2" role="status" style={{ color: submitMsg.includes("failed") || submitMsg.includes("error") || submitMsg.includes("Error") ? "#DC2626" : "#16A34A" }}>
                      {submitMsg}
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>

            <Card style={{ background: "white", border: "1px solid #ddd8cc" }}>
              <CardHeader>
                <CardTitle className="text-base" style={{ color: "#072C2C" }}>Recent Vendors</CardTitle>
              </CardHeader>
              <CardContent>
                {vendors.length === 0 ? (
                  <p className="text-sm" style={{ color: "#888" }}>No vendors registered yet. Submit the form to get started.</p>
                ) : (
                  <div className="space-y-3">
                    {vendors.slice(0, 8).map((v) => (
                      <div key={v.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "#f0ece3" }}>
                        <div>
                          <p className="text-sm font-medium" style={{ color: "#072C2C" }}>{v.companyName}</p>
                          <p className="text-xs" style={{ color: "#888" }}>{v.vendorEmail} &middot; {v.category}</p>
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
        )}

        {activeTab === "documents" && (
          <div className="grid md:grid-cols-[1fr_1.4fr] gap-6">
            <Card style={{ background: "white", border: "1px solid #ddd8cc" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base" style={{ color: "#072C2C" }}>
                  <Upload className="h-5 w-5" style={{ color: "#FF5F03" }} />
                  Record Document
                </CardTitle>
                <p className="text-sm" style={{ color: "#666" }}>Attach a compliance document to a vendor</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDocSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="doc_vendor" className="text-sm font-medium">Vendor</Label>
                    <select id="doc_vendor" value={docVendorId} onChange={(e) => setDocVendorId(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" style={{ borderColor: "#ddd8cc", background: "white" }} required>
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
                  <Button type="submit" disabled={docSubmitting} className="w-full font-medium" style={{ background: "#072C2C", color: "white" }}>
                    {docSubmitting ? "Saving..." : "Save Document"}
                  </Button>
                  {docSubmitMsg && (
                    <p className="text-sm mt-2" role="status" style={{ color: docSubmitMsg.includes("failed") || docSubmitMsg.includes("error") ? "#DC2626" : "#16A34A" }}>
                      {docSubmitMsg}
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>

            <Card style={{ background: "white", border: "1px solid #ddd8cc" }}>
              <CardHeader>
                <CardTitle className="text-base" style={{ color: "#072C2C" }}>Uploaded Documents</CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <p className="text-sm" style={{ color: "#888" }}>No documents recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {documents.slice(0, 10).map((d) => (
                      <div key={d.id} className="flex items-start gap-3 py-2 border-b last:border-0" style={{ borderColor: "#f0ece3" }}>
                        <FileCheck className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#FF5F03" }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "#072C2C" }}>{d.documentName}</p>
                          <p className="text-xs" style={{ color: "#888" }}>{d.documentType}</p>
                        </div>
                        <a href={d.documentUrl} target="_blank" rel="noreferrer noopener" className="text-xs underline shrink-0" style={{ color: "#FF5F03" }}>View</a>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "admin" && (
          <div className="space-y-6">
            <Card style={{ background: "white", border: "1px solid #ddd8cc" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base" style={{ color: "#072C2C" }}>
                  <ShieldCheck className="h-5 w-5" style={{ color: "#FF5F03" }} />
                  Approve Vendor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-[1fr_2fr_auto] gap-3 items-end">
                  <div>
                    <Label htmlFor="approve_vendor" className="text-sm font-medium">Vendor</Label>
                    <select id="approve_vendor" value={approveVendorId} onChange={(e) => setApproveVendorId(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" style={{ borderColor: "#ddd8cc", background: "white" }}>
                      <option value="">Select vendor...</option>
                      {vendors.filter((v) => v.status === "pending").map((v) => (
                        <option key={v.id} value={v.id}>{v.companyName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="review_note" className="text-sm font-medium">Reviewer Note</Label>
                    <Input id="review_note" placeholder="Approved for canary" value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} className="mt-1" />
                  </div>
                  <Button onClick={() => approveVendorId && handleApprove(approveVendorId, reviewNote)} disabled={approving || !approveVendorId} style={{ background: "#16A34A", color: "white" }}>
                    {approving ? "Approving..." : "Approve"}
                  </Button>
                </div>
                {approveMsg && (
                  <p className="text-sm mt-3" role="status" style={{ color: approveMsg.includes("failed") || approveMsg.includes("error") ? "#DC2626" : "#16A34A" }}>
                    {approveMsg}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card style={{ background: "white", border: "1px solid #ddd8cc" }}>
              <CardHeader>
                <CardTitle className="text-base" style={{ color: "#072C2C" }}>Vendor Review Queue</CardTitle>
              </CardHeader>
              <CardContent>
                {vendors.length === 0 ? (
                  <p className="text-sm" style={{ color: "#888" }}>No vendors to review.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: "2px solid #f0ece3" }}>
                          <th className="text-left py-2 pr-4 font-medium" style={{ color: "#072C2C" }}>Company</th>
                          <th className="text-left py-2 pr-4 font-medium" style={{ color: "#072C2C" }}>Category</th>
                          <th className="text-left py-2 pr-4 font-medium" style={{ color: "#072C2C" }}>Risk</th>
                          <th className="text-left py-2 pr-4 font-medium" style={{ color: "#072C2C" }}>Status</th>
                          <th className="text-left py-2 pr-4 font-medium" style={{ color: "#072C2C" }}>Documents</th>
                          <th className="text-left py-2 font-medium" style={{ color: "#072C2C" }}>Reviewer Note</th>
                          <th className="text-left py-2 pl-4 font-medium" style={{ color: "#072C2C" }}>Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendors.map((v) => {
                          const vendorDocs = documents.filter((d) => d.vendorId === v.id);
                          return (
                            <tr key={v.id} style={{ borderBottom: "1px solid #f0ece3" }}>
                              <td className="py-2 pr-4">
                                <p className="font-medium" style={{ color: "#072C2C" }}>{v.companyName}</p>
                                <p className="text-xs" style={{ color: "#888" }}>{v.vendorEmail}</p>
                              </td>
                              <td className="py-2 pr-4" style={{ color: "#555" }}>{v.category}</td>
                              <td className="py-2 pr-4">{riskBadge(v.riskLevel)}</td>
                              <td className="py-2 pr-4">{statusBadge(v.status)}</td>
                              <td className="py-2 pr-4">
                                <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: "#f0ece3", color: "#072C2C" }}>{vendorDocs.length}</span>
                              </td>
                              <td className="py-2 pr-4 text-xs" style={{ color: "#666", maxWidth: 160 }}>
                                {v.reviewNote ?? <span style={{ color: "#bbb" }}>&mdash;</span>}
                              </td>
                              <td className="py-2 pl-4 text-xs" style={{ color: "#888" }}>
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
        )}

        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Vendors", value: vendors.length, icon: Building2, color: "#072C2C" },
                { label: "Pending Review", value: pendingVendors.length, icon: Clock, color: "#D97706" },
                { label: "Approved", value: approvedVendors.length, icon: CheckCircle, color: "#16A34A" },
                { label: "Documents", value: totalDocs, icon: FileCheck, color: "#FF5F03" },
              ].map(({ label, value, icon: Icon, color }) => (
                <Card key={label} style={{ background: "white", border: "1px solid #ddd8cc" }}>
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "#888" }}>{label}</p>
                        <p className="text-3xl font-bold mt-1" style={{ color }}>{value}</p>
                      </div>
                      <Icon className="h-5 w-5 mt-1" style={{ color }} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card style={{ background: "white", border: "1px solid #ddd8cc" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base" style={{ color: "#072C2C" }}>
                  <Bell className="h-5 w-5" style={{ color: "#FF5F03" }} />
                  Activity &amp; Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <p className="text-sm" style={{ color: "#888" }}>No activity recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {notifications.slice(0, 15).map((n) => (
                      <div key={n.id} className="flex items-start gap-3 py-2 border-b last:border-0" style={{ borderColor: "#f0ece3" }}>
                        <div className="mt-1 h-2 w-2 rounded-full shrink-0" style={{ background: n.status === "unread" ? "#FF5F03" : "#ccc" }} />
                        <div className="flex-1">
                          <p className="text-sm" style={{ color: "#111827" }}>{n.message}</p>
                          <p className="text-xs mt-0.5" style={{ color: "#888" }}>{n.type} &middot; {new Date(n.createdAt).toLocaleString()}</p>
                        </div>
                        {n.status === "unread" && <Badge variant="outline" className="text-xs shrink-0">New</Badge>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

      </main>
    </div>
  );
}
