const { apiAccountService } = require('@rdcdev/dbank-client');

const moment = require('moment');

const DATE_FORMAT = 'YYYYMMDD';

/**
 * Transaction list
 *
 * @title Get transactions
 * @param {string} unit The unit of the date
 * @category Transaction list
 */
const getTransactions = async (unit) => {
  try {
    const transactions = await apiAccountService.transactions({
      ...user.req_user_data,
      FromDate: prepareData(unit),
      ToDate: moment().format(DATE_FORMAT),
      ID: null,
    });

    const reduced = transactions.reduce(
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

/**
 * @title Prepare data
 * @param {string} unit The unit of the date
 */
function prepareData(unit) {
  const date = (unit === 'today')
    ? moment()
    : moment().subtract(1, unit);

  return date.format(DATE_FORMAT);
}

return getTransactions(args.unit);
