/**
 * Shared option shapes for the quote wizard. Plain serializable data passed
 * from the server page — never Payload documents.
 */
export type ProductOption = {
  name: string;
  slug: string;
  category: string | null;
  categorySlug: string | null;
};

export type PreselectedProduct = {
  name: string;
  slug: string;
  categorySlug: string | null;
};

export type CategoryOption = {
  name: string;
  slug: string;
};
