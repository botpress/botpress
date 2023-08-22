export const createCardUi = {
  name: {
    title: 'The name of the card (e.g. "My Test Card")',
  },
  listId: {
    title: 'The ID of the list to add the card to (e.g. "5f5f7f7f7f7f7f7f7f7f7f7f")',
  },
  desc: {
    title: 'The description of the card (Optional) (e.g. "This is my test card created using the Trello API")',
  },
  due: {
    title: 'The due date of the card in ISO format (Optional) (e.g. "2023-08-15T15:00:00.000Z")',
  },
  idMembers: {
    title:
      'The member IDs should be strings separated by commas (Optional) (e.g. "5f5f5f5f5f5f5f5f5f5f5f5f, 6g6g6g6g6g6g6g6g6g6g6g6g")',
  },
  idLabels: {
    title:
      'The label IDs should be strings separated by commas (Optional) (e.g. "5e5e5e5e5e5e5e5e5e5e5e5e, 4d4d4d4d4d4d4d4d4d4d4d4d")',
  },
}

export const updateCardUi = {
  ...createCardUi,
  cardId: {
    title: 'Card ID to update',
  },
  name: {
    title: 'The name of the card (Optional) (e.g. "My Test Card")',
  },
  listId: {
    title: 'The ID of the list to add the card to (Optional) (e.g. "5f5f7f7f7f7f7f7f7f7f7f7f")',
  },
  closed: {
    title:
      'If the card is closed, enter "true". If the card is open, enter "false" (without quotes). If no value is entered, it will keep its previous status. (Optional)',
  },
  dueComplete: {
    title:
      'If the card is due complete, enter "true". If the card is not due complete, enter "false" (without quotes). If no value is entered, it will keep its previous status. (Optional)',
  },
}

export const getMemberUi = {
  usernameOrId: {
    title: 'Trello username or Trello ID (e.g. miuser5 or 6497b46edeb36c99f68he834)',
  },
}

export const addCommentUi = {
  cardId: {
    title: 'Card ID to comment',
  },
  comment: {
    title: 'Content of the comment to be added',
  },
}

export const getBoardMembersUi = {
  boardId: {
    title: 'The ID of the board (e.g kLmNoPqR)',
  },
}
