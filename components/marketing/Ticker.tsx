import { Fragment } from "react";
import { Marquee } from "@/components/ui/Marquee";

type TickerProps = {
  /** Product family names, in display order. */
  items: string[];
};

/**
 * One reprojection ticker: product families + the showroom address,
 * separated by brass diamonds. The Marquee ui component duplicates the
 * group with an aria-hidden clone and pauses off-screen.
 */
export function Ticker({ items }: TickerProps) {
  const names = [...items, "Winnipeg — 360 Keewatin St"];
  return (
    <Marquee>
      {names.map((name) => (
        <Fragment key={name}>
          <span className="px-8 text-sm font-medium tracking-[0.18em] whitespace-nowrap text-ink/80 uppercase md:text-base">
            {name}
          </span>
          <span aria-hidden="true" className="text-xs text-brass">
            ◆
          </span>
        </Fragment>
      ))}
    </Marquee>
  );
}
