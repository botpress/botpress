import React from 'react'
import _ from 'lodash'

import {
  Grid,
  Row,
  Col,
  ListGroup,
  ButtonToolbar,
  ButtonGroup,
  Button,
  Badge,
  OverlayTrigger,
  Tooltip
} from 'react-bootstrap'

import classnames from 'classnames'

import Previous from './previous'
import Upcoming from './upcoming'
import CreateModal from './create'

import style from './style.scss'

const api = route => '/mod/scheduler/' + route

export default class SchedulerModule extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: true,
      upcoming: [],
      previous: [],
      showCreate: false,
      active: 'Upcoming'
    }
  }

  componentDidMount() {
    this.fetchAll().then(() => {
      this.setState({ loading: false })
    })

    this.props.bp.events.on('scheduler.update', ::this.fetchAll)
  }

  componentWillUnmount() {
    this.props.bp.events.off('scheduler.update', ::this.fetchAll)
  }

  fetchAll() {
    return this.fetchUpcoming().then(() => this.fetchPrevious())
  }

  fetchUpcoming() {
    return this.props.bp.axios.get(api('schedules/upcoming')).then(({ data }) => {
      this.setState({ upcoming: data })
    })
  }

  fetchPrevious() {
    return this.props.bp.axios.get(api('schedules/past')).then(({ data }) => {
      this.setState({ previous: data })
    })
  }

  setActive(view) {
    return () => this.setState({ active: view })
  }

  trashAllDone() {
    this.props.bp.axios.delete(api('done'))
  }

  renderUpcoming() {
    const axios = this.props.bp.axios
    const elements = this.state.upcoming.map((el, i) => <Upcoming key={i} task={el} axios={axios} />)

    const contain =
      this.state.upcoming.length === 0 ? (
        <div className={style.emptyText}>There are no upcoming tasks</div>
      ) : (
        <ListGroup>{elements}</ListGroup>
      )

    return (
      <div>
        <div className={style.sectionHeader}>
          <h4>
            {'Upcoming'}
            <Badge className={style.historyBadge}>
              <p>{this.state.upcoming.length}</p>
            </Badge>
          </h4>
          {this.renderCreateButton()}
        </div>
        <div className={style.historyContain}>{contain}</div>
      </div>
    )
  }

  renderPrevious() {
    const sortedElements = _.orderBy(this.state.previous, ['scheduledOn'], ['desc'])
    const elements = sortedElements.map((el, i) => <Previous key={i} task={el} />)

    const contain =
      this.state.previous.length === 0 ? (
        <div className={style.emptyText}>There are no previously run tasks</div>
      ) : (
        <ListGroup>{elements}</ListGroup>
      )

    const tooltip = <Tooltip id="tooltip">Trash all</Tooltip>

    return (
      <div>
        <div className={style.sectionHeader}>
          <h4>
            {'History'}
            <Badge className={style.historyBadge}>
              <p>{this.state.previous.length}</p>
            </Badge>
          </h4>

          <OverlayTrigger placement="top" overlay={tooltip}>
            <a className={style.trashAll} href="#" onClick={::this.trashAllDone}>
              <i className="material-icons">delete</i>
            </a>
          </OverlayTrigger>
        </div>
        <div className={style.historyContain}>{contain}</div>
      </div>
    )
  }

  renderLoading() {
    return <h1>Loading...</h1>
  }

  renderCreateButton() {
    const click = () => this.createModal.show()
    return (
      <Button bsStyle="primary" onClick={click}>
        Create
      </Button>
    )
  }

  render() {
    if (this.state.loading) {
      return this.renderLoading()
    }

    return (
      <div className={style.mainContainer}>
        <Grid>
          <Row>
            <Col md={8}>{this.renderUpcoming()}</Col>
            <Col md={4}>{this.renderPrevious()}</Col>
          </Row>
        </Grid>
        <CreateModal ref={r => (this.createModal = r)} axios={this.props.bp.axios} />
      </div>
    )
  }
}
