/**
 * Scoped styles for the custom Payload admin views (dashboard + pipeline).
 * Payload's own admin stylesheet does not cover custom view markup, so the
 * `pk-` prefixed classes below ship with the components themselves. All
 * selectors are prefixed to avoid leaking into the rest of the admin UI.
 */
export const ADMIN_CSS = `
.pk-wrap { padding: 2rem; max-width: 1200px; }
.pk-h1 { font-size: 1.5rem; font-weight: 700; margin: 0 0 0.25rem; }
.pk-sub { margin: 0 0 1.5rem; opacity: 0.65; font-size: 0.875rem; }
.pk-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem; }
.pk-card { display: block; border: 1px solid var(--theme-elevation-200, #d9d9d9); border-radius: 6px; padding: 1rem; text-decoration: none; color: inherit; background: var(--theme-bg, #fff); }
.pk-card:hover { border-color: var(--theme-elevation-400, #9a9a9a); }
.pk-card-num { font-size: 2rem; font-weight: 700; line-height: 1.1; }
.pk-card-label { font-size: 0.8rem; opacity: 0.7; margin-top: 0.25rem; }
.pk-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem; }
.pk-panel { border: 1px solid var(--theme-elevation-200, #d9d9d9); border-radius: 6px; padding: 1rem; background: var(--theme-bg, #fff); }
.pk-panel h2 { font-size: 1rem; font-weight: 600; margin: 0 0 0.75rem; display: flex; justify-content: space-between; align-items: baseline; }
.pk-panel h2 a { font-size: 0.8rem; font-weight: 400; }
.pk-list { list-style: none; margin: 0; padding: 0; }
.pk-list li { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; padding: 0.4rem 0; border-bottom: 1px solid var(--theme-elevation-150, #eaeaea); font-size: 0.875rem; }
.pk-list li:last-child { border-bottom: 0; }
.pk-list a { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pk-chip { display: inline-block; font-size: 0.7rem; padding: 0.1rem 0.5rem; border-radius: 999px; border: 1px solid var(--theme-elevation-300, #c4c4c4); white-space: nowrap; }
.pk-chips { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.5rem; }
.pk-muted { opacity: 0.6; font-size: 0.8rem; }
.pk-board { display: flex; gap: 0.75rem; overflow-x: auto; align-items: flex-start; padding-bottom: 1rem; }
.pk-col { min-width: 240px; width: 240px; flex-shrink: 0; border: 1px solid var(--theme-elevation-200, #d9d9d9); border-radius: 6px; background: var(--theme-elevation-50, #f7f7f7); }
.pk-col-head { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; font-size: 0.8rem; font-weight: 600; border-bottom: 1px solid var(--theme-elevation-200, #d9d9d9); }
.pk-col-body { min-height: 60px; padding: 0.5rem; display: flex; flex-direction: column; gap: 0.5rem; }
.pk-col-over { outline: 2px dashed var(--theme-elevation-500, #7a7a7a); outline-offset: -2px; }
.pk-quote { border: 1px solid var(--theme-elevation-200, #d9d9d9); border-radius: 4px; padding: 0.5rem 0.6rem; background: var(--theme-bg, #fff); font-size: 0.8rem; }
.pk-quote[draggable="true"] { cursor: grab; }
.pk-quote-ref { font-weight: 600; display: flex; justify-content: space-between; gap: 0.5rem; }
.pk-quote-meta { margin-top: 0.25rem; display: flex; flex-direction: column; gap: 0.3rem; }
.pk-quote select { width: 100%; font-size: 0.75rem; padding: 0.2rem; background: var(--theme-input-bg, #fff); color: inherit; border: 1px solid var(--theme-elevation-300, #c4c4c4); border-radius: 4px; }
.pk-quote a { font-size: 0.75rem; }
.pk-error { color: #b3261e; font-size: 0.8rem; }
`;
