import React from 'react'

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
      window.setTimeout(() => {
        this.setState({ modules: [{ name: 'skin-messenger', menuText: 'Messenger', menuIcon: 'icon-social-facebook' }] })
      }, 2000)
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
