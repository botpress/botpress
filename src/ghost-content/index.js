module.exports = async ({ logger, db, projectLocation }) => {
  logger.info('Ghost Content Manager initialized')

  const addFolder = async folder => {}

  const recordVersion = async (folder, file, content) => {}

  return {
    addFolder,
    recordVersion
  }
}
