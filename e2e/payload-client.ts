import "dotenv/config";

import type { Payload } from "payload";
// Shared Payload local-API client for e2e specs.
//
// getPayload caches instances globally per cache key inside the worker
// process. The default (unkeyed) instance is shared with anything else in the
// same worker — and payload.destroy() clears the drizzle adapter tables,
// breaking every later local-API query in that worker. So:
//
// - ALWAYS use a per-spec key (`getPayloadClient(__filename)` or an explicit
//   string) so no spec can poison another spec's instance.
// - NEVER call payload.destroy() in e2e cleanup. Cleanup means deleting the
//   docs the spec created — nothing else.
import { getPayload } from "payload";
import config from "../payload.config";

/** Returns this spec's own Payload local-API instance (cached per key). */
export async function getPayloadClient(key: string): Promise<Payload> {
  return getPayload({ config, key });
}

/**
 * Deletes docs created by a spec. `refs` is a list of `{ collection, id }`
 * pairs; deletes are best-effort (a missing doc is not an error).
 */
export async function deleteCreatedDocs(
  payload: Payload,
  refs: { collection: string; id: number | string }[],
): Promise<void> {
  for (const { collection, id } of refs) {
    await payload.delete({ collection: collection as never, id: id as never }).catch(() => {});
  }
}
