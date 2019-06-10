import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { genKey } from 'draft-js'
import { escapeRegExp } from 'lodash'
import addMention from '../modifiers/addMention'
import decodeOffsetKey from '../utils/decodeOffsetKey'
import getSearchText from '../utils/getSearchText'
import cx from 'classnames'

import style from '../styles.scss'

const Category = ({ category = 'UNKNOWN' }) => (
  <span className={cx(style['suggestion-type'], style[category.toLowerCase()])}>{category[0]}</span>
)

const defaultEntryComponent = props => {
  const {
    mention,
    theme,
    isFocused, // eslint-disable-line no-unused-vars
    searchValue, // eslint-disable-line no-unused-vars
    ...parentProps
  } = props
  const { category = 'VARIABLES', value } = mention

  return (
    <div {...parentProps}>
      <Category category={category} />
      <span className={cx(style.variable, { [style.focused]: isFocused })}>{mention.name}</span>

      {isFocused && (
        <div className={style.info}>
          <div className={style.description}>{mention.description}</div>
          <div className={style.source}>{mention.source}</div>
          <div className={style.location}>{mention.location}</div>
        </div>
      )}
    </div>
  )
}

export class Entry extends Component {
  constructor(props) {
    super(props)
    this.mouseDown = false
  }

  componentDidUpdate() {
    this.mouseDown = false
  }

  onMouseUp = () => {
    if (this.mouseDown) {
      this.props.onMentionSelect(this.props.mention)
      this.mouseDown = false
    }
  }

  onMouseDown = event => {
    // Note: important to avoid a content edit change
    event.preventDefault()

    this.mouseDown = true
  }

  onMouseEnter = () => {
    this.props.onMentionFocus(this.props.index)
  }

  render() {
    const { theme = {}, mention, searchValue, isFocused, id } = this.props
    const className = isFocused ? style.mentionSuggestionsEntryFocused : style.mentionSuggestionsEntry
    const EntryComponent = this.props.entryComponent
    return (
      <EntryComponent
        className={className}
        onMouseDown={this.onMouseDown}
        onMouseUp={this.onMouseUp}
        onMouseEnter={this.onMouseEnter}
        role="option"
        id={id}
        aria-selected={isFocused ? 'true' : null}
        theme={theme}
        mention={mention}
        isFocused={isFocused}
        searchValue={searchValue}
      />
    )
  }
}

export class MentionSuggestions extends Component {
  static propTypes = {
    entityMutability: PropTypes.oneOf(['SEGMENTED', 'IMMUTABLE', 'MUTABLE']),
    entryComponent: PropTypes.func,
    onAddMention: PropTypes.func,
    suggestions: PropTypes.array
  }

  state = {
    isActive: false,
    focusedOptionIndex: 0
  }

  componentWillMount() {
    this.key = genKey()
    this.props.callbacks.onChange = this.onEditorStateChange
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.suggestions.length === 0 && this.state.isActive) {
      this.closeDropdown()
    } else if (
      nextProps.suggestions.length > 0 &&
      nextProps.suggestions !== this.props.suggestions &&
      !this.state.isActive
    ) {
      this.openDropdown()
    }
  }

  componentDidUpdate = (prevProps, prevState) => {
    if (this.popover) {
      // In case the list shrinks there should be still an option focused.
      // Note: this might run multiple times and deduct 1 until the condition is
      // not fullfilled anymore.sugge
      const size = this.props.suggestions.length
      if (size > 0 && this.state.focusedOptionIndex >= size) {
        this.setState({
          focusedOptionIndex: size - 1
        })
      }

      // Note: this is a simple protection for the error when componentDidUpdate
      // try to get new getPortalClientRect, but the key already was deleted by
      // previous action. (right now, it only can happened when set the mention
      // trigger to be multi-characters which not supported anyway!)
      if (!this.props.store.getAllSearches().has(this.activeOffsetKey)) {
        return
      }

      const decoratorRect = this.props.store.getPortalClientRect(this.activeOffsetKey)
      const newStyles = this.props.positionSuggestions({
        decoratorRect,
        prevProps,
        prevState,
        props: this.props,
        state: this.state,
        popover: this.popover
      })
      Object.keys(newStyles).forEach(key => {
        this.popover.style[key] = newStyles[key]
      })
    }
  }

  componentWillUnmount = () => {
    this.props.callbacks.onChange = undefined
  }

  onEditorStateChange = editorState => {
    const searches = this.props.store.getAllSearches()

    // if no search portal is active there is no need to show the popover
    if (searches.size === 0) {
      return editorState
    }

    const removeList = () => {
      this.props.store.resetEscapedSearch()
      this.closeDropdown()
      return editorState
    }

    // get the current selection
    const selection = editorState.getSelection()
    const anchorKey = selection.getAnchorKey()
    const anchorOffset = selection.getAnchorOffset()

    // the list should not be visible if a range is selected or the editor has no focus
    if (!selection.isCollapsed() || !selection.getHasFocus()) return removeList()

    // identify the start & end positon of each search-text
    const offsetDetails = searches.map(offsetKey => decodeOffsetKey(offsetKey))

    // a leave can be empty when it is removed due e.g. using backspace
    // do not check leaves, use full decorated portal text
    const leaves = offsetDetails
      .filter(({ blockKey }) => blockKey === anchorKey)
      .map(({ blockKey, decoratorKey }) => editorState.getBlockTree(blockKey).getIn([decoratorKey]))

    // if all leaves are undefined the popover should be removed
    if (leaves.every(leave => leave === undefined)) {
      return removeList()
    }

    // Checks that the cursor is after the @ character but still somewhere in
    // the word (search term). Setting it to allow the cursor to be left of
    // the @ causes troubles due selection confusion.
    const plainText = editorState.getCurrentContent().getPlainText()
    const selectionIsInsideWord = leaves.filter(leave => leave !== undefined).map(
      ({ start, end }) =>
        (start === 0 &&
          anchorOffset === this.props.mentionTrigger.length &&
          plainText.charAt(anchorOffset) !== this.props.mentionTrigger &&
          new RegExp(String.raw({ raw: `${escapeRegExp(this.props.mentionTrigger)}` }), 'g').test(plainText) &&
          anchorOffset <= end) || // @ is the first character
        (anchorOffset > start + this.props.mentionTrigger.length && anchorOffset <= end) // @ is in the text or at the end
    )

    if (selectionIsInsideWord.every(isInside => isInside === false)) return removeList()

    const lastActiveOffsetKey = this.activeOffsetKey
    this.activeOffsetKey = selectionIsInsideWord
      .filter(value => value === true)
      .keySeq()
      .first()

    this.onSearchChange(editorState, selection, this.activeOffsetKey, lastActiveOffsetKey)

    // make sure the escaped search is reseted in the cursor since the user
    // already switched to another mention search
    if (!this.props.store.isEscaped(this.activeOffsetKey)) {
      this.props.store.resetEscapedSearch()
    }

    // If none of the above triggered to close the window, it's safe to assume
    // the dropdown should be open. This is useful when a user focuses on another
    // input field and then comes back: the dropdown will show again.
    if (
      !this.state.isActive &&
      !this.props.store.isEscaped(this.activeOffsetKey) &&
      this.props.suggestions.length > 0
    ) {
      this.openDropdown()
    }

    // makes sure the focused index is reseted every time a new selection opens
    // or the selection was moved to another mention search
    if (this.lastSelectionIsInsideWord === undefined || !selectionIsInsideWord.equals(this.lastSelectionIsInsideWord)) {
      this.setState({
        focusedOptionIndex: 0
      })
    }

    this.lastSelectionIsInsideWord = selectionIsInsideWord

    return editorState
  }

  onSearchChange = (editorState, selection, activeOffsetKey, lastActiveOffsetKey) => {
    const { matchingString: searchValue } = getSearchText(editorState, selection, this.props.mentionTrigger)

    if (this.lastSearchValue !== searchValue || activeOffsetKey !== lastActiveOffsetKey) {
      this.lastSearchValue = searchValue
      this.props.onSearchChange({ value: searchValue })
    }
  }

  onDownArrow = keyboardEvent => {
    keyboardEvent.preventDefault()
    const newIndex = this.state.focusedOptionIndex + 1
    this.onMentionFocus(newIndex >= this.props.suggestions.length ? 0 : newIndex)
  }

  onTab = keyboardEvent => {
    keyboardEvent.preventDefault()
    this.commitSelection()
  }

  onUpArrow = keyboardEvent => {
    keyboardEvent.preventDefault()
    if (this.props.suggestions.length > 0) {
      const newIndex = this.state.focusedOptionIndex - 1
      this.onMentionFocus(newIndex < 0 ? this.props.suggestions.length - 1 : newIndex)
    }
  }

  onEscape = keyboardEvent => {
    keyboardEvent.preventDefault()

    const activeOffsetKey = this.lastSelectionIsInsideWord
      .filter(value => value === true)
      .keySeq()
      .first()
    this.props.store.escapeSearch(activeOffsetKey)
    this.closeDropdown()

    // to force a re-render of the outer component to change the aria props
    this.props.store.setEditorState(this.props.store.getEditorState())
  }

  onMentionSelect = mention => {
    // Note: This can happen in case a user typed @xxx (invalid mention) and
    // then hit Enter. Then the mention will be undefined.
    if (!mention) {
      return
    }

    if (this.props.onAddMention) {
      this.props.onAddMention(mention)
    }

    if (mention.partial !== true) {
      this.closeDropdown()
    }

    // this.closeDropdown()
    const newEditorState = addMention(
      this.props.store.getEditorState(),
      mention,
      this.props.mentionPrefix,
      this.props.mentionTrigger,
      this.props.entityMutability,
      false
    )
    this.props.store.setEditorState(newEditorState)
  }

  onMentionFocus = index => {
    const descendant = `mention-option-${this.key}-${index}`
    this.props.ariaProps.ariaActiveDescendantID = descendant
    this.setState({
      focusedOptionIndex: index
    })

    // to force a re-render of the outer component to change the aria props
    this.props.store.setEditorState(this.props.store.getEditorState())
  }

  commitSelection = () => {
    if (!this.props.store.getIsOpened()) {
      return 'not-handled'
    }

    this.onMentionSelect(this.props.suggestions[this.state.focusedOptionIndex])
    return 'handled'
  }

  openDropdown = () => {
    // This is a really nasty way of attaching & releasing the key related functions.
    // It assumes that the keyFunctions object will not loose its reference and
    // by this we can replace inner parameters spread over different modules.
    // This better be some registering & unregistering logic. PRs are welcome :)
    this.props.callbacks.onDownArrow = this.onDownArrow
    this.props.callbacks.onUpArrow = this.onUpArrow
    this.props.callbacks.onEscape = this.onEscape
    this.props.callbacks.handleReturn = this.commitSelection
    this.props.callbacks.onTab = this.onTab

    const descendant = `mention-option-${this.key}-${this.state.focusedOptionIndex}`
    this.props.ariaProps.ariaActiveDescendantID = descendant
    this.props.ariaProps.ariaOwneeID = `mentions-list-${this.key}`
    this.props.ariaProps.ariaHasPopup = 'true'
    this.props.ariaProps.ariaExpanded = true
    this.setState({
      isActive: true
    })

    if (this.props.onOpen) {
      this.props.onOpen()
    }
  }

  closeDropdown = () => {
    // make sure none of these callbacks are triggered
    this.props.callbacks.onDownArrow = undefined
    this.props.callbacks.onUpArrow = undefined
    this.props.callbacks.onTab = undefined
    this.props.callbacks.onEscape = undefined
    this.props.callbacks.handleReturn = undefined
    this.props.ariaProps.ariaHasPopup = 'false'
    this.props.ariaProps.ariaExpanded = false
    this.props.ariaProps.ariaActiveDescendantID = undefined
    this.props.ariaProps.ariaOwneeID = undefined
    this.setState({
      isActive: false
    })

    if (this.props.onClose) {
      this.props.onClose()
    }
  }

  render() {
    if (!this.state.isActive) {
      return null
    }

    const {
      entryComponent,
      popoverComponent = <div />,
      onClose, // eslint-disable-line no-unused-vars
      onOpen, // eslint-disable-line no-unused-vars
      onAddMention, // eslint-disable-line no-unused-vars, no-shadow
      onSearchChange, // eslint-disable-line no-unused-vars, no-shadow
      suggestions, // eslint-disable-line no-unused-vars
      ariaProps, // eslint-disable-line no-unused-vars
      callbacks, // eslint-disable-line no-unused-vars
      theme = {},
      store, // eslint-disable-line no-unused-vars
      entityMutability, // eslint-disable-line no-unused-vars
      positionSuggestions, // eslint-disable-line no-unused-vars
      mentionTrigger, // eslint-disable-line no-unused-vars
      mentionPrefix, // eslint-disable-line no-unused-vars
      ...elementProps
    } = this.props

    return React.cloneElement(
      popoverComponent,
      {
        ...elementProps,
        className: style.mentionSuggestions,
        role: 'listbox',
        id: `mentions-list-${this.key}`,
        ref: element => {
          this.popover = element
        }
      },
      this.props.suggestions.map((mention, index) => (
        <Entry
          key={mention.id != null ? mention.id : mention.name}
          onMentionSelect={this.onMentionSelect}
          onMentionFocus={this.onMentionFocus}
          isFocused={this.state.focusedOptionIndex === index}
          mention={mention}
          index={index}
          id={`mention-option-${this.key}-${index}`}
          theme={theme}
          searchValue={this.lastSearchValue}
          entryComponent={entryComponent || defaultEntryComponent}
        />
      ))
    )
  }
}

export default MentionSuggestions
