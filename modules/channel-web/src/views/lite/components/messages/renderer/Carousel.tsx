import React from 'react'
import Slider from 'react-slick'

// Added those manually to remove the font dependencies which keeps showing 404 not found
import '../../../../../../assets/slick/slick-theme.css'
import '../../../../../../assets/slick/slick.css'
import { Renderer } from '../../../typings'
import { ProcessedText } from '../../../utils'

const CarouselSkeleton = () => {
  const common = { width: '100%', borderRadius: 5, padding: 10 }
  const button = { height: 30, backgroundColor: '#ecebeb', marginTop: 10, ...common }
  return (
    <div className="bpw-carousel-skeleton" style={{ height: 380, backgroundColor: '#f3f3f3', ...common }}>
      <div style={{ height: 280, backgroundColor: '#ecebeb', ...common }} />
      <div style={button} />
      <div style={button} />
    </div>
  )
}

export class Carousel extends React.Component<ICarouselProps, ICarouselState> {
  private ref

  public state = {
    adjustedWidth: 0
  }

  componentDidMount() {
    this.setState({ adjustedWidth: this.ref.offsetWidth - window.innerWidth })
    // Reset this to avoid incorrect values when closing-opening the webchat
    setTimeout(() => {
      this.setState({
        adjustedWidth: this.ref.offsetWidth - window.innerWidth
      })
    }, 300)
  }

  renderCarousel() {
    const carousel = this.props.carousel
    const elements = carousel.elements || []

    // Breakpoints must be adjusted since the carousel is based on the page width, and not its parent component
    const adjustBreakpoint = size => size - this.state.adjustedWidth

    const defaultSettings = {
      dots: false,
      infinite: false,
      responsive: [...Array(10)].map((_, i) => ({
        breakpoint: adjustBreakpoint(550 + i * 524),
        settings: { slidesToShow: i + 1 }
      })), // Carousel will be responsive for screens as width as ~5300px
      slidesToScroll: 1,
      autoplay: false,
      centerMode: false,
      arrows: elements.length > 1
    }

    const settings = Object.assign({}, defaultSettings, carousel?.settings)

    return (
      <Slider key={this.state.adjustedWidth} {...settings}>
        {elements.map((el, idx) => (
          <Card
            element={el}
            key={idx}
            onSendData={this.props.onSendData}
            escapeHTML={this.props.escapeHTML}
            isBotMessage={this.props.isBotMessage}
            intl={this.props.intl}
          />
        ))}
      </Slider>
    )
  }

  render() {
    return (
      <div ref={el => (this.ref = el)} style={{ width: '100%', ...this.props.style }}>
        {(this.state.adjustedWidth && this.renderCarousel()) || <CarouselSkeleton />}
      </div>
    )
  }
}

export const Card = props => {
  const { picture, title, subtitle, buttons, markdown } = props.element as Renderer.Card
  const { escapeHTML, intl } = props

  return (
    <div className={'bpw-card-container'}>
      {picture && <div className={'bpw-card-picture'} style={{ backgroundImage: `url("${picture}")` }} />}
      <div>
        <div className={'bpw-card-header'}>
          <ProcessedText
            wrapperProps={{
              className: 'bpw-card-title',
              tag: 'div'
            }}
            isBotMessage={props.isBotMessage}
            markdown={markdown}
            escapeHTML={escapeHTML}
          >
            {title}
          </ProcessedText>
          {subtitle && (
            <ProcessedText
              wrapperProps={{
                className: 'bpw-card-subtitle',
                tag: 'div'
              }}
              isBotMessage={props.isBotMessage}
              markdown={markdown}
              escapeHTML={escapeHTML}
              intl={props.intl}
            >
              {subtitle}
            </ProcessedText>
          )}
        </div>
        <div className={'bpw-card-buttons'}>
          {buttons.map((btn: Renderer.CardButton) => {
            if (btn.url) {
              return (
                <a
                  href={btn.url}
                  key={`1-${btn.title}`}
                  target={/^javascript:/.test(btn.url) ? '_self' : '_blank'}
                  className={'bpw-card-action'}
                >
                  {btn.title || btn}
                  {/^javascript:/.test(btn.url) ? null : <i className={'bpw-card-external-icon'} />}
                </a>
              )
            } else if (btn.type === 'postback' || btn.payload) {
              return (
                <a
                  onClick={props.onSendData?.bind(this, { type: 'postback', payload: btn.payload })}
                  key={`2-${btn.title}`}
                  className={'bpw-card-action'}
                >
                  {btn.title || btn}
                </a>
              )
            } else if (btn.type === 'say_something' || btn.text) {
              return (
                <a
                  onClick={props.onSendData?.bind(this, { type: 'say_something', text: btn.text })}
                  key={`2-${btn.title}`}
                  className={'bpw-card-action'}
                >
                  {btn.title || btn}
                </a>
              )
            } else {
              return (
                <a href={'#'} key={`3-${btn.title}`} target={'_blank'} className={'bpw-card-action'}>
                  {btn.title || btn}
                  <i className={'bpw-card-external-icon'} />
                </a>
              )
            }
          })}
        </div>
      </div>
    </div>
  )
}

interface ICarouselProps {
  carousel: Renderer.Carousel
  onSendData: any
  style?: object
  escapeHTML: boolean
  isBotMessage: boolean
  intl: any
}

interface ICarouselState {
  adjustedWidth: number
}
