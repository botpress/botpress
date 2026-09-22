# LLMz examples

These examples use native `run_javascript` tool calls, `Session` for retained state, and `Chat` for assistant text and components. Worker examples complete through typed exits. The numbering is stable so existing links keep working.

## Setup

From the repository root, install the workspace dependencies and build LLMz with its dependencies:

```sh
pnpm install
pnpm exec turbo run build --filter=llmz...
cd packages/llmz/examples
cp .env.example .env
```

Set `BOTPRESS_BOT_ID` and `BOTPRESS_TOKEN` in `.env`. A per-example `.env` takes precedence over the shared file; existing shell variables take precedence over both. `BOTPRESS_API_URL` optionally selects a different Botpress endpoint. All examples use `openai:gpt-5.6-luna` by default, including the guardrail checker. Set `BOTPRESS_MODEL` to override the model for any example.

```sh
pnpm start --list
pnpm start 01
pnpm start 14_worker_snapshot
```

Run interactive examples in a terminal. Most chat examples accept an empty reply, `quit`, or `exit` to stop; Ctrl+C also stops the process. Provider generation costs apply. Examples 05, 12, and 20 additionally use real browser or file APIs; run them against a development bot. Other business actions are simulated.

## Examples

| Example                                                | Demonstrates                     |
| ------------------------------------------------------ | -------------------------------- |
| [01_chat_basic](./01_chat_basic)                       | Basic chat                       |
| [02_chat_exits](./02_chat_exits)                       | Typed exits                      |
| [03_chat_conditional_tool](./03_chat_conditional_tool) | Conditional tools                |
| [04_chat_small_models](./04_chat_small_models)         | Model selection and ticket tools |
| [05_chat_web_search](./05_chat_web_search)             | Browser integration tools        |
| [06_chat_confirm_tool](./06_chat_confirm_tool)         | Host-controlled confirmation     |
| [07_chat_guardrails](./07_chat_guardrails)             | Code and response checks         |
| [08_chat_multi_agent](./08_chat_multi_agent)           | Agent handoffs                   |
| [09_chat_variables](./09_chat_variables)               | Validated object properties      |
| [10_chat_components](./10_chat_components)             | Custom chat components           |
| [11_worker_minimal](./11_worker_minimal)               | Minimal worker                   |
| [12_worker_fs](./12_worker_fs)                         | Cloud file tools                 |
| [13_worker_sandbox](./13_worker_sandbox)               | Cooperative cancellation         |
| [14_worker_snapshot](./14_worker_snapshot)             | Save and resume a session        |
| [15_worker_stacktraces](./15_worker_stacktraces)       | Execution diagnostics            |
| [16_worker_tool_chaining](./16_worker_tool_chaining)   | Tool chaining                    |
| [17_worker_error_recovery](./17_worker_error_recovery) | Error recovery                   |
| [18_worker_security](./18_worker_security)             | Sandbox security checks          |
| [19_worker_wrap_tool](./19_worker_wrap_tool)           | Wrapping tools                   |
| [20_chat_rag](./20_chat_rag)                           | Retrieval with citations         |
| [22_chat_streaming](./22_chat_streaming)               | Streaming text and rich messages |

| [23_chat_compaction](./23_chat_compaction) | Custom mocked compaction and summary previews |
| [24_chat_events_and_media](./24_chat_events_and_media) | Events, image attachments and voice input |

## Verification

From `packages/llmz`:

```sh
pnpm check:examples
pnpm test -- examples
```

The type check resolves `llmz` to the current source API. Offline smoke tests execute the example entry points with scripted model responses and mocked external services, exercising the real LLMz runtime without API charges. They verify wiring and behavior, not current provider quality or the configuration of your bot’s integrations. Live execution uses the built package; rebuild it after changing the library.

Examples 01–22 include a short, colored recording made with Luna. The recordings use a 100 × 28 terminal, with the same dimensions for capture and SVG playback. Typing is paced naturally, and interactive conversations include button selections and follow-up turns where useful. Long idle pauses are shortened; model responses and tool results are recorded live. `record-demo.sh` can record a new terminal session when `asciinema` 2.x and `svg-term` are installed. Run `./record-demo.sh 01` (or the full example folder name); the cast and SVG are saved inside that example folder.
