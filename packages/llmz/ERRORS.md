# Errors and recovery

Every library failure has a stable `code`, a readable `message`, and a `critical` flag. Each class exports a detachable `.is(value)` type guard. `isLLMzError(value, code)` narrows the same discriminated union by code. Guards use a shared `Symbol.for` brand plus the error code, so they work across independently loaded copies of LLMz and after the runtime restores a QuickJS exception. They do not rely on `instanceof`, class names, or message matching.

```ts
import { ToolInputError, isLLMzError, isCriticalError, type Iteration } from 'llmz'

function observe(iteration: Iteration) {
  // Includes tool failures that generated JavaScript caught and handled itself.
  for (const error of iteration.errors) {
    if (ToolInputError.is(error)) {
      console.log(error.toolName, error.issues, error.expectedInput)
    }
  }

  const error = iteration.exception
  if (isLLMzError(error, 'EXECUTION_FAILED')) {
    // The wrapper retains source location information and the original typed cause.
    console.log(error.source, error.stacktrace)
    if (ToolInputError.is(error.cause)) {
      console.log(error.cause.expectedInput)
    }
  }

  if (isCriticalError(error)) {
    console.error('Execution cannot continue:', error.code)
  }
}
```

Pass `observe` as `onIterationEnd`. `iteration.error` remains the readable string summary; `iteration.exception` is the typed failure that ended the iteration. `iteration.errors` also includes observed tool/component/exit failures and memory retention errors, including failures handled inside generated code. A recovered execution keeps the failed iterations in `result.iterations`; a successful iteration can have errors in its diagnostics without an `exception`.

`result.isError()` exposes a typed `result.error`. An exhausted iteration budget is a run-level `LoopExceededError`; the last iteration keeps its original exception, and its `errors` list also receives the limit error. This limit is detected after that iteration's end hook. Configuration failures can occur before an iteration exists. Constructors, `session.append()`, and standalone session operations throw directly to their caller.

A **non-critical** iteration failure produces feedback and permits another model call within the remaining iteration budget. It does not promise that retrying an external action is safe. Feedback records acknowledged tool results and deliveries, discloses uncertain effects, and tells the model not to repeat completed actions blindly. The model may correct its arguments, choose another tool, or complete through an appropriate exit.

Original schema refinements are enforced for tool inputs, exit payloads, component props, and object-property assignments. Their issues use the corresponding input/property error below. Async effects are supported for tool inputs; using them on synchronous exit, component, or property APIs raises critical `InvalidConfigurationError`. A schema callback that throws instead of reporting a validation issue is also a configuration failure. Tool output schemas are documentation only: unexpected tool return values do not produce schema-validation errors.

A **critical** failure stops the execution without another model call. Critical tool failures remain fatal even if generated JavaScript catches them; later host operations are closed. Examples include provider failures, token overflow, failed compaction, cancellation, and memory capacity exhaustion. A hook can reject an iteration with an ordinary error (reported as `HookError`), or stop execution with a critical typed error or its abort controller. Observational callbacks remain observational; `onIterationEnd` propagates explicitly critical failures.

## Complete catalogue

“Recoverable” below means the runtime may continue when the failure occurs in an active iteration. Errors thrown by standalone methods are returned to the caller.

| Code                      | Exported class              | Handling and details                                                                                                                                                                                              |
| ------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `INVALID_CODE`            | `InvalidCodeError`          | Recoverable. Invalid JavaScript or unsupported dynamic code; `source` retains the program.                                                                                                                        |
| `EXECUTION_FAILED`        | `CodeExecutionError`        | Recoverable unless its cause is critical. `source`, `stacktrace`, `originalErrorName`, and `cause` preserve execution context.                                                                                    |
| `UNKNOWN_TOOL`            | `UnknownToolError`          | Recoverable. Missing callable or unrecognized native tool; `toolName`, `availableTools`.                                                                                                                          |
| `INVALID_TOOL_INPUT`      | `ToolInputError`            | Recoverable. Handler never ran; `toolName`, `issues`, `expectedInput`.                                                                                                                                            |
| `TOOL_EXECUTION_FAILED`   | `ToolExecutionError`        | Recoverable. Handler failed after its configured retry policy; `toolName`, original `cause`. Effects may have occurred.                                                                                           |
| `RESERVED_IDENTIFIER`     | `ReservedIdentifierError`   | Generated variable declarations are recoverable. Registered tools, objects, exits, and components are critical configuration failures. `identifier`, `kind`. The conventional `exit` exit name remains supported. |
| `INVALID_ASSIGNMENT`      | `AssignmentError`           | Recoverable. Read-only assignment or generated variable/object namespace collision.                                                                                                                               |
| `INVALID_OBJECT_PROPERTY` | `ObjectPropertyError`       | Recoverable. Rejected whole-property assignment; `objectName`, `propertyName`, `issues`, `expectedInput`.                                                                                                         |
| `UNKNOWN_EXIT`            | `UnknownExitError`          | Recoverable. `exitName`, `availableExits`. No exit was applied.                                                                                                                                                   |
| `INVALID_EXIT_INPUT`      | `ExitInputError`            | Recoverable. `exitName`, `issues`, `expectedInput`. No exit was applied.                                                                                                                                          |
| `UNKNOWN_COMPONENT`       | `UnknownComponentError`     | Recoverable. Missing `chat` method, including computed property access; `componentName`, `availableComponents`. No message was sent.                                                                              |
| `INVALID_COMPONENT_INPUT` | `ComponentInputError`       | Recoverable. `componentName`, `issues`, `expectedInput`. No message was sent.                                                                                                                                     |
| `INVALID_NATIVE_CALL`     | `NativeProtocolError`       | Recoverable. Malformed native call, invalid JavaScript envelope, or multiple calls in one response. The rejected batch did not execute.                                                                           |
| `HOST_OPERATION_FAILED`   | `HostOperationError`        | Recoverable. Unawaited tool or operation after JavaScript completion. Started work is joined; feedback distinguishes its effects.                                                                                 |
| `MISSING_CHAT_RESPONSE`   | `MissingChatResponseError`  | Recoverable. Chat tried to complete through `listen` without sending a message; disabled by `options.requireChatResponse: false`.                                                                                 |
| `DELIVERY_FAILED`         | `DeliveryError`             | Recoverable. Text/component handler failed. Earlier acknowledged sends remain delivered; later queued sends are skipped. Inspect `cause`.                                                                         |
| `HOOK_FAILED`             | `HookError`                 | Recoverable. A hook rejected an operation; original `cause` is retained.                                                                                                                                          |
| `INVALID_MEMORY_VALUE`    | `MemoryValueError`          | Recoverable. Unsupported/cyclic memory or inspection value. Failed captures also appear in `iteration.errors` and the memory report.                                                                              |
| `ITERATION_LIMIT`         | `LoopExceededError`         | Critical. `limit` is the configured iteration count.                                                                                                                                                              |
| `GENERATION_FAILED`       | `CognitiveError`            | Critical. Provider failure, malformed generation, content filtering, or incomplete response; original provider failure is retained as `cause` when available.                                                     |
| `TOKEN_OVERFLOW`          | `TokenOverflowError`        | Critical. `phase` distinguishes input context overflow from output `max_tokens`; `tokens` and `limit` are supplied when known.                                                                                    |
| `COMPACTION_FAILED`       | `CompactionError`           | Critical. Summary generation or validation failed; history is preserved. Inspect `cause`.                                                                                                                         |
| `MEMORY_CAPACITY`         | `MemoryCapacityError`       | Critical. Retained memory exceeds `maxBytes`. Completed effects must not be replayed.                                                                                                                             |
| `EXECUTION_ABORTED`       | `ExecutionAbortedError`     | Critical. Cancellation or timeout; `cause` retains the original abort reason.                                                                                                                                     |
| `INVALID_TOOL`            | `InvalidToolError`          | Critical. Invalid tool definition or tool configuration.                                                                                                                                                          |
| `INVALID_OBJECT`          | `InvalidObjectError`        | Critical. Invalid object definition or property registration.                                                                                                                                                     |
| `INVALID_EXIT`            | `InvalidExitError`          | Critical. Invalid exit definition or exit configuration.                                                                                                                                                          |
| `INVALID_COMPONENT`       | `InvalidComponentError`     | Critical. Invalid component definition or registration.                                                                                                                                                           |
| `INVALID_CONFIG`          | `InvalidConfigurationError` | Critical. Invalid execution/chat/token/compaction settings or conflicting bindings.                                                                                                                               |
| `INVALID_MESSAGE`         | `InvalidMessageError`       | Critical. Invalid user/assistant input or input batch. Nothing is appended.                                                                                                                                       |
| `INVALID_EVENT`           | `InvalidEventError`         | Critical. Invalid event name or non-persistable payload. Nothing is appended.                                                                                                                                     |
| `INVALID_SESSION`         | `InvalidSessionError`       | Critical. Invalid persisted history, native messages, or serialized session data.                                                                                                                                 |
| `SESSION_STATE`           | `SessionStateError`         | Critical. Concurrent execution or an operation incompatible with the current session lifecycle.                                                                                                                   |
| `CODE_FORMATTING_FAILED`  | `CodeFormattingError`       | Critical. Invalid generated API typings; `source` contains the failed type declaration.                                                                                                                           |
| `INTERNAL_ERROR`          | `InternalError`             | Critical. Unexpected library failure outside a recognized boundary; inspect `cause`.                                                                                                                              |

Compaction cannot guarantee that every request fits: instructions, tools, queued input, and mandatory context can exceed the entire budget. Input estimates also cannot predict all provider-specific media usage. Compaction does not prevent an output token limit. These cases must remain detectable by consumers.

Validation errors include a path/message list and the expected argument shape as TypeScript. Constraints such as minimum lengths and numeric bounds remain in `issues`; TypeScript shapes alone cannot express them. Error text is for humans and model recovery; use codes and guards for application decisions.

`ThinkSignal` is control flow, not a failure. Use `ThinkSignal.is(value)` to detect it across imports. It has no error code and is not collected in `iteration.errors`.

## Inspecting recovery prompts

[`src/runtime/error-recovery.test.ts`](./src/runtime/error-recovery.test.ts) runs scripted, mocked LLM responses through the real runtime and both VM drivers. Its `.toMatchInlineSnapshot()` assertions show the tool-result feedback actually present in the next model request, including the expected input types. Memory and iteration-budget footers are excluded from the catalogue snapshot so the failure feedback is easy to review. Critical-error tests in [`src/runtime/errors.test.ts`](./src/runtime/errors.test.ts) assert that no additional provider call or business action occurs.

Recovery feedback uses XML-style sections: `<error>` contains the specific error code and readable message, `<stack_trace>` shows source-mapped guest code with line numbers and carets, and `<recovery>` explains how to continue. Tool calls, sent messages, memory changes, and inspection results each have their own section. Section tags are readable separators, not a strict XML document. Content is shown verbatim without entity escaping or CDATA, so code examples, entity literals, and retrieval tags stay unchanged. Validation messages preserve line breaks and the expected TypeScript shape.

Source traces are bounded previews around the failure sites, including failures near the end of long programs. The complete annotated source remains available as `CodeExecutionError.stacktrace`. Node and QuickJS may report different column precision; the inline snapshots cover each. Compiler errors show the invalid source. Host failures outside guest execution retain their original `cause` for consumers; the model is not shown a misleading guest stack or internal host paths.

A tool's thrown or returned `ThinkSignal` counts as successful execution, with its `context` returned to JavaScript. Multiple signals are collected while code continues. At settlement, they force inspection before any exit hook can run, even when later code raises a recoverable error. The `<forced_inspection>` section groups each tool's name, original call-site line (when available), reason, and result. It explicitly describes this as equivalent to `inspect()` and tells the model not to repeat those calls. Actual downstream failures remain in `iteration.errors` and the report's error sections; cancellation and critical errors still stop execution.

`think_signal` traces include the responsible tool name, tool-call ID, source line, reason, context, and optional metadata. Results are captured after output hooks and before guest mutations, and displayed through the normal inspection hooks and token budgets.

`toJSON()` and `result.diagnostics()` retain codes, messages, criticality, and nested error diagnostics. They are plain data: JSON does not retain the shared symbol brand or Error prototypes, so class guards intentionally do not accept parsed diagnostic JSON. The VM restores typed errors internally before exposing them on iterations.
