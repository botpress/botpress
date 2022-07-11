<<<<<<<< HEAD:packages/runtime/src/runtime/nlu/nlu-client/localhost.test.ts
import { isLocalHost } from './localhost'
========
import { isLocalHost } from './is-localhost'
>>>>>>>> 985cc8194651851f39259a8fac0276dc576596fe:modules/nlu/src/backend/application/nlu-client/is-localhost.test.ts

const testcases: [string, boolean][] = [
  ['http://localhost:3200', true],
  ['https://localhost:3201', true],
  ['http://127.0.0.1:8080/aresource', true],
  ['https://0.0.0.0:8080/aresource', true],
  ['ws://localhost:8080', true],
  ['https://www.google.com', false],
  ['https://www.botpress.com/documentation', false],
  ['http://local-host:8080', false]
]

test.each(testcases)('expect isLocalHost %s to be %s', (uri: string, expected: boolean) => {
  const actual = isLocalHost(uri)
  expect(actual).toBe(expected)
})
