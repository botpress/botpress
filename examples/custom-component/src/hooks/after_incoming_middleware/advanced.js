if (event.preview === 'disappearKeyboard') {
  const payload = {
    type: 'custom',
    module: 'custom-component',
    component: 'DisappearingText',
    myrandomproperty:
      'This text will disappear when the timer expires. You can add any component, buttons, etc as a keyboard',
    wrapped: {
      // We can wrap an existing component
      ...event.payload
    }
  }
  bp.events.replyToEvent(event, [payload])
}

if (event.preview === 'feedbackKeyboard') {
  const payload = {
    type: 'custom',
    module: 'custom-component',
    component: 'FeedbackButtons',
    wrapped: {
      // Wrap an existing event...
      ...event.payload,

      // Or create a new one
      type: 'text',
      text: 'bla'
    }
  }
  bp.events.replyToEvent(event, [payload])
}

if (event.preview === 'multiLineKeyboard') {
  const payload = {
    type: 'text',
    text: 'how can i help you?',
    quick_replies: [
      [
        { label: 'row 1, button 1', payload: 'something' },
        { label: 'row 1, button 2', payload: 'something' }
      ],
      [{ label: 'row 2, button 1', payload: 'something' }],
      [{ label: 'row 3, button 1', payload: 'something' }]
    ]
  }
  bp.events.replyToEvent(event, [payload])
}

if (event.preview === 'wrapperExample') {
  const payload = {
    type: 'custom',
    module: 'custom-component',
    component: 'ColorText',
    color: '#ff0000',
    wrapped: {
      type: 'custom',
      module: 'custom-component',
      component: 'UpperCase',
      wrapped: {
        type: 'text',
        text: 'this will be colored red & in uppercase '
      }
    }
  }
  bp.events.replyToEvent(event, [payload])
}

if (event.payload && event.payload.type === 'user_satisfied') {
  bp.logger.info(`User is satisfied!`)
}

if (event.payload && event.payload.type === 'more_info') {
  bp.logger.info(`User would like more info...`)
}
