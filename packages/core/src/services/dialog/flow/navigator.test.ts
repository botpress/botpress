describe('Flow Navigator', () => {
  beforeEach(() => {
    dialogEngine = new TestDialogEngine(instructionProcessor, flowService, sessionService)
    session = stubSession()
    flowService.loadAll.mockReturnValue(flows)
    dialogEngine.loadFlowsForBot()
  })

  it('Assign current node as the next node in the current flow', async () => {
    await dialogEngine.transitionToNode('welcome', session)

    expect(session.context.currentNode.name).toEqual('welcome')
    expect(session.context.currenFlow.name).toEqual('main.flow.json')
    expect(sessionService.updateSession).toHaveBeenCalled()
  })

  it('Assign current node as the starting node of the next flow', async () => {
    await dialogEngine.transitionToNode('other.flow.json', session)

    expect(session.context.currentNode.name).toEqual('entry')
    expect(session.context.currenFlow.name).toEqual('other.flow.json')
    expect(sessionService.updateSession).toHaveBeenCalled()
  })

  it('Assign current node as the last called node in the parent flow', async () => {
    await dialogEngine.transitionToNode('other.flow.json', session)
    await dialogEngine.transitionToNode('##', session)

    expect(session.context.currentNode.name).toEqual('entry')
    expect(session.context.currenFlow.name).toEqual('main.flow.json')
  })

  it('Assign current node as a specific node of the parent flow', async () => {
    await dialogEngine.transitionToNode('other.flow.json', session)
    await dialogEngine.transitionToNode('#welcome', session)

    expect(session.context.currentNode.name).toEqual('welcome')
    expect(session.context.currenFlow.name).toEqual('main.flow.json')
  })

  it('Throws when the node or the flow doesnt exists', () => {
    expect(dialogEngine.transitionToNode('unknown', session)).rejects.toEqual(
      new Error('Could not find any node or flow under the name of "unknown"')
    )
  })
})

function givenInstructionsAreSuccessful(success: boolean = true) {
  instructionProcessor.process.mockReturnValue(success)
}

function stubSession() {
  return { id: 'an_id', context: context, event: {}, state: {} }
}
})
