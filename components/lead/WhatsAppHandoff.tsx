import { site } from "@/lib/site";
import { buildLeadWhatsAppLink } from "@/lib/whatsapp";

/**
 * Primary post-submit CTA on every intake confirmation page: deep-links
 * into a WhatsApp chat with the business number (lib/site.ts) and the lead
 * summary pre-filled. The message is composed on the server, so only the
 * reference + first name ever reach the URL the customer sees rendered —
 * and the link itself carries the customer's own details back to them.
 */
export function WhatsAppHandoff({
  formType,
  reference,
  firstName,
  summaryLines,
}: {
  formType: string;
  reference: string | null;
  firstName: string | null;
  summaryLines: string[];
}) {
  const href = buildLeadWhatsAppLink({
    phone: site.whatsapp.href,
    reference,
    formType,
    firstName,
    summaryLines,
  });

  return (
    <div className="mt-10 border border-brass/50 bg-brass/5 px-8 py-10">
      <h2 className="text-label text-ink/55">Get a faster reply</h2>
      <p className="mt-4 max-w-xl text-foreground/80">
        Send your details straight to our WhatsApp — the team picks chat up first.
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Send your ${formType} details to ${site.name} via WhatsApp`}
        className="mt-6 inline-flex h-14 select-none items-center gap-3 rounded-[2px] bg-ink px-8 text-[0.8125rem] font-medium uppercase tracking-[0.12em] text-bone transition-colors duration-500 hover:bg-charcoal hover:text-brass"
      >
        <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 6.988 2.896 9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413Z" />
        </svg>
        Send via WhatsApp
      </a>
      <p className="mt-4 text-sm text-foreground/55">
        or we&rsquo;ll reach out using the details you provided.
      </p>
    </div>
  );
}
