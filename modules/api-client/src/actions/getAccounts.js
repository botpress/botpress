const { apiAccountService, AccountType } = require('@rdcdev/dbank-client');

/**
 * Account list
 *
 * @title Get accounts
 * @category Account list
 */
const getAccounts = async () => {
  try {
    const accounts = await apiAccountService.accounts({ ...user.req_user_data, ID: null }, AccountType.Account);

    const reduced = accounts.reduce(
      (acc, account) => `${acc} CODE: ${account.Code} " ${account.Currency} ${account.Available} " \n`,
      ''
    );

    const payloads = await bp.cms.renderElement(
      'builtin_text', { text: reduced }, event
    );
    await bp.events.replyToEvent(event, payloads);
  } catch (e) {
    const sessionId = bp.dialog.createId(event);
    await bp.dialog.jumpTo(sessionId, event, 'error.flow.json', e.httpCode);
  }
};

return getAccounts();
