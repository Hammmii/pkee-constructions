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
      <label htmlFor="contact-hp">
        Website
        <input id="contact-hp" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
