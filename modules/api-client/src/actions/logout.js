/**
 * Logout
 *
 * @title Logout user
 * @category Auth
 */
const logout = async () => {
  user = null;
  temp = null
  const sessionId = bp.dialog.createId(event)
  await bp.dialog.jumpTo(sessionId, event, 'main.flow.json', 'entry')
};

return logout();
