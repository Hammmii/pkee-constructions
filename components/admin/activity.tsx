import type { PayloadRequest } from "payload";
import type { ReactNode } from "react";

import { ADMIN_CSS } from "@/components/admin/styles";
import {
  buildActivityQuery,
  isManagerRole,
  LEAD_COLLECTIONS,
  type LeadCollectionSlug,
  leadSubtitle,
  leadTitle,
  relativeTime,
} from "@/lib/admin";

type ViewProps = {
  initPageResult: { req: PayloadRequest };
};

type ActivityRow = {
  createdAt: string;
  href: string;
  id: string | number;
  status: string;
  subtitle: string | null;
  title: string;
  type: LeadCollectionSlug;
};

/** Short badge glyphs per lead type (no emoji — initials in a chip). */
const TYPE_BADGE: Record<LeadCollectionSlug, string> = {
  quotes: "QT",
  "dealer-applications": "DA",
  "contact-messages": "CM",
  consultations: "CS",
  "sample-requests": "SR",
};

const STATUS_OPTIONS = [
  "new",
  "contacted",
  "qualified",
  "site-visit",
  "design",
  "quote-preparing",
  "quote-sent",
  "negotiation",
  "won",
  "lost",
  "archived",
  "under-review",
  "documents-pending",
  "approved",
  "rejected",
  "read",
  "confirmed",
  "completed",
  "cancelled",
  "processing",
  "shipped",
  "fulfilled",
];

const queryOf = (req: PayloadRequest): Record<string, string> => {
  const source = (req as { query?: Record<string, string | string[]> }).query ?? {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === "string" && value !== "") out[key] = value;
  }
  return out;
};

async function ActivityView({ initPageResult }: ViewProps) {
  const { payload, user } = initPageResult.req;
  const roles = (user as { roles?: string[] } | null)?.roles ?? [];
  const query = queryOf(initPageResult.req);

  const typeFilter = LEAD_COLLECTIONS.some((c) => c.slug === query.type)
    ? (query.type as LeadCollectionSlug)
    : undefined;
  const statusFilter = query.status ?? undefined;
  const where = buildActivityQuery({ status: statusFilter });

  const collections = typeFilter
    ? LEAD_COLLECTIONS.filter((c) => c.slug === typeFilter)
    : [...LEAD_COLLECTIONS];

  const results = await Promise.all(
    collections.map(({ slug }) =>
      payload.find({
        collection: slug,
        where,
        sort: "-createdAt",
        limit: 200,
        depth: 1,
        overrideAccess: true,
      }),
    ),
  );

  const rows: ActivityRow[] = [];
  results.forEach((result, index) => {
    const slug = collections[index]?.slug;
    if (!slug) return;
    for (const doc of result.docs) {
      const record = doc as unknown as Record<string, unknown>;
      rows.push({
        createdAt: String(record.createdAt ?? ""),
        href: `/admin/collections/${slug}/${String(record.id)}`,
        id: doc.id,
        status: typeof record.status === "string" ? record.status : "unknown",
        subtitle: leadSubtitle(slug, record),
        title: leadTitle(slug, record),
        type: slug,
      });
    }
  });
  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const visible = rows.slice(0, 200);

  return (
    <div className="pk-wrap" style={{ maxWidth: "none" }}>
      <style>{ADMIN_CSS}</style>
      <h1 className="pk-h1">Activity</h1>
      <p className="pk-sub">
        Last {visible.length} lead events across all intake queues.{" "}
        <a href="/admin">Back to dashboard</a>
      </p>

      <form className="pk-filters" method="get">
        <label>
          <span className="pk-muted">Type</span>
          <select name="type" defaultValue={typeFilter ?? ""}>
            <option value="">All types</option>
            {LEAD_COLLECTIONS.map(({ slug, title }) => (
              <option key={slug} value={slug}>
                {title}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="pk-muted">Status</span>
          <select name="status" defaultValue={statusFilter ?? ""}>
            <option value="">Any status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Filter</button>
        {(typeFilter || statusFilter) && <a href="/admin/activity">Reset</a>}
      </form>

      {visible.length === 0 ? (
        <p className="pk-muted">No lead events match these filters.</p>
      ) : (
        <ul className="pk-activity">
          {visible.map((row) => (
            <li key={`${row.type}-${String(row.id)}`}>
              <span className="pk-type" data-type={row.type}>
                {TYPE_BADGE[row.type]}
              </span>
              <span className="pk-activity-main">
                <a href={row.href}>{row.title}</a>
                {row.subtitle ? <span className="pk-muted">{row.subtitle}</span> : null}
              </span>
              <span className="pk-chip">{row.status}</span>
              <time className="pk-muted" dateTime={row.createdAt} title={row.createdAt}>
                {relativeTime(row.createdAt)}
              </time>
            </li>
          ))}
        </ul>
      )}

      {isManagerRole(roles) ? (
        <p className="pk-muted">
          Export:{" "}
          {LEAD_COLLECTIONS.map(
            ({ slug, title }, index): ReactNode => (
              <span key={slug}>
                {index > 0 ? " · " : ""}
                <a href={`/custom/api/export/${slug}`}>{title} CSV</a>
              </span>
            ),
          )}
        </p>
      ) : null}
    </div>
  );
}

export { ActivityView };
