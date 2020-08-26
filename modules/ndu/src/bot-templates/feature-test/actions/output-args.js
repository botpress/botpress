  /**
   * Small description of your action
   * @title The title displayed in the flow editor
   * @category Custom
   * @author Your_Name
   * @param {string} name - An example string variable
   * @param {any} value - Another Example value
   */
  const myAction = async (name, value) => {
    bp.logger.attachEvent(event).info(args)
    console.log(args)
  }

  return myAction(args.name, args.value)