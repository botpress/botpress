import React, { Component } from 'react'

import Slider from 'react-slick'

import style from './style.scss'

require('slick-carousel/slick/slick.css')
require('slick-carousel/slick/slick-theme.css')

export default class CarouselMessage extends Component {
  constructor(props) {
    super(props)
    this.state = { hover: false }
  }

  handleSendPostBack = (text, payload) => this.props.onSendData({ type: 'quick_reply', text, data: { payload } })

  render() {
    const CarouselElement = el => {
      return (
        <div className={style['carousel-item']}>
          {el.picture && <div className={style.picture} style={{ backgroundImage: `url("${el.picture}")` }} />}
          <div className={style.more}>
            <div className={style.info}>
              <div className={style.title}>{el.title}</div>
              {el.subtitle && <div className={style.subtitle}>{el.subtitle}</div>}
            </div>
            <div className={style.buttons}>
              {el.buttons.map(btn => {
                if (btn.url) {
                  return (
                    <a href={btn.url} target="_blank" className={style.action}>
                      <i className={style.external} />
                      {btn.title || btn}
                    </a>
                  )
                } else if (btn.payload) {
                  return (
                    <a
                      href
                      onClick={() => this.handleSendPostBack(btn.text || btn.title, btn.payload)}
                      className={style.action}
                    >
                      {btn.title || btn}
                    </a>
                  )
                } else {
                  return (
                    <a href="#" target="_blank" className={style.action}>
                      <i className={style.external} />
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

    const elements = this.props.carousel.elements || []
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

    const settings = Object.assign({}, defaultSettings, this.props.carousel.settings)

    return <Slider {...settings}>{elements.map(el => CarouselElement(el))}</Slider>
  }
}
