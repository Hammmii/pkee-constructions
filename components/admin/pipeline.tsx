import type { PayloadRequest } from "payload";

import { QUOTE_STATUSES } from "@/collections/Quotes";
import { PipelineBoard } from "@/components/admin/pipeline-board";
import type { PipelineQuote, StatusOption } from "@/components/admin/pipeline-helpers";
import { ADMIN_CSS } from "@/components/admin/styles";
import { leadSubtitle } from "@/lib/admin";

type ViewProps = {
  initPageResult: { req: PayloadRequest };
};

const MANAGER_ROLES = ["super-admin", "sales-manager"];

const toPipelineQuote = (doc: Record<string, unknown>): PipelineQuote => {
  const customer = (doc.customer ?? {}) as { name?: string; email?: string };
  const assignedTo = doc.assignedTo as { id: string | number; email?: string } | null | undefined;
  return {
    id: String(doc.id),
    reference: String(doc.reference ?? ""),
    customerName: customer.name ?? "Unknown",
    customerEmail: customer.email ?? null,
    status: String(doc.status ?? "new"),
    assignedToId: assignedTo?.id ?? null,
    assignedToName: assignedTo?.email ?? null,
    leadScore: typeof doc.leadScore === "number" ? doc.leadScore : null,
    source: typeof doc.source === "string" ? doc.source : null,
    contextLine:
      leadSubtitle("quotes", doc) ??
      (typeof doc.source === "string" && doc.source ? doc.source : null),
    createdAt: String(doc.createdAt ?? ""),
    updatedAt: String(doc.updatedAt ?? ""),
    notes: Array.isArray(doc.notes)
      ? (doc.notes as PipelineQuote["notes"]).map((note) => ({
          note: String(note.note),
          author: note.author
            ? typeof note.author === "object"
              ? String((note.author as { id: string | number }).id)
              : String(note.author)
            : null,
          date: String(note.date),
        }))
      : [],
  };
};

async function PipelineView({ initPageResult }: ViewProps) {
  const { payload, user } = initPageResult.req;
  const roles = (user as { roles?: string[] } | null)?.roles ?? [];
  const isManager = MANAGER_ROLES.some((role) => roles.includes(role));

  const where = isManager ? undefined : { assignedTo: { equals: user?.id ?? null } };

  const [quotesResult, usersResult] = await Promise.all([
    payload.find({
      collection: "quotes",
      sort: "createdAt",
      limit: 200,
      depth: 1,
      where,
      overrideAccess: true,
    }),
    payload.find({
      collection: "users",
      limit: 100,
      depth: 0,
      overrideAccess: true,
    }),
  ]);

  const quotes = quotesResult.docs.map((doc) =>
    toPipelineQuote(doc as unknown as Record<string, unknown>),
  );
  const statuses: StatusOption[] = QUOTE_STATUSES.map(({ label, value }) => ({ label, value }));
  const assignees = usersResult.docs.map((doc) => ({
    id: String(doc.id),
    name: doc.email ?? String(doc.id),
  }));

  return (
    <div className="pk-wrap" style={{ maxWidth: "none" }}>
      <style>{ADMIN_CSS}</style>
      <h1 className="pk-h1">Quote pipeline</h1>
      <p className="pk-sub">
        Drag cards between columns, or use the status select on each card. Changes save
        automatically. <a href="/admin">Back to dashboard</a>
      </p>
      <PipelineBoard
        assignees={assignees}
        currentUserId={String(user?.id ?? "")}
        initialQuotes={quotes}
        statuses={statuses}
      />
    </div>
  );
}

export { PipelineView };
