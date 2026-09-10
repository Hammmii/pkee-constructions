"use client";

import { useMemo, useState } from "react";
import type { ColumnMap, PipelineQuote, StatusOption } from "@/components/admin/pipeline-helpers";
import {
  appendStatusChangeNote,
  groupQuotesByStatus,
  moveQuoteInColumns,
} from "@/components/admin/pipeline-helpers";

type Assignee = { id: string; name: string };

type Props = {
  assignees: Assignee[];
  currentUserId: string;
  initialQuotes: PipelineQuote[];
  statuses: StatusOption[];
};

type PatchBody = {
  assignedTo?: string | null;
  note?: string;
  status?: string;
};

async function patchQuote(id: string, body: PatchBody) {
  const res = await fetch(`/custom/api/quotes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with ${res.status}`);
  }
  return res.json();
}

export function PipelineBoard({ assignees, currentUserId, initialQuotes, statuses }: Props) {
  const [columns, setColumns] = useState<ColumnMap>(() =>
    groupQuotesByStatus(initialQuotes, statuses),
  );
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const statusLabel = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of statuses) map[s.value] = s.label;
    return map;
  }, [statuses]);

  const persist = async (
    quoteId: string,
    body: PatchBody,
    optimistic: (prev: ColumnMap) => ColumnMap,
  ) => {
    setError(null);
    const previous = columns;
    setColumns(optimistic);
    try {
      await patchQuote(quoteId, body);
    } catch (err) {
      setColumns(previous);
      setError(err instanceof Error ? err.message : "Save failed — reverted.");
    }
  };

  const handleDrop = (status: string) => (e: React.DragEvent) => {
    e.preventDefault();
    setOverColumn(null);
    const quoteId = e.dataTransfer.getData("text/plain");
    if (!quoteId) return;
    const quote = Object.values(columns)
      .flat()
      .find((q) => q.id === quoteId);
    if (!quote || quote.status === status) return;
    const note = appendStatusChangeNote(
      quote.notes,
      status,
      statusLabel[status] ?? status,
      currentUserId,
      new Date().toISOString(),
    );
    void persist(quoteId, { status, note: note[note.length - 1]?.note }, (prev) =>
      moveQuoteInColumns(prev, quoteId, status),
    );
  };

  const handleStatusSelect =
    (quote: PipelineQuote) => (e: React.ChangeEvent<HTMLSelectElement>) => {
      const status = e.target.value;
      if (!status || status === quote.status) return;
      const note = appendStatusChangeNote(
        quote.notes,
        status,
        statusLabel[status] ?? status,
        currentUserId,
        new Date().toISOString(),
      );
      void persist(quote.id, { status, note: note[note.length - 1]?.note }, (prev) =>
        moveQuoteInColumns(prev, quote.id, status),
      );
    };

  const handleAssign = (quote: PipelineQuote) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    const assignedTo = e.target.value || null;
    void persist(quote.id, { assignedTo }, (prev) => {
      const next: ColumnMap = {};
      for (const [status, quotes] of Object.entries(prev)) {
        next[status] = quotes.map((q) =>
          q.id === quote.id ? { ...q, assignedToId: assignedTo } : q,
        );
      }
      return next;
    });
  };

  return (
    <div>
      {error ? (
        <p className="pk-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="pk-board">
        {statuses.map((status) => (
          <section
            aria-label={`${status.label} column`}
            className={`pk-col${overColumn === status.value ? " pk-col-over" : ""}`}
            key={status.value}
            // biome-ignore lint/a11y/noStaticElementInteractions: HTML5 drag-and-drop drop target; keyboard users get the per-card status select.
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setOverColumn(status.value);
            }}
            onDragLeave={() =>
              setOverColumn((current) => (current === status.value ? null : current))
            }
            onDrop={handleDrop(status.value)}
          >
            <header className="pk-col-head">
              <span>{status.label}</span>
              <span className="pk-chip">{columns[status.value]?.length ?? 0}</span>
            </header>
            <div className="pk-col-body">
              {(columns[status.value] ?? []).map((quote) => (
                <article
                  className="pk-quote"
                  draggable
                  key={quote.id}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", quote.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                >
                  <div className="pk-quote-ref">
                    <a href={`/admin/collections/quotes/${quote.id}`}>{quote.reference}</a>
                    {typeof quote.leadScore === "number" ? (
                      <span className="pk-chip" title="Lead score">
                        {quote.leadScore}
                      </span>
                    ) : null}
                  </div>
                  <div className="pk-quote-meta">
                    <span>{quote.customerName}</span>
                    <label>
                      <span className="pk-muted">Status</span>
                      <select
                        aria-label={`Status for ${quote.reference}`}
                        onChange={handleStatusSelect(quote)}
                        value={quote.status}
                      >
                        {statuses.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span className="pk-muted">Assignee</span>
                      <select
                        aria-label={`Assignee for ${quote.reference}`}
                        onChange={handleAssign(quote)}
                        value={quote.assignedToId ? String(quote.assignedToId) : ""}
                      >
                        <option value="">Unassigned</option>
                        {assignees.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
