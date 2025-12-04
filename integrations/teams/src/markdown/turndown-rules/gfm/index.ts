import TurndownService from 'turndown'
import { highlightedCodeBlock } from './highlighted-code-block'
import { strikethrough } from './strikethrough'
import { tables } from './tables'
import { taskListItems } from './task-list-items'

/** This plugin is mostly pulled from the source code of the "turndown-plugin-gfm" npm package.
 *  The reason we are not using the package directly is that it doesn't support ES6 imports.
 *
 *  @remark The source code was slightly modified to work with TypeScript.
 *  @see [NPM Package](https://www.npmjs.com/package/turndown-plugin-gfm)
 *  @see [Repository](https://github.com/mixmark-io/turndown-plugin-gfm) */
export const gfm = (turndownService: TurndownService) => {
  turndownService.use([highlightedCodeBlock, strikethrough, tables, taskListItems])
}
