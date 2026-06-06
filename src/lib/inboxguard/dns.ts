import type { DnsRecordSet } from "./types";

const GOOGLE_DOH_URL = "https://dns.google/resolve";
const DEFAULT_DKIM_SELECTORS = ["default", "mail", "google", "s1", "s2", "k1", "selector1", "selector2"];

type ResolveOptions = {
  fetcher?: typeof fetch;
  selectors?: string[];
};

type DnsAnswer = {
  Answer?: Array<{ data?: string }>;
};

export async function resolveDomainAuth(domain: string, options: ResolveOptions = {}): Promise<DnsRecordSet> {
  const fetcher = options.fetcher ?? fetch;
  const selectors = options.selectors ?? DEFAULT_DKIM_SELECTORS;
  const normalizedDomain = domain.trim().toLowerCase();
  const [spf, dmarc, ...dkimResults] = await Promise.all([
    lookupTxt(normalizedDomain, fetcher),
    lookupTxt(`_dmarc.${normalizedDomain}`, fetcher),
    ...selectors.map((selector) => lookupTxt(`${selector}._domainkey.${normalizedDomain}`, fetcher))
  ]);

  return {
    spf: spf.filter((record) => record.toLowerCase().startsWith("v=spf1")),
    dmarc: dmarc.filter((record) => record.toLowerCase().startsWith("v=dmarc1")),
    dkim: Object.fromEntries(selectors.map((selector, index) => [selector, dkimResults[index] ?? []]))
  };
}

async function lookupTxt(name: string, fetcher: typeof fetch): Promise<string[]> {
  const url = new URL(GOOGLE_DOH_URL);
  url.searchParams.set("name", name);
  url.searchParams.set("type", "TXT");

  const response = await fetcher(url);
  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as DnsAnswer;
  return (payload.Answer ?? []).map((answer) => cleanTxt(answer.data ?? "")).filter(Boolean);
}

function cleanTxt(value: string): string {
  return value.replaceAll('" "', "").replaceAll('"', "").trim();
}
