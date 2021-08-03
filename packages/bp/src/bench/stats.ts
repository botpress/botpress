import os from 'os'
interface ResponseCode {
  [key: string]: number
}

export class Stats {
  public minLatency: number | undefined
  public maxLatency: number | undefined
  public overSlaCount: number = 0
  public messagesCount: number = 0
  private totalLatency: number = 0
  private startTime: number
  private responseCodes: ResponseCode = {}
  private slaLimit: number
  private slaTarget: number

  constructor(slaLimit: number, slaTarget: number) {
    this.startTime = Date.now()
    this.slaLimit = slaLimit
    this.slaTarget = slaTarget
  }

  clear() {
    this.startTime = Date.now()
    this.minLatency = undefined
    this.maxLatency = undefined
    this.totalLatency = 0
    this.messagesCount = 0
    this.overSlaCount = 0
    this.responseCodes = {}
  }

  logSentMessage(status: string, latency: number) {
    if (!this.minLatency || latency < this.minLatency) {
      this.minLatency = latency
    }

    if (!this.maxLatency || latency > this.maxLatency) {
      this.maxLatency = latency
    }

    if (latency >= this.slaLimit) {
      this.overSlaCount++
    }

    if (this.responseCodes[status]) {
      this.responseCodes[status]++
    } else {
      this.responseCodes[status] = 1
    }

    this.totalLatency += latency
    this.messagesCount++
  }

  isSlaBreached() {
    return this.slaTarget + this.getPctOverSla() > 100
  }

  getAverageLatency() {
    return Math.round(this.totalLatency / this.messagesCount)
  }

  getPctOverSla() {
    return this.round((this.overSlaCount / this.messagesCount) * 100)
  }

  getElapsedSeconds() {
    return this.round((Date.now() - this.startTime) / 1000)
  }

  calculateMps() {
    return this.round(this.messagesCount / this.getElapsedSeconds())
  }

  round(number: number): number {
    return Number(number.toFixed(2))
  }

  getCodesSummary(): string {
    let responseCodes = ''
    for (const code in this.responseCodes) {
      responseCodes += `${code}: ${this.responseCodes[code]}${os.EOL}`
    }
    return responseCodes
  }
}
