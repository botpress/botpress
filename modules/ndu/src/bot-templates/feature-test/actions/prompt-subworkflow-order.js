  const myAction = async (name, value) => {
    bp.dialog.createVariable({ name: 'confirmationNumber', type: 'number', value: Math.random() }, event)
  }

  return myAction(args.name, args.value)