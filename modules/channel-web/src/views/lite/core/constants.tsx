export default {
  /** These types are sent using the /message/ endpoint */
  MESSAGE_TYPES: ['text', 'quick_reply', 'form', 'login_prompt', 'visit', 'postback'],
  /** The duration of the hide / show chat */
  ANIM_DURATION: 300,
  MIN_TIME_BETWEEN_SOUNDS: 1000,
  HISTORY_STARTING_POINT: -1,
  HISTORY_MAX_MESSAGES: 10,
  HISTORY_UP: 'ArrowUp',
  /** The number of minutes before a new timestamp is displayed */
  TIME_BETWEEN_DATES: 10,
  /** The default configuration when starting the chat */
  DEFAULT_CONFIG: {
    userId: undefined,
    enableReset: true,
    stylesheet: '/assets/modules/channel-web/default.css',
    extraStylesheet: '',
    showConversationsButton: true,
    showUserName: false,
    showUserAvatar: false,
    enableTranscriptDownload: true,
    enableArrowNavigation: false
  }
}
