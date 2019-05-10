import React from 'react'

export default class FullView extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
    this.messages = []
  }

  componentDidMount() {
    this.metadataTimer = setInterval(this.fetchMetadata.bind(this), 500)
    this.fetchMetadata()
  }

  componentWillUnmount() {
    this.unmounting = true
    clearInterval(this.metadataTimer)
  }

  fetchMetadata() {
    this.props.bp.axios.get('/mod/history/msg').then(({ data }) => {
      this.setState({ ...data })
      this.messages = data.map(d => d.msg)
    })
  }

  render() {
    return this.messages.map(m => {
      return <div>{m}</div>
    })
  }
}
