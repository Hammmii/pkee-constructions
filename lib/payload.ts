import { getPayload } from "payload";
import { cache } from "react";

// Relative import: this file must stay loadable from plain Node scripts as
// well as the Next.js bundler (payload.config.ts itself requires relative
// imports — see payload CLI constraints).
import config from "../payload.config";

/**
 * Per-request cached Payload instance for React Server Components.
 * `cache()` dedupes across all calls during a single server render.
 */
export const getPayloadCached = cache(async () => getPayload({ config }));
