	const myAction = async (name, value) => {
	  bp.logger.attachEvent(event).warn('It will fail!')
	  bp.dialog.jumpTo('', event, 'someflow', 'do_not_existed')
	}

	return myAction(args.name, args.value)