import React from 'react';
// import ContentWrapper from '../Layout/ContentWrapper';
import {Grid, Row, Col, Dropdown, MenuItem} from 'react-bootstrap';

class LoginPage extends React.Component {

  render() {
    return <div>
      You need to be logged in: {(!!window.PRODUCTION).toString()}
    </div>
  }
}

export default LoginPage
