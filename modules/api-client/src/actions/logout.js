/**
 * Logout
 *
 * @title Logout user
 * @category Auth
 */
const logout = async () => {
  user.isAuth = false;
  temp.successAuth = false;
  const sessionId = bp.dialog.createId(event)
  await bp.dialog.jumpTo(sessionId, event, 'main.flow.json', 'entry')
};

return logout();
