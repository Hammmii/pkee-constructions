/**
 * Serializable shape passed from the server (Header) into the client
 * mega-menu. Image fields are flattened so the prop crosses the
 * server/client boundary without Payload class instances.
 */
export type MegaCategory = {
  name: string;
  slug: string;
  image: {
    url: string;
    alt: string;
    width?: number | null;
    height?: number | null;
  } | null;
};
