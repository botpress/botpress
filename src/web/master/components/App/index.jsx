import React, {Component} from 'react'

import EventBus from './EventBus'
import routes from '../Routes'

export default class App extends Component {

  constructor(props) {
    super(props)
    // EventBus.default.setup()
    this.state = {
      skin: {
        events: EventBus.default
      }
    }
  }

  render() {
    return routes()
  }
}
