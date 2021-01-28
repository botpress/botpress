import { ReqUserData } from '@rdcdev/dbank-client';

export interface User {
  login: string;
  userId: string;
  channel: string;
  req_user_data: ReqUserData
}
