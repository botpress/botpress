import { innermostContaining, isStatementContainer, type Ctx } from '../ast.js'
import { USER_CODE_END_MARKER, USER_CODE_START_MARKER } from './async-wrapper.js'

export const CommentFnIdentifier = '__comment__'

const MARKER_TAGS = [USER_CODE_START_MARKER, USER_CODE_END_MARKER].map((m) => m.replace(/\/\*|\*\/|\s/g, ''))

/** Blanks a range, keeping newlines so line numbers are preserved */
const blank = (ctx: Ctx, start: number, end: number) => {
  ctx.ms.update(start, end, ctx.code.slice(start, end).replace(/[^\n]/g, ' '))
}

/**
 * Replaces comments at statement position with `__comment__("<text>", <line>)`
 * calls so the agent's inline "thinking" comments show up as traces at runtime.
 * Comments inside expressions and the user-code markers are blanked; comments
 * inside instrumented tool-call ranges are left verbatim.
 */
export function applyCommentReplacement(ctx: Ctx, skipRanges: Array<[number, number]>): void {
  for (const comment of ctx.comments) {
    const text = comment.value.trim()

    if (MARKER_TAGS.some((tag) => text.includes(tag))) {
      blank(ctx, comment.start, comment.end)
      continue
    }

    if (skipRanges.some(([start, end]) => comment.start >= start && comment.end <= end)) {
      continue
    }

    const container = innermostContaining(ctx.ast, comment.start, comment.end)
    if (isStatementContainer(container)) {
      // pad with the newlines of the original comment so lines stay 1:1
      const newlines = ctx.code.slice(comment.start, comment.end).replace(/[^\n]/g, '')
      ctx.ms.update(
        comment.start,
        comment.end,
        `;${CommentFnIdentifier}(${JSON.stringify(text)}, ${comment.loc!.start.line});${newlines}`
      )
    } else {
      blank(ctx, comment.start, comment.end)
    }
  }
}
