import { resolveDomainAuth } from "@/lib/inboxguard/dns";
import type { InboxGuardDomainSource, InboxGuardSource } from "@/lib/inboxguard/types";

export const HIGHLEVEL_API_BASE = "https://services.leadconnectorhq.com";
const HIGHLEVEL_API_VERSION = "2023-02-21";
const PAGE_LIMIT = 100;

type QueryValue = string | number | boolean | null | undefined;
type RawRecord = Record<string, unknown>;
type DomainResolver = (domain: string) => Promise<InboxGuardDomainSource["dns"]>;

type InstalledLocation = {
  id: string;
  name: string;
  domain?: string;
};

export function buildGhlUrl(path: string, query: Record<string, QueryValue> = {}): URL {
  const url = new URL(path.startsWith("/") ? path : `/${path}`, HIGHLEVEL_API_BASE);

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

export class HighLevelClient {
  constructor(
    private readonly accessToken: string,
    private readonly fetcher: typeof fetch = fetch,
    private readonly resolveDns: DomainResolver = resolveDomainAuth
  ) {}

  async buildInboxGuardSource(companyId?: string): Promise<InboxGuardSource> {
    const [company, locations] = await Promise.all([this.getCompany(companyId), this.listInstalledLocations(companyId)]);
    const domains: InboxGuardDomainSource[] = [];

    for (const location of locations) {
      const domain = location.domain ?? (await this.findLocationDomain(location.id));
      if (!domain) {
        continue;
      }

      domains.push({
        id: location.id,
        locationId: location.id,
        locationName: location.name,
        domain,
        dns: await this.resolveDns(domain)
      });
    }

    return {
      agencyName: company.name ?? "HighLevel Agency",
      generatedAt: new Date().toISOString(),
      domains
    };
  }

  async getCompany(companyId?: string): Promise<{ name?: string }> {
    if (!companyId) {
      return {};
    }

    const payload = await this.getJson(`/companies/${companyId}`);
    const raw = extractSingleRecord(payload, "company");
    return {
      name: asString(raw.name ?? raw.companyName)
    };
  }

  async listInstalledLocations(companyId?: string): Promise<InstalledLocation[]> {
    const payload = await this.getJson("/oauth/installedLocations", { companyId, limit: PAGE_LIMIT });
    return extractRecords(payload, ["locations", "installedLocations"]).map(normalizeInstalledLocation);
  }

  private async findLocationDomain(locationId: string): Promise<string | undefined> {
    try {
      const payload = await this.getJson(`/locations/${locationId}`);
      return extractSendingDomain(payload);
    } catch {
      return undefined;
    }
  }

  private async getJson(path: string, query: Record<string, QueryValue> = {}): Promise<unknown> {
    const response = await this.fetcher(buildGhlUrl(path, query), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.accessToken}`,
        Version: HIGHLEVEL_API_VERSION
      }
    });

    if (!response.ok) {
      throw new Error(`HighLevel request failed: ${response.status}`);
    }

    return response.json();
  }
}

export function normalizeInstalledLocation(raw: RawRecord): InstalledLocation {
  return {
    id: requiredString(raw.locationId ?? raw.id ?? raw._id, "location id"),
    name: asString(raw.name ?? raw.businessName ?? raw.companyName) ?? "Unnamed sub-account",
    domain: extractSendingDomain(raw)
  };
}

export function extractSendingDomain(value: unknown): string | undefined {
  return findDomain(value);
}

function findDomain(value: unknown, key = ""): string | undefined {
  if (typeof value === "string") {
    return keyLooksLikeDomain(key) ? domainFromUnknown(value) : undefined;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const domain = findDomain(item, key);
      if (domain) {
        return domain;
      }
    }
    return undefined;
  }

  if (!isRecord(value)) {
    return undefined;
  }

  for (const [childKey, childValue] of Object.entries(value)) {
    const domain = findDomain(childValue, childKey);
    if (domain) {
      return domain;
    }
  }

  return undefined;
}

function keyLooksLikeDomain(key: string): boolean {
  const normalized = key.toLowerCase();
  return normalized.includes("domain") || normalized.includes("host") || normalized.includes("smtp") || normalized.includes("mailgun");
}

function domainFromUnknown(value: string): string | undefined {
  const text = value.trim();
  if (!text) {
    return undefined;
  }

  if (text.includes("@")) {
    return normalizeDomain(text.split("@")[1] ?? "");
  }

  try {
    const url = new URL(text.startsWith("http") ? text : `https://${text}`);
    return normalizeDomain(url.hostname);
  } catch {
    return normalizeDomain(text);
  }
}

function normalizeDomain(domain: string): string | undefined {
  const normalized = domain.trim().toLowerCase().replace(/^\.+|\.+$/g, "");
  return normalized.includes(".") ? normalized : undefined;
}

function extractSingleRecord(payload: unknown, preferredKey: string): RawRecord {
  if (isRecord(payload) && isRecord(payload[preferredKey])) {
    return payload[preferredKey];
  }

  if (isRecord(payload)) {
    return payload;
  }

  return {};
}

function extractRecords(payload: unknown, keys: string[]): RawRecord[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  if (!isRecord(payload)) {
    return [];
  }

  for (const key of keys) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value.filter(isRecord);
    }
  }

  return [];
}

function requiredString(value: unknown, field: string): string {
  const text = asString(value);
  if (!text) {
    throw new Error(`HighLevel record is missing ${field}.`);
  }
  return text;
}

function asString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim() !== "") {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return undefined;
}

function isRecord(value: unknown): value is RawRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
