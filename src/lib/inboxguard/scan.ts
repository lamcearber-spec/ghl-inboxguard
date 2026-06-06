import { HighLevelClient } from "@/lib/ghl/client";
import { getInstallationStore, type InstallationStore } from "@/lib/store/installations";
import { toInboxGuardCsv, toInboxGuardFindingsCsv } from "./export";
import { demoInboxGuardReport } from "./fixtures";
import { buildInboxGuardReport } from "./model";
import type { InboxGuardReport, InboxGuardSource } from "./types";

export type InboxGuardScanParams = {
  installationId?: string;
};

export type InboxGuardScan = {
  mode: "fixture" | "live";
  report: InboxGuardReport;
  domainCsv: string;
  findingsCsv: string;
};

type InboxGuardClient = {
  buildInboxGuardSource(companyId?: string): Promise<InboxGuardSource>;
};

type ScanDependencies = {
  store?: InstallationStore;
  clientFactory?: (accessToken: string) => InboxGuardClient;
};

export async function scanInboxGuard(params: InboxGuardScanParams = {}, deps: ScanDependencies = {}): Promise<InboxGuardScan> {
  const store = deps.store ?? getInstallationStore();
  const installation = params.installationId ? await store.get(params.installationId) : undefined;

  if (!installation) {
    return buildScan("fixture", demoInboxGuardReport);
  }

  const clientFactory = deps.clientFactory ?? ((accessToken: string) => new HighLevelClient(accessToken));
  const source = await clientFactory(installation.accessToken).buildInboxGuardSource(installation.companyId);
  return buildScan("live", buildInboxGuardReport(source));
}

function buildScan(mode: InboxGuardScan["mode"], report: InboxGuardReport): InboxGuardScan {
  return {
    mode,
    report,
    domainCsv: toInboxGuardCsv(report),
    findingsCsv: toInboxGuardFindingsCsv(report)
  };
}
