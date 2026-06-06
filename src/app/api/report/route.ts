import { NextResponse } from "next/server";
import { scanInboxGuard } from "@/lib/inboxguard/scan";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const scan = await scanInboxGuard({
    installationId: url.searchParams.get("installationId") ?? undefined
  });

  return NextResponse.json(scan);
}
