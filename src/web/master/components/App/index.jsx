import React, {Component} from 'react'
import axios from 'axios'

import EventBus from './EventBus'
import routes from '../Routes'

export default class App extends Component {

  constructor(props) {
    super(props)
    // EventBus.default.setup()
    this.state = {
      modules: null,
      events: EventBus.default
    }
  }

  componentDidMount() {
    if(!this.state.modules) {
      axios.get('/api/modules')
      .then((result) => {
        this.setState({ modules: result.data })
      })
    }
  }

  render() {
    // const el = React.cloneElement(this.props.children, {
    //   skin: this.props.route.skin,
    //   modules: modules
    // })
    return routes({ modules: this.state.modules, events: this.state.events })
  }
}
