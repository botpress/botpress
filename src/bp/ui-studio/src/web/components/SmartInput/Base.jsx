import decorateComponentWithProps from 'decorate-component-with-props'
import { Map } from 'immutable'

import Mention from './Mention.jsx'
import MentionSuggestions from './MentionSuggestions' // eslint-disable-line import/no-named-as-default
import MentionSuggestionsPortal from './MentionSuggestionsPortal'
import defaultRegExp from './defaultRegExp'
import mentionStrategy from './mentionStrategy'
import mentionSuggestionsStrategy from './mentionSuggestionsStrategy'
import suggestionsFilter from './utils/defaultSuggestionsFilter'
import defaultPositionSuggestions from './utils/positionSuggestions'

export { default as MentionSuggestions } from './MentionSuggestions'

import style from './styles.scss'

export const defaultTheme = {
  // CSS class for mention text
  mention: style.mention,
  // CSS class for suggestions component
  mentionSuggestions: style.mentionSuggestions,
  // CSS classes for an entry in the suggestions component
  mentionSuggestionsEntry: style.mentionSuggestionsEntry,
  mentionSuggestionsEntryFocused: style.mentionSuggestionsEntryFocused,
  mentionSuggestionsEntryText: style.mentionSuggestionsEntryText,
  mentionSuggestionsEntryAvatar: style.mentionSuggestionsEntryAvatar
}

const HandleSpan = props => {
  return (
    <span className={style.mention} data-offset-key={props.offsetKey}>
      {props.children}
    </span>
  )
}

const HANDLE_REGEX = /{{[A-Za-z0-9_\\.-]+}}/g

function handleStrategy(contentBlock, callback, contentState) {
  findWithRegex(HANDLE_REGEX, contentBlock, callback)
}

function findWithRegex(regex, contentBlock, callback) {
  const text = contentBlock.getText()
  let matchArr, start
  while ((matchArr = regex.exec(text)) !== null) {
    start = matchArr.index
    callback(start, start + matchArr[0].length)
  }
}

export default (config = {}) => {
  const callbacks = {
    keyBindingFn: undefined,
    handleKeyCommand: undefined,
    onDownArrow: undefined,
    onUpArrow: undefined,
    onTab: undefined,
    onEscape: undefined,
    handleReturn: undefined,
    onChange: undefined
  }

  const ariaProps = {
    ariaHasPopup: 'false',
    ariaExpanded: false,
    ariaOwneeID: undefined,
    ariaActiveDescendantID: undefined
  }

  let searches = Map()
  let escapedSearch
  let clientRectFunctions = Map()
  let isOpened

  const store = {
    getEditorState: undefined,
    setEditorState: undefined,
    getPortalClientRect: offsetKey => clientRectFunctions.get(offsetKey)(),
    getAllSearches: () => searches,
    isEscaped: offsetKey => escapedSearch === offsetKey,
    escapeSearch: offsetKey => {
      escapedSearch = offsetKey
    },

    resetEscapedSearch: () => {
      escapedSearch = undefined
    },

    register: offsetKey => {
      searches = searches.set(offsetKey, offsetKey)
    },

    updatePortalClientRect: (offsetKey, func) => {
      clientRectFunctions = clientRectFunctions.set(offsetKey, func)
    },

    unregister: offsetKey => {
      searches = searches.delete(offsetKey)
      clientRectFunctions = clientRectFunctions.delete(offsetKey)
    },

    getIsOpened: () => isOpened,
    setIsOpened: nextIsOpened => {
      isOpened = nextIsOpened
    }
  }

  // Styles are overwritten instead of merged as merging causes a lot of confusion.
  //
  // Why? Because when merging a developer needs to know all of the underlying
  // styles which needs a deep dive into the code. Merging also makes it prone to
  // errors when upgrading as basically every styling change would become a major
  // breaking change. 1px of an increased padding can break a whole layout.
  const {
    mentionPrefix = '',
    theme = defaultTheme,
    positionSuggestions = defaultPositionSuggestions,
    mentionComponent,
    mentionSuggestionsComponent = MentionSuggestions,
    entityMutability = 'SEGMENTED',
    mentionTrigger = '@',
    mentionRegExp = defaultRegExp,
    supportWhitespace = false
  } = config
  const mentionSearchProps = {
    ariaProps,
    callbacks,
    theme,
    store,
    entityMutability,
    positionSuggestions,
    mentionTrigger,
    mentionPrefix
  }
  return {
    MentionSuggestions: decorateComponentWithProps(mentionSuggestionsComponent, mentionSearchProps),
    decorators: [
      {
        strategy: handleStrategy,
        component: HandleSpan
      },
      {
        strategy: mentionStrategy(mentionTrigger),
        component: decorateComponentWithProps(Mention, { theme, mentionComponent })
      },
      {
        strategy: mentionSuggestionsStrategy(mentionTrigger, supportWhitespace, mentionRegExp),
        component: decorateComponentWithProps(MentionSuggestionsPortal, { store })
      }
    ],
    getAccessibilityProps: () => ({
      role: 'combobox',
      ariaAutoComplete: 'list',
      ariaHasPopup: ariaProps.ariaHasPopup,
      ariaExpanded: ariaProps.ariaExpanded,
      ariaActiveDescendantID: ariaProps.ariaActiveDescendantID,
      ariaOwneeID: ariaProps.ariaOwneeID
    }),

    initialize: ({ getEditorState, setEditorState }) => {
      store.getEditorState = getEditorState
      store.setEditorState = setEditorState
    },

    onDownArrow: keyboardEvent => callbacks.onDownArrow && callbacks.onDownArrow(keyboardEvent),
    onTab: keyboardEvent => callbacks.onTab && callbacks.onTab(keyboardEvent),
    onUpArrow: keyboardEvent => callbacks.onUpArrow && callbacks.onUpArrow(keyboardEvent),
    onEscape: keyboardEvent => callbacks.onEscape && callbacks.onEscape(keyboardEvent),
    handleReturn: keyboardEvent => callbacks.handleReturn && callbacks.handleReturn(keyboardEvent),
    onChange: editorState => {
      if (callbacks.onChange) return callbacks.onChange(editorState)
      return editorState
    }
  }
}

export const defaultSuggestionsFilter = suggestionsFilter
