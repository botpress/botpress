# Security Policy

## Reporting a vulnerability

Do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.

Report them privately through [GitHub private vulnerability reporting](https://github.com/botpress/botpress/security/advisories/new). If you can't use GitHub, email [security@botpress.com](mailto:security@botpress.com).

Please include as much of the following as you can:

- The type of issue (e.g. sandbox escape, injection, authentication bypass, credential exposure)
- The affected package(s) and version(s), or the affected integration
- Step-by-step instructions to reproduce, with a proof of concept if possible
- The impact as you understand it, including how an attacker might exploit it

### What to expect

- We will acknowledge your report within 3 business days.
- We will keep you informed as we triage, confirm, and fix the issue.
- We coordinate disclosure with you. We aim to fix confirmed vulnerabilities within 90 days of the initial report. Once a fix is released, we publish a GitHub security advisory and credit you for the discovery unless you prefer to stay anonymous. If we need more time, we will communicate this and work out a mutually agreed extension before any disclosure.

## Scope

This repository contains the Botpress SDK, CLI, client libraries, and the source of official integrations and plugins. Reports are in scope if the vulnerability is in code that lives here, including:

| Package                       | Description                                      |
| ----------------------------- | ------------------------------------------------ |
| `@botpress/sdk`               | SDK for building integrations, bots, and plugins |
| `@botpress/cli`               | CLI for building and deploying on Botpress       |
| `@botpress/client`            | Botpress API client                              |
| `@botpress/chat`              | Chat API client                                  |
| `@botpress/cognitive`         | LLM abstraction layer                            |
| `@botpress/zai`               | AI utility library                               |
| `@botpress/vai`               | AI testing utilities for Vitest                  |
| `llmz`                        | LLM-native TypeScript agent runtime              |
| `@bpinternal/zui`             | Schema library (Zod extension)                   |
| `integrations/*`, `plugins/*` | Official integrations and plugins                |

Only the latest published version of each package receives security fixes.

Reports we are especially interested in:

- **Sandbox escapes in `llmz`**: any way for generated code to break out of the VM isolation, reach the host system, or access tools and variables it was not granted
- **Code execution or path traversal in the CLI**: e.g. through malicious integration definitions or project files
- **Credential exposure**: tokens or secrets leaking through logs, error messages, or integration code
- **Authentication or authorization flaws** in client libraries or integration webhook handling

### Out of scope

- The Botpress Cloud platform and its infrastructure (app.botpress.cloud, APIs, webchat hosting). Report those to [security@botpress.com](mailto:security@botpress.com) instead.
- Bots and agents built by Botpress users
- Vulnerabilities in third-party services that integrations connect to (report those to the respective vendor)
- Vulnerabilities in dependencies with no demonstrated exploit path through this codebase (report those upstream)
- Denial of service through volume, brute force, or resource exhaustion
- Social engineering, phishing, and physical attacks
- Prompt injection that only affects the output quality of a user's own bot. Prompt injection that crosses a security boundary (unauthorized tool execution, data exfiltration, sandbox escape) is in scope.

Botpress v12 lives in a separate repository ([botpress/v12](https://github.com/botpress/v12)) and is not covered by this policy.

## Safe harbor

We consider security research conducted in line with this policy to be authorized. We will not pursue legal action for good-faith research that stays in scope, avoids privacy violations and service disruption, and gives us reasonable time to fix issues before public disclosure.
