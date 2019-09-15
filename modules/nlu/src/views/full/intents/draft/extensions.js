import { EditorState, Modifier, SelectionState } from 'draft-js'

import { getSelectionEntity, getSelectedBlock } from 'draftjs-utils'

export function mergeEntities(editorState) {
  const contentState = editorState.getCurrentContent()
  const block = contentState.getFirstBlock()
  const charList = block.getCharacterList()
  const anchor = editorState.getSelection().getAnchorKey()

  let currentLabel = null
  let currentLabelEntityName = null
  let start = 0
  let end = 0

  let nextContentState = contentState

  const applyLabel = () => {
    nextContentState = Modifier.applyEntity(
      nextContentState,
      new SelectionState({
        anchorKey: anchor,
        anchorOffset: start,
        focusKey: anchor,
        focusOffset: end,
        isBackward: false
      }),
      currentLabel
    )

    currentLabel = null
    currentLabelEntityName = null
    start = end
  }

  for (let i = 0; i < charList.size; i++) {
    const label = charList.get(i).getEntity()
    const entity = label && contentState.getEntity(label)
    end = i

    if (entity && entity.getType() === 'LABEL') {
      const name = entity.getData().entityId

      if (currentLabelEntityName !== name) {
        // Different label

        if (currentLabelEntityName) {
          applyLabel()
        }

        start = i
        currentLabelEntityName = name
        currentLabel = label
      }
    } else if (!entity && currentLabelEntityName) {
      applyLabel()
    }
  }

  if (currentLabelEntityName) {
    end++
    applyLabel()
  }

  return EditorState.push(editorState, nextContentState, 'merge-labels')
}

export function removeEntity(editorState, entityKey) {
  const contentState = editorState.getCurrentContent()
  const block = contentState.getFirstBlock()
  const charList = block.getCharacterList()
  const anchor = editorState.getSelection().getAnchorKey()

  let nextContentState = contentState
  let start = -1
  let end = -1

  for (let i = 0; i < charList.size; i++) {
    const label = charList.get(i).getEntity()
    end = i + 1

    if (label === entityKey) {
      if (start === -1) {
        start = i
      }
    } else {
      if (start !== -1) {
        break
      }
    }
  }

  if (start !== -1) {
    nextContentState = Modifier.applyEntity(
      nextContentState,
      new SelectionState({
        anchorKey: anchor,
        anchorOffset: start,
        focusKey: anchor,
        focusOffset: end,
        isBackward: false
      }),
      null
    )
  }

  return EditorState.push(editorState, nextContentState, 'remove-label')
}

export function getSelectionFirstEntity(editorState) {
  const selection = editorState.getSelection()
  let start = selection.getStartOffset()
  let end = selection.getEndOffset()

  if (start === end && start === 0) {
    end = 1
  } else if (start === end) {
    start -= 1
  }

  const block = getSelectedBlock(editorState)

  for (let i = start; i < end; i += 1) {
    const currentEntity = block.getEntityAt(i)
    if (currentEntity) {
      return currentEntity
    }
  }
}

export function countChars(editorState) {
  return editorState.getCurrentContent().getPlainText('').length
}

export { getSelectionText } from 'draftjs-utils'
