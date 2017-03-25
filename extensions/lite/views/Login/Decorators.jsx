import { Button, FormGroup, FormControl, ControlLabel, HelpBlock } from 'react-bootstrap'

const User = props => {
  return <FormControl type="text" placeholder="" value={props.value} readOnly/>
}

module.exports = { User }