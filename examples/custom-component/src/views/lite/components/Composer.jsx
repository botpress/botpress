// This component is an example on how to replace the composer input of the web chat (text input)
export class Composer extends React.Component {
  render() {
    /**
     * We are re-using styling and the original input component. You can use part of existing props or replace all of them.
     * Check out the code of 'channel-web' on the link below to see how the this.props methods are handled.
     * https://github.com/botpress/botpress/blob/master/modules/channel-web/src/views/web/side/index.jsx
     */
    const { style, Input } = this.props.original

    return (
      <div className={style.composer}>
        <div className={style['flex-column']}>
          <Input
            placeholder={'Reply to some bot name (or this.props.name)'}
            send={this.props.onTextSend}
            change={this.props.onTextChanged}
            text={this.props.text}
            recallHistory={this.props.recallHistory}
            config={this.props.config}
          />
        </div>
      </div>
    )
  }
}
