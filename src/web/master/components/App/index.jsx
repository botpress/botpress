import React, {Component} from 'react'
import axios from 'axios'
import {
  Provider,
  connect,
  nuclearMixin
} from 'nuclear-js-react-addons'

import EventBus from './EventBus'
import routes from '../Routes'

import reactor from '~/reactor'
import ModulesStore from '~/stores/ModulesStore'
import actions from '~/actions'

export default class App extends Component {

  constructor(props) {
    super(props)

    reactor.registerStores({
      'modules': ModulesStore
    })
  }

  componentDidMount() {
    actions.fetchModules()
  }

  render() {
    // const el = React.cloneElement(this.props.children, {
    //   skin: this.props.route.skin,
    //   modules: modules
    // })
    return <Provider reactor={reactor}>
      {routes()}
    </Provider>
  }
}
