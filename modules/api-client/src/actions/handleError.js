async function handleError({ bp, error, event }) {
  switch (error.status) {
    case 401: {
      const payloads = await bp.cms.renderElement(
        'builtin_text', { text: 'Sesiunea a expirat' }, event
      );
      await bp.events.replyToEvent(event, payloads);

      const sessionId = bp.dialog.createId(event);
      await bp.dialog.jumpTo(sessionId, event, 'main.flow.json', 'entry');

      break;
    }
    default:
      const payloads = await bp.cms.renderElement(
        'builtin_text', { text: 'Eroare in conexiune' }, event
      );
      await bp.events.replyToEvent(event, payloads);
  }
}

module.exports = {
  handleError
};
