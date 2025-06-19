import * as bp from '.botpress'
import {PipedriveWebhookPayload} from './entities/webhooks'
import {createWebhook} from './utils'
import * as conf from './conf'
import qs from 'qs'

import { DealsApi, DealsApiAddDealRequest, LeadsApi} from "pipedrive/v2";
import * as console from "node:console";
import {getCorsHeaders} from "./cors";


const debugRequest = ({ req, logger }: bp.HandlerProps): void => {
  const { method, path, query, body } = req
  const fullPath = query ? `${path}?${query}` : path
  logger.forBot().debug(`Received webhook request: ${method} ${fullPath} ${JSON.stringify(body)}`)
}

export default new bp.Integration({
  register: async () => {
    /**
     * This is called when an integration configuration is saved.
     * You should use this handler to instantiate resources in the external service and ensure that the configuration is valid.
     */

    // DealsApi
    await createWebhook('create', 'deal', `${conf.bpWebHookUrl}/${conf.createDeal}`)
    await createWebhook('change', 'deal', `${conf.bpWebHookUrl}/${conf.changeDeal}`)
    await createWebhook('delete', 'deal', `${conf.bpWebHookUrl}/${conf.deleteDeal}`)

    // LeadsApi
    await createWebhook('create', 'lead', `${conf.bpWebHookUrl}/${conf.createLead}`)
    await createWebhook('change', 'lead', `${conf.bpWebHookUrl}/${conf.changeLead}`)
    await createWebhook('delete', 'lead', `${conf.bpWebHookUrl}/${conf.deleteLead}`)

  },
  unregister: async () => {
    /**
     * This is called when a bot removes the integration.
     * You should use this handler to instantiate resources in the external service and ensure that the configuration is valid.
     */
    // TODO: should use the deleteWebhook function to remove the webhooks; not sure how bp handle states in backend.
  },
  actions: {
    createDeal: async (props) => {
      /**
       * This is called when a bot calls the action `createDeal`.
       */
      const dealsApi = new DealsApi(conf.pipeDriveConfig)
      const addDealRequest: DealsApiAddDealRequest = {AddDealRequest: {title: props.input.title}}
      try {
        const response = await dealsApi.addDeal(addDealRequest)
        props.logger.forBot().info('Create deal') // this log will be visible by the bots that use this integration
        console.log('Deal created:', response.data)
        return {message: response.data?.title??" Deal created successfully Deal creation failed"}
      } catch (error) {
        console.error('Error creating deal:', error)
        throw error
      }
      // return { message: `Deal with title "${title}" have been added to pipedrive.` }
    },
    createLead: async (props) => {
      /**
       * This is called when a bot calls the action `createLead`.
       */
      //TODO Seems like the leadsApi does not have a method to create a lead, so we will just log the action.. Must be implemented later by hand...
      // const _ = new LeadsApi(conf.pipeDriveConfig)
      props.logger.forBot().info('Create deal NOT IMPLEMENTED YET')
      return { message: 'NOT IMPLEMENTED YET' };
    },
    changeLead: async (props) => {
        /**
         * This is called when a bot calls the action `changeLead`.
         */
        props.logger.forBot().info('Change lead NOT IMPLEMENTED YET')
        return { message: 'NOT IMPLEMENTED YET' };
    },
    changeDeal: async (props) => {
      /**
       * This is called when a bot calls the action `changeDeal`.
       */
      props.logger.forBot().info('Change deal NOT IMPLEMENTED YET')
      return { message: 'NOT IMPLEMENTED YET' };
    },
    deleteLead: async (props) => {
      /**
       * This is called when a bot calls the action `deleteLead`.
       */
      props.logger.forBot().info('Delete lead NOT IMPLEMENTED YET')
      return { message: 'NOT IMPLEMENTED YET' };
    },
    deleteDeal: async (props) => {
      /**
       * This is called when a bot calls the action `deleteDeal`.
       */
      props.logger.forBot().info('Delete deal NOT IMPLEMENTED YET')
      return { message: 'NOT IMPLEMENTED YET' };
    }

  },
  channels: {},
  handler: async (args: any) => {
    debugRequest(args)

    const corsHeaders = getCorsHeaders(args)

    if (args.req.method.toLowerCase() === 'options') {
      // preflight request
      return {
        status: 200,
        headers: corsHeaders,
      }
    }

    const { req, client, ctx } = args
    const method = req.method.toUpperCase()
    const query = req.query ? qs.parse(req.query) : {}


    let body = JSON.parse(req.body ?? '{}') as PipedriveWebhookPayload

    let parsed_query = {}
    try {
      parsed_query = query as Record<string, any>
    } catch {console.error('Error parsing query:', query)}

    const queryType: any = query["type"]
    args.logger.forBot().debug(`Received webhook request: ${query}`)
    switch (queryType) {
      case conf.createDeal:
        await client.createEvent({
          type: conf.createDeal,
          payload: {
            body,
            query: parsed_query,
            method,
            headers: req.headers as Record<string, string>,
            path: req.path,
          },
        })
        args.logger.forBot().debug(`Botpress received webhook ${conf.createDeal} from pipedrive.`)
        break
      case conf.createLead:
        await client.createEvent({
          type: conf.createLead,
          payload: {
            body,
            query: parsed_query,
            method,
            headers: req.headers as Record<string, string>,
            path: req.path,
          },
        })
        args.logger.forBot().debug(`Botpress received webhook ${conf.createLead} from pipedrive.`)
        break
      case conf.changeDeal:
        await client.createEvent({
          type: conf.changeDeal,
          payload: {
            body,
            query: parsed_query,
            method,
            headers: req.headers as Record<string, string>,
          },
        })
        args.logger.forBot().debug(`Botpress received webhook ${conf.changeDeal} from pipedrive.`)
        break
      case conf.changeLead:
        await client.createEvent({
          type: conf.changeLead,
          payload: {
            body,
            query: parsed_query,
            method,
            headers: req.headers as Record<string, string>,
          },
        })
        args.logger.forBot().debug(`Botpress received webhook ${conf.changeLead} from pipedrive.`)
        break
      case conf.deleteDeal:
        await client.createEvent({
          type: conf.deleteDeal,
          payload: {
            body,
            query: parsed_query,
            method,
            headers: req.headers as Record<string, string>,
          },
        })
        args.logger.forBot().debug(`Botpress received webhook ${conf.deleteDeal} from pipedrive.`)
        break
      case conf.deleteLead:
        await client.createEvent({
          type: conf.deleteLead,
          payload: {
            body,
            query: parsed_query,
            method,
            headers: req.headers as Record<string, string>,
          },
        })
        args.logger.forBot().debug(`Botpress received webhook ${conf.deleteLead} from pipedrive.`)
        break
      default:
        console.log("Unknown query type:", queryType)}

    return {
      status: 200,
      headers: corsHeaders,
    }

  }
})
