import React from "react";
import DatePicker from "react-datepicker";
import { Col, Grid, Row, Button, FormControl } from 'react-bootstrap';

import "react-datepicker/dist/react-datepicker.css";
import "./style.css";

export default class Filter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      startDateBegin: new Date(),
      startDateEnd: new Date(),
      showAll: false,
      valid: true
    };
    this.handleChangeBegin = this.handleChangeBegin.bind(this);
    this.handleChangeEnd = this.handleChangeEnd.bind(this);
  }

  componentDidMount() {
    this.props.parent.setState({ dateBegin: this.getISODate(this.state.startDateBegin), dateEnd: this.getISODate(this.state.startDateEnd), showAll: false })
  }

  isValid(callback) {
    if (Math.floor(this.state.startDateBegin.getTime() / 1000) > Math.floor(this.state.startDateEnd.getTime() / 1000)) {
      this.setState({
        valid: false
      }, callback);
    } else {
      this.setState({
        valid: true
      }, callback);
    }
  }

  handleChangeBegin(date) {
    this.props.onChange()
    this.setState({
      startDateBegin: date
    }, () => {
      this.isValid(() => {
        this.props.parent.setState({ dateBegin: this.getISODate(date) })
      })
    });
  }

  handleChangeEnd(date) {
    this.props.onChange()
    this.setState({
      startDateEnd: date
    }, () => {
      this.isValid(() => {
        this.props.parent.setState({ dateEnd: this.getISODate(date) })
      })
    });
  }

  getISODate(date) {
    return date.toISOString().substring(0, 10)
  }

  clickShowAll() {
    this.props.onChange()
    this.setState({ showAll: !this.state.showAll }, () => {
      this.props.parent.setState({ showAll: this.state.showAll })
    });
  }

  render() {
    return (
      <Grid style={{ paddingTop: "10px" }}>
        <label>Show all records: </label>
        <input defaultChecked={this.state.showAll} onClick={this.clickShowAll.bind(this)} style={{ marginLeft: "10px" }} type="checkbox" />
        <Row className="show-grid">
          <Col xs={12} md={12}>
            <label>From :</label>
            <DatePicker
              disabled={this.state.showAll}
              selected={this.state.startDateBegin}
              onChange={this.handleChangeBegin}
            />
            <label>To :</label>
            <DatePicker
              disabled={this.state.showAll}
              style={{ marginLeft: "10px" }}
              selected={this.state.startDateEnd}
              onChange={this.handleChangeEnd}
            />
            <Button disabled={!this.state.valid} style={{ marginLeft: "10px" }} bsStyle="primary"
              onClick={() => { this.props.onClick(this.getISODate(this.state.startDateBegin), this.getISODate(this.state.startDateEnd), this.state.showAll) }}>Search</Button>
          </Col>
        </Row>
      </Grid>
    );
  }
}