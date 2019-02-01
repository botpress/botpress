import React, { Component } from 'react'
import { Input, Button } from 'reactstrap'
import { MdDelete, MdAdd } from 'react-icons/lib/md'
import api from '../../../api'

let childWindow

export default class CreditCardPicker extends Component {
  state = {
    selectedSource: null,
    sources: [],
    isLoading: false
  }

  componentDidMount() {
    window.onmessage = e => {
      if (e.data.action === 'getUserInfo') {
        const message = {
          action: 'updateUserInfo',
          payload: this.props.userInfo
        }

        childWindow.postMessage(message, '*')
      } else if (e.data.action === 'saveUserCard') {
        this.addSource(e.data.payload.id)
      }
    }

    this.refreshSources()
  }

  async refreshSources() {
    this.setState({ isLoading: true })
    try {
      const licensing = await api.getLicensing()
      const { data } = await licensing.get(`/me/cards`)
      this.setState({ sources: data, isLoading: false })

      if (data && data.length) {
        this.selectSource(data[0].id)
      }
    } catch (error) {
      this.setState({ error: error.message })
    }
  }

  async addSource(sourceId) {
    this.setState({ isLoading: true })
    try {
      const licensing = await api.getLicensing()
      await licensing.post(`/me/cards`, { sourceId })
      this.refreshSources()
    } catch (error) {
      this.setState({ error: error.message, isLoading: false })
    }
  }

  deleteSource = async source => {
    this.setState({ isLoading: true })
    try {
      const licensing = await api.getLicensing()
      await licensing.delete(`/me/cards/${source.target.id}`)
      this.refreshSources()
    } catch (error) {
      this.setState({ error: error.message, isLoading: false })
    }
  }

  centerPopup(url, title, w, h) {
    const y = window.outerHeight / 2 + window.screenY - h / 2
    const x = window.outerWidth / 2 + window.screenX - w / 2
    return window.open(url, title, 'toolbar=no, status=no, width=' + w + ', height=' + h + ', top=' + y + ', left=' + x)
  }

  openAddCardPopup = () => {
    childWindow = this.centerPopup(api.getStripePath(), 'Add Credit Card', 480, 200)
  }

  selectSource = selectedSource => {
    this.setState({ selectedSource })
    this.props.onCardChanged(selectedSource)
  }

  handleCardChanged = e => this.selectSource(e.target.value)

  render() {
    return (
      <div>
        <b>Credit Card</b>
        <br />
        <small>Please choose which credit card should be associated with this subscription</small>
        <div className="sourcesList">
          {this.state.sources &&
            this.state.sources.map(source => {
              const { brand, last4 } = source.card
              return (
                <div className="sourceItem" key={source.id}>
                  <Input
                    type="radio"
                    id={source.id}
                    value={source.id}
                    checked={this.state.selectedSource === source.id}
                    onChange={this.handleCardChanged}
                  />
                  <label htmlFor={source.id}>
                    {brand} ending with {last4}
                  </label>
                  <div className="deleteButton">
                    <Button
                      size="sm"
                      color="danger"
                      id={source.id}
                      onClick={this.deleteSource}
                      disabled={this.state.isLoading}
                    >
                      <MdDelete />
                      Delete
                    </Button>
                  </div>
                </div>
              )
            })}
        </div>
        <Button size="sm" color="success" onClick={this.openAddCardPopup} disabled={this.state.isLoading}>
          <MdAdd /> Add Card
        </Button>
      </div>
    )
  }
}
