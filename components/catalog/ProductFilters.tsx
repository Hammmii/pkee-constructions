"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type FilterOptions = {
  categories: { slug: string; name: string }[];
  materials: string[];
  properties: { value: string; label: string }[];
};

export type CatalogFilterState = {
  category?: string;
  material?: string;
  indoorOutdoor?: string;
  backlit?: boolean;
  customizable?: boolean;
  properties?: string[];
  q?: string;
  sort?: string;
};

const INDOOR_OUTDOOR = [
  { value: "both", label: "Indoor & Outdoor" },
  { value: "indoor", label: "Indoor" },
  { value: "outdoor", label: "Outdoor" },
] as const;

function buildQuery(state: CatalogFilterState, patch: Partial<CatalogFilterState>): string {
  const merged = { ...state, ...patch };
  const next: Record<string, string> = {};
  if (merged.category) next.category = merged.category;
  if (merged.material) next.material = merged.material;
  if (merged.indoorOutdoor) next.indoorOutdoor = merged.indoorOutdoor;
  if (merged.backlit) next.backlit = "1";
  if (merged.customizable) next.customizable = "1";
  if (merged.properties?.length) next.properties = merged.properties.join(",");
  if (merged.q) next.q = merged.q;
  if (merged.sort && merged.sort !== "featured") next.sort = merged.sort;
  // page intentionally omitted: any filter change resets to page 1
  const qs = new URLSearchParams(next).toString();
  return qs ? `/products?${qs}` : "/products";
}

function clearAllPatch(): Partial<CatalogFilterState> {
  return {
    category: undefined,
    material: undefined,
    indoorOutdoor: undefined,
    backlit: undefined,
    customizable: undefined,
    properties: undefined,
    q: undefined,
  };
}

function CheckboxRow({
  checked,
  label,
  onToggle,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <label
      className={cn(
        "rule flex cursor-pointer items-center gap-3 border-t py-2.5 text-sm transition-colors duration-300",
        checked ? "text-brass" : "text-ink/70 hover:text-ink",
      )}
    >
      <input type="checkbox" checked={checked} onChange={onToggle} className="sr-only" />
      <span
        aria-hidden
        className={cn(
          "flex h-3.5 w-3.5 shrink-0 items-center justify-center border transition-colors duration-300",
          checked ? "border-brass bg-brass" : "border-stone",
        )}
      >
        {checked && <span className="h-1 w-1 bg-ink" />}
      </span>
      <span className="flex-1">{label}</span>
    </label>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="text-label mb-1 text-ink/50">{title}</legend>
      <div>{children}</div>
    </fieldset>
  );
}

/**
 * Catalog filter sidebar (client island). All state lives in the URL
 * searchParams — this component reads the current state from props and pushes
 * new URLs. Filter changes reset pagination to page 1.
 */
export function ProductFilters({
  options,
  state,
  resultCount,
}: {
  options: FilterOptions;
  state: CatalogFilterState;
  resultCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(state.q ?? "");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearch(state.q ?? "");
  }, [state.q]);

  useEffect(
    () => () => {
      if (debounce.current) clearTimeout(debounce.current);
    },
    [],
  );

  const navigate = (patch: Partial<CatalogFilterState>) => {
    startTransition(() => {
      router.replace(buildQuery(state, patch), { scroll: false });
    });
  };

  const onSearchChange = (value: string) => {
    setSearch(value);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => navigate({ q: value || undefined }), 300);
  };

  const toggleProperty = (value: string) => {
    const current = state.properties ?? [];
    const next = current.includes(value)
      ? current.filter((p) => p !== value)
      : [...current, value];
    navigate({ properties: next.length ? next : undefined });
  };

  const chips: { key: string; label: string; patch: Partial<CatalogFilterState> }[] = [];
  if (state.category) {
    const cat = options.categories.find((c) => c.slug === state.category);
    chips.push({
      key: "category",
      label: cat?.name ?? state.category,
      patch: { category: undefined },
    });
  }
  if (state.material) {
    chips.push({ key: "material", label: state.material, patch: { material: undefined } });
  }
  if (state.indoorOutdoor) {
    const io = INDOOR_OUTDOOR.find((o) => o.value === state.indoorOutdoor);
    chips.push({
      key: "indoorOutdoor",
      label: io?.label ?? state.indoorOutdoor,
      patch: { indoorOutdoor: undefined },
    });
  }
  if (state.backlit) chips.push({ key: "backlit", label: "Backlit", patch: { backlit: undefined } });
  if (state.customizable) {
    chips.push({ key: "customizable", label: "Customizable", patch: { customizable: undefined } });
  }
  for (const prop of state.properties ?? []) {
    const opt = options.properties.find((p) => p.value === prop);
    chips.push({
      key: `prop-${prop}`,
      label: opt?.label ?? prop,
      patch: {
        properties: (state.properties ?? []).filter((p) => p !== prop),
      },
    });
  }
  if (state.q) chips.push({ key: "q", label: `“${state.q}”`, patch: { q: undefined } });

  const hasFilters = chips.length > 0;

  return (
    <div className={cn("space-y-10", pending && "opacity-60 transition-opacity duration-300")}>
      <div>
        <label htmlFor="catalog-search" className="text-label mb-3 block text-ink/50">
          Search
        </label>
        <input
          id="catalog-search"
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search materials…"
          autoComplete="off"
          className="h-12 w-full border-0 border-b border-stone bg-transparent px-0 text-base text-ink outline-none placeholder:text-ink/35 focus:border-brass focus:outline-none focus:ring-0"
        />
      </div>

      <div>
        <label htmlFor="catalog-sort" className="text-label mb-3 block text-ink/50">
          Sort
        </label>
        <select
          id="catalog-sort"
          value={state.sort ?? "featured"}
          onChange={(e) => navigate({ sort: e.target.value })}
          className="h-12 w-full cursor-pointer border-0 border-b border-stone bg-transparent px-0 text-sm text-ink outline-none focus:border-brass focus:outline-none focus:ring-0"
        >
          <option value="featured">Featured</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>

      {hasFilters && (
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-label text-ink/50">Active filters</span>
            <button
              type="button"
              onClick={() => navigate(clearAllPatch())}
              className="text-xs uppercase tracking-[0.12em] text-brass underline-offset-4 hover:underline"
            >
              Clear all
            </button>
          </div>
          <ul className="flex flex-wrap gap-2" aria-label="Active filters">
            {chips.map((chip) => (
              <li key={chip.key}>
                <button
                  type="button"
                  onClick={() => navigate(chip.patch)}
                  className="inline-flex h-9 items-center gap-2 rounded-[2px] border border-brass px-3 text-[0.8125rem] uppercase tracking-[0.08em] text-brass transition-colors duration-300 hover:bg-brass hover:text-ink"
                  aria-label={`Remove filter ${chip.label}`}
                >
                  {chip.label}
                  <span aria-hidden>×</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Group title="Category">
        <div role="radiogroup" aria-label="Category">
          {options.categories.map((cat) => {
            const active = state.category === cat.slug;
            return (
              <button
                key={cat.slug}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => navigate({ category: active ? undefined : cat.slug })}
                className={cn(
                  "rule flex w-full items-center justify-between border-t py-2.5 text-left text-sm transition-colors duration-300",
                  active ? "text-brass" : "text-ink/70 hover:text-ink",
                )}
              >
                {cat.name}
                <span
                  aria-hidden
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-colors duration-300",
                    active ? "bg-brass" : "bg-transparent",
                  )}
                />
              </button>
            );
          })}
        </div>
      </Group>

      {options.materials.length > 0 && (
        <Group title="Material">
          {options.materials.map((material) => (
            <CheckboxRow
              key={material}
              label={material}
              checked={state.material === material}
              onToggle={() =>
                navigate({ material: state.material === material ? undefined : material })
              }
            />
          ))}
        </Group>
      )}

      <Group title="Suitability">
        {INDOOR_OUTDOOR.map((opt) => (
          <CheckboxRow
            key={opt.value}
            label={opt.label}
            checked={state.indoorOutdoor === opt.value}
            onToggle={() =>
              navigate({ indoorOutdoor: state.indoorOutdoor === opt.value ? undefined : opt.value })
            }
          />
        ))}
        <CheckboxRow
          label="Backlit"
          checked={Boolean(state.backlit)}
          onToggle={() => navigate({ backlit: state.backlit ? undefined : true })}
        />
        <CheckboxRow
          label="Customizable"
          checked={Boolean(state.customizable)}
          onToggle={() => navigate({ customizable: state.customizable ? undefined : true })}
        />
      </Group>

      {options.properties.length > 0 && (
        <Group title="Properties">
          {options.properties.map((prop) => (
            <CheckboxRow
              key={prop.value}
              label={prop.label}
              checked={(state.properties ?? []).includes(prop.value)}
              onToggle={() => toggleProperty(prop.value)}
            />
          ))}
        </Group>
      )}

      <p className="text-label text-ink/40" aria-live="polite">
        {resultCount} {resultCount === 1 ? "material" : "materials"}
      </p>
    </div>
  );
}
