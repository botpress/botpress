module.exports = function(skin) {

  skin.logger.info('Congratulations, your bot is now alive')

  skin.notif({
    level: 'success',
    message: 'First notification! ' +
      'Please check `index.js` line 5 to remove this message.'
  })

  skin.events.on('bot.click', function() {
    skin.logger.info('You clicked on me.')
  })

}
