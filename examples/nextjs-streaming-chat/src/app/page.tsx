"use client";

import { FormEvent, useState } from "react";

type RetrievedSource = {
  id: string;
  name: string;
  text?: string | null;
  relevance?: number | null;
  pageNumber?: number | null;
  startTime?: number | null;
  endTime?: number | null;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  sources?: RetrievedSource[];
};

type IngestRecord = {
  contentId: string;
  collectionId?: string | null;
  complete: boolean;
  name?: string | null;
};

type StreamEvent =
  | { type: "conversation_started"; conversationId: string }
  | {
      type: "tool_update";
      name: string;
      status: string;
      result?: { results?: RetrievedSource[] } | null;
    }
  | { type: "message_update"; message: string; isStreaming: boolean }
  | { type: "done" }
  | { type: "error"; message: string };

const QUICK_PROMPTS = [
  "Summarize the key points from the ingested content.",
  "What onboarding steps are mentioned in the ingested content?",
  "What support, pricing, or limits are described?",
];

export default function Page() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [ingestUrl, setIngestUrl] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const [ingestStatus, setIngestStatus] = useState<string | null>(null);
  const [ingested, setIngested] = useState<IngestRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runtimeStatus = isStreaming
    ? "STREAMING"
    : toolStatus
      ? "TOOL ACTIVE"
      : ingested?.complete
        ? "READY"
        : "WAITING FOR CONTENT";

  function updateLastAssistant(
    updater: (message: ChatMessage) => ChatMessage,
  ): void {
    setMessages((current) => {
      const next = [...current];

      for (let index = next.length - 1; index >= 0; index -= 1) {
        if (next[index].role === "assistant") {
          next[index] = updater(next[index]);
          break;
        }
      }

      return next;
    });
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = input.trim();
    if (!message || isStreaming) {
      return;
    }

    setError(null);
    setToolStatus(null);
    setInput("");
    setIsStreaming(true);
    setMessages((current) => [
      ...current,
      { role: "user", content: message },
      { role: "assistant", content: "", sources: [] },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          conversationId,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to start chat stream.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        while (true) {
          const newlineIndex = buffer.indexOf("\n");
          if (newlineIndex === -1) {
            break;
          }

          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);

          if (!line) {
            continue;
          }

          const streamEvent = JSON.parse(line) as StreamEvent;

          switch (streamEvent.type) {
            case "conversation_started":
              setConversationId(streamEvent.conversationId);
              break;
            case "tool_update":
              setToolStatus(`${streamEvent.name}: ${streamEvent.status}`);
              if (
                streamEvent.name === "retrieve_contents" &&
                streamEvent.status === "completed" &&
                streamEvent.result?.results
              ) {
                updateLastAssistant((assistant) => ({
                  ...assistant,
                  sources: streamEvent.result?.results ?? [],
                }));
              }
              break;
            case "message_update":
              updateLastAssistant((assistant) => ({
                ...assistant,
                content: streamEvent.message,
              }));
              break;
            case "error":
              setError(streamEvent.message);
              break;
            case "done":
              setToolStatus(null);
              break;
          }
        }
      }
    } catch (streamError) {
      const messageText =
        streamError instanceof Error
          ? streamError.message
          : "Unexpected streaming error.";
      setError(messageText);
    } finally {
      setIsStreaming(false);
    }
  }

  async function ingestContent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const url = ingestUrl.trim();
    if (!url || isIngesting) {
      return;
    }

    setError(null);
    setIsIngesting(true);
    setIngestStatus("Starting ingestion...");

    try {
      const response = await fetch("/api/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const payload = (await response.json()) as {
        error?: string;
        contentId?: string;
        collectionId?: string;
        complete?: boolean;
        name?: string | null;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to ingest URL.");
      }

      setIngestUrl("");
      setIngested({
        contentId: payload.contentId ?? "",
        collectionId: payload.collectionId,
        complete: Boolean(payload.complete),
        name: payload.name,
      });
      setIngestStatus(
        payload.complete
          ? `Ready: ${payload.name ?? payload.contentId}`
          : "Ingestion started but is still processing.",
      );
    } catch (ingestError) {
      const messageText =
        ingestError instanceof Error
          ? ingestError.message
          : "Unexpected ingestion error.";
      setError(messageText);
      setIngestStatus(null);
    } finally {
      setIsIngesting(false);
    }
  }

  return (
    <main className="page-shell">
      <div className="page-frame">
        <header className="masthead">
          <div className="masthead-copy">
            <div className="system-label">Graphlit skill / next.js example</div>
            <h1 className="page-title">Agentic retrieval chat over ingested content.</h1>
            <p className="page-summary">
              Ingest a website or file URL with Graphlit, poll{" "}
              <code>isContentDone()</code>, then use <code>streamAgent()</code>{" "}
              with one explicit <code>retrieve_contents</code> tool. Retrieval
              stays visible, scoped, and debuggable.
            </p>
          </div>

          <div className="runbook">
            <div className="runbook-row">
              <span className="system-label">Harness</span>
              <span className="mono-data">streamAgent()</span>
            </div>
            <div className="runbook-row">
              <span className="system-label">Retrieval</span>
              <span className="mono-data">retrieve_contents</span>
            </div>
            <div className="runbook-row">
              <span className="system-label">Content gate</span>
              <span className="mono-data">isContentDone()</span>
            </div>
            <div className="runbook-row">
              <span className="system-label">Scope</span>
              <span className="mono-data">single collection</span>
            </div>
          </div>
        </header>

        <section className="surface">
          <div className="surface-header">
            <div className="system-label">System state</div>
            <div className="status-inline">
              <div className="leds" aria-hidden="true">
                <span className={`led ${ingested ? "active" : ""}`} />
                <span className={`led ${ingested?.complete ? "active" : ""}`} />
                <span className={`led ${messages.length > 0 ? "active" : ""}`} />
                <span className={`led ${Boolean(toolStatus) ? "active" : ""}`} />
                <span className={`led ${isStreaming ? "active" : ""}`} />
              </div>
              <span className="status-badge">{runtimeStatus}</span>
            </div>
          </div>

          <div className="metrics-grid">
            <div className="metric-card">
              <div className="system-label">Conversation</div>
              <div className="mono-data">
                {conversationId ?? "created on first message"}
              </div>
            </div>
            <div className="metric-card">
              <div className="system-label">Ingestion</div>
              <div className="mono-data">
                {ingestStatus ?? "no content ingested yet"}
              </div>
            </div>
            <div className="metric-card">
              <div className="system-label">Tool status</div>
              <div className="mono-data">{toolStatus ?? "idle"}</div>
            </div>
            <div className="metric-card">
              <div className="system-label">Collection scope</div>
              <div className="mono-data">
                {ingested?.collectionId ?? "auto-created example collection"}
              </div>
            </div>
          </div>
        </section>

        <div className="workspace-grid">
          <aside className="control-column">
            <section className="surface">
              <div className="surface-header">
                <div className="system-label">Credential setup</div>
                <div className="status-badge">Graphlit Studio</div>
              </div>
              <div className="surface-body">
                <div className="list-table">
                  <div className="list-row">
                    <div className="list-index">01</div>
                    <div className="list-copy">
                      Select the target project in the Graphlit Studio sidebar
                      so its project card is visible.
                    </div>
                  </div>
                  <div className="list-row">
                    <div className="list-index">02</div>
                    <div className="list-copy">
                      Choose the target environment tab, usually{" "}
                      <code>Preview</code> or <code>Production</code>.
                    </div>
                  </div>
                  <div className="list-row">
                    <div className="list-index">03</div>
                    <div className="list-copy">
                      Click the copy button for{" "}
                      <code>Copy Environment Variables</code>.
                    </div>
                  </div>
                  <div className="list-row">
                    <div className="list-index">04</div>
                    <div className="list-copy">
                      Paste <code>GRAPHLIT_ORGANIZATION_ID</code>,{" "}
                      <code>GRAPHLIT_ENVIRONMENT_ID</code>, and{" "}
                      <code>GRAPHLIT_JWT_SECRET</code> into{" "}
                      <code>.env.local</code>.
                    </div>
                  </div>
                  <div className="list-row">
                    <div className="list-index">05</div>
                    <div className="list-copy">
                      Add <code>OPENAI_API_KEY</code> for the model runtime.
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="surface">
              <div className="surface-header">
                <div className="system-label">Step 1 / ingest content</div>
                <div className="status-badge">
                  {isIngesting ? "Polling isContentDone" : "ingestUri()"}
                </div>
              </div>
              <div className="surface-body stack">
                <div className="micro-note">
                  Use a public website URL or public file URL. This sample keeps
                  ingestion minimal on purpose so the retrieval step stays easy to
                  understand.
                </div>

                <form onSubmit={ingestContent} className="form-grid">
                  <div className="field-stack">
                    <label className="system-label" htmlFor="ingest-url">
                      Website or file URL
                    </label>
                    <input
                      id="ingest-url"
                      className="hardware-input mono-input"
                      value={ingestUrl}
                      onChange={(event) => setIngestUrl(event.target.value)}
                      placeholder="https://example.com/document.pdf"
                    />
                  </div>
                  <div className="action-row">
                    <button
                      className="button-primary"
                      type="submit"
                      disabled={isIngesting}
                    >
                      {isIngesting ? "Ingesting" : "Ingest content"}
                    </button>
                  </div>
                </form>

                <div className="hint-panel">
                  Retrieval should not start until Graphlit finishes processing the
                  content. That is why the route polls <code>isContentDone()</code>{" "}
                  before the UI marks the content ready.
                </div>

                {ingested ? (
                  <div className="list-table">
                    <div className="list-row">
                      <div className="list-index">ID</div>
                      <div className="list-copy mono-data">{ingested.contentId}</div>
                    </div>
                    <div className="list-row">
                      <div className="list-index">NM</div>
                      <div className="list-copy">
                        {ingested.name ?? "recently ingested content"}
                      </div>
                    </div>
                    <div className="list-row">
                      <div className="list-index">ST</div>
                      <div className="list-copy mono-data">
                        {ingested.complete ? "COMPLETE" : "PROCESSING"}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="surface">
              <div className="surface-header">
                <div className="system-label">Runtime contract</div>
                <div className="status-badge">retrieval-first</div>
              </div>
              <div className="surface-body">
                <div className="list-table">
                  <div className="list-row">
                    <div className="list-index">A</div>
                    <div className="list-copy">
                      <code>streamAgent()</code> is the tool-calling harness, not
                      the retrieval layer.
                    </div>
                  </div>
                  <div className="list-row">
                    <div className="list-index">B</div>
                    <div className="list-copy">
                      The model should call <code>retrieve_contents</code> before
                      answering knowledge-base questions.
                    </div>
                  </div>
                  <div className="list-row">
                    <div className="list-index">C</div>
                    <div className="list-copy">
                      Retrieved evidence is rendered below the assistant reply so
                      the flow stays inspectable.
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </aside>

          <section className="surface transcript-surface">
            <div className="surface-header">
              <div className="system-label">Step 2 / stream chat with retrieval</div>
              <div className="status-badge mono-data">
                {conversationId ?? "no active conversation"}
              </div>
            </div>

            <div className="transcript-shell">
              <div className="prompt-strip">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="prompt-button"
                    onClick={() => setInput(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="message-list">
                {messages.length === 0 ? (
                  <div className="empty-state">
                    <div className="system-label">Suggested first question</div>
                    <div className="empty-copy">
                      Ask for a grounded summary, onboarding details, support
                      information, pricing details, or any topic that should force
                      the agent to retrieve evidence first.
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <article
                      key={`${message.role}-${index}`}
                      className={`message-row ${
                        message.role === "user" ? "message-row-user" : ""
                      }`}
                    >
                      <div className="message-topline">
                        <span className="system-label">{message.role}</span>
                        <span className="mono-meta">
                          turn {Math.floor(index / 2) + 1}
                        </span>
                      </div>
                      <div className="message-body">
                        {message.content || (message.role === "assistant" ? "..." : "")}
                      </div>

                      {message.role === "assistant" && message.sources?.length ? (
                        <div className="source-table">
                          {message.sources.map((source) => (
                            <div key={source.id} className="source-entry">
                              <div className="source-topline">
                                <span className="source-name">{source.name}</span>
                                <span className="mono-meta">
                                  {source.pageNumber
                                    ? `PAGE ${source.pageNumber}`
                                    : "SECTION"}
                                  {source.relevance != null
                                    ? ` · ${source.relevance.toFixed(3)}`
                                    : ""}
                                </span>
                              </div>
                              <div className="source-snippet">{source.text}</div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))
                )}
              </div>
            </div>

            <div className="composer">
              <form onSubmit={sendMessage} className="form-grid">
                <div className="field-stack">
                  <label className="system-label" htmlFor="chat-input">
                    Grounded chat prompt
                  </label>
                  <textarea
                    id="chat-input"
                    className="hardware-textarea"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Ask a grounded question about the content you ingested..."
                    rows={5}
                  />
                </div>
                <div className="action-row">
                  <button
                    className="button-primary"
                    type="submit"
                    disabled={isStreaming}
                  >
                    {isStreaming ? "Streaming" : "Send prompt"}
                  </button>
                  <button
                    className="button-secondary"
                    type="button"
                    onClick={() => {
                      setMessages([]);
                      setConversationId(null);
                      setToolStatus(null);
                    }}
                  >
                    Reset conversation
                  </button>
                </div>
              </form>

              {error ? <div className="alert-panel">{error}</div> : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
