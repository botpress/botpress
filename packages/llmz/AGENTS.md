# LLMz code style

Follow the existing readable TypeScript style in this package. Code density is not a goal.

- Use braces for every `if`, `else`, loop, and `catch`, including single statements.
- Separate independent guards, state transitions, and logical steps with a blank line. Keep related declarations together; do not cram consecutive branches together.
- Write one statement per line. Expand state transitions, nested objects, and error paths across lines.
- Prefer early returns and small named helpers over deep nesting or nested ternaries.
- Keep execution, validation, memory settlement, and rendering responsibilities in separate helpers.
- Use descriptive names. Comments should explain an invariant or a decision, not restate a statement.
- Give public APIs explicit types and document lifecycle behavior that callers must understand.
- Tests follow the same style as production code. Keep setup, action, and assertions easy to scan.
- Run `pnpm fix:format` and `pnpm check:lint` before presenting changes, followed by appropriate tests and `pnpm check:type`.
- Formatting is necessary but insufficient: review the changed code for readable control flow and clear responsibilities.

This is the native protocol implementation. Do not reintroduce marker parsing or a second legacy execution path.
