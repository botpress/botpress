import * as types from '../types'
import * as lin from '../utils/linear-utils'

/**
 * The marker appended to each kind of bot comment so it can be found and updated later. Keeping a
 * comment's kind out of the Linear client (which only sees an opaque predicate/body) means all of
 * this — the marker convention and the one-open-comment-per-kind behavior — lives here.
 */
const COMMENT_MARKERS: Record<types.CommentType, string> = {
  lint: '#lint',
  stale: '#stale',
}

export class CommentService {
  public constructor(
    private _linear: lin.LinearApi,
    private _botId: string
  ) {}

  public async upsertComment(props: { issue: lin.Issue; type: types.CommentType; body: string }): Promise<void> {
    const { issue, type, body } = props
    const marker = COMMENT_MARKERS[type]
    await this._linear.upsertComment({
      issue,
      botId: this._botId,
      body: `${body}\n\n${marker}`,
      predicate: (comment) => comment.body.includes(marker),
    })
  }

  public async resolveComments(props: { issue: lin.Issue; type: types.CommentType }): Promise<void> {
    const { issue, type } = props
    const marker = COMMENT_MARKERS[type]
    await this._linear.resolveComments({
      issue,
      predicate: (comment) => comment.body.includes(marker),
    })
  }
}
