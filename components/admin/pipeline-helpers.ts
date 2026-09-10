/**
 * Pure helpers for the admin quote pipeline kanban. Kept free of Payload /
 * React imports so they stay trivially unit-testable.
 */

export type PipelineNote = {
  note: string;
  author?: string | null;
  date: string;
};

export type PipelineQuote = {
  id: string;
  reference: string;
  customerName: string;
  customerEmail?: string | null;
  status: string;
  assignedToId?: string | number | null;
  assignedToName?: string | null;
  leadScore?: number | null;
  source?: string | null;
  /** "Product · source" context line, pre-computed server-side. */
  contextLine?: string | null;
  createdAt: string;
  updatedAt: string;
  notes: PipelineNote[];
};

export type StatusOption = { label: string; value: string };

export type ColumnMap = Record<string, PipelineQuote[]>;

/** Group quotes into status columns, preserving the incoming order per column. */
export function groupQuotesByStatus(quotes: PipelineQuote[], statuses: StatusOption[]): ColumnMap {
  const columns: ColumnMap = {};
  for (const status of statuses) columns[status.value] = [];
  for (const quote of quotes) {
    if (!columns[quote.status]) columns[quote.status] = [];
    columns[quote.status]?.push(quote);
  }
  return columns;
}

/**
 * Return a new column map with the quote moved to `newStatus`. The quote
 * keeps its relative position if it was already in the target column,
 * otherwise it is appended at the end. Unknown ids return the input unchanged.
 */
export function moveQuoteInColumns(
  columns: ColumnMap,
  quoteId: string,
  newStatus: string,
): ColumnMap {
  const target = columns[newStatus];
  if (!target) return columns;
  if (target.some((quote) => quote.id === quoteId)) return columns;

  const next: ColumnMap = {};
  let moved: PipelineQuote | undefined;
  for (const [status, quotes] of Object.entries(columns)) {
    next[status] = quotes.filter((quote) => {
      if (quote.id !== quoteId) return true;
      moved = quote;
      return false;
    });
  }
  if (!moved) return columns;
  next[newStatus] = [...target, { ...moved, status: newStatus }];
  return next;
}

/**
 * Build the notes payload for a quote whose status changed: the existing
 * notes plus an audit entry recording the transition.
 */
export function appendStatusChangeNote(
  existing: PipelineNote[],
  newStatus: string,
  statusLabel: string,
  authorId: string | number,
  date: string,
): PipelineNote[] {
  const entry: PipelineNote = {
    note: `Status changed to ${statusLabel} (${newStatus})`,
    author: String(authorId),
    date,
  };
  return [...existing, entry];
}
