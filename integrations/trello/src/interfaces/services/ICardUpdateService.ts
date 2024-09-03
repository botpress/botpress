export type ICardUpdateService = {
    moveCardVertically(listName: string, cardName: string, nbPositions: number): Promise<void>
    moveCardToOtherList(listName: string, cardName: string, newListName: string): Promise<void>
}
