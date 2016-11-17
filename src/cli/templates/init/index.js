module.exports = function(bp) {

  bp.logger.info('Congratulations, your bot is now alive')

  bp.notif({
    level: 'success',
    message: 'First notification! ' +
      'Please check `index.js` line 5 to remove this message.'
  })

  bp.events.on('bot.click', function() {
    bp.logger.info('You clicked on me.')
  })

}
