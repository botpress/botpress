# Tool chaining

Three typed tools demonstrate data dependencies. JavaScript reads a nested value from tool A, filters tool B’s numbers, and passes both to tool C before returning a typed result. The tool outputs are simulated.

From `packages/llmz/examples`, after the [shared setup](../README.md):

```sh
pnpm start 16_worker_tool_chaining
```

The program can perform these operations in one native `run_javascript` call; a particular model may choose additional inspection steps.

```javascript
const a = await tool_a()
const b = await tool_b()
const result = await tool_c({
  first_task: a.pick.deep.deep_number,
  second_task: b.filter((value) => value > 50),
})
return exit('exit', { result })
```

![Tool chaining demo](./demo.svg)
