import previousMigration from './v12_10_8-1600900478-add_thread_id_column_to_session_table'
// This is the exact same migration as modules/hitl/src/migrations/v12_10_8-1600900478-add_thread_id_column_to_session_table.ts.
// This will be useful for clients that upgrade to 12.13.0 and are missing the thread_id column, but don't want to add the column manually by connecting to their database.
// See https://github.com/botpress/v12/pull/4181 for more information
export default previousMigration
