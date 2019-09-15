// Simply write 'options' when talking with the bot to receive the drop down menu
if (event.preview === 'options') {
  const payload = {
    type: 'custom',
    module: 'custom-component',
    component: 'DropdownMenu',
    options: ['my option 1', 'option 2', 'another option']
  }

  bp.events.replyToEvent(event, [payload])
}
