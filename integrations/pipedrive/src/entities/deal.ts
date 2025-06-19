import { z } from 'zod/v4';

// Helper to get current date in ISO format
const getCurrentDate = () => new Date().toISOString();

// Custom fields are dynamic, so we'll use record
// const customFieldsSchema = z.record(z.unknown()).default({});

// Define the deal data schema
const dealDataSchema = z.object({
    id: z.number().default(0),
    title: z.string().default("n/a"),
    creator_user_id: z.number().default(0),
    owner_id: z.number().default(0),
    value: z.number().default(0),
    person_id: z.number().default(0),
    org_id: z.number().default(0),
    stage_id: z.number().default(0),
    pipeline_id: z.number().default(0),
    currency: z.string().default("n/a"),
    archive_time: z.string().default("n/a"),
    add_time: z.string().default("n/a"),
    update_time: z.string().default("n/a"),
    stage_change_time: z.string().default("n/a"),
    status: z.string().default("n/a"),
    is_archived: z.boolean().default(false),
    is_deleted: z.boolean().default(false),
    probability: z.number().default(0),
    lost_reason: z.string().default("n/a"),
    visible_to: z.number().default(0),
    close_time: z.string().default("n/a"),
    won_time: z.string().default("n/a"),
    lost_time: z.string().default("n/a"),
    local_won_date: z.string().default("n/a"),
    local_lost_date: z.string().default("n/a"),
    local_close_date: z.string().default("n/a"),
    expected_close_date: z.string().default("n/a"),
    label_ids: z.array(z.number()).default([]),
    origin: z.string().default("n/a"),
    origin_id: z.string().nullable().default(null),
    channel: z.number().default(0),
    channel_id: z.string().default("n/a"),
    acv: z.number().default(0),
    arr: z.number().default(0),
    mrr: z.number().default(0),
    // custom_fields: customFieldsSchema
});

// Define the complete response schema
const dealResponseSchema = z.object({
    success: z.boolean().default(false),
    data: dealDataSchema
});

// export dealDataSchema
export { dealDataSchema, dealResponseSchema};
