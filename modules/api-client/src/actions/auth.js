const axios = require('axios');
const { apiAuthService, apiUserService } = require('@rdcdev/dbank-client');

/**
 * Auth user
 *
 * @title Set user
 * @category Auth
 * @param {string} login The login of the ecb user
 * @param {string} password The password of the ecb user
 */
const auth = async (login, password) => {
  try {
    const axiosConfig = await bp.http.getAxiosConfigForBot(event.botId, { localUrl: true });

    const authData = await apiAuthService.auth(login, password);
    const ecbUser = await apiUserService.user(authData);

    const req_user_data = {
      ID: ecbUser.ID,
      SessionID: authData.SessionID,
      SessionSalt: authData.SessionSalt,
      Type: ecbUser.Type,
      token: authData.token,
      CustomerID: ecbUser.Customers[1].ID,
      RoleID: ecbUser.Customers[1].RoleID,
    }

    await axios.post('/mod/users/auth', { req_user_data, login }, axiosConfig);

    user.req_user_data = req_user_data
    user.login = login
    user.isAuth = true;
    temp.successAuth = true;
  } catch (error) {

    const sessionId = bp.dialog.createId(event);
    await bp.dialog.jumpTo(sessionId, event, 'error.flow.json', 'unauthorized');

    user.isAuth = false;
    temp.successAuth = false;
  }
};

return auth(args.login, args.password);
