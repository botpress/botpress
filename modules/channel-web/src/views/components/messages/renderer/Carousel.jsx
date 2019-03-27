import React from 'react'

import Slider from 'react-slick'

import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

export const Carousel = props => {
  const elements = props.carousel.elements || []
  const defaultSettings = {
    dots: false,
    infinite: false,
    responsive: [
      { breakpoint: 550, settings: { slidesToShow: 1 } },
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 1548, settings: { slidesToShow: 3 } },
      { breakpoint: 2072, settings: { slidesToShow: 4 } },
      { breakpoint: 10000, settings: 'unslick' }
    ],
    slidesToScroll: 1,
    autoplay: false,
    centerMode: false,
    arrows: elements.length > 1
  }

  const settings = Object.assign({}, defaultSettings, props.carousel.settings)

  return <Slider {...settings}>{elements.map(el => Card(el))}</Slider>
}

export const Test = () => {
  return <div className={'bpw-carousel-container'}>lo</div>
}

export const Card = element => {
  const { picture, title, subtitle, buttons } = element

  return (
    <div className={'bpw-carousel-container'}>
      {picture && <div className={'bpw-carousel-picture'} style={{ backgroundImage: `url("${picture}")` }} />}
      <div>
        <div className={'bpw-carousel-header'}>
          <div className={'bpw-carousel-title'}>{title}</div>
          {subtitle && <div className={'bpw-carousel-subtitle'}>{subtitle}</div>}
        </div>
        <div className={'bpw-carousel-buttons'}>
          {buttons.map(btn => {
            if (btn.url) {
              return (
                <a href={btn.url} key={`1-${btn.title}`} target="_blank" className={'bpw-carousel-action'}>
                  <i className={'bpw-carousel-external-icon'} />
                  {btn.title || btn}
                </a>
              )
            } else if (btn.action == 'Postback') {
              return (
                <a
                  href
                  onClick={this.props.onSendData.bind(this, { type: 'postback', data: { payload: btn.payload } })}
                  key={`2-${btn.title}`}
                  className={'bpw-carousel-action'}
                >
                  {btn.title || btn}
                </a>
              )
            } else {
              return (
                <a href="#" key={`3-${btn.title}`} target="_blank" className={'bpw-carousel-action'}>
                  <i className={'bpw-carousel-external-icon'} />
                  [NO LINK] {btn.title || btn}
                </a>
              )
            }
          })}
        </div>
      </div>
    </div>
  )
}
