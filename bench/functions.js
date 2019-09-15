let testId = null

exports.setupTestId = function setupTestId(context, events, done) {
  if (!testId) {
    testId = Math.random()
      .toString(16)
      .substr(2)
  }
  context.vars['testId'] = testId
  return done()
}
