import React from 'react'

import Header from './Header'
import Sidebar from './Sidebar'

class Layout extends React.Component {

  render() {
    // const { modules } = this.state
    const modules = this.props.route.skin

    return (
      <div className="wrapper">
        {/* <Header skin={this.props.route.skin} /> */}
        <Sidebar modules={modules}>
          <Header />
          <section>{this.props.children}</section>
        </Sidebar>
      </div>
    )
  }
}

export default Layout
