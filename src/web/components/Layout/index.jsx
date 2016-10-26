import React from 'react'

import Header from './Header'
import Sidebar from './Sidebar'

class Layout extends React.Component {

  render() {
    return (
      <div className="wrapper">
        <Sidebar>
          <Header />
          <section>{this.props.children}</section>
        </Sidebar>
      </div>
    )
  }
}

export default Layout
