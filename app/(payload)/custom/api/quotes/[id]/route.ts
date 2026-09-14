import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getPayloadCached } from "@/lib/payload";

const SALES_ROLES = ["super-admin", "sales-manager", "sales-rep"];
const MANAGER_ROLES = ["super-admin", "sales-manager"];

const patchSchema = z.object({
  assignedTo: z.union([z.string(), z.number(), z.null()]).optional(),
  note: z.string().min(1).max(5000).optional(),
  status: z.string().min(1).optional(),
});

/**
 * Relationship IDs in Postgres are numeric, but clients may send string IDs
 * (the admin UI select values are strings). Coerce before payload.update —
 * the local API does not stringify-coerce relationship values the way the
 * REST adapter does, and a raw string fails relationship validation.
 */
function coerceRelationshipId(value: string | number | null) {
  if (value === null) return null;
  if (typeof value === "number") return value;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const payload = await getPayloadCached();
  const { user } = await payload.auth({ headers: await headers() });

  const roles = (user as { roles?: string[] } | null)?.roles ?? [];
  if (!user || !SALES_ROLES.some((role) => roles.includes(role))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawBody: unknown = await request.json().catch(() => ({}));
  // Accept both flat `{ assignedTo }` and Payload-style `{ data: { ... } }` bodies.
  const candidate =
    typeof rawBody === "object" &&
    rawBody !== null &&
    "data" in rawBody &&
    typeof (rawBody as { data?: unknown }).data === "object" &&
    (rawBody as { data?: unknown }).data !== null
      ? (rawBody as { data: unknown }).data
      : rawBody;
  const body = patchSchema.safeParse(candidate);
  if (!body.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: body.error.issues },
      { status: 400 },
    );
  }

  const isManager = MANAGER_ROLES.some((role) => roles.includes(role));

  const quote = await payload.findByID({
    collection: "quotes",
    id,
    depth: 0,
    overrideAccess: true,
  });
  if (!isManager && String(quote.assignedTo ?? "") !== String(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { assignedTo, note, status } = body.data;

  const data: Record<string, unknown> = {};
  if (typeof status === "string") data.status = status;
  if (assignedTo !== undefined) {
    const coerced = coerceRelationshipId(assignedTo);
    if (coerced === null && assignedTo !== null) {
      return NextResponse.json(
        { error: "Invalid assignee ID — must be a numeric user ID or null" },
        { status: 400 },
      );
    }
    if (coerced !== null) {
      const assignee = await payload
        .findByID({
          collection: "users",
          id: coerced,
          depth: 0,
          overrideAccess: true,
        })
        .catch(() => null);
      if (!assignee) {
        return NextResponse.json(
          { error: `Assignee user ${coerced} does not exist` },
          { status: 400 },
        );
      }
    }
    data.assignedTo = coerced;
  }

  const notes = Array.isArray(quote.notes)
    ? quote.notes.map((n) => ({
        note: n.note,
        author: n.author ? Number(n.author) : undefined,
        date: n.date,
      }))
    : [];
  if (note) {
    notes.push({
      note,
      author: Number(user.id),
      date: new Date().toISOString(),
    });
  }
  if (notes.length > 0) data.notes = notes;

  let updated: Awaited<ReturnType<typeof payload.update>>;
  try {
    updated = await payload.update({
      collection: "quotes",
      id,
      data,
      depth: 0,
      overrideAccess: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({
    id: updated.id,
    status: (updated as { status?: string }).status ?? null,
    assignedTo: (updated as { assignedTo?: unknown }).assignedTo ?? null,
  });
}
