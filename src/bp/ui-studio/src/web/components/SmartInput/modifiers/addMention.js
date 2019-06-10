import { Modifier, EditorState } from 'draft-js'
import getSearchText from '../utils/getSearchText'

const addMention = (editorState, mention, mentionPrefix, mentionTrigger, entityMutability, addSpaceAfter) => {
  const currentSelectionState = editorState.getSelection()
  const { begin, end } = getSearchText(editorState, currentSelectionState, mentionTrigger)

  // get selection of the @mention search text
  const mentionTextSelection = currentSelectionState.merge({
    anchorOffset: begin,
    focusOffset: end
  })

  const suffix = mention.partial === true ? '.' : '}}'

  let mentionReplacedContent = Modifier.replaceText(
    editorState.getCurrentContent(),
    mentionTextSelection,
    `{{${mention.name}${suffix}`,
    null, // no inline style needed
    ''
  )

  // If the mention is inserted at the end, a space is appended right after for
  // a smooth writing experience.
  const blockKey = mentionTextSelection.getAnchorKey()
  const blockSize = editorState
    .getCurrentContent()
    .getBlockForKey(blockKey)
    .getLength()
  if (blockSize === end && addSpaceAfter) {
    mentionReplacedContent = Modifier.insertText(
      mentionReplacedContent,
      mentionReplacedContent.getSelectionAfter(),
      ' '
    )
  }

  const newEditorState = EditorState.push(editorState, mentionReplacedContent, 'insert-mention')
  return EditorState.forceSelection(newEditorState, mentionReplacedContent.getSelectionAfter())
}

export default addMention
