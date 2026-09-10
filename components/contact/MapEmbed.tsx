import { mapEmbedUrl } from "@/lib/contact";

type MapEmbedProps = {
  className?: string;
};

/**
 * Lazy-loaded showroom map. `loading="lazy"` keeps the iframe out of the
 * initial request until it nears the viewport; a real `title` keeps it
 * announced correctly to assistive tech.
 */
export function MapEmbed({ className }: MapEmbedProps) {
  return (
    <iframe
      src={mapEmbedUrl()}
      title="Map — PKEE Constructions showroom, 360 Keewatin St, Winnipeg, MB"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className={className}
    />
  );
}
