module.exports = (logger, db, botfile) => ({
  // There is no License Guard in the Open-Source / Free version
  start: () => {},
  getStatus: async () => {
    return {
      licensed: true,
      name: 'Botpress Community',
      text: null,
      status: 'Active'
    }
  },
  getFeatures: () => ({})
})
