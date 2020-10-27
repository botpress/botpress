import { Tag } from '@blueprintjs/core'
import { NLU } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import classnames from 'classnames'
import _ from 'lodash'
import React from 'react'
import { Document, Editor as CoreEditor, MarkJSON, Node, Range, Selection, Value } from 'slate'
import { Editor, EditorProps, RenderBlockProps, RenderMarkProps } from 'slate-react'
import PlaceholderPlugin from 'slate-react-placeholder'

import { TagSlotPopover } from './slots/SlotPopover'
import style from './style.scss'
import { makeSlotMark, utterancesToValue, valueToUtterances } from './utterances-state-utils'

const plugins = [
  PlaceholderPlugin({
    placeholder: lang.tr('module.nlu.intents.summaryPlaceholder'),
    when: (_, node) => node.text.trim() === '' && node.type === 'title'
  }),
  PlaceholderPlugin({
    placeholder: lang.tr('module.nlu.intents.utterancePlaceholder'),
    when: (_, node) => node.text.trim() === '' && node.type === 'paragraph'
  })
]

interface Props {
  intentName: string
  utterances: string[]
  slots: NLU.SlotDefinition[]
  onChange: (x: string[]) => void
}

export class UtterancesEditor extends React.Component<Props> {
  state = {
    selection: { utterance: -1, block: -1, from: -1, to: -1 },
    value: utterancesToValue([]),
    showSlotMenu: false
  }
  utteranceKeys = []

  componentDidMount() {
    this.init(this.props.utterances)
  }

  init = (utterances: string[]) => {
    const value = utterancesToValue(utterances)
    this.setState({ value })
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.intentName !== this.props.intentName) {
      this.init(this.props.utterances)
    } else if (!_.isEqual(this.props.utterances, prevProps.utterances)) {
      const value = utterancesToValue(this.props.utterances, this.state.value.get('selection'))
      this.setState({ value })
    }
  }

  onKeyDown = (event: KeyboardEvent, editor: CoreEditor, next: () => void) => {
    if (event.key === 'Enter') {
      const doc: Document = editor.value.get('document')
      const marks = doc.getActiveMarksAtRange(editor.value.selection)

      if (marks.size) {
        editor = editor.moveToEndOfText().moveForward()
        if (editor.value.selection.anchor.path.get(0) === this.props.utterances.length - 1) {
          event.preventDefault()
          editor.insertBlock('paragraph')
          return
        }
      }
    }

    if (event.key === 'Backspace') {
      const doc: Document = editor.value.get('document')
      const marks = doc.getActiveMarksAtRange(editor.value.selection)
      if (marks.size) {
        event.preventDefault()
        editor.moveEndToEndOfText().moveStartToStartOfText()
        marks.forEach(m => editor.removeMark(m))
        return
      }
    }

    const somethingSelected = this.state.selection.from !== this.state.selection.to
    const slotIdx = parseInt(event.key)

    if (somethingSelected && slotIdx < this.props.slots.length) {
      event.preventDefault()
      this.tag(editor, this.props.slots[slotIdx])
      return
    }

    if ((event.key === 'Escape' || event.key === 'Esc') && somethingSelected) {
      this.hideSlotPopover()
      return
    }

    return next()
  }

  onBlur = (event, editor: CoreEditor, next) => {
    const newUtts = valueToUtterances(editor.value)
    if (!_.isEqual(this.props.utterances, newUtts)) {
      this.dispatchChanges(editor.value)
    }

    return next()
  }

  render() {

    return (
      <Editor
        value={this.state.value}
        plugins={plugins}
        renderMark={this.renderMark}
        renderEditor={this.renderEditor}
        renderBlock={this.renderBlock}
        onKeyDown={this.onKeyDown}
        onChange={this.onChange}
        onBlur={this.onBlur}
      />
    )
  }

  renderEditor = (props: EditorProps, editor: CoreEditor, next: () => any) => {
    const children = next()

    this.utteranceKeys = editor.value
      .getIn(['document', 'nodes'])
      .map(x => x.key)
      .toJS()

    return (
      <div className={style['editor-body']}>
        <TagSlotPopover
          slots={this.props.slots}
          show={this.state.showSlotMenu}
          onSlotClicked={this.tag.bind(this, editor)}
        />
        <div className={style.utterances} onCopy={this.onCopy}>{children}</div>
      </div>
    )
  }

  onCopy = event => {
    const selection = document.getSelection().toString()
    let lines: string[]
    if (!selection.length) {
      // Selected the whole component, we put all utterances in the clipboard
      lines = valueToUtterances(this.state.value)
    } else {
      // Partial selection, we remove the heading numbers and empty lines
      lines = selection.split('\n').map(txt =>
        txt.replace(/^\d{1,4}$/, '')
      ).filter(x => x.length)
    }

    event.clipboardData.setData('text/plain', lines.join('\n'))
    event.clipboardData.setData('text/html', `<ul>${lines.map(x => `<li>${x}</li>`).join('')}</ul>`)
    event.preventDefault()
  }

  tag = (editor: CoreEditor, slot: NLU.SlotDefinition) => {
    const { utterance, block } = this.state.selection
    let { from, to } = this.state.selection
    const node: Node = editor.value.getIn(['document', 'nodes', utterance, 'nodes', block])
    const selectedTxt = node.text.substring(from, to)
    // // We're trimming white spaces in the tagging (forward and backward)
    from += selectedTxt.length - selectedTxt.trimStart().length
    to -= selectedTxt.length - selectedTxt.trimEnd().length
    if (from >= to) {
      // Trimming screwed up selection (nothing to tag)
      return
    }

    const range = Range.fromJS({
      anchor: { path: [utterance, block], offset: from },
      focus: {
        path: [utterance, block],
        offset: Math.min(node.text.length, to)
      }
    })

    const mark = makeSlotMark(slot.name, utterance) as MarkJSON

    const marks = (editor.value.get('document') as Document).getActiveMarksAtRange(range)
    if (marks.size) {
      marks.forEach(m => editor.select(range).replaceMark(m, mark))
    } else {
      editor.select(range).addMark(mark)
    }
  }

  dispatchChanges = _.debounce(value => {
    this.props.onChange(valueToUtterances(value))
  }, 2500)

  dispatchNeeded = operations => {
    return operations
      .map(x => x.get('type'))
      .filter(x => ['insert_text', 'remove_text', 'add_mark', 'remove_mark', 'split_node'].includes(x)).size
  }

  onChange = ({ value, operations }) => {
    let selectionState = {}
    if (operations.filter(x => x.get('type') === 'set_selection').size) {
      selectionState = this.onSelectionChanged(value)
    }

    this.setState({ value, ...selectionState })

    if (this.dispatchNeeded(operations)) {
      this.dispatchChanges(value)
    }
  }

  renderMark = (props: RenderMarkProps, editor: CoreEditor, next: () => any) => {
    switch (props.mark.type) {
      case 'slot':
        const slotMark = props.mark.data.toJS()
        const color = this.props.slots.find(s => s.name === slotMark.slotName).color
        const cn = classnames(style.slotMark, style[`label-colors-${color}`])
        const remove = () => editor.moveToRangeOfNode(props.node).removeMark(props.mark)

        return (
          <Tag large={slotMark.utteranceIdx === 0} className={cn} round onClick={remove}>
            {props.children}
          </Tag>
        )
      default:
        return next()
    }
  }

  renderBlock = (props: RenderBlockProps, editor: CoreEditor, next) => {
    const { attributes, children, node } = props

    const utteranceIdx = this.utteranceKeys.indexOf(node.key)
    const isEmpty = node.text.trim().length <= 0
    const isWrong = utteranceIdx < this.utteranceKeys.length - 1 && isEmpty

    const elementCx = classnames(style.utterance, {
      [style.title]: node.type === 'title' && utteranceIdx === 0,
      [style.active]: props.isFocused,
      [style.wrong]: isWrong
    })

    switch (node.type) {
      case 'title':
      case 'paragraph':
        const utterance = (
          <p className={elementCx} {...attributes}>
            <span contentEditable={false} className={style.index} unselectable="on">
              {utteranceIdx + 1}
            </span>
            {children}
          </p>
        )
        return utterance
      default:
        return next()
    }
  }

  showSlotPopover = _.debounce(() => {
    this.setState({ showSlotMenu: true })
  }, 150)

  hideSlotPopover = (cb = () => {}) => {
    this.showSlotPopover.cancel()

    if (this.state.showSlotMenu) {
      this.setState({ showSlotMenu: false }, cb)
    }
  }

  somethingIsSelected = (selection: Selection) => {
    return (
      selection.anchor &&
      selection.anchor.path &&
      selection.focus &&
      selection.focus.path &&
      // Make sure we're in the same utterance (you can't tag cross-utterance)
      selection.anchor.path['0'] === selection.focus.path['0'] &&
      // Make sure we're not wrapping a slot entity inside another slot
      selection.anchor.path['1'] === selection.focus.path['1']
    )
  }

  onSelectionChanged = (value: Value) => {
    const selection: Selection = value.get('selection').toJS()

    let from = -1
    let to = -1
    let utterance = -1
    let block = -1
    if (this.somethingIsSelected(selection)) {
      utterance = selection.anchor.path['0']
      block = selection.anchor.path['1']
      from = Math.min(selection.anchor.offset, selection.focus.offset)
      to = Math.max(selection.anchor.offset, selection.focus.offset)


      if (from !== to) {
        if (selection.isFocused) {
          this.showSlotPopover()
        } else {
          // Weird behavior from slate when selection just changed is to keep the value but to set focus to false
          // need the setTimeout for tagging with click
          setTimeout(this.hideSlotPopover, 200)
        }
      } else if (from === to && this.state.showSlotMenu) {
        this.hideSlotPopover()
      }
    } else {
      this.hideSlotPopover()
    }

    return { selection: { utterance, block, from, to } }
  }
}
