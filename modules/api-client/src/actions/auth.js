const { apiAuthService } = require('@rdcdev/dbank-client');

/**
 * Auth user
 *
 * @title Set user
 * @category Auth
 * @param {string} login The login of the ecb user
 * @param {string} password The password of the ecb user
 */
const auth = async (login, password) => {
  const authData = await apiAuthService.auth(login, password);
  console.log(authData);
};

return auth(args.login, args.password);
