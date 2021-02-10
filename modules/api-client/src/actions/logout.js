const axios = require('axios');

/**
 * Logout
 *
 * @title Logout user
 * @category Auth
 */
const logout = async () => {
  const login = user.login
  temp = null
  user.login = null;
  user.req_user_data = null;
  user.isAuth = false;
  const sessionId = bp.dialog.createId(event)
  await bp.dialog.jumpTo(sessionId, event, 'main.flow.json', 'entry')

  const axiosConfig = await bp.http.getAxiosConfigForBot(event.botId, { localUrl: true });
  axios.post(
    '/mod/users/logout',
    { login },
    axiosConfig
  );
};

return logout();
