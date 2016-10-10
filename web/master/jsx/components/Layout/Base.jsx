import React from 'react'

import Header from './Header'
import Sidebar from './Sidebar'
import Footer from './Footer'

class Base extends React.Component {
  render() {
    return (
      <div className="wrapper">
        <Header />
        <Sidebar />
        <section>
          {this.props.children}
        </section>
        <Footer />
      </div>
    )
  }
}

export default Base
