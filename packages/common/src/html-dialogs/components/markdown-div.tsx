import dedent from 'dedent'
import { marked } from 'marked'
import * as preact from 'preact'

export default ({ children }: { children: preact.ComponentChild }) => (
  <div
    dangerouslySetInnerHTML={{
      __html: marked.parse(dedent(String(children ?? '')), { async: false, breaks: false, gfm: true }),
    }}
  ></div>
)
