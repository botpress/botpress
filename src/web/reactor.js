import { Reactor } from 'nuclear-js'
import ReactDom from 'react-dom'

const reactor = new Reactor({
  debug: window.DEV_MODE
})

const oldDispatch = reactor.dispatch.bind(reactor)
reactor.dispatch = (actionType, payload) => {
  ReactDom.unstable_batchedUpdates(() => oldDispatch(actionType, payload))
}

export default reactor
