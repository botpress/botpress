import * as React from 'react'
import { Component } from 'react'
import cx from 'classnames'
import { Modifier, EditorState } from 'draft-js'
import Editor from 'draft-js-plugins-editor'
import { Button } from '@blueprintjs/core'
import createSingleLinePlugin from 'draft-js-single-line-plugin'

import createMentionPlugin, { defaultSuggestionsFilter } from './Base'

import style from './styles.scss'

export default class SmartInput extends Component {
  mentionPlugin
  editor
  state = {
    editorState: EditorState.createEmpty(),
    suggestions: []
  }
  mentionOptions = {
    mentionTrigger: '{',
    mentionRegExp: '{?[\\d\\w\\.]*}{0,2}',
    entityMutability: 'MUTABLE'
  }

  constructor(props) {
    super(props)
    this.mentionPlugin = createMentionPlugin({
      ...this.mentionOptions
    })
  }

  onChange = editorState => {
    this.setState({
      editorState
    })
  }

  onSearchChange = ({ value }) => {
    this.setState({
      suggestions: defaultSuggestionsFilter(value, this.props.suggestions)
    })
  }

  focus = e => {
    this.editor.focus()
  }

  insertVariable = e => {
    setTimeout(() => {
      const state = this.state.editorState
      const content = state.getCurrentContent()
      const newContent = Modifier.insertText(content, content.getSelectionAfter(), '{{')

      const newEditorState = EditorState.push(state, newContent, 'insert-characters')
      this.setState({ editorState: EditorState.forceSelection(newEditorState, newContent.getSelectionAfter()) })
    }, 100) // To allow the component to be focused first
  }

  render() {
    const { MentionSuggestions, decorators } = this.mentionPlugin
    const plugins = [this.mentionPlugin]

    if (this.props.singleLine) {
      plugins.push(createSingleLinePlugin())
    }

    return (
      <div className={cx(style.editor, this.props.className)} onClick={this.focus}>
        <Editor
          stripPastedStyles={true}
          editorState={this.state.editorState}
          onChange={this.onChange}
          plugins={plugins}
          ref={element => (this.editor = element)}
        />
        <MentionSuggestions onSearchChange={this.onSearchChange} suggestions={this.state.suggestions} />
        <div className={style.insertBtn}>
          <Button minimal={true} small={true} icon="code" text={undefined} onClick={this.insertVariable} />
        </div>
      </div>
    )
  }
}
