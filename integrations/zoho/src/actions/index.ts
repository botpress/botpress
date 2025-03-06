import { makeApiCall } from './make-api-call'
import { createAppointment } from './create-appointment'
import { deleteAppointment } from './delete-appointment'
import { deleteRecord } from './delete-record'
import { getAppointmentById } from './get-appointment-by-id'
import { getAppointments } from './get-appointments'
import { getFile } from './get-file'
import { getOrganizationDetails } from './get-organization-details'
import { getRecordById } from './get-record-by-id'
import { getRecords } from './get-records'
import { getUsers } from './get-users'
import { insertRecord } from './insert-record'
import { searchRecords } from './search-records'
import { sendMail } from './send-email'
import { updateAppointment } from './update-appointment'
import { updateRecord } from './update-record'
import { uploadFile } from './upload-file'
import * as bp from '.botpress'

export default {
  makeApiCall,
  deleteRecord,
  getRecordById,
  getRecords,
  insertRecord,
  searchRecords,
  updateRecord,
  getOrganizationDetails,
  getUsers,
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  sendMail,
  getFile,
  uploadFile
} satisfies bp.IntegrationProps['actions']
