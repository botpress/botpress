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

  async fetchUsers(fromId) {
    this.setState({ loading: true })

    try {
      const { data } = await this.getAxios().post('/mod/audience/users', {
        from: this.state.page * LIMIT_PER_PAGE,
        limit: LIMIT_PER_PAGE
      })

      this.setState({
        loading: false,
        users: data
      })
    } catch (err) {
      this.setState({
        loading: false
      })
    }
  }

  async fetchCount() {
    const { data } = await this.getAxios().get('/mod/audience/users/count')

    this.setState({
      count: data
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
          <th>Created</th>
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
      return <span>Not tagged yet</span>
    }

    return tags.map((t, key) => {
      const isBoolean = t.value == 1 || t.value === true
      const text = isBoolean ? t.tag : `${t.tag} = ${t.value}`
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
    if (!locale && !timezone && gender === 'unknown') {
      return 'No info'
    }

    const popover = (
      <Popover id="popover-trigger-hover-focus">
        {gender !== 'unknown' && <div>{'Gender: ' + gender}</div>}
        {timezone && <div>{'Timezone: ' + timezone}</div>}
        {locale && <div>{'Locale: ' + locale}</div>}
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
      const picture_url = _.get(_.find(user.attributes, { key: 'picture_url' }), 'value')
      const first_name = _.get(_.find(user.attributes, { key: 'first_name' }), 'value')
      const last_name = _.get(_.find(user.attributes, { key: 'last_name' }), 'value')

      return (
        <tr key={key}>
          <td style={{ width: '10%' }}>{this.renderProfilePicture(picture_url)}</td>
          <td style={{ width: '24%' }}>{user.user_id}</td>
          <td style={{ width: '15%' }}>{this.renderName(first_name, last_name)}</td>
          <td style={{ width: '10%' }}>{_.upperFirst(user.channel)}</td>
          <td style={{ width: '15%' }}>{this.renderCreatedOn(user.created_at)}</td>
          <td style={{ width: '21%' }}>{this.renderTags(user.tags)}</td>
          <td style={{ width: '5%' }}>{this.renderExtra(user.attributes)}</td>
        </tr>
      )
    })
  }

  renderTable() {
    return (
      <div className={style.usersTableWrapper}>
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
      this.state.count > (this.state.page + 1) * LIMIT_PER_PAGE ? (
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
