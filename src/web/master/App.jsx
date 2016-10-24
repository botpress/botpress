import React from 'react'
import ReactDOM from 'react-dom'
import { Button } from 'react-bootstrap'

require("bootstrap/dist/css/bootstrap.css")
const style = require('./App.scss')

ReactDOM.render(<div>
  <button type="button" className="btn btn-default" aria-label="Left Align">
    <span className="glyphicon glyphicon-align-left" aria-hidden="true"></span>
  </button>
</div>, document.getElementById('app'))
