const axios = require('axios')
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
    const axiosConfig = await bp.http.getAxiosConfigForBot(event.botId, { localUrl: true })
    const authData = await apiAuthService.auth(login, password);
    console.log(authData);
    const res = await axios.get('/mod/clients', axiosConfig)
    console.log('clients');
    console.log(res.data);
    console.log('clients');
  } catch (e) {
    console.log(e);
  }
};

return auth(args.login, args.password);
