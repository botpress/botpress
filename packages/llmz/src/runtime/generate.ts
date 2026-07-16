import { Cognitive } from "@botpress/cognitive";
import { clamp } from "lodash-es";

import { Context, Iteration } from "../context.js";
import { CognitiveError } from "../errors.js";
import { truncateWrappedContent } from "../truncator.js";
import { getErrorMessage } from "../utils.js";
import { RuntimeCognitive } from "./types.js";

const RESPONSE_LENGTH_BUFFER = {
  MIN_TOKENS: 1_000,
  MAX_TOKENS: 16_000,
  PERCENTAGE: 0.1,
} as const;

const getModelOutputLimit = (inputLength: number) =>
  clamp(
    RESPONSE_LENGTH_BUFFER.PERCENTAGE * inputLength,
    RESPONSE_LENGTH_BUFFER.MIN_TOKENS,
    RESPONSE_LENGTH_BUFFER.MAX_TOKENS,
  );

type GenerateCodeProps = {
  iteration: Iteration;
  ctx: Context;
  cognitive: RuntimeCognitive;
  controller: AbortController;
};

export const generateCode = async ({
  iteration,
  ctx,
  cognitive,
  controller,
}: GenerateCodeProps) => {
  const startedAt = Date.now();
  const traces = iteration.traces;

  const modelRef = Array.isArray(iteration.model) ? iteration.model[0]! : iteration.model;
  const model = await cognitive.getModelDetails(modelRef).catch((thrown: unknown) => {
    throw new CognitiveError(
      `Failed to fetch model details for model "${modelRef}": ${getErrorMessage(thrown)}`,
    );
  });
  const modelLimit = Math.max(model.input.maxTokens, 8_000);
  const responseLengthBuffer = getModelOutputLimit(modelLimit);

  const messages = truncateWrappedContent({
    messages: iteration.messages,
    tokenLimit: modelLimit - responseLengthBuffer,
    throwOnFailure: true,
  }).filter((x) => typeof x.content !== "string" || x.content.trim().length > 0);
  iteration.messages = messages;

  traces.push({
    type: "llm_call_started",
    started_at: startedAt,
    ended_at: startedAt,
    model: model.ref,
  });

  const output = await cognitive
    .generateContent({
      signal: controller.signal,
      systemPrompt: messages.find((x) => x.role === "system")?.content,
      model: iteration.model as Required<Parameters<Cognitive["generateContent"]>[0]>["model"],
      temperature: iteration.temperature,
      responseFormat: "text",
      reasoningEffort: iteration.reasoningEffort,
      messages: messages.filter((x) => x.role !== "system"),
      stopSequences: ctx.version.getStopTokens(),
    })
    .catch((thrown: unknown) => {
      throw new CognitiveError(`LLM generation failed: ${getErrorMessage(thrown)}`);
    });

  const out =
    typeof output.output.choices?.[0]?.content === "string"
      ? output.output.choices[0].content
      : null;

  if (!out) {
    throw new CognitiveError("LLM did not return any text output");
  }

  const assistantResponse = ctx.version.parseAssistantResponse(out);
  iteration.code = assistantResponse.code.trim();

  iteration.llm = {
    cached: output.meta.cached || false,
    ended_at: Date.now(),
    started_at: startedAt,
    status: "success",
    tokens: output.meta.tokens.input + output.meta.tokens.output,
    spend: output.meta.cost.input + output.meta.cost.output,
    output: assistantResponse.raw,
    model: `${output.meta.model.integration}:${output.meta.model.model}`,
    usage: output.output.usage,
  };

  traces.push({
    type: "llm_call_success",
    started_at: startedAt,
    ended_at: iteration.llm.ended_at,
    model: model.ref,
    code: iteration.code,
  });
};
