export default class AuthService {
  constructor() {}

  supportsBasicLogin() {
    // TODO: make it actually detect auth mode
    return true
  }

  basicLogin(username: string, password: string, ip: string): Promise<string> {
    return Promise.resolve('NOT IMPLEMENTED')
  }
}
