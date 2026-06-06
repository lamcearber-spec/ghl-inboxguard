import { describe, expect, it } from "vitest";
import { resolveDomainAuth } from "./dns";

describe("resolveDomainAuth", () => {
  it("loads SPF, DMARC, and common DKIM selector TXT records through DNS-over-HTTPS", async () => {
    const requestedNames: string[] = [];
    const fetcher = async (input: URL | RequestInfo) => {
      const url = new URL(String(input));
      const name = url.searchParams.get("name") ?? "";
      requestedNames.push(name);

      const records: Record<string, string[]> = {
        "alpha.example": ['"v=spf1 include:mailgun.org ~all"'],
        "_dmarc.alpha.example": ['"v=DMARC1; p=quarantine"'],
        "default._domainkey.alpha.example": ['"v=DKIM1; k=rsa; p=alpha"']
      };

      return new Response(JSON.stringify({ Answer: (records[name] ?? []).map((data) => ({ data })) }), {
        headers: { "content-type": "application/json" }
      });
    };

    const dns = await resolveDomainAuth("alpha.example", {
      fetcher,
      selectors: ["default", "s1"]
    });

    expect(requestedNames).toEqual(["alpha.example", "_dmarc.alpha.example", "default._domainkey.alpha.example", "s1._domainkey.alpha.example"]);
    expect(dns).toEqual({
      spf: ["v=spf1 include:mailgun.org ~all"],
      dmarc: ["v=DMARC1; p=quarantine"],
      dkim: {
        default: ["v=DKIM1; k=rsa; p=alpha"],
        s1: []
      }
    });
  });
});
