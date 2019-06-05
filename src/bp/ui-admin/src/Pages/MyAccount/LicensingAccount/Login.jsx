import React, { Component, Fragment } from 'react'
import { Row, Jumbotron, Col, Button } from 'reactstrap'
import LoginModal from './LoginModal'

class Login extends Component {
  state = {
    loginModalOpen: false
  }

  toggleLoginModal = () => {
    this.setState({ loginModalOpen: !this.state.loginModalOpen })
  }

  render() {
    return (
      <Fragment>
        <Jumbotron>
          <Row>
            <Col style={{ textAlign: 'center' }} sm="12" md={{ size: 10, offset: 1 }}>
              <h2>Botpress Licensing</h2>
              <p>
                To buy and manage license keys, you need to login to your botpress licensing account. If you don't have
                a licensing account, just hit the login button below, it'll create the account for you.
              </p>
              <p>
                License keys are necessary to enable Professionnal Edition features like role-based access management,
                cluster deployement & more. For more information head to{' '}
                <a href="https://botpress.io/pricing">botpress website</a>
              </p>
            </Col>
          </Row>
          <Row>
            <Col style={{ textAlign: 'center' }}>
              <Button onClick={this.toggleLoginModal} color="primary">
                Login to licensing
              </Button>
            </Col>
          </Row>
        </Jumbotron>
        <LoginModal isOpen={this.state.loginModalOpen} toggle={this.toggleLoginModal} />
      </Fragment>
    )
  }
}

export default Login
