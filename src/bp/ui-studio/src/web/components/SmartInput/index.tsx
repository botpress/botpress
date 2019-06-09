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

interface Props {
  className?: string
  singleLine: boolean
  value: string
  onChange: (value: string) => void
}

class SmartInput extends Component<Props & { hints: any[] }> {
  valueAsText = ''

  mentionOptions = {
    mentionTrigger: '{',
    mentionRegExp: '{?[\\d\\w\\.]*}{0,2}',
    entityMutability: 'MUTABLE'
  }

  mentionPlugin = createMentionPlugin({
    ...this.mentionOptions
  })

  editor

  state = {
    contentStateText: '',
    editorState: EditorState.createEmpty(),
    suggestions: []
  }

  static getDerivedStateFromProps(props, state) {
    if (props.value && props.value !== state.contentStateText && props.value !== state.beforeContentStateText) {
      return {
        contentStateText: props.value,
        editorState: EditorState.createWithContent(ContentState.createFromText(props.value))
      }
    }

    return null
  }

  onChange = editorState => {
    const text = editorState.getCurrentContent().getPlainText()
    const shouldUpdate = text !== this.valueAsText
    this.valueAsText = text
    this.setState({ editorState, contentStateText: text, beforeContentStateText: this.state.contentStateText }, () => {
      shouldUpdate && this.props.onChange && this.props.onChange(text)
    })
  }

  onSearchChange = ({ value }) => {
    this.setState({
      suggestions: defaultSuggestionsFilter(value, this.props.hints)
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
    const { MentionSuggestions } = this.mentionPlugin
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
export default (props: Props) => <ConnectedSmartInput {...props} store={store} />
