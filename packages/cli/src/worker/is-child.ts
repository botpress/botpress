export const CHILD_ENV_KEY = 'IS_CHILD'
export const CHILD_ENV_VALUE = 'true'

export type MainProcessProps = {
  type: 'main'
  pid: number
}
export type ChildProcessProps = {
  type: 'child'
  sendMessage: (message: string) => void
  pid: number
}

export type ProcessProps = MainProcessProps | ChildProcessProps

const getProcessProps = (): ProcessProps => {
  const type = process.env[CHILD_ENV_KEY] === CHILD_ENV_VALUE ? 'child' : 'main'
  if (type === 'main') {
    return {
      type,
      pid: process.pid,
    }
  }

  if (!process.send) {
    throw new Error(`Please do not use variable ${CHILD_ENV_KEY} manually`)
  }

  return {
    type,
    sendMessage: process.send,
    pid: process.pid,
  }
}

export const processProps = getProcessProps()
export const isChildProcess = processProps.type === 'child'
