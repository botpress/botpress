// Inspired by jasmineJs createSpyObject
// Credit: https://stackoverflow.com/questions/45304270/jest-createspyobj
export function createSpyObject(...methodNames) {
  const obj: any = {}

  for (let i = 0; i < methodNames.length; i++) {
    // @ts-ignore: ts-lint cannot find jest when outside of test files
    obj[methodNames[i]] = jest.fn()
  }
  return obj
}
