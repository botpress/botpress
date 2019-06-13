const decodeOffsetKey = offsetKey => {
  const [blockKey, decoratorKey, leafKey] = offsetKey.split('-')
  return {
    blockKey,
    decoratorKey: parseInt(decoratorKey, 10),
    leafKey: parseInt(leafKey, 10)
  }
}

export default decodeOffsetKey
