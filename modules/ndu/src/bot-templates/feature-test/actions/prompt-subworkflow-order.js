  /**
   * Small description of your action
   * @title The title displayed in the flow editor
   * @category Custom
   * @author Your_Name
   * @param {string} name - An example string variable
   * @param {any} value - Another Example value
   */
  const myAction = async (name, value) => {
    bp.dialog.createVariable({ name: 'confirmationNumber', type: 'number', value: Math.random() }, event)
  }

  return myAction(args.name, args.value)