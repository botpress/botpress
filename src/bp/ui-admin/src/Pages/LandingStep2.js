import React, { Component } from 'react'

class LandingStep2 extends Component {
  render() {
    return (
      <div className="landing">
        {/* TODO display the username in the H2 */}
        <h2>Hey {this.props.userName}</h2>
        <p>
          Now that you've completed your profile,{' '}
          <span className="is-block">it's time to go in the teams section.</span> We have already created a team for
          you!
        </p>
        {/* TODO make sure I link the href the correct way */}
        <a class="btn btn-primary" href={`/admin/teams`}>
          Go to the teams section
        </a>
      </div>
    )
  }
}

export default LandingStep2
