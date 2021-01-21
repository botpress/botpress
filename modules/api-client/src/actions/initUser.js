const axios = require('axios');
const { apiUserService } = require('@rdcdev/dbank-client');

/**
 * Init user
 *
 * @title Init user session
 * @category Auth
 */
const initUser = async () => {
  try {
    const axiosConfig = await bp.http.getAxiosConfigForBot(event.botId, { localUrl: true });

    const res = await axios.get(`/mod/users/${user.login}`, axiosConfig)

    await apiUserService.user(res.data.req_user_data);

    user.req_user_data = res.data.req_user_data
    user.isAuth = true;
  } catch (error) {

    const sessionId = bp.dialog.createId(event);
    await bp.dialog.jumpTo(sessionId, event, 'error.flow.json', 'unauthorized');

    user.isAuth = false;
  }
};

return initUser();
