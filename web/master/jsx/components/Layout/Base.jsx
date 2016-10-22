import React from 'react'
import axios from 'axios'

import Header from './Header'
import Sidebar from './Sidebar'

class Base extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      modules: null
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
    const { modules } = this.state
    const el = React.cloneElement(this.props.children, {
      skin: this.props.route.skin,
      modules: modules
    })

    return (
      <div className="wrapper">
        <Header skin={this.props.route.skin} />
        <Sidebar modules={modules} />
        <section>{el}</section>
      </div>
    )
  }
}

export default Base
