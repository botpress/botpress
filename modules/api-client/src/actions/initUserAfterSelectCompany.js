const axios = require('axios');

/**
 * Init user after select company
 *
 * @title  Init user after select company
 * @category Auth
 */
const initUserAfterSelectCompany = async () => {
  try {
    const parsed = JSON.parse(event.payload.payload);

    const eventPayload = {
      ID: parsed.ID,
      Type: parsed.TYPE,
      CustomerID: parsed.CUSTOMERID,
      RoleID: parsed.ROLEID,
    };

    const req_user_data = {

      SessionID: temp.authData.SessionID,
      SessionSalt: temp.authData.SessionSalt,
      token: temp.authData.token,

      ...eventPayload,

    };

    const axiosConfig = await bp.http.getAxiosConfigForBot(event.botId, { localUrl: true });
    await axios.post(
      '/mod/users/auth',
      { req_user_data, login: temp.login, userId: event.target, channel: event.channel },
      axiosConfig
    );

    user.req_user_data = req_user_data;
    user.isAuth = true;
  } catch (e) {
    const sessionId = bp.dialog.createId(event);
    await bp.dialog.jumpTo(sessionId, event, 'error.flow.json', e.httpCode);
  }
};

return initUserAfterSelectCompany();
