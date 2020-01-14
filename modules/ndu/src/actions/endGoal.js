/**
   * Update goal
   * @title End Goal
   * @category Custom
   * @author Your_Name
   * @param {bool} success - An example string variable
   */
  const myAction = async success => {
    if (success === 'true') {
      event.state.session.nduResult = 'success'
    } else {
      event.state.session.nduResult = 'failure'
    }
  }

  return myAction(args.success)