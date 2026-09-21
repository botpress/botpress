# Custom session compaction

Run `pnpm start 23` from `examples` after the shared setup.

Three short chat turns use Luna. Summary generation is mocked: `compaction.summarize` deterministically extracts recent user requests without a provider call. The example previews a summary with `session.summarize()`, explicitly compacts older iterations with `session.compact()`, and continues the conversation. A summary event replaces older history; exact `trip` memory and queued input survive.

The extraction callback is deliberately a demo, not a production summarizer: it does not preserve all assistant actions or older summaries. Replace it with a summarizer that preserves decisions, completed effects, uncertainty, and pending work. LLMz validates the returned text and enforces `maxSummaryTokens`; failed summaries leave history unchanged. The same callback is used by automatic compaction.

`compaction.test.ts` verifies deterministic summaries, no summarization network calls, unchanged history after preview, and preserved memory/events after compaction.
