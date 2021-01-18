const { apiBranchListService } = require('@rdcdev/dbank-client');

/**
 * Branch list
 *
 * @title Get branch list
 * @category Branch list
 */
const getBranchList = async () => {
  try {
    const branches = await apiBranchListService.branchList();

    const reduced = branches.reduce(
      (acc, branch) => `${acc} Name: ${branch.Name}\n`,
      ''
    );

    const payloads = await bp.cms.renderElement(
      'builtin_text', { text: reduced }, event
    );
    await bp.events.replyToEvent(event, payloads);
  } catch (e) {
  }
};

return getBranchList();
