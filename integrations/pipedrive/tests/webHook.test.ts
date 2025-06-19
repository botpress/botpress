import {bpWebHookUrl} from '../src/conf';
import { expect, test} from 'vitest'
import {createWebhook, deleteWebhook} from '../src/utils';
import {dealResponseSchema} from '../src/entities/deal';
import {deleteHookResSchemaType} from "../src/entities/webhooks";



test('create hook', async ()  => {
    const create_res = await createWebhook('create', 'deal', `${bpWebHookUrl}/createDeal`)
    const parsed_payload = dealResponseSchema.parse(create_res);
    expect(parsed_payload.success).toBeTruthy();
    const delete_res: deleteHookResSchemaType = await deleteWebhook(parsed_payload.data.id.toString())
    console.log(delete_res)
})