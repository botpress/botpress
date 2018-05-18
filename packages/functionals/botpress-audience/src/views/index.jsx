import React from 'react'
import { Label, Col, Panel, Table, Button, Glyphicon, Popover, OverlayTrigger, Pager } from 'react-bootstrap'

import _ from 'lodash'
import moment from 'moment'

import style from './style.scss'

const LIMIT_PER_PAGE = 50
const INTERVAL_FETCH_COUNT = 60000 // 1min

export default class AudienceModule extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      loading: true,
      page: 0
    }

    this.fetchCount = this.fetchCount.bind(this)
    this.timer = null
  }

  getAxios() {
    return this.props.bp.axios
  }

  componentDidMount() {
    this.fetchUsers()
    this.fetchCount()
    this.timer = setInterval(() => {
      this.fetchCount()
    }, INTERVAL_FETCH_COUNT)
  }

  componentWillUnmount() {
    clearInterval(this.timer)
  }

  fetchUsers(fromId) {
    this.setState({ loading: true })

    this.getAxios()
      .post('/api/botpress-audience/users', {
        from: this.state.page * LIMIT_PER_PAGE,
        limit: LIMIT_PER_PAGE
      })
      .then(res => {
        this.setState({
          loading: false,
          users: res.data
        })
      })
      .catch(err => {
        this.setState({
          loading: false
        })
      })
  }

  fetchCount() {
    this.getAxios()
      .get('/api/botpress-audience/users/count')
      .then(res => {
        this.setState({
          count: res.data
        })
      })
  }

  handlePreviousClicked() {
    this.setState(
      {
        page: Math.max(0, this.state.page - 1)
      },
      () => this.fetchUsers()
    )
  }

  handleNextClicked() {
    this.setState(
      {
        page: this.state.page + 1
      },
      () => this.fetchUsers()
    )
  }

  renderTableHeader() {
    return (
      <thead>
        <tr>
          <th>Avatar</th>
          <th>ID</th>
          <th>Name</th>
          <th>Platform</th>
          <th>Created on</th>
          <th>Tags</th>
          <th>Information</th>
        </tr>
      </thead>
    )
  }

  renderName(firstName, lastName) {
    const name = firstName + ' ' + lastName
    return <span>{name}</span>
  }

  renderCreatedOn(date) {
    const calendar = moment(date, 'YYYY-MM-DD HH:mm').calendar()
    return <span>{calendar}</span>
  }

  renderTags(tags) {
    if (_.isEmpty(tags)) {
      return <span>Not tagged yet...</span>
    }

    return tags.map((t, key) => {
      const isBoolean = t.value == 1 || t.value === true
      const text = isBoolean ? t.tag : t.tag + ' = ' + t.value
      return (
        <Label className={style.tag} key={key}>
          {text}
        </Label>
      )
    })
  }

  renderProfilePicture(url) {
    let picture = null
    if (!url) {
      picture = <Glyphicon glyph="user" />
    } else {
      picture = <img src={url} alt="Profile picture" />
    }

    return <div className={style.image}>{picture}</div>
  }

  renderExtra({ locale, timezone, gender }) {
    const popover = (
      <Popover id="popover-trigger-hover-focus">
        <div>{'Gender: ' + gender}</div>
        <div>{'Timezone: ' + timezone}</div>
        <div>{'Locale: ' + locale}</div>
      </Popover>
    )

    return (
      <OverlayTrigger trigger={['hover', 'focus']} placement="left" overlay={popover}>
        <a>Additional information</a>
      </OverlayTrigger>
    )
  }

  renderUsers(users) {
    return _.mapValues(users, (user, key) => {
      return (
        <tr key={key}>
          <td style={{ width: '10%' }}>{this.renderProfilePicture(user.picture_url)}</td>
          <td style={{ width: '22%' }}>{user.id}</td>
          <td style={{ width: '15%' }}>{this.renderName(user.first_name, user.last_name)}</td>
          <td style={{ width: '10%' }}>{_.upperFirst(user.platform)}</td>
          <td style={{ width: '15%' }}>{this.renderCreatedOn(user.created_on)}</td>
          <td style={{ width: '23%' }}>{this.renderTags(user.tags)}</td>
          <td style={{ width: '5%' }}>{this.renderExtra(user)}</td>
        </tr>
      )
    })
  }

  renderTable() {
    return (
      <div>
        <Table striped bordered condensed hover className={style.usersTable}>
          {this.renderTableHeader()}
          <tbody>{_.values(this.renderUsers(this.state.users))}</tbody>
        </Table>
      </div>
    )
  }

  renderEmptyMessage() {
    return (
      <div className={style.emptyMessage}>
        <h5>No more row in your database of users...</h5>
      </div>
    )
  }

  renderPagination() {
    const previous =
      this.state.page > 0 ? (
        <Pager.Item previous onClick={::this.handlePreviousClicked}>
          &larr; Previous
        </Pager.Item>
      ) : null

    const next =
      this.state.count > this.state.page * LIMIT_PER_PAGE ? (
        <Pager.Item next onClick={::this.handleNextClicked}>
          Next &rarr;
        </Pager.Item>
      ) : null

    return (
      <Pager>
        {previous}
        {next}
      </Pager>
    )
  }

  renderCount() {
    const text = this.state.count > 1 ? this.state.count + ' users' : this.state.count + ' user'

    return <div className={style.count}>Total: {text}</div>
  }

  renderAllContent() {
    return (
      <Col md={12}>
        <Panel>
          <Panel.Body>
            {this.renderCount()}
            {_.isEmpty(this.state.users) ? this.renderEmptyMessage() : this.renderTable()}
            {this.renderPagination()}
          </Panel.Body>
        </Panel>
      </Col>
    )
  }

  render() {
    return this.state.loading ? null : this.renderAllContent()
  }
}
