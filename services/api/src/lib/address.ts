/**
 * Address formatting shared by the agreement renderer and anything else that
 * has to print a postal address into a document.
 *
 * A job has two distinct addresses: where the client lives (the party to the
 * contract) and where the work happens (the job site). They are frequently
 * different — an owner in Raleigh building on the Outer Banks — so they are
 * stored and rendered separately and neither is inferred from the other.
 */

export interface AddressParts {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}

/**
 * Render an address on one line, e.g. "22 Ocean Blvd, Southern Shores, NC 27949".
 *
 * Returns "" when there is no real address to print. A state on its own is not
 * an address: the old renderer defaulted state to "NC" and joined the parts, so
 * a customer with no street address printed the single word "NC" where the
 * contract should have shown their address. A caller that gets "" back should
 * print a blank fill-in line instead.
 */
export function formatAddress(parts: AddressParts): string {
  const line1 = clean(parts.line1);
  const line2 = clean(parts.line2);
  const city = clean(parts.city);
  const state = clean(parts.state);
  const zip = clean(parts.zip);

  // Nothing but a state (or nothing at all) is not an address.
  if (!line1 && !city && !zip) return "";

  const locality = [city, [state, zip].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

  return [line1, line2, locality].filter(Boolean).join(", ");
}

/** Same, but broken across lines for a block-style address in a document. */
export function formatAddressLines(parts: AddressParts): string[] {
  const line1 = clean(parts.line1);
  const line2 = clean(parts.line2);
  const city = clean(parts.city);
  const state = clean(parts.state);
  const zip = clean(parts.zip);

  if (!line1 && !city && !zip) return [];

  const locality = [city, [state, zip].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

  return [line1, line2, locality].filter(Boolean) as string[];
}

function clean(v: string | null | undefined): string {
  return typeof v === "string" ? v.trim() : "";
}
