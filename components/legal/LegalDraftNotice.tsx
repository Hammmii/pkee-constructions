/**
 * Draft banner shown at the top of every legal page. These policies are
 * working drafts written for a lead-generation site; they are not legal
 * advice and must be reviewed by a lawyer before launch (TODO-CLIENT).
 */
export function LegalDraftNotice() {
  return (
    <div className="border-b border-brass/40 bg-brass/10" role="note">
      <div className="mx-auto w-full max-w-3xl px-6 py-3 md:px-10">
        <p className="text-xs leading-relaxed text-ink/70">
          Draft v1 — requires legal review before launch.{" "}
          <span className="text-ink/55">TODO-CLIENT</span>
        </p>
      </div>
    </div>
  );
}
