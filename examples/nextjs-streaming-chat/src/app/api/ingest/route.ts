import { NextRequest } from "next/server";

import {
  createGraphlitClient,
  ensureExampleCollection,
  pollUntilContentDone,
} from "@/lib/graphlit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IngestRequest = {
  url?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as IngestRequest;
  const url = body.url?.trim();

  if (!url) {
    return Response.json({ error: "URL is required." }, { status: 400 });
  }

  const client = createGraphlitClient();
  const collectionId = await ensureExampleCollection(client);

  const ingestResponse = await client.ingestUri(
    url,
    undefined,
    undefined,
    undefined,
    false,
    undefined,
    collectionId ? [{ id: collectionId }] : undefined,
  );

  const contentId = ingestResponse.ingestUri?.id;
  if (!contentId) {
    return Response.json(
      { error: "Graphlit did not return a content id for the ingestion request." },
      { status: 500 },
    );
  }

  const complete = await pollUntilContentDone(client, contentId);
  const content = complete ? await client.getContent(contentId) : undefined;

  return Response.json({
    contentId,
    collectionId: collectionId ?? null,
    complete,
    name: content?.content?.name ?? null,
  });
}
