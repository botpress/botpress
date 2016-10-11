import React from 'react'
import axios from 'axios'

import Header from './Header'
import Sidebar from './Sidebar'
import Footer from './Footer'

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

    return (
      <div className="wrapper">
        <Header />
        <Sidebar modules={modules} />
        <section>
          {this.props.children}
        </section>
        <Footer />
      </div>
    )
  }
}

export default Base
