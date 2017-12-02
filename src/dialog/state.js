module.exports = () => {

  const __state = {}

  async function getState(stateId) {
    let state = __state[stateId]
    if (!state) {
      state = __state[stateId] = {}
    }

    return state
  }

  async function setState(stateId, state) {
    return __state[stateId] = state
  }

  async function clearState(stateId) {
    delete __state[stateId]
  }

  return {
    getState, setState, clearState
  }

}
