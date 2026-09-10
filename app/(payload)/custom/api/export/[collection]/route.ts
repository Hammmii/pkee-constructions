import { headers } from "next/headers";
import { NextResponse } from "next/server";

import {
  buildActivityQuery,
  csvEscape,
  isLeadCollectionSlug,
  isManagerRole,
  type LeadCollectionSlug,
} from "@/lib/admin";
import { getPayloadCached } from "@/lib/payload";

type CsvColumn = {
  heading: string;
  value: (doc: Record<string, unknown>) => unknown;
};

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const num = (v: unknown): number | null => (typeof v === "number" ? v : null);
const group = (doc: Record<string, unknown>, key: string): Record<string, unknown> =>
  (doc[key] ?? {}) as Record<string, unknown>;
const relName = (v: unknown): string => {
  if (!v || typeof v !== "object") return "";
  const title = (v as Record<string, unknown>).title;
  return typeof title === "string" ? title : "";
};

const COLUMNS: Record<LeadCollectionSlug, CsvColumn[]> = {
  quotes: [
    { heading: "reference", value: (d) => str(d.reference) },
    { heading: "status", value: (d) => str(d.status) },
    { heading: "customer name", value: (d) => str(group(d, "customer").name) },
    { heading: "customer email", value: (d) => str(group(d, "customer").email) },
    { heading: "customer phone", value: (d) => str(group(d, "customer").phone) },
    { heading: "city", value: (d) => str(group(d, "customer").city) },
    { heading: "project type", value: (d) => str(group(d, "project").projectType) },
    { heading: "timeline", value: (d) => str(group(d, "project").timeline) },
    { heading: "product", value: (d) => relName(group(d, "material").product) },
    { heading: "finish", value: (d) => str(group(d, "material").finish) },
    { heading: "color", value: (d) => str(group(d, "material").color) },
    { heading: "quantity", value: (d) => num(group(d, "material").quantity) },
    { heading: "unit", value: (d) => str(group(d, "material").unit) },
    { heading: "source", value: (d) => str(d.source) },
    { heading: "landing page", value: (d) => str(d.landingPage) },
    { heading: "lead score", value: (d) => num(d.leadScore) },
    { heading: "created", value: (d) => str(d.createdAt) },
    { heading: "updated", value: (d) => str(d.updatedAt) },
  ],
  "dealer-applications": [
    { heading: "first name", value: (d) => str(d.firstName) },
    { heading: "last name", value: (d) => str(d.lastName) },
    { heading: "company", value: (d) => str(d.companyName) },
    { heading: "email", value: (d) => str(d.email) },
    { heading: "phone", value: (d) => str(d.phone) },
    { heading: "city", value: (d) => str(d.city) },
    { heading: "province", value: (d) => str(d.province) },
    { heading: "business type", value: (d) => str(d.businessType) },
    { heading: "years in business", value: (d) => num(d.yearsInBusiness) },
    { heading: "annual turnover", value: (d) => str(d.annualTurnover) },
    { heading: "gst number", value: (d) => str(d.gstNumber) },
    { heading: "territory", value: (d) => str(d.territory) },
    { heading: "status", value: (d) => str(d.status) },
    { heading: "created", value: (d) => str(d.createdAt) },
    { heading: "updated", value: (d) => str(d.updatedAt) },
  ],
  "contact-messages": [
    { heading: "name", value: (d) => str(d.name) },
    { heading: "email", value: (d) => str(d.email) },
    { heading: "phone", value: (d) => str(d.phone) },
    { heading: "subject", value: (d) => str(d.subject) },
    { heading: "message", value: (d) => str(d.message) },
    { heading: "status", value: (d) => str(d.status) },
    { heading: "created", value: (d) => str(d.createdAt) },
    { heading: "updated", value: (d) => str(d.updatedAt) },
  ],
  consultations: [
    { heading: "type", value: (d) => str(d.type) },
    { heading: "date", value: (d) => str(d.date) },
    { heading: "time", value: (d) => str(d.time) },
    { heading: "project type", value: (d) => str(d.projectType) },
    { heading: "product interest", value: (d) => str(d.productInterest) },
    { heading: "contact name", value: (d) => str(group(d, "contact").name) },
    { heading: "contact email", value: (d) => str(group(d, "contact").email) },
    { heading: "contact phone", value: (d) => str(group(d, "contact").phone) },
    { heading: "status", value: (d) => str(d.status) },
    { heading: "created", value: (d) => str(d.createdAt) },
    { heading: "updated", value: (d) => str(d.updatedAt) },
  ],
  "sample-requests": [
    { heading: "product", value: (d) => relName(d.product) },
    { heading: "color", value: (d) => str(d.color) },
    { heading: "finish", value: (d) => str(d.finish) },
    { heading: "quantity", value: (d) => num(d.quantity) },
    { heading: "contact name", value: (d) => str(group(d, "contact").name) },
    { heading: "contact email", value: (d) => str(group(d, "contact").email) },
    { heading: "contact phone", value: (d) => str(group(d, "contact").phone) },
    { heading: "address", value: (d) => str(group(d, "contact").address) },
    { heading: "status", value: (d) => str(d.status) },
    { heading: "created", value: (d) => str(d.createdAt) },
    { heading: "updated", value: (d) => str(d.updatedAt) },
  ],
};

type RouteContext = {
  params: Promise<{ collection: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  const { collection } = await params;
  if (!isLeadCollectionSlug(collection)) {
    return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  }

  const payload = await getPayloadCached();
  const { user } = await payload.auth({ headers: await headers() });
  const roles = (user as { roles?: string[] } | null)?.roles ?? [];
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isManagerRole(roles)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  if ((from && Number.isNaN(Date.parse(from))) || (to && Number.isNaN(Date.parse(to)))) {
    return NextResponse.json(
      { error: "Invalid date range — use YYYY-MM-DD or ISO timestamps" },
      { status: 400 },
    );
  }

  const result = await payload.find({
    collection,
    where: buildActivityQuery({ from, to }),
    sort: "-createdAt",
    limit: 5000,
    depth: 1,
    overrideAccess: true,
  });

  const columns = COLUMNS[collection];
  const header = columns.map((column) => csvEscape(column.heading)).join(",");
  const encoder = new TextEncoder();
  const docs = result.docs as unknown as Record<string, unknown>[];

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // UTF-8 BOM so Excel opens the file with correct encoding.
      controller.enqueue(encoder.encode(`\uFEFF${header}\n`));
      for (const doc of docs) {
        const row = columns.map((column) => csvEscape(column.value(doc))).join(",");
        controller.enqueue(encoder.encode(`${row}\n`));
      }
      controller.close();
    },
  });

  const stamp = (to ?? from ?? new Date().toISOString().slice(0, 10)).replaceAll("-", "");
  return new Response(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pkee-${collection}-${stamp}.csv"`,
    },
  });
}
