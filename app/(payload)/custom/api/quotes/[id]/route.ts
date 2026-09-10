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

  const body = patchSchema.safeParse(await request.json().catch(() => ({})));
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
  if (assignedTo !== undefined) data.assignedTo = assignedTo;

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

  const updated = await payload.update({
    collection: "quotes",
    id,
    data,
    depth: 0,
    overrideAccess: true,
  });

  return NextResponse.json({ id: updated.id, status: updated.status });
}
