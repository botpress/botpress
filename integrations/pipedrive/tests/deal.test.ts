import { expect, test } from 'vitest'
import {dealDataSchema } from "../src/entities/deal"
import {pipedriveLeadResponseSchema} from "../src/entities/lead"
import {rawDealPayload, rawLeadPayload} from "./assets/pipedrive.payload"
test('test deal entities conversion', () => {
    const parsed_payload = dealDataSchema.safeParse(JSON.parse(rawDealPayload));
    expect(parsed_payload.success).toBeTruthy
})

test('test lead entities conversion', () => {
    const parsed_payload = pipedriveLeadResponseSchema.safeParse(JSON.parse(rawLeadPayload));
    expect(parsed_payload.success).toBeTruthy
})