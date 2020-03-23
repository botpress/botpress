const legacyAction = `
  /**
   * Small description of your action
   * @title The title displayed in the flow editor
   * @category Custom
   * @author Your_Name
   * @param {string} name - An example string variable
   * @param {any} value - Another Example value
   */
  const myAction = async (name, value) => {\n    \n    \n  }

  return myAction(args.name, args.value)
`

const httpAction = `
  /**
   * Small description of your action
   * @title The title displayed in the flow editor
   * @category Custom
   * @author Your_Name
   * @param {string} name - An example string variable
   * @param {number} value - Another Example value
   */
  const myAction = async (name, value) => {\n    \n    \n  }

  return myAction(args.name, args.value)
`

const baseHook = `
  async function hook() {\n    \n    \n  }

  return hook()
`

export { legacyAction, httpAction, baseHook }
