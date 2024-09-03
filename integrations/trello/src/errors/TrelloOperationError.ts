export class TrelloOperationError extends Error {
    constructor(message: string, public originalError: unknown) {
        super(message)
        this.name = 'TrelloOperationError'
    }
}
