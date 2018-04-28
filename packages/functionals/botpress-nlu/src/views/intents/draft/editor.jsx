import React from 'react'
import { OverlayTrigger, Popover, Button } from 'react-bootstrap'
import _ from 'lodash'
import classnames from 'classnames'

import {
  Editor,
  EditorState,
  KeyBindingUtil,
  getDefaultKeyBinding,
  CompositeDecorator,
  Modifier,
  SelectionState,
  convertFromRaw
} from 'draft-js'

import { mergeEntities, removeEntity, getSelectionFirstEntity, getSelectionText, countChars } from './extensions'

import style from './style.scss'
import colors from '../colors.scss'

require('draft-js/dist/Draft.css')

function myKeyBindingFn(e) {
  if (e.keyCode === 13) {
    return 'prevent-enter'
  } else if (e.keyCode === 83 /* `S` key */ && KeyBindingUtil.hasCommandModifier(e)) {
    return 'myeditor-save'
  }
  return getDefaultKeyBinding(e)
}

function getEntityStrategy(type) {
  return function(contentBlock, callback, contentState) {
    contentBlock.findEntityRanges(character => {
      const entityKey = character.getEntity()
      if (entityKey === null) {
        return false
      }
      return contentState.getEntity(entityKey).getType() === type
    }, callback)
  }
}

function getCanonicalText(editorState, getEntity) {
  const contentState = editorState.getCurrentContent()
  const block = contentState.getFirstBlock()
  const charList = block.getCharacterList()
  const plainText = editorState.getCurrentContent().getPlainText('')

  let currentLabelEntityId = null
  let currentSegmentValue = ''

  const segments = []

  for (let i = 0; i < charList.size; i++) {
    const label = charList.get(i).getEntity()
    const entity = label && contentState.getEntity(label)
    const entityId = entity && entity.getData().entityId

    if (currentLabelEntityId !== entityId) {
      // Different label
      if (currentSegmentValue.length) {
        segments.push({
          entityId: currentLabelEntityId,
          text: currentSegmentValue
        })
      }

      currentLabelEntityId = entityId
      currentSegmentValue = ''
    }

    currentSegmentValue += plainText[i]
  }

  if (currentSegmentValue.length) {
    segments.push({
      entityId: currentLabelEntityId,
      text: currentSegmentValue
    })
  }

  return segments.reduce((canonical, segment) => {
    if (segment.entityId) {
      const entityName = getEntity(segment.entityId).name
      return `${canonical}[${segment.text}](${entityName})`
    } else {
      return canonical + segment.text
    }
  }, '')
}

const TokenSpanFactory = ({ getEditorState, setEditorState, getEntity }) => props => {
  const entity = props.contentState.getEntity(props.entityKey)
  const { entityId } = entity.getData()
  const nluEntity = getEntity(entityId)

  if (!nluEntity) {
    console.log('entityId', entityId, entity, entity.getData())
    return null
  }

  const removeLabel = () => {
    const editorState = removeEntity(getEditorState(), props.entityKey)
    setEditorState(editorState)
  }

  const popover = (
    <Popover id="popover-positioned-bottom" title="">
      <Button bsSize="xsmall" bsStyle="link" onClick={removeLabel}>
        Remove "{nluEntity.name}" label
      </Button>
    </Popover>
  )

  const className = classnames(
    colors[`label-colors-${nluEntity.colors}`],
    style[`entity-${entity.getType().toLowerCase()}`]
  )

  return (
    <span data-offset-key={props.offsetkey} className={className}>
      <OverlayTrigger trigger="click" rootClose placement="bottom" overlay={popover}>
        <span>{props.children}</span>
      </OverlayTrigger>
    </span>
  )
}

const createDecorator = actions =>
  new CompositeDecorator([
    {
      strategy: getEntityStrategy('LABEL'),
      component: TokenSpanFactory(actions)
    }
  ])

function createEditorStateFromCanonicalValue(canonicalValue, actions) {
  const segments = []
  let plainText = ''

  const regex = /\[(.+?)]\((.+?)\)/g
  let m
  let i = 0

  do {
    m = regex.exec(canonicalValue)
    if (m) {
      plainText += canonicalValue.substr(i, m.index - i)
      i = m.index + m[0].length
      plainText += m[1]
      segments.push({
        start: plainText.length - m[1].length,
        end: plainText.length,
        entityName: m[2]
      })
    }
  } while (m)

  plainText += canonicalValue.substr(i, canonicalValue.length - i)

  const entities = segments.map((segment, i) => {
    return {
      key: i,
      length: segment.end - segment.start,
      offset: segment.start
    }
  })

  const rawData = {
    blocks: [
      {
        data: {},
        depth: 0,
        entityRanges: entities,
        inlineStyleRanges: [],
        key: '789p9',
        text: plainText,
        type: 'unstyled'
      }
    ],
    entityMap: _.keyBy(
      entities.map((entity, i) => {
        return {
          key: entities[i].key,
          type: 'LABEL',
          mutability: 'MUTABLE',
          data: {
            entityId: actions.getEntityIdFromName(segments[i].entityName)
          }
        }
      }),
      'key'
    )
  }

  const contentState = convertFromRaw(rawData)

  return EditorState.createWithContent(contentState, createDecorator(actions))
}

function getInitialContent(actions) {
  return createEditorStateFromCanonicalValue('', actions)
}

export default class IntentEditor extends React.Component {
  getActions = props => {
    props = props || this.props

    return {
      getEditorState: () => this.state.editorState,
      setEditorState: state => this.setState({ editorState: state }),
      getEntity: entityId => _.find(props.entities, { id: entityId }),
      getEntityIdFromName: name => _.get(_.find(props.entities, { name: name }), 'id')
    }
  }

  domRef = null
  wasConsumed = false

  state = {
    editorState: getInitialContent(this.getActions()),
    hasFocus: false
  }

  componentDidMount() {
    this.setState({ editorState: createEditorStateFromCanonicalValue(this.props.canonicalValue, this.getActions()) })
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.canonicalValue !== nextProps.canonicalValue) {
      this.setState({
        editorState: createEditorStateFromCanonicalValue(nextProps.canonicalValue, this.getActions(nextProps))
      })
    }
  }

  onChange = editorState => {
    const beforeState = this.state.editorState

    this.setState({ editorState })

    if (countChars(beforeState) === 0 && countChars(editorState) > 0 && !this.wasConsumed) {
      this.props.onInputConsumed && this.props.onInputConsumed()
      this.wasConsumed = true
    }
  }

  focus = () => {
    if (this.domRef) {
      this.domRef.focus()
    }
  }

  handleKeyCommand = command => {
    if (command === 'prevent-enter') {
      const selection = this.state.editorState.getSelection()

      if (selection.isCollapsed()) {
        this.props.onDone && this.props.onDone()
      }

      const editor = this.props.getEntitiesEditor()
      if (editor) {
        editor.executeRecommendedAction(this)
      }

      return 'handled'
    }
    return 'not-handled'
  }

  handleBeforeInput = chars => {
    const state = this.state.editorState
    const selection = state.getSelection()

    if (!selection.isCollapsed()) {
      return false
    }

    const startOffset = selection.getStartOffset()
    const content = state.getCurrentContent()
    const block = content.getBlockForKey(selection.getStartKey())

    const entity = block.getEntityAt(startOffset)
    if (entity === null) {
      const style = state.getCurrentInlineStyle()
      const newContent = Modifier.insertText(content, selection, chars, style, null)
      this.onChange(EditorState.push(state, newContent, 'insert-characters'))
      return 'handled'
    }

    return 'not-handled'
  }

  tagSelected = entityId => {
    const selection = this.state.editorState.getSelection()
    const contentState = this.state.editorState.getCurrentContent()
    const contentStateWithEntity = contentState.createEntity('LABEL', 'MUTABLE', { entityId: entityId })

    const entityKey = contentStateWithEntity.getLastCreatedEntityKey()
    const contentStateWithLink = Modifier.applyEntity(contentStateWithEntity, selection, entityKey)

    const newSelection = Math.max(selection.anchorOffset, selection.focusOffset) + 1

    const updateSelection = new SelectionState({
      anchorKey: selection.anchorKey,
      anchorOffset: newSelection,
      focusKey: selection.anchorKey,
      focusOffset: newSelection,
      isBackward: false
    })

    const nextEditorState = EditorState.forceSelection(
      mergeEntities(EditorState.push(this.state.editorState, contentStateWithLink, 'added-label')),
      updateSelection
    )

    this.onChange(nextEditorState)
  }

  onArrow = action => keyboardEvent => {
    const editor = this.props.getEntitiesEditor()
    const selection = this.state.editorState.getSelection()

    console.log(selection, selection.isCollapsed())

    if (editor) {
      editor[action] && editor[action]()
      keyboardEvent.preventDefault()
    }
  }

  updateCanonicalValue = () => {
    const canonical = getCanonicalText(this.state.editorState, this.getActions().getEntity)

    if (canonical !== this.props.canonicalValue) {
      this.props.canonicalValueChanged && this.props.canonicalValueChanged(canonical)
    }
  }

  render() {
    const selectedText = getSelectionText(this.state.editorState)
    const selectedEntity = getSelectionFirstEntity(this.state.editorState)
    let selectedEntityId = null

    if (selectedEntity) {
      const entity = this.state.editorState.getCurrentContent().getEntity(selectedEntity)
      selectedEntityId = entity.getData().entityId
    }

    const editor = this.props.getEntitiesEditor()

    if (editor) {
      editor.setSelection(selectedText, selectedEntityId, this)
    }

    const onFocus = e => {
      this.setState({ hasFocus: true })
    }

    const onBlur = e => {
      const currentTarget = e.currentTarget

      setImmediate(() => {
        if (!currentTarget.contains(document.activeElement)) {
          this.updateCanonicalValue()
          this.setState({ hasFocus: false })
        }
      })
    }

    const className = classnames(style.editorContainer, {
      [style.focus]: this.state.hasFocus
    })

    return (
      <div className={className} tabIndex={0} onBlur={onBlur} onFocus={onFocus}>
        <div className={style.editor}>
          <Editor
            handleBeforeInput={this.handleBeforeInput}
            handleKeyCommand={this.handleKeyCommand}
            keyBindingFn={myKeyBindingFn}
            editorState={this.state.editorState}
            onChange={this.onChange}
            placeholder="Type to create a new utterance"
            onBlur={this.onBlur}
            ref={el => (this.domRef = el)}
            onUpArrow={this.onArrow('moveUp')}
            onDownArrow={this.onArrow('moveDown')}
            onTab={this.onArrow('moveDown')}
          />
        </div>
        <div className={style.controls}>
          <span className={style.action} onClick={this.props.deleteUtterance}>
            Delete Utterance
          </span>
        </div>
      </div>
    )
  }
}
