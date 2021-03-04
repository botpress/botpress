const { apiExchangeService } = require('@rdcdev/dbank-client');
const moment = require('moment');

/**
 * Exchange
 *
 * @title Get exchanges
 * @param {string} rateType the type of banc
 * @category Exchange
 */
const getExchanges = async (rateType) => {
  try {
    const exchange = (await apiExchangeService.exchange({
      // rateDate: moment().format('DD/MM/YYYY'),
      rateDate: '17/01/2021',
      customerId: user.req_user_data.CustomerID
    }))
      .filter(({RateType}) => RateType === +rateType)

    if (!exchange.length) {
      const sessionId = bp.dialog.createId(event);
      await bp.dialog.jumpTo(sessionId, event, 'error.flow.json', 400);
    }

    const reduced = exchange.reduce(
      (acc, itm) => `${acc} Buy: ${itm.RateBuy}\n`,
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

return getExchanges(args.rateType);
