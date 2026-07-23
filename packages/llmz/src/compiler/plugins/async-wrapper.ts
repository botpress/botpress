const Open = 'async function __fn__() {'
const Close = '}'

// Unique markers to identify user code boundaries in transformed output
export const USER_CODE_START_MARKER = '/* __LLMZ_USER_CODE_START__ */'
export const USER_CODE_END_MARKER = '/* __LLMZ_USER_CODE_END__ */'

/**
 * Wraps user code in an async function so top-level `await` and `return` parse,
 * and so plugins can target the `__fn__` declaration. The wrapper is removed
 * after transformation — drivers re-wrap the bare statements themselves.
 */
export const AsyncWrapper = {
  preProcessing: (code: string) => {
    return `"use strict";
${Open}
${USER_CODE_START_MARKER}
${code}
${USER_CODE_END_MARKER}
${Close}
`.trim()
  },
  postProcessing: (code: string) => {
    // deterministic layout for the error handlers: dropping the two wrapper
    // lines and prepending one blank line puts user line N at output line N + 2
    code = code.slice(code.indexOf(Open) + Open.length)
    code = code.slice(0, code.lastIndexOf(Close))
    // Remove markers from final output
    code = code.replace(USER_CODE_START_MARKER, '').replace(USER_CODE_END_MARKER, '')
    return code.trimEnd()
  },
}
