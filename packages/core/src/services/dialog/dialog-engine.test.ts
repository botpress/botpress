import { NewDialogEngine } from './dialog-engine'
import FlowService from './flow-service'

describe('DialogEngine', () => {
  const mockFlowService: FlowService = { initialize: jest.fn(), loadAll: jest.fn(), saveAll: jest.fn() }
  const mockSessionService = {}
  const dialogEngine = new NewDialogEngine(mockFlowService, mockSessionService)
})
