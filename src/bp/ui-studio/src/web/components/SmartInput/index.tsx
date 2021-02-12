import { Button, Icon, Position, Tooltip } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import cx from 'classnames'
import { ContentState, EditorState, getDefaultKeyBinding, KeyBindingUtil, Modifier } from 'draft-js'
import Editor from 'draft-js-plugins-editor'
import createSingleLinePlugin from 'draft-js-single-line-plugin'
import * as React from 'react'
import { connect } from 'react-redux'
import { refreshHints } from '~/actions'
import store from '~/store'

import createMentionPlugin, { defaultSuggestionsFilter } from './Base'
import style from './styles.scss'

interface ExposedProps {
  children?: any
  className?: string
  placeholder?: string
  isSideForm?: boolean
  singleLine: boolean
  value: string
  onChange: (value: string) => void
}

const { hasCommandModifier } = KeyBindingUtil
const A_KEY = 65

type ConnectedProps = ExposedProps & { hints: any[] }

interface State {
  beforeContentStateText?: string
  currentContentStateText: string
  editorState: EditorState
  suggestions: any[]
}

class SmartInput extends React.Component<ConnectedProps, State> {
  valueAsText = '' // A local cache of what the last text value of the input was for performance reasons
  editor: any

  mentionOptions = {
    mentionTrigger: '{', // The character that will trigger the auto-complete to show up
    mentionRegExp: '{?[\\d\\w\\.]*}{0,2}', // Combined with mentionTrigger's "{", this looks for "{{something.like.this}}"
    entityMutability: 'MUTABLE' // Mutable means the user will be able to delete and add characters to this entity once tagged
  }

  mentionPlugin = createMentionPlugin(this.mentionOptions)

  state: State = {
    beforeContentStateText: null,
    currentContentStateText: '',
    editorState: EditorState.createEmpty(),
    suggestions: []
  }

  static getDerivedStateFromProps(props: ConnectedProps, state: State) {
    if (props.value && props.value !== state.currentContentStateText && props.value !== state.beforeContentStateText) {
      return {
        contentStateText: props.value,
        editorState: EditorState.createWithContent(ContentState.createFromText(props.value.toString()))
      }
    }

    return null
  }

  onChange = (editorState: EditorState) => {
    const text = editorState.getCurrentContent().getPlainText()
    const shouldUpdate = text !== this.valueAsText
    this.valueAsText = text
    this.setState(
      { editorState, currentContentStateText: text, beforeContentStateText: this.state.currentContentStateText },
      () => {
        shouldUpdate && this.props.onChange && this.props.onChange(text)
      }
    )
  }

  onSearchChange = ({ value }) => {
    this.setState({
      suggestions: defaultSuggestionsFilter(value, this.props.hints)
    })
  }

  focus = () => this.editor.focus()

  insertVariable = () => {
    // Intentional delay to allow the component to be focused before editing the state
    // There seems to be no simple way of working around this
    setTimeout(() => {
      const state = this.state.editorState
      const content = state.getCurrentContent()
      const newContent = Modifier.insertText(content, content.getSelectionAfter(), '{{')
      const newEditorState = EditorState.push(state, newContent, 'insert-characters')
      this.setState({ editorState: EditorState.forceSelection(newEditorState, newContent.getSelectionAfter()) })
    }, 100)
  }

  get placeholder() {
    const placeholder = (this.props.placeholder || '').split('\n').join(' ')
    return placeholder.length > 50 ? placeholder.substring(0, 50) + '...' : placeholder
  }

  handleKeydown = e => {
    if (e.keyCode === A_KEY && hasCommandModifier(e)) {
      return 'myeditor-save'
    }

    return getDefaultKeyBinding(e)
  }

  getAllSelection = () => {
    const currentContent = this.state.editorState.getCurrentContent()

    return this.state.editorState.getSelection().merge({
      anchorKey: currentContent.getFirstBlock().getKey(),
      anchorOffset: 0,

      focusOffset: currentContent.getLastBlock().getText().length,
      focusKey: currentContent.getLastBlock().getKey()
    })
  }

  handleKeyCommand = (command: string) => {
    if (command === 'myeditor-save') {
      this.setState({
        editorState: EditorState.forceSelection(this.state.editorState, this.getAllSelection())
      })
      return 'handled'
    }
    return 'not-handled'
  }

  render() {
    const { MentionSuggestions } = this.mentionPlugin
    const plugins: any[] = [this.mentionPlugin]

    if (this.props.singleLine) {
      plugins.push(createSingleLinePlugin())
    }

    return (
      <div className={cx(style.editor, this.props.className)} onClick={this.focus}>
        <Editor
          stripPastedStyles
          placeholder={this.placeholder}
          editorState={this.state.editorState}
          handleKeyCommand={this.handleKeyCommand}
          keyBindingFn={this.handleKeydown}
          onChange={this.onChange}
          plugins={plugins}
          ref={el => (this.editor = el)}
        />
        <MentionSuggestions onSearchChange={this.onSearchChange} suggestions={this.state.suggestions} />
        <div className={cx(style.insertBtn, { [style.insertBtnMoreSpacing]: this.props.isSideForm })}>
          <Tooltip content={lang.tr('studio.content.insertVariable')} position={Position.TOP}>
            <Button minimal small icon={<Icon icon="code" />} text={undefined} onClick={this.insertVariable} />
          </Tooltip>
          {this.props.children}
        </div>
      </div>
    )
  }
}

const mapDispatchToProps = { refreshHints }
const mapStateToProps = ({ hints: { inputs } }) => ({ hints: inputs })
const ConnectedSmartInput = connect(mapStateToProps, mapDispatchToProps)(SmartInput)

// Passing store explicitly since this component may be imported from another botpress-module
export default (props: ExposedProps) => <ConnectedSmartInput {...props} store={store} />
