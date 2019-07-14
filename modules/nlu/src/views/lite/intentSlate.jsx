import React from 'react'
import { Editor } from 'slate-react'
import PlaceholderPlugin from 'slate-react-placeholder'
import classnames from 'classnames'

import style from './style.scss'
import { utterancesToValue, valueToUtterances } from './transformers'
import { Popover, Position } from '@blueprintjs/core'

const plugins = [
  PlaceholderPlugin({
    placeholder: 'Summary of intent',
    when: (editor, node) => node.text.trim() === '' && node.type === 'title'
  }),
  PlaceholderPlugin({
    placeholder: 'Type a sentence',
    when: (editor, node) => node.text.trim() === '' && node.type === 'paragraph'
  })
]

export class UtterancesEditor extends React.Component {
  state = { selection: { utterance: -1, block: -1, from: -1, to: -1 }, value: utterancesToValue([]) }
  utteranceKeys = []
  editorRef = null

  componentDidMount() {
    const value = utterancesToValue(this.props.utterances)
    this.setState({ value })
  }

  componentDidUpdate(prevProps) {
    // TODO something smarter than this ... maybe hash ?
    if (!_.isEqual(this.props.utterances, prevProps.utterances)) {
      const value = utterancesToValue(this.props.utterances)
      this.setState({ value })
    }
  }

  onKeyDown = (event, editor, next) => {
    if (event.key === 'Enter') {
      const doc = editor.value.get('document')
      const marks = doc.getActiveMarksAtRange(editor.value.selection)

      if (marks.size) {
        event.preventDefault()
        return editor
          .moveToEndOfText()
          .moveForward()
          .insertBlock('paragraph')
      }
    }

    if (event.key === 'Backspace') {
      const doc = editor.value.get('document')
      const marks = doc.getActiveMarksAtRange(editor.value.selection)
      if (marks.size) {
        event.preventDefault()
        editor.moveEndToEndOfText().moveStartToStartOfText()
        marks.forEach(m => editor.removeMark(m))
        return
      }
    }

    const somethingSelected = this.state.selection.from !== this.state.selection.to
    const shortcutIdx = slotShortcuts.indexOf(event.key)

    if (somethingSelected && shortcutIdx > -1 && shortcutIdx < this.props.slots.length) {
      event.preventDefault()
      this.onTag(shortcutIdx, editor)
      return
    }

    return next()
  }

  render() {
    return (
      <Editor
        ref={editor => (this.editorRef = editor)}
        value={this.state.value}
        plugins={plugins}
        renderMark={this.renderMark}
        renderEditor={this.renderEditor}
        selection={this.state.selection}
        renderBlock={this.renderBlock}
        onKeyDown={this.onKeyDown}
        onChange={this.onChange}
      />
    )
  }

  renderEditor = (props, editor, next) => {
    const children = next()

    this.utteranceKeys = editor.value
      .getIn(['document', 'nodes'])
      .map(x => x.key)
      .toJS()

    return (
      <div className={style['editor-body']}>
        <div className={style.utterances} editor={editor}>
          {children}
        </div>
      </div>
    )
  }

  onTag = (idx, editor) => {
    const { utterance, block } = this.state.selection
    let { from, to } = this.state.selection

    const node = editor.value.getIn(['document', 'nodes', utterance, 'nodes', block])

    const content = node.text

    // We're trimming white spaces in the tagging (forward and backward)
    while (from < to && !content.charAt(from).trim().length) {
      from++
    }
    do {
      to--
    } while (to > from && !content.charAt(to).trim().length)

    if (from >= to) {
      // Trimming screwed up selection (nothing to tag)
      return
    }

    const range = Range.fromJS({
      anchor: { path: [utterance, block], offset: from },
      focus: {
        path: [utterance, block],
        offset: Math.min(content.length, to + 1)
      }
    })

    const mark = {
      type: 'slot',
      data: Data.fromJSON(this.props.slots[idx])
    }

    const marks = editor.value.get('document').getActiveMarksAtRange(range)
    if (marks.size) {
      marks.forEach(m => editor.select(range).replaceMark(m, mark))
    } else {
      editor.select(range).addMark(mark)
    }
  }

  dispatchChanges = _.debounce(value => {
    this.props.onChange(valueToUtterances(value))
  }, 2000)

  onChange = ({ value, operations }) => {
    debugger
    if (operations.filter(x => x.get('type') === 'set_selection').size) {
      this.onSelectionChanged(value)
    }
    const needsDispatch = operations
      .map(x => x.get('type'))
      .filter(x => ['insert_text', 'remove_text', 'add_mark', 'remove_mark'].includes(x)).size

    if (needsDispatch) {
      this.dispatchChanges(value)
    }

    this.setState({ value })
  }

  renderMark = (props, editor, next) => {
    switch (props.mark.type) {
      case 'slot':
        const { slotName } = props.mark.data.toJS()
        const color = this.props.slots.findIndex(s => s.name === slotName)
        const cn = classnames(style['slot'], style['color-bg'], style[`color-${color}`])
        const remove = () => props.editor.moveToRangeOfNode(props.node).removeMark(props.mark)
        return (
          <span onClick={remove} className={cn}>
            {props.children}
          </span>
        )
      default:
        return next()
    }
  }

  renderBlock = (props, editor, next) => {
    const { attributes, children, node } = props

    const utteranceIdx = this.utteranceKeys.indexOf(node.key)
    const isEmpty = node.text.trim().length <= 0
    const isWrong = utteranceIdx < this.utteranceKeys.length - 1 && isEmpty

    const elementCx = classnames(style.utterance, {
      [style.title]: node.type === 'title',
      [style.active]: props.isFocused,
      [style.wrong]: isWrong
    })

    switch (node.type) {
      case 'title':
      case 'paragraph':
        const utterance = (
          <p className={elementCx} {...attributes}>
            {utteranceIdx > 0 ? (
              <span contentEditable={false} className={style.index}>
                {utteranceIdx}
              </span>
            ) : (
              <span contentEditable={false} className={classnames(style.index, style.count)}>
                {this.utteranceKeys.length}
              </span>
            )}
            {children}
          </p>
        )
        return utterance
      default:
        return next()
    }
  }

  showSlotPopover = _.debounce(selection => {
    const editor = this.editorRef
    editor.addAnnotation({
      key: 'slot-popover',
      type: 'popover',
      anchor: selection.anchor,
      focus: selection.focus
    })
  }, 200)

  onSelectionChanged = value => {
    const selection = value.get('selection').toJS()
    let from = -1
    let to = -1
    let utterance = -1
    let block = -1
    if (
      // Something is actually selected
      selection.anchor &&
      selection.anchor.path &&
      selection.focus &&
      selection.focus.path &&
      // Make sure we're in the same utterance (you can't tag cross-utterance)
      selection.anchor.path['0'] === selection.focus.path['0'] &&
      // Make sure we're not wrapping a slot entity inside an other slot
      selection.anchor.path['1'] === selection.focus.path['1']
    ) {
      utterance = selection.anchor.path['0']
      block = selection.anchor.path['1']
      from = Math.min(selection.anchor.offset, selection.focus.offset)
      to = Math.max(selection.anchor.offset, selection.focus.offset)
      if (from !== to) {
        this.showSlotPopover(selection)
      }
    }

    this.setState({ selection: { utterance, block, from, to } })
  }
}
