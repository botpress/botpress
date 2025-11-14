# QuickJS-Emscripten Migration Plan

## Executive Summary

This document outlines a plan to replace the current dual VM execution system (isolated-vm + Node.js VM fallback) with quickjs-emscripten as a unified, cross-platform JavaScript sandbox for LLMz.

## Current State Analysis

### Existing VM Architecture (`src/vm.ts`)

**Current Implementation:**
- **Production/Default**: `isolated-vm` (Node.js only, native module)
- **CI/Fallback**: Node.js built-in VM module
- **Browser**: Basic JavaScript execution (no isolation)
- **Driver Selection**: Environment-based (`VM_DRIVER` env var, `IS_CI` check)

**Key Features:**
- Memory limits (128MB for isolated-vm)
- Context isolation with jail pattern
- Property tracking and copying between host/sandbox
- Support for getters/setters via references
- Tool call tracking and variable extraction
- JSX component yielding
- Timeout support (60s default)
- Source map integration for error handling
- Two-way context synchronization

**Current Pain Points:**
1. **Platform Fragmentation**: Different execution paths for Node.js, CI, and browser
2. **Native Dependency**: isolated-vm requires native compilation
3. **Complexity**: ~667 lines managing two different VM implementations
4. **Browser Limitations**: No true isolation in browser environments
5. **CI Compatibility**: isolated-vm doesn't work well in CI, requires fallback
6. **Installation Issues**: Native module compilation can fail

## Why QuickJS-Emscripten?

### Key Benefits

1. **Universal Platform Support**
   - Works in Node.js, browsers, Deno, Bun, and other JavaScript runtimes
   - No native compilation required (WebAssembly-based)
   - Single codebase for all platforms

2. **True Isolation Everywhere**
   - Sandboxed execution in both browser and Node.js
   - WebAssembly provides consistent security guarantees
   - No risk of accessing host system resources

3. **Smaller Bundle Size**
   - Minimal setup: ~1.3MB total (quickjs-emscripten-core + WASM file)
   - Much smaller than isolated-vm's native binary
   - Tree-shakeable, ESM-native

4. **Better Developer Experience**
   - No native build toolchain required
   - Works out-of-the-box in CI environments
   - Package.json export conditions for ESM/CJS

5. **Advanced Features**
   - ASYNCIFY support for async/await in sandbox
   - Memory limits and resource control
   - Interrupt handlers for timeout support
   - Multiple build variants (debug/release)

6. **Active Maintenance**
   - Actively maintained project
   - Regular updates and bug fixes
   - Good documentation and examples

### Trade-offs

**Potential Limitations:**
1. **Performance**: QuickJS may be slower than V8 (isolated-vm), but likely faster than Node.js VM
2. **API Compatibility**: Need to verify ES2020+ feature support in QuickJS
3. **Memory Overhead**: WebAssembly adds some overhead vs. native
4. **Learning Curve**: Team needs to learn new API

**Mitigations:**
- LLMz code generation is typically simple (loops, conditionals, tool calls)
- Performance bottleneck is LLM generation, not code execution
- QuickJS supports ES2020, sufficient for generated code
- Clear migration path with comprehensive testing

## Migration Architecture

### Target Architecture

```typescript
// Unified driver using quickjs-emscripten
import { getQuickJS } from 'quickjs-emscripten'

export async function runAsyncFunction(
  context: any,
  code: string,
  traces: Trace[] = [],
  signal: AbortSignal | null = null,
  timeout: number = MAX_VM_EXECUTION_TIME
): Promise<VMExecutionResult> {
  const QuickJS = await getQuickJS()
  const runtime = QuickJS.newRuntime()
  const vm = runtime.newContext()

  try {
    // Set memory limit (equivalent to isolated-vm's 128MB)
    runtime.setMemoryLimit(128 * 1024 * 1024)

    // Set interrupt handler for timeout support
    runtime.setInterruptHandler(() => {
      return signal?.aborted || Date.now() - startTime > timeout
    })

    // Execute code in sandbox
    const result = vm.evalCode(code)

    return processResult(result)
  } finally {
    vm.dispose()
    runtime.dispose()
  }
}
```

### Key Implementation Changes

#### 1. Context Bridging

**Current (isolated-vm):**
- Manual property copying with `jail.set()`
- Separate handling for functions, objects, primitives
- Complex getter/setter reference tracking
- Two-way synchronization after execution

**Target (quickjs-emscripten):**
- Use `vm.newFunction()` to expose host functions
- `vm.newObject()` + `vm.setProp()` for objects
- Automatic handle management with `Scope.withScope()`
- Simpler one-way data flow with explicit exports

#### 2. Tool Call Interception

**Current:**
```typescript
await isolatedContext.evalClosure(
  `global['${key}'] = (...args) => $0.applySyncPromise(null, args, {arguments: {copy: true}});`,
  [async (...args: any[]) => new isolatedVm.ExternalCopy(await context[key](...args)).copyInto()]
)
```

**Target:**
```typescript
const toolHandle = vm.newFunction(key, async (...args) => {
  const result = await context[key](...args)
  return vm.unwrapResult(result)
})
vm.setProp(vm.global, key, toolHandle)
toolHandle.dispose()
```

#### 3. Variable Tracking

**Current:**
- Line tracking via injected function calls
- Variable extraction through AST plugins
- Top-level property tracking with `__report`

**Target:**
- Same AST-based approach (no changes to compiler)
- Simplified context extraction using `vm.getProp()`
- More efficient value marshaling with QuickJS handles

#### 4. Error Handling

**Current:**
- Stack trace parsing for `<isolated-vm>` or `<anonymous>`
- Source map integration for original line numbers
- Manual offset calculations (LINE_OFFSET = 3 or 1)

**Target:**
- Parse QuickJS stack traces (format: `at <eval> (...)`)
- Same source map integration (unchanged)
- Simpler offset calculations (consistent format)

#### 5. Async/Yield Support

**Current:**
- Wrapped code in async generator function
- Manual `do/while` loop for yielding
- Different implementations for isolated-vm vs Node.js VM

**Target:**
- Use ASYNCIFY build variant for async support
- Same async generator wrapper pattern
- Unified implementation across all platforms

## Migration Plan

### Phase 1: Proof of Concept (Week 1)

**Goals:**
- Validate quickjs-emscripten can execute LLMz-generated code
- Test core features: tools, variables, JSX yielding
- Measure performance vs. current implementation

**Tasks:**
1. Create `src/vm-quickjs.test.ts` with existing test cases
2. Implement minimal `runAsyncFunctionQuickJS()` prototype
3. Test with examples: `11_worker_minimal`, `16_worker_tool_chaining`
4. Benchmark execution time vs. isolated-vm
5. Document any compatibility issues

**Success Criteria:**
- All core VM tests pass with quickjs-emscripten
- Performance within 2x of isolated-vm
- No major compatibility blockers identified

### Phase 2: Feature Parity Implementation (Week 2-3)

**Goals:**
- Implement all current VM features
- Achieve 100% test coverage parity
- Handle edge cases and error scenarios

**Tasks:**

#### 2.1 Core Execution
- [ ] Implement context setup with tool/object bridging
- [ ] Add memory limit configuration (128MB default)
- [ ] Implement timeout with interrupt handlers
- [ ] Support AbortSignal integration
- [ ] Handle primitive, object, and function context values

#### 2.2 Variable Tracking
- [ ] Integrate variable extraction (reuse compiler plugins)
- [ ] Implement `VariableTrackingFnIdentifier` bridge
- [ ] Support getter/setter tracking
- [ ] Copy back modified variables after execution
- [ ] Handle sealed and non-extensible objects

#### 2.3 Tool System Integration
- [ ] Bridge tool functions from context
- [ ] Support async tool calls with ASYNCIFY
- [ ] Implement `ToolCallTrackerFnIdentifier` for snapshot support
- [ ] Handle tool call errors and retry logic
- [ ] Track tool call assignments for snapshots

#### 2.4 Component/JSX System
- [ ] Implement `JSXFnIdentifier` bridge
- [ ] Support async generator yielding (`AsyncIterYieldFnIdentifier`)
- [ ] Handle component validation and rendering
- [ ] Test multi-component yielding

#### 2.5 Error Handling
- [ ] Parse QuickJS stack traces
- [ ] Integrate source map for line mapping
- [ ] Generate annotated error code (arrow pointers)
- [ ] Preserve error context and variables
- [ ] Handle VMSignal errors (SnapshotSignal, ThinkSignal)

#### 2.6 Tracing System
- [ ] Implement comment tracing (`CommentFnIdentifier`)
- [ ] Support line execution tracking
- [ ] Add console.log tracing (`ConsoleObjIdentifier`)
- [ ] Track yield operations
- [ ] Maintain trace timestamps

**Success Criteria:**
- All existing `src/vm.test.ts` tests pass
- All 28 examples run successfully
- Error messages are as informative as current implementation
- Feature parity checklist 100% complete

### Phase 3: Integration & Testing (Week 4)

**Goals:**
- Replace current VM implementation
- Comprehensive testing across all platforms
- Performance validation

**Tasks:**

#### 3.1 Code Integration
- [ ] Create feature flag: `USE_QUICKJS` env variable
- [ ] Refactor `vm.ts` to use quickjs-emscripten
- [ ] Remove isolated-vm and Node.js VM code paths
- [ ] Update type definitions and exports
- [ ] Clean up legacy driver detection code

#### 3.2 Cross-Platform Testing
- [ ] Test in Node.js (v18, v20, v22)
- [ ] Test in browsers (Chrome, Firefox, Safari)
- [ ] Test in CI environments (GitHub Actions)
- [ ] Test in Deno (if supported)
- [ ] Test in Bun (if supported)

#### 3.3 Example Testing
- [ ] Run all 20 examples with QuickJS VM
- [ ] Test chat mode examples (01-10, 20)
- [ ] Test worker mode examples (11-19)
- [ ] Verify snapshots work correctly
- [ ] Test error recovery scenarios

#### 3.4 Performance Testing
- [ ] Benchmark code execution time
- [ ] Measure memory usage
- [ ] Test timeout handling
- [ ] Profile WASM initialization overhead
- [ ] Compare vs. baseline (isolated-vm + Node.js VM)

**Success Criteria:**
- All tests pass on all platforms
- Examples run without modification
- Performance within acceptable range (<2x slower)
- No regressions in functionality

### Phase 4: Optimization & Polish (Week 5)

**Goals:**
- Optimize performance bottlenecks
- Improve error messages
- Documentation updates

**Tasks:**

#### 4.1 Performance Optimization
- [ ] Cache QuickJS module initialization
- [ ] Optimize context setup (reduce bridge calls)
- [ ] Use RELEASE_SYNC build variant for production
- [ ] Minimize handle creation/disposal overhead
- [ ] Profile and optimize hot paths

#### 4.2 Developer Experience
- [ ] Improve error messages and stack traces
- [ ] Add debug mode with detailed logging
- [ ] Create migration guide for users
- [ ] Update CLAUDE.md with QuickJS details
- [ ] Add troubleshooting section to docs

#### 4.3 Build Configuration
- [ ] Configure build variants (debug/release)
- [ ] Optimize bundle size for browser
- [ ] Set up source maps for debugging
- [ ] Configure ESM/CJS dual package
- [ ] Test tree-shaking effectiveness

#### 4.4 Documentation
- [ ] Update README.md with platform support
- [ ] Document QuickJS configuration options
- [ ] Add quickjs-emscripten to dependencies section
- [ ] Update STRUCTURE.md with new architecture
- [ ] Create QUICKJS_MIGRATION.md guide

**Success Criteria:**
- Performance optimized to <1.5x isolated-vm
- Clear documentation for troubleshooting
- All docs updated to reflect changes
- Build artifacts optimized for size

### Phase 5: Rollout & Monitoring (Week 6)

**Goals:**
- Gradual rollout to production
- Monitor for issues
- Gather feedback

**Tasks:**

#### 5.1 Gradual Rollout
- [ ] Deploy with feature flag (default: OFF)
- [ ] Enable for 10% of traffic
- [ ] Monitor error rates and performance
- [ ] Increase to 50% if stable
- [ ] Full rollout if no issues

#### 5.2 Monitoring
- [ ] Track execution time metrics
- [ ] Monitor error rates
- [ ] Watch for memory leaks
- [ ] Alert on timeout increases
- [ ] Collect user feedback

#### 5.3 Cleanup
- [ ] Remove isolated-vm dependency
- [ ] Delete legacy VM code
- [ ] Archive old tests (if needed)
- [ ] Update package.json
- [ ] Remove `VM_DRIVER` env variable

**Success Criteria:**
- Zero critical bugs reported
- Performance meets SLAs
- Positive user feedback
- Legacy code fully removed

## Implementation Details

### Package Changes

**Add:**
```json
{
  "dependencies": {
    "quickjs-emscripten": "^0.29.0"
  }
}
```

**Remove:**
```json
{
  "dependencies": {
    "isolated-vm": "^5.0.3"
  }
}
```

**Net Change:** ~15MB smaller package size (no native binaries)

### API Surface Changes

**Public API:** No changes (internal implementation only)
**Environment Variables:**
- Remove: `VM_DRIVER`
- Add: `QUICKJS_VARIANT` (optional: 'debug' | 'release-sync', default: 'release-sync')

### File Changes

**Modified:**
- `src/vm.ts` - Complete rewrite (~400 lines vs. 667)
- `src/vm.test.ts` - Update test assertions for QuickJS
- `package.json` - Swap dependencies

**Added:**
- `src/vm-quickjs-bridge.ts` - Context bridging utilities (optional, for organization)

**Removed:**
- None (isolated-vm code will be deleted from vm.ts)

## Risk Assessment

### High-Risk Items
1. **Breaking Changes**: Subtle behavior differences in QuickJS vs. V8
   - **Mitigation**: Comprehensive test suite, gradual rollout

2. **Performance Regression**: Slower execution impacts user experience
   - **Mitigation**: Benchmarking, optimization phase, acceptable threshold

3. **Feature Gaps**: QuickJS missing required JS features
   - **Mitigation**: POC phase validates compatibility, fallback plan

### Medium-Risk Items
1. **Memory Leaks**: Improper handle disposal in QuickJS
   - **Mitigation**: Use `Scope.withScope()`, rigorous testing

2. **WASM Loading**: Initialization time impacts cold starts
   - **Mitigation**: Lazy loading, module caching, measure impact

3. **Browser Compatibility**: WASM not supported in old browsers
   - **Mitigation**: Document minimum browser versions, acceptable trade-off

### Low-Risk Items
1. **Build Process**: WASM files need bundler configuration
   - **Mitigation**: Most bundlers work out-of-box, document exceptions

2. **Debugging**: Stack traces may be less familiar
   - **Mitigation**: Improve error messages, debug build variant

## Rollback Plan

If critical issues arise:

1. **Immediate (< 1 hour):**
   - Flip feature flag to disable QuickJS
   - Keep isolated-vm code during rollout phase
   - No code changes needed

2. **Short-term (< 1 day):**
   - Revert package.json changes
   - Restore isolated-vm dependency
   - Git revert VM changes

3. **Long-term:**
   - Re-evaluate quickjs-emscripten vs. alternatives
   - Consider hybrid approach (QuickJS for browser only)
   - Keep current architecture if no viable alternative

## Success Metrics

### Performance
- **Target:** <1.5x execution time vs. isolated-vm
- **Acceptable:** <2.0x execution time
- **Unacceptable:** >2.0x execution time

### Reliability
- **Target:** Zero critical bugs, <0.1% error rate increase
- **Acceptable:** <3 critical bugs, <0.5% error rate increase
- **Unacceptable:** >3 critical bugs or >1% error rate increase

### Platform Support
- **Target:** Works on Node.js, Chrome, Firefox, Safari, CI
- **Acceptable:** Works on Node.js and modern browsers
- **Unacceptable:** Doesn't work on Node.js or major browsers

### Bundle Size
- **Target:** <1.5MB increase in browser bundle
- **Acceptable:** <3MB increase
- **Unacceptable:** >3MB increase

## Timeline

| Phase | Duration | Start Date | End Date |
|-------|----------|------------|----------|
| Phase 1: POC | 1 week | Week 1 | Week 1 |
| Phase 2: Implementation | 2 weeks | Week 2 | Week 3 |
| Phase 3: Integration | 1 week | Week 4 | Week 4 |
| Phase 4: Optimization | 1 week | Week 5 | Week 5 |
| Phase 5: Rollout | 1 week | Week 6 | Week 6 |
| **Total** | **6 weeks** | | |

## Open Questions

1. **ASYNCIFY Performance**: Does ASYNCIFY add significant overhead for async/await?
2. **Module System**: Does QuickJS support ES modules, or only CommonJS?
3. **Debugging**: What debugging tools are available for QuickJS?
4. **Memory Limits**: Can we enforce stricter memory limits than 128MB?
5. **Interrupt Granularity**: How frequently does interrupt handler get called?

**Resolution:** Investigate during POC phase (Phase 1)

## Conclusion

Migrating to quickjs-emscripten offers significant benefits:
- **Universal platform support** (Node.js, browser, CI)
- **Simpler architecture** (single VM implementation)
- **Better DX** (no native compilation)
- **Smaller bundle size** (~15MB savings)
- **True isolation everywhere** (security improvement)

The migration is feasible with acceptable risk, clear phases, and measurable success criteria. The 6-week timeline provides buffer for unexpected issues while maintaining momentum.

**Recommendation:** Proceed with Phase 1 (POC) to validate feasibility and gather data for go/no-go decision.
