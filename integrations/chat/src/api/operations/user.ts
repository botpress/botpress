import * as errors from '../../gen/errors'
import { validateFid } from '../../id-store'
import * as types from '../types'
import * as fid from './fid'
import * as model from './model'

export const createUser: types.Operations['createUser'] = async (props, foreignReq) => {
  if (props.auth.mode === 'personal') {
    throw new errors.UnauthorizedError(
      'The "createUser" operation can only be called when using the shared encryption key.'
    )
  }

  const fidHandler = fid.handlers.createUser(props, { ...foreignReq, auth: { userId: '' } })
  const req = await fidHandler.mapRequest()

  const {
    body: { name, pictureUrl, profile },
  } = req

  const { user } = await props.client.createUser({
    name,
    pictureUrl,
    tags: {
      profile,
    },
  })

  const userFid = foreignReq.body.id ?? user.id
  const userKey = props.auth.generateKey({ id: userFid })
  return fidHandler.mapResponse({
    body: {
      user: model.mapUser(user),
      key: userKey,
    },
  })
}

export const getUser: types.AuthenticatedOperations['getUser'] = async (props, foreignReq) => {
  const fidHandler = fid.handlers.getUser(props, foreignReq)
  const req = await fidHandler.mapRequest()

  const { user } = await props.client.getUser({ id: req.auth.userId })
  return fidHandler.mapResponse({
    body: {
      user: model.mapUser(user),
    },
  })
}

export const getOrCreateUser: types.AuthenticatedOperations['getOrCreateUser'] = async (props, foreignReq) => {
  const {
    auth: { userId: userFid },
    body: { name, pictureUrl, profile },
  } = foreignReq

  const existingId =
    (await props.userIdStore.byFid.find(userFid)) ??
    (await props.apiUtils.findUser({ id: userFid }).then((res) => res.user?.id))

  if (existingId) {
    const { user: updatedUser } = await props.client.updateUser({
      id: existingId,
      name,
      pictureUrl,
      tags: {
        profile,
      },
    })

    const res = {
      body: {
        user: model.mapUser(updatedUser),
      },
    }

    return fid.merge(res, {
      body: {
        user: {
          id: userFid,
        },
      },
    })
  }

  const validationResult = validateFid(userFid)
  if (!validationResult.success) {
    throw new errors.InvalidPayloadError(validationResult.reason)
  }

  const { user: newUser } = await props.client.createUser({
    name,
    pictureUrl,
    tags: {
      profile,
    },
  })

  const res = {
    body: {
      user: model.mapUser(newUser),
    },
  }

  await props.userIdStore.byFid.set(userFid, newUser.id)
  return fid.merge(res, {
    body: {
      user: {
        id: userFid,
      },
    },
  })
}

export const updateUser: types.AuthenticatedOperations['updateUser'] = async (props, foreignReq) => {
  const fidHandler = fid.handlers.updateUser(props, foreignReq)
  const req = await fidHandler.mapRequest()

  const {
    body: { name, pictureUrl },
  } = req

  const { user } = await props.client.updateUser({ id: req.auth.userId, name, pictureUrl, tags: {} })

  return fidHandler.mapResponse({
    body: {
      user: model.mapUser(user),
    },
  })
}

export const deleteUser: types.AuthenticatedOperations['deleteUser'] = async (props, foreignReq) => {
  const fidHandler = fid.handlers.deleteUser(props, foreignReq)
  const req = await fidHandler.mapRequest()

  await props.client.deleteUser({ id: req.auth.userId })
  return fidHandler.mapResponse({ body: {} })
}
