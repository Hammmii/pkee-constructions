/// <reference types="react/canary" />
import * as React from "react";

/**
 * React 19.2 `<ViewTransition>` (stable in Next 16 — the App Router bundles
 * the canary React build, so no flag or canary install is needed).
 *
 * Runtime feature-detect with a `Fragment` fallback: unit tests and any
 * non-Next runtime resolve the stable React build, which lacks the export.
 * In the app itself Next's vendored React always provides it; the fallback
 * also degrades gracefully if that ever changes (content renders, it just
 * doesn't animate — the same progressive-enhancement story as unsupported
 * browsers).
 */
type ReactWithViewTransition = typeof React & { ViewTransition?: unknown };

const runtimeReact = React as ReactWithViewTransition;

export const ViewTransition: typeof React.ViewTransition = (
  "ViewTransition" in runtimeReact && runtimeReact.ViewTransition
    ? runtimeReact.ViewTransition
    : React.Fragment
) as typeof React.ViewTransition;

/** True when the browser supports the View Transitions API. */
export function supportsViewTransitions(): boolean {
  return typeof document !== "undefined" && "startViewTransition" in document;
}
