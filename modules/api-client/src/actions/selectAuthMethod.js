const { apiAuthService } = require('@rdcdev/dbank-client')

/**
 * Select Auth Method
 *
 * @title Select auth method
 * @category Auth
 */
const selectAuthMethod = async () => {
  try {
    const choice = {
      Type: temp.choiceMAP[event.payload.text].Type,
      Reference: temp.choiceMAP[event.payload.text].Reference,
      Label: temp.choiceMAP[event.payload.text].Label,
      Description: temp.choiceMAP[event.payload.text].Description,
      Icon: temp.choiceMAP[event.payload.text].Icon,
    }

    await apiAuthService.selectAuthMethod({
      token: temp.authData.authData.token,
      Reference: choice.Reference,
      Type: temp.authData.Code,
      SessionID: temp.authData.authData.SessionID,
      SessionSalt: temp.authData.authData.SessionSalt,
      Content: JSON.stringify(choice),
    });

    temp.choice = choice
  } catch (e) {
    const sessionId = bp.dialog.createId(event)
    await bp.dialog.jumpTo(sessionId, event, 'error.flow.json', e.httpCode)
  }
}

return selectAuthMethod()
