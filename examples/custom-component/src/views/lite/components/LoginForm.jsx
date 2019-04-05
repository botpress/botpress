export class LoginForm extends React.Component {
  state = {
    username: null,
    password: null
  }

  //Your login logic would go here
  login = async () => {
    alert(`This would be sent to the configured endpoint: ${this.props.endpoint}`)

    /*
    if (this.state.username && this.state.password) {
      const result = await this.props.bp.axios.post('/mywebsite/login', { username, password })
    }
    */
  }

  sendCustomEvent = () => {
    //This will act as if the user typed 'bla bla' and pressed enter.
    this.props.onSendData({ type: 'text', text: 'bla bla' })

    //You can send any type of (valid) event using the above method.
  }

  render() {
    return (
      <div>
        Please login
        <br />
        Username: <input type="username" />
        <br />
        Password: <input type="password" />
        <button onClick={this.login}>Login</button>
        <br />
        <br />
        <button onClick={this.sendCustomEvent}>Send Custom Event</button>
      </div>
    )
  }
}
