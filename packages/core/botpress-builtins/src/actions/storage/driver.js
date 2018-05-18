import moment from 'moment'
import _ from 'lodash'
import ms from 'ms'

const boxWithExpiry = (value, expiry = 'never') => {
  const expiryDate = expiry === 'never' ? 'never' : moment().add(ms(expiry), 'milliseconds')

  return { value, expiry: expiryDate }
}

const unboxWithExpiry = box => {
  if (box && box.expiry && (box.expiry === 'never' || moment(box.expiry).isAfter())) {
    return box.value
  }

  return null
}

export const setStorageWithExpiry = async (bp, key, value, expiry) => {
  const box = boxWithExpiry(value, expiry)
  await bp.kvs.set(key, box)
}

export const getStorageWithExpiry = async (bp, key) => {
  const box = await bp.kvs.get(key)
  return unboxWithExpiry(box)
}

export const removeStorageKeysStartingWith = async (bp, key) => {
  const knex = await bp.db.get()

  await knex('kvs')
    .where('key', 'like', key + '%')
    .del()
    .then()
}
