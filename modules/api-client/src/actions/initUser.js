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

    const user = await axios.get(`/mod/users/dv0001`, axiosConfig)

    const ecbUser = await apiUserService.user(user.data.req_user_data);

    user.isAuth = true;
  } catch (error) {
    const { handleError } = require('handleError')
    handleError({ bp, error, event });
    user.isAuth = false;
  }
};

return initUser();
