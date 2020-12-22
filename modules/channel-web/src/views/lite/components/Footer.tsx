import React from 'react'
import { FormattedMessage } from 'react-intl'

const Footer = () => {
  return (
    <span>
      <div className={'bpw-powered'}>
        <span>
          <FormattedMessage
            id="footer.poweredBy"
            defaultMessage="We're {icon} by {link}"
            values={{
              icon: (
                <i>
                  <svg width="7" height="13" viewBox="0 0 7 13" xmlns="http://www.w3.org/2000/svg">
                    <g fill="none" fillRule="evenodd">
                      <path
                        d="M4.127.496C4.51-.12 5.37.356 5.16 1.07L3.89 5.14H6.22c.483 0 .757.616.464 1.044l-4.338 6.34c-.407.595-1.244.082-1.01-.618L2.72 7.656H.778c-.47 0-.748-.59-.48-1.02L4.13.495z"
                        fill="#F6A623"
                      />
                      <path fill="#FEF79E" d="M4.606.867L.778 7.007h2.807l-1.7 5.126 4.337-6.34H3.16" />
                    </g>
                  </svg>
                </i>
              ),
              link: (
                <a href={'https://botpress.com'} target="_blank">
                  {'Botpress'}
                </a>
              )
            }}
          />
        </span>
      </div>
    </span>
  )
}

export default Footer
