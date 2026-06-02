import { Graphlit, Types } from "graphlit-client";

type RetrievalToolOptions = {
  collectionId?: string;
  defaultLimit?: number;
};

type RetrievalArgs = {
  query: string;
  limit?: number;
};

function clampLimit(limit: number | undefined, fallback: number): number {
  if (!Number.isFinite(limit)) {
    return fallback;
  }

  return Math.min(Math.max(Math.floor(limit as number), 1), 10);
}

function truncateText(text: string | null | undefined, maxLength = 900): string {
  const value = text?.trim() ?? "";
  if (!value) {
    return "";
  }

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

export function createRetrieveContentsTool(
  client: Graphlit,
  options: RetrievalToolOptions = {},
): {
  tools: Types.ToolDefinitionInput[];
  toolHandlers: Record<string, (args: RetrievalArgs) => Promise<unknown>>;
} {
  const collectionId = options.collectionId;
  const defaultLimit = options.defaultLimit ?? 6;

  const tool: Types.ToolDefinitionInput = {
    name: "retrieve_contents",
    description:
      "Retrieve relevant content from Graphlit before answering knowledge-base questions. Use this for documents, notes, pages, transcripts, and scoped collections.",
    schema: JSON.stringify({
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "What to search for in the Graphlit knowledge base. Use specific concepts, subjects, or questions.",
        },
        limit: {
          type: "number",
          description: "Maximum number of matches to retrieve. Defaults to 6.",
        },
      },
      required: ["query"],
    }),
  };

  const toolHandlers = {
    retrieve_contents: async (args: RetrievalArgs) => {
      const query = args.query?.trim();
      if (!query) {
        return {
          query: "",
          collectionId: collectionId ?? null,
          results: [],
          warning: "retrieve_contents requires a non-empty query.",
        };
      }

      const limit = clampLimit(args.limit, defaultLimit);
      const filter: Types.ContentFilter = {
        searchType: Types.SearchTypes.Hybrid,
        disableInheritance: true,
        collections: collectionId ? [{ id: collectionId }] : undefined,
      };

      const retrieved = await client.retrieveSources(
        query,
        filter,
        undefined,
        {
          type: Types.RetrievalStrategyTypes.Section,
          contentLimit: limit,
          disableFallback: true,
        },
        {
          serviceType: Types.RerankingModelServiceTypes.Cohere,
        },
      );

      const rawSources =
        retrieved.retrieveSources?.results?.filter(
          (source): source is NonNullable<typeof source> =>
            Boolean(source?.content?.id),
        ) ?? [];

      const contentIds = [...new Set(rawSources.map((source) => source.content!.id!))];
      const lookup =
        contentIds.length > 0 ? await client.lookupContents(contentIds) : undefined;

      const contentMap = new Map(
        (lookup?.lookupContents?.results ?? [])
          .filter((content): content is NonNullable<typeof content> => Boolean(content))
          .map((content) => [content.id, content]),
      );

      const results = rawSources
        .map((source) => {
          const content = contentMap.get(source.content!.id!);
          if (!content) {
            return null;
          }

          return {
            id: content.id,
            name: content.fileName || content.name || "Untitled content",
            text: truncateText(source.text),
            relevance: source.relevance ?? null,
            pageNumber: source.pageNumber ?? null,
            startTime: source.startTime ?? null,
            endTime: source.endTime ?? null,
          };
        })
        .filter((result): result is NonNullable<typeof result> => result !== null);

      return {
        query,
        collectionId: collectionId ?? null,
        results,
      };
    },
  };

  return {
    tools: [tool],
    toolHandlers,
  };
}
