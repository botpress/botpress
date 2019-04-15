import React from 'react'

import Slider from 'react-slick'

// Added those manually to remove the font dependencies which keeps showing 404 not found
import '../../../../../../assets/slick/slick.css'
import '../../../../../../assets/slick/slick-theme.css'

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

  return (
    <Slider {...settings}>
      {elements.map((el, idx) => (
        <Card element={el} key={idx} onSendData={props.onSendData} />
      ))}
    </Slider>
  )
}

export const Card = props => {
  const { picture, title, subtitle, buttons } = props.element

  return (
    <div className={'bpw-card-container'}>
      {picture && <div className={'bpw-card-picture'} style={{ backgroundImage: `url("${picture}")` }} />}
      <div>
        <div className={'bpw-card-header'}>
          <div className={'bpw-card-title'}>{title}</div>
          {subtitle && <div className={'bpw-card-subtitle'}>{subtitle}</div>}
        </div>
        <div className={'bpw-card-buttons'}>
          {buttons.map(btn => {
            if (btn.url) {
              return (
                <a href={btn.url} key={`1-${btn.title}`} target="_blank" className={'bpw-card-action'}>
                  {btn.title || btn}
                  <i className={'bpw-card-external-icon'} />
                </a>
              )
            } else if (btn.type == 'postback' || btn.payload) {
              return (
                <a
                  href
                  onClick={props.onSendData.bind(this, { type: 'postback', payload: btn.payload })}
                  key={`2-${btn.title}`}
                  className={'bpw-card-action'}
                >
                  {btn.title || btn}
                </a>
              )
            } else if (btn.type == 'say_something' || btn.text) {
              return (
                <a
                  href
                  onClick={props.onSendData.bind(this, { type: 'say_something', text: btn.text })}
                  key={`2-${btn.title}`}
                  className={'bpw-card-action'}
                >
                  {btn.title || btn}
                </a>
              )
            } else {
              return (
                <a href="#" key={`3-${btn.title}`} target="_blank" className={'bpw-card-action'}>
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
