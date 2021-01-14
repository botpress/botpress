import { ReqUserData } from '@rdcdev/dbank-client';

export interface User {
  login: string;
  req_user_data: ReqUserData
}
