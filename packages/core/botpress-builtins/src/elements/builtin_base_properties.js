export const typingIndicators = {
  typing: {
    type: 'boolean',
    title: 'Show typing indicators',
    default: true
  }
}

export const messagingPurpose = {
  messagingType: {
    type: 'string',
    title: 'Messaging Type',
    enum: ['RESPONSE', 'UPDATE', 'MESSAGE_TAG'],
    default: 'RESPONSE'
  },
  messagingTag: {
    type: 'string',
    title: 'Messaging Tag',
    enum: [
      '',
      'NON_PROMOTIONAL_SUBSCRIPTION',
      'BUSINESS_PRODUCTIVITY',
      'COMMUNITY_ALERT',
      'CONFIRMED_EVENT_REMINDER',
      'GAME_EVENT',
      'ISSUE_RESOLUTION',
      'ACCOUNT_UPDATE',
      'APPLICATION_UPDATE',
      'APPOINTMENT_UPDATE',
      'FEATURE_FUNCTIONALITY_UPDATE',
      'PAIRING_UPDATE',
      'PAYMENT_UPDATE',
      'PERSONAL_FINANCE_UPDATE',
      'RESERVATION_UPDATE',
      'SHIPPING_UPDATE',
      'TICKET_UPDATE',
      'TRANSPORTATION_UPDATE'
    ],
    default: ''
  }
}
