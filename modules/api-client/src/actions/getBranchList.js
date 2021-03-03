const { apiBranchListService } = require('@rdcdev/dbank-client');

/**
 * Branch list
 *
 * @title Get branch list
 * @category Branch list
 */
const getBranchList = async () => {
  try {
    const branches = await apiBranchListService.branches();

    const reduced = branches.reduce(
      (acc, branch) => `${acc} Name: ${branch.Name}\n`,
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

return getBranchList();
