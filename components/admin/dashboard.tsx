import type { Payload } from "payload";

import { ADMIN_CSS } from "@/components/admin/styles";

type ViewProps = {
  initPageResult: { req: { payload: Payload } };
};

type StatCard = {
  count: number;
  href: string;
  label: string;
};

type RecentItem = {
  id: string | number;
  href: string;
  status?: string;
  title: string;
};

type RecentPanel = {
  breakdown: Record<string, number>;
  href: string;
  items: RecentItem[];
  title: string;
};

const INTAKE_COLLECTIONS = [
  { slug: "quotes", statusLabel: "New quotes", title: "Quotes" },
  {
    slug: "dealer-applications",
    statusLabel: "New dealer applications",
    title: "Dealer applications",
  },
  { slug: "contact-messages", statusLabel: "New contact messages", title: "Contact messages" },
  { slug: "consultations", statusLabel: "New consultations", title: "Consultations" },
  { slug: "sample-requests", statusLabel: "New sample requests", title: "Sample requests" },
] as const;

const titleFor = (slug: string, doc: Record<string, unknown>): string => {
  switch (slug) {
    case "quotes":
      return String(doc.reference ?? "Quote");
    case "dealer-applications":
      return String(doc.companyName ?? "Application");
    case "contact-messages":
      return `${String(doc.name ?? "Message")} — ${String(doc.subject ?? "")}`;
    case "consultations":
      return `${String((doc.contact as { name?: string })?.name ?? "Consultation")} (${String(doc.type ?? "")})`;
    case "sample-requests":
      return `Sample — ${String(doc.color ?? "color TBD")}`;
    default:
      return String(doc.id ?? "Document");
  }
};

const statusOf = (doc: Record<string, unknown>): string | undefined =>
  typeof doc.status === "string" ? doc.status : undefined;

async function Dashboard({ initPageResult }: ViewProps) {
  const { payload } = initPageResult.req;

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
          depth: 0,
          overrideAccess: true,
        }),
        payload.find({
          collection: slug,
          select: { status: true },
          limit: 1000,
          depth: 0,
          overrideAccess: true,
        }),
      ]);

      stats.push({ count: newCount, href: `/admin/collections/${slug}`, label: statusLabel });

      const breakdown: Record<string, number> = {};
      for (const doc of all.docs) {
        const status = statusOf(doc as unknown as Record<string, unknown>) ?? "unknown";
        breakdown[status] = (breakdown[status] ?? 0) + 1;
      }

      panels.push({
        breakdown,
        href: `/admin/collections/${slug}`,
        items: recent.docs.map((doc) => ({
          id: doc.id,
          href: `/admin/collections/${slug}/${doc.id}`,
          status: statusOf(doc as unknown as Record<string, unknown>),
          title: titleFor(slug, doc as unknown as Record<string, unknown>),
        })),
        title,
      });
    }),
  );

  panels.sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="pk-wrap">
      <style>{ADMIN_CSS}</style>
      <h1 className="pk-h1">PKEE Studio</h1>
      <p className="pk-sub">
        Intake overview · <a href="/admin/pipeline">Quote pipeline board</a>
      </p>

      <div className="pk-cards">
        {stats.map((stat) => (
          <a className="pk-card" href={stat.href} key={stat.label}>
            <div className="pk-card-num">{stat.count}</div>
            <div className="pk-card-label">{stat.label}</div>
          </a>
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
                    <a href={item.href}>{item.title}</a>
                    {item.status ? <span className="pk-chip">{item.status}</span> : null}
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
