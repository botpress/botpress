const { apiUserService } = require('@rdcdev/dbank-client')

/**
 * Select company
 *
 * @title Select company
 * @category Auth
 */
const selectCompany = async () => {
  try {
    const ecbUser = await apiUserService.user(user.isAuth ? {
      ChannelID: event.channel || 0,
      SessionKey: user.req_user_data.SessionKey,
      secretKey: user.req_user_data.secretKey,
      SessionID: user.req_user_data.SessionID,
      SessionSalt: user.req_user_data.SessionSalt,
      token: user.req_user_data.token,
      lang: user.language,
    } : temp.authData)

    temp.usersMAP = {}

    const choices = ecbUser.Customers.map(({
                                             ID,
                                             RoleID,
                                             Name
                                           }) => {
      temp.usersMAP[Name] = {
        ...temp.authData,
        RoleID,
        CustomerID: ID,
        ID: ecbUser.ID,
        Type: ecbUser.Type
      }
      return {
        title: Name,
        value: Name
      }
    })

    const payloads = await bp.cms.renderElement(
      'builtin_single-choice', {
        text: 'Select company',
        choices: choices,
        typing: true
      }, event
    )

    await bp.events.replyToEvent(event, payloads)
  } catch (e) {
    const sessionId = bp.dialog.createId(event)
    await bp.dialog.jumpTo(sessionId, event, 'error.flow.json', e.httpCode)
  }
}

return selectCompany()
