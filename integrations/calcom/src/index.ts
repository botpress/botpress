import * as sdk from '@botpress/sdk'
import axios from 'axios'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async () => {
    // store discussion id in state
    // create webHook with discussionId as secret api key cal_live_4cc22129887f21ed43b46a962f15b49d
  },
  unregister: async () => {
      //remove webhook
  },
  channels: {},
  actions: {
     generateLink: async (props) => {
         const {client, input } = props;
         props.logger.debug('calcom::generateLink', input.conversationId);

         client.updateConversation({
             id: input.conversationId,
             tags: {

             }
         });

         return {
             message: 'test'
         };
     }
  },
  handler: async (props: bp.HandlerProps) => {
      const { client, req: {body} } = props;

      props.logger.debug('calcom::handler');
      let response: any;
      try {
          if(body) {
              response = JSON.parse(body);
              props.logger.debug(response);
          }

      } catch(e) {
          props.logger.debug(e);
      }

      await client.createEvent({
          type: 'eventScheduled',
          payload: {
              event: response?.event,
              conversationId: response?.conversationid
          }
      });
  },
})
