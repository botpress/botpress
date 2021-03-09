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
  try {
    temp.authData = await apiAuthService.auth(login, password)
    user.login = login;
    temp.successAuth = true;
  } catch (e) {
    const sessionId = bp.dialog.createId(event);
    await bp.dialog.jumpTo(sessionId, event, 'error.flow.json', e.httpCode);

    temp.successAuth = false;
  }
};

return auth(args.login, args.password);
