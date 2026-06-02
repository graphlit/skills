import type { AgentStreamEvent } from "graphlit-client";
import { NextRequest } from "next/server";

import {
  createGraphlitClient,
  ensureStreamingSpecification,
  ensureExampleCollection,
} from "@/lib/graphlit";
import { createRetrieveContentsTool } from "@/lib/retrieval-tool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatRequest = {
  message?: string;
  conversationId?: string | null;
  collectionId?: string | null;
};

function ndjson(data: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(data)}\n`);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ChatRequest;
  const message = body.message?.trim();

  if (!message) {
    return Response.json({ error: "Message is required." }, { status: 400 });
  }

  const client = createGraphlitClient();
  const specification = await ensureStreamingSpecification(client);
  const collectionId = await ensureExampleCollection(
    client,
    body.collectionId ?? undefined,
  );
  const { tools, toolHandlers } = createRetrieveContentsTool(client, {
    collectionId,
    defaultLimit: 6,
  });

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const write = (payload: unknown) => {
        controller.enqueue(ndjson(payload));
      };

      void (async () => {
        try {
          await client.streamAgent(
            message,
            (event: AgentStreamEvent) => {
              switch (event.type) {
                case "conversation_started":
                  write({
                    type: "conversation_started",
                    conversationId: event.conversationId,
                  });
                  break;
                case "tool_update":
                  write({
                    type: "tool_update",
                    name: event.toolCall.name,
                    status: event.status,
                    result: event.result ?? null,
                  });
                  break;
                case "message_update":
                  if (event.message.isThinking) {
                    return;
                  }
                  write({
                    type: "message_update",
                    message: event.message.message ?? "",
                    isStreaming: event.isStreaming,
                  });
                  break;
                case "error":
                  write({
                    type: "error",
                    message: event.error.message,
                  });
                  break;
              }
            },
            body.conversationId ?? undefined,
            specification,
            tools,
            toolHandlers,
            {
              chunkingStrategy: "word",
              useResponsesApi: true,
            },
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            [
              "You are a grounded assistant over a Graphlit knowledge base.",
              "Only rely on content that has already been ingested and processed in Graphlit.",
              "Use retrieve_contents before answering questions that depend on project content, documents, pages, notes, or synced knowledge.",
              "If retrieve_contents returns weak or empty evidence, say so plainly.",
              "Cite document names naturally in the answer instead of mentioning tools or runtime mechanics.",
            ].join(" "),
          );

          write({ type: "done" });
          controller.close();
        } catch (error) {
          write({
            type: "error",
            message:
              error instanceof Error ? error.message : "Unexpected server error.",
          });
          controller.close();
        }
      })();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
