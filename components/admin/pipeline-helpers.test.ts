import { describe, expect, it } from "vitest";
import type { PipelineQuote, StatusOption } from "@/components/admin/pipeline-helpers";
import {
  appendStatusChangeNote,
  groupQuotesByStatus,
  moveQuoteInColumns,
} from "@/components/admin/pipeline-helpers";

const STATUSES: StatusOption[] = [
  { label: "New", value: "new" },
  { label: "Won", value: "won" },
];

const quote = (id: string, status: string): PipelineQuote => ({
  id,
  reference: `PK-2026-${id}`,
  customerName: `Customer ${id}`,
  status,
  updatedAt: "2026-09-11T00:00:00.000Z",
  notes: [],
});

describe("groupQuotesByStatus", () => {
  it("creates a bucket for every status, even when empty", () => {
    const columns = groupQuotesByStatus([quote("1", "new")], STATUSES);
    expect(Object.keys(columns).sort()).toEqual(["new", "won"]);
    expect(columns.won).toEqual([]);
    expect(columns.new).toHaveLength(1);
  });

  it("keeps incoming order within a column", () => {
    const columns = groupQuotesByStatus(
      [quote("1", "new"), quote("2", "new"), quote("3", "won")],
      STATUSES,
    );
    expect(columns.new?.map((q) => q.id)).toEqual(["1", "2"]);
  });
});

describe("moveQuoteInColumns", () => {
  it("moves a quote to the end of the target column and updates its status", () => {
    const columns = groupQuotesByStatus([quote("1", "new"), quote("2", "won")], STATUSES);
    const next = moveQuoteInColumns(columns, "1", "won");
    expect(next.new).toEqual([]);
    expect(next.won?.map((q) => q.id)).toEqual(["2", "1"]);
    expect(next.won?.[1]?.status).toBe("won");
  });

  it("keeps position when moving within the same column", () => {
    const columns = groupQuotesByStatus([quote("1", "new"), quote("2", "new")], STATUSES);
    const next = moveQuoteInColumns(columns, "1", "new");
    expect(next.new?.map((q) => q.id)).toEqual(["1", "2"]);
  });

  it("returns input unchanged for unknown quote or unknown status", () => {
    const columns = groupQuotesByStatus([quote("1", "new")], STATUSES);
    expect(moveQuoteInColumns(columns, "nope", "won")).toBe(columns);
    expect(moveQuoteInColumns(columns, "1", "bogus")).toBe(columns);
  });

  it("does not mutate the input columns", () => {
    const columns = groupQuotesByStatus([quote("1", "new")], STATUSES);
    moveQuoteInColumns(columns, "1", "won");
    expect(columns.new).toHaveLength(1);
    expect(columns.won).toEqual([]);
  });
});

describe("appendStatusChangeNote", () => {
  it("appends an audit entry to the existing notes", () => {
    const existing = [{ note: "Called customer", date: "2026-09-10T00:00:00.000Z" }];
    const next = appendStatusChangeNote(existing, "won", "Won", "Sam", "2026-09-11T00:00:00.000Z");
    expect(next).toHaveLength(2);
    expect(next[1]).toEqual({
      note: "Status changed to Won (won)",
      author: "Sam",
      date: "2026-09-11T00:00:00.000Z",
    });
    expect(existing).toHaveLength(1);
  });
});
