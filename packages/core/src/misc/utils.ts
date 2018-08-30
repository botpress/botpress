// Inspired by jasmineJs createSpyObject
// Credit: https://stackoverflow.com/questions/45304270/jest-createspyobj
export function createSpyObject(...methodNames) {
  const obj: any = {}

  for (let i = 0; i < methodNames.length; i++) {
    obj[methodNames[i]] = jest.fn()
  }
  return obj
}
