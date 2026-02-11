import * as bp from '.botpress'

export const channels = {
  channel: {
    messages: {
      text: async (props) => {
        props.logger.info('Text Channel is NOT Implemented yet')
      },
      video: async (props) => {
        props.logger.info('Video Channel is NOT Implemented yet')
      },
      image: async (props) => {
        props.logger.info('Image Channel is NOT Implemented yet')
      },
    },
  },
} satisfies bp.IntegrationProps['channels']
