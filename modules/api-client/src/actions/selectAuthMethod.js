const { apiAuthService } = require('@rdcdev/dbank-client')

/**
 * Select Auth Method
 *
 * @title Select auth method
 * @category Auth
 */
const selectAuthMethod = async () => {
  try {
    event.payload.payload = event.payload.payload.replace(`"NEEDADDAUTH":FALSE`, `"NEEDADDAUTH":"FALSE"`)
    event.payload.payload = event.payload.payload.replace(`"NEEDADDAUTH":TRUE`, `"NEEDADDAUTH":"TRUE"`)

    const parsed = JSON.parse(event.payload.payload);

    const choice = {
      Type: parsed.TYPE,
      Reference: parsed.REFERENCE,
      Label: parsed.LABEL,
      Description: parsed.DESCRIPTION,
      Icon: parsed.ICON,
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
    console.log(e)
    const sessionId = bp.dialog.createId(event)
    await bp.dialog.jumpTo(sessionId, event, 'error.flow.json', e.httpCode)
  }
}

return selectAuthMethod()
