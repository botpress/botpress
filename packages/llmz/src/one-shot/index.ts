import { Context } from "../context.js";
import { type ExecutionProps } from "../runtime/types.js";
import { buildVMContext } from "../runtime/vm-context.js";
import { runAsyncFunction } from "../vm/index.js";

/**
 * Props for executing pre-generated code directly in the VM.
 *
 * Only the runtime / code-execution props from {@link ExecutionProps} are kept.
 * Everything specific to code generation (LLM prompting, model selection, the
 * iteration loop, exits, snapshots, etc.) is omitted since no generation happens.
 */
export type ExecuteCodeProps = Omit<
  ExecutionProps,
  // LLM / code-generation props
  | "chat"
  | "instructions"
  | "exits"
  | "client"
  | "model"
  | "temperature"
  | "reasoningEffort"
  | "snapshot"
  // iteration-loop / generation hooks
  | "onIterationStart"
  | "onIterationEnd"
  | "onExit"
  | "onBeforeExecution"
> & {
  code: string;
};

export async function executeCode(props: ExecuteCodeProps) {
  const controller = new AbortController();

  const ctx = new Context(props);
  const iteration = await ctx.nextIteration();

  const vmCtx = buildVMContext({
    ctx: ctx,
    controller,
    iteration,
    ...props,
  });

  return runAsyncFunction(vmCtx, props.code);
}
