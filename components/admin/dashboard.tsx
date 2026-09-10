import type { Payload } from "payload";

import { ADMIN_CSS } from "@/components/admin/styles";
import {
  isManagerRole,
  type LeadCollectionSlug,
  leadSubtitle,
  leadTitle,
  relativeTime,
  slaCounts,
} from "@/lib/admin";

type ViewProps = {
  initPageResult: { req: { payload: Payload; user?: { roles?: string[] } | null } };
};

type StatCard = {
  amber: number;
  count: number;
  href: string;
  label: string;
  red: number;
  slug: LeadCollectionSlug;
};

type RecentItem = {
  createdAt: string;
  href: string;
  id: string | number;
  status?: string;
  subtitle: string | null;
  title: string;
};

type RecentPanel = {
  breakdown: Record<string, number>;
  href: string;
  items: RecentItem[];
  title: string;
};

const INTAKE_COLLECTIONS: { slug: LeadCollectionSlug; statusLabel: string; title: string }[] = [
  { slug: "quotes", statusLabel: "New quotes", title: "Quotes" },
  {
    slug: "dealer-applications",
    statusLabel: "New dealer applications",
    title: "Dealer applications",
  },
  { slug: "contact-messages", statusLabel: "New contact messages", title: "Contact messages" },
  { slug: "consultations", statusLabel: "New consultations", title: "Consultations" },
  { slug: "sample-requests", statusLabel: "New sample requests", title: "Sample requests" },
];

const statusOf = (doc: Record<string, unknown>): string | undefined =>
  typeof doc.status === "string" ? doc.status : undefined;

async function Dashboard({ initPageResult }: ViewProps) {
  const { payload, user } = initPageResult.req;
  const canExport = isManagerRole(user?.roles ?? []);

  const stats: StatCard[] = [];
  const panels: RecentPanel[] = [];

  await Promise.all(
    INTAKE_COLLECTIONS.map(async ({ slug, statusLabel, title }) => {
      const [{ totalDocs: newCount }, recent, all] = await Promise.all([
        payload.find({
          collection: slug,
          where: { status: { equals: "new" } },
          limit: 0,
          depth: 0,
          overrideAccess: true,
        }),
        payload.find({
          collection: slug,
          sort: "-createdAt",
          limit: 5,
          depth: 1,
          overrideAccess: true,
        }),
        payload.find({
          collection: slug,
          select: { status: true, createdAt: true },
          limit: 1000,
          depth: 0,
          overrideAccess: true,
        }),
      ]);

      const stale = slaCounts(
        all.docs
          .filter(
            (doc) =>
              statusOf(doc as unknown as Record<string, unknown>) === "new" &&
              typeof (doc as unknown as Record<string, unknown>).createdAt === "string",
          )
          .map((doc) => String((doc as unknown as Record<string, unknown>).createdAt)),
      );

      stats.push({
        amber: stale.amber,
        count: newCount,
        href: `/admin/collections/${slug}`,
        label: statusLabel,
        red: stale.red,
        slug,
      });

      const breakdown: Record<string, number> = {};
      for (const doc of all.docs) {
        const status = statusOf(doc as unknown as Record<string, unknown>) ?? "unknown";
        breakdown[status] = (breakdown[status] ?? 0) + 1;
      }

      panels.push({
        breakdown,
        href: `/admin/collections/${slug}`,
        items: recent.docs.map((doc) => {
          const record = doc as unknown as Record<string, unknown>;
          return {
            createdAt: String(record.createdAt ?? ""),
            href: `/admin/collections/${slug}/${String(doc.id)}`,
            id: doc.id,
            status: statusOf(record),
            subtitle: leadSubtitle(slug, record),
            title: leadTitle(slug, record),
          };
        }),
        title,
      });
    }),
  );

  panels.sort((a, b) => a.title.localeCompare(b.title));
  const totalAmber = stats.reduce((sum, stat) => sum + stat.amber, 0);
  const totalRed = stats.reduce((sum, stat) => sum + stat.red, 0);

  return (
    <div className="pk-wrap">
      <style>{ADMIN_CSS}</style>
      <h1 className="pk-h1">PKEE Studio</h1>
      <p className="pk-sub">
        Intake overview · <a href="/admin/pipeline">Quote pipeline board</a> ·{" "}
        <a href="/admin/activity">Activity feed</a>
      </p>

      {totalAmber + totalRed > 0 ? (
        <div className="pk-sla">
          <span className="pk-chip pk-chip-warn">
            {totalAmber} new lead{totalAmber === 1 ? "" : "s"} untouched 24h+
          </span>
          <span className="pk-chip pk-chip-alert">
            {totalRed} new lead{totalRed === 1 ? "" : "s"} untouched 72h+
          </span>
        </div>
      ) : null}

      <div className="pk-cards">
        {stats.map((stat) => (
          <div className="pk-card" key={stat.label}>
            <a href={stat.href}>
              <div className="pk-card-num">{stat.count}</div>
              <div className="pk-card-label">{stat.label}</div>
            </a>
            {stat.amber + stat.red > 0 ? (
              <div className="pk-card-actions">
                {stat.amber > 0 ? (
                  <span className="pk-chip pk-chip-warn" title="New for over 24 hours">
                    {stat.amber} &gt;24h
                  </span>
                ) : null}
                {stat.red > 0 ? (
                  <span className="pk-chip pk-chip-alert" title="New for over 72 hours">
                    {stat.red} &gt;72h
                  </span>
                ) : null}
              </div>
            ) : null}
            <div className="pk-card-actions">
              <a href={stat.href}>View</a>
              {canExport ? <a href={`/custom/api/export/${stat.slug}`}>Export CSV</a> : null}
            </div>
          </div>
        ))}
      </div>

      <div className="pk-grid">
        {panels.map((panel) => (
          <section className="pk-panel" key={panel.title}>
            <h2>
              {panel.title}
              <a href={panel.href}>View all</a>
            </h2>
            {panel.items.length === 0 ? (
              <p className="pk-muted">Nothing yet.</p>
            ) : (
              <ul className="pk-list">
                {panel.items.map((item) => (
                  <li key={String(item.id)}>
                    <span style={{ minWidth: 0 }}>
                      <a href={item.href}>{item.title}</a>
                      {item.subtitle ? <span className="pk-subline">{item.subtitle}</span> : null}
                    </span>
                    <span style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                      {item.status ? <span className="pk-chip">{item.status}</span> : null}
                      <time
                        className="pk-muted"
                        dateTime={item.createdAt}
                        style={{ whiteSpace: "nowrap" }}
                        title={item.createdAt}
                      >
                        {relativeTime(item.createdAt)}
                      </time>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="pk-chips">
              {Object.entries(panel.breakdown).map(([status, count]) => (
                <span className="pk-chip" key={status}>
                  {status}: {count}
                </span>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export { Dashboard };
