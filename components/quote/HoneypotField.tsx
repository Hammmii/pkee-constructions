/**
 * Honeypot trap — present for every submission, invisible to humans
 * (off-screen, unfocusable, hidden from assistive tech). Bots that fill it
 * get a silent fake success in the server action.
 */
export function HoneypotField() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-auto left-[-10000px] h-px w-px overflow-hidden"
    >
      <label htmlFor="quote-hp">
        Website
        <input id="quote-hp" name="hp" type="text" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
