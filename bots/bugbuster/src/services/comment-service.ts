import * as types from '../types'
import * as lin from '../utils/linear-utils'

/**
 * Stable identifier for each kind of bot comment, embedded verbatim in the comment footer so the bot
 * can find and update its own comment later. The predicate matches ONLY this token, decoupled from
 * how the footer is styled: the decoration built around the marker (emoji, wording, divider) can
 * change freely and stay backward compatible, but a marker value itself must never change — doing so
 * would orphan every comment already posted with the old one. Keeping the Linear client unaware of
 * comment kinds means this convention and the one-open-comment-per-kind behavior live entirely here.
 */
const COMMENT_MARKERS: Record<types.CommentType, string> = {
  lint: 'BugBuster · lint',
  stale: 'BugBuster · stale',
}

const _buildFooter = (marker: string): string => `---\n_🐛 via ${marker}_`

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
      body: `${body}\n\n${_buildFooter(marker)}`,
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
