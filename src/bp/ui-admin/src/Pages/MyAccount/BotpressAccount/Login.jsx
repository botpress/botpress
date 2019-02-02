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
              <p>
                Login to your botpress account to buy and manage license keys. License keys are necessary to enable
                Professionnal Edition features like role-based access management, cluster deployement & more. For more
                information head to <a href="https://botpress.io/pricing">our website</a>
              </p>
            </Col>
          </Row>
          <Row>
            <Col style={{ textAlign: 'center' }}>
              <Button onClick={this.toggleLoginModal} color="primary" size="sm">
                Login to botpress
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
