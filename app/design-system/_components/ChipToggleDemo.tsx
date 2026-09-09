"use client";

import { useState } from "react";
import { Chip } from "@/components/ui/Chip";

const FILTERS = ["Walls", "Ceilings", "Stone", "Lighting", "Doors"];

/** Interactive filter row demoing Chip's active state. */
export function ChipToggleDemo({ dark = false }: { dark?: boolean }) {
  const [active, setActive] = useState("Walls");
  return (
    <div className="flex flex-wrap gap-3">
      {FILTERS.map((filter) => (
        <button
          key={filter}
          type="button"
          onClick={() => setActive(filter)}
          aria-pressed={active === filter}
          className="cursor-pointer bg-transparent"
        >
          <Chip active={active === filter} dark={dark}>
            {filter}
          </Chip>
        </button>
      ))}
    </div>
  );
}
