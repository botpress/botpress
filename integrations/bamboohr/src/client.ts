import axios, { AxiosInstance } from 'axios'

export class BambooHRClient {
  axios: AxiosInstance

  constructor({ apiKey, subdomain }: { apiKey: string; subdomain: string }) {
    this.axios = axios.create({
      baseURL: `https://api.bamboohr.com/api/gateway.php/${subdomain}/v1/`,
      headers: {
        accept: 'application/json',
      },
      auth: {
        username: apiKey,
        password: 'x',
      },
    })
  }

  async getEmployee(id: string) {
    const { data } = await this.axios.get(`employees/${id}?fields=firstName,lastName,SupervisorID`)
    return data
  }

  async getEmployees() {
    const { data } = await this.axios.get('employees/directory')
    console.log(data)
    return data
  }
}
