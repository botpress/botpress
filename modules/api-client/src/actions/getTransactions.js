const { apiAccountService } = require('@rdcdev/dbank-client');

/**
 * Transaction list
 *
 * @title Get transactions
 * @category Transaction list
 */
const getTransactions = async () => {
  try {
    const transaction = await apiAccountService.lastTransactions({
      ...user.req_user_data,
      ID: null
    });

    const reduced = transaction.transactions.reduce(
      (acc, { Amount }) => `${acc} Amount: ${Amount}\n`,
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

return getTransactions(args.unit);
