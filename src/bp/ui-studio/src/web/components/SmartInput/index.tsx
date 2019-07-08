import { Button } from '@blueprintjs/core'
import cx from 'classnames'
import { ContentState, EditorState, Modifier } from 'draft-js'
import Editor from 'draft-js-plugins-editor'
import createSingleLinePlugin from 'draft-js-single-line-plugin'
import * as React from 'react'
import { Component } from 'react'
import { connect } from 'react-redux'
import { refreshHints } from '~/actions'
import store from '~/store'

import style from './styles.scss'
import createMentionPlugin, { defaultSuggestionsFilter } from './Base'

interface ExposedProps {
  className?: string
  placeholder?: string
  singleLine: boolean
  value: string
  onChange: (value: string) => void
}

type ConnectedProps = ExposedProps & { hints: any[] }

interface State {
  beforeContentStateText?: string
  currentContentStateText: string
  editorState: EditorState
  suggestions: any[]
}

class SmartInput extends Component<ConnectedProps, State> {
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

  render() {
    const { MentionSuggestions } = this.mentionPlugin
    const plugins = [this.mentionPlugin]

    if (this.props.singleLine) {
      plugins.push(createSingleLinePlugin())
    }

    return (
      <div className={cx(style.editor, this.props.className)} onClick={this.focus}>
        <Editor
          stripPastedStyles={true}
          placeholder={this.placeholder}
          editorState={this.state.editorState}
          onChange={this.onChange}
          plugins={plugins}
          ref={el => (this.editor = el)}
        />
        <MentionSuggestions onSearchChange={this.onSearchChange} suggestions={this.state.suggestions} />
        <div className={style.insertBtn}>
          <Button minimal={true} small={true} icon="insert" text={undefined} onClick={this.insertVariable} />
        </div>
      </div>
    )
  }
}

const mapDispatchToProps = { refreshHints }
const mapStateToProps = ({ hints: { inputs } }) => ({ hints: inputs })
const ConnectedSmartInput = connect(
  mapStateToProps,
  mapDispatchToProps
)(SmartInput)

// Passing store explicitly since this component may be imported from another botpress-module
export default (props: ExposedProps) => <ConnectedSmartInput {...props} store={store} />
