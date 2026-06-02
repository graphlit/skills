import OpenAI from "openai";
import { Graphlit, Types } from "graphlit-client";

const STREAMING_SPEC_NAME = "Graphlit Streaming Chat Example";
const EXAMPLE_COLLECTION_NAME = "Graphlit Streaming Chat Example";

let cachedSpecificationId: string | undefined;
let cachedCollectionId: string | undefined;

export function createGraphlitClient(): Graphlit {
  const client = new Graphlit();
  client.setOpenAIClient(
    new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    }),
  );
  return client;
}

export async function ensureStreamingSpecification(
  client: Graphlit,
): Promise<Types.EntityReferenceInput | undefined> {
  const explicitId = process.env.GRAPHLIT_SPECIFICATION_ID;
  if (explicitId) {
    return { id: explicitId };
  }

  if (cachedSpecificationId) {
    return { id: cachedSpecificationId };
  }

  const existing = await client.querySpecifications({
    search: STREAMING_SPEC_NAME,
    types: [Types.SpecificationTypes.Completion],
  });

  const matching =
    existing.specifications?.results?.find(
      (spec) => spec?.name === STREAMING_SPEC_NAME,
    ) ?? existing.specifications?.results?.[0];

  if (matching?.id) {
    cachedSpecificationId = matching.id;
    return { id: matching.id };
  }

  const created = await client.createSpecification({
    name: STREAMING_SPEC_NAME,
    type: Types.SpecificationTypes.Completion,
    serviceType: Types.ModelServiceTypes.OpenAi,
    openAI: {
      model: Types.OpenAiModels.Gpt4O_128K,
      temperature: 0.2,
      completionTokenLimit: 1200,
    },
  });

  const createdSpecificationId = created.createSpecification?.id;
  if (!createdSpecificationId) {
    throw new Error("Failed to create Graphlit completion specification.");
  }

  cachedSpecificationId = createdSpecificationId;
  return { id: cachedSpecificationId };
}

export async function ensureExampleCollection(
  client: Graphlit,
  requestCollectionId?: string | null,
): Promise<string | undefined> {
  const explicitCollectionId =
    requestCollectionId ?? process.env.GRAPHLIT_COLLECTION_ID ?? undefined;

  if (explicitCollectionId) {
    return explicitCollectionId;
  }

  if (cachedCollectionId) {
    return cachedCollectionId;
  }

  const existing = await client.queryCollections({
    name: EXAMPLE_COLLECTION_NAME,
  });

  const matching =
    existing.collections?.results?.find(
      (collection) => collection?.name === EXAMPLE_COLLECTION_NAME,
    ) ?? existing.collections?.results?.[0];

  if (matching?.id) {
    cachedCollectionId = matching.id;
    return matching.id;
  }

  const created = await client.createCollection({
    name: EXAMPLE_COLLECTION_NAME,
  });

  const createdCollectionId = created.createCollection?.id;
  if (!createdCollectionId) {
    throw new Error("Failed to create Graphlit example collection.");
  }

  cachedCollectionId = createdCollectionId;
  return cachedCollectionId;
}

export async function pollUntilContentDone(
  client: Graphlit,
  contentId: string,
  intervalMs = 5000,
  maxAttempts = 24,
): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const status = await client.isContentDone(contentId);
    if (status.isContentDone?.result) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return false;
}
