const axios = require('axios');

/**
 * Init user after select company
 *
 * @title  Init user after select company
 * @category Auth
 */
const initUserAfterSelectCompany = async () => {
  try {

    console.log(temp.usersMAP[event.payload.text])

    const req_user_data = temp.usersMAP[event.payload.text]

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
