const { apiAuthService } = require('@rdcdev/dbank-client')

/**
 * Get Auth Methods
 *
 * @title Get auth methods
 * @category Auth
 */
const getAuthMethods = async () => {
  try {
    const choices = temp.authData.Choice.map((choice) => ({
      title: choice.Type,
      value: JSON.stringify(choice)
    }));

    const payloads = await bp.cms.renderElement(
      'builtin_single-choice', {
        text: 'Select auth method',
        choices: choices,
        typing: true
      }, event
    );
    await bp.events.replyToEvent(event, payloads);
  } catch (e) {
    const sessionId = bp.dialog.createId(event)
    await bp.dialog.jumpTo(sessionId, event, 'error.flow.json', e.httpCode)
  }
}

return getAuthMethods()
