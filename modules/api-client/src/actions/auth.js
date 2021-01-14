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
    const res = await axios.post('/mod/users/auth', {
      req_user_data: {
        ID: ecbUser.ID,
        SessionID: authData.SessionID,
        SessionSalt: authData.SessionSalt,
        Type: ecbUser.Type,
        token: authData.token,
        CustomerID: ecbUser.Customers[1].ID,
        RoleID: ecbUser.Customers[1].RoleID,
      },
      login
    }, axiosConfig);
  } catch (e) {
  }
};

return auth(args.login, args.password);
