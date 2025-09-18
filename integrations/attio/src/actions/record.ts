//

export const listRecords = async ({ ctx, input, logger }: any) => {
  const accessToken = ctx.configuration.accessToken

  const { object } = input.path
  const { filter, sorts, limit, offset } = input.body

  try {
    const response = await fetch(`https://api.attio.com/v2/objects/${encodeURIComponent(object)}/records/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filter, sorts, limit, offset }),
    })
    const json = (await response.json()) as any
    return { data: json.data ?? [] }
  } catch (err) {
    logger.forBot().error('Attio listRecords failed', err)
    return { data: [] }
  }
}

export const getRecord = async ({ ctx, input, logger }: any) => {
  const accessToken = ctx.configuration.accessToken

  const { object, record_id } = input.path

  try {
    const url = `https://api.attio.com/v2/objects/${encodeURIComponent(object)}/records/${encodeURIComponent(
      record_id
    )}`
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    const json = (await response.json()) as any
    return { data: json.data ?? [] }
  } catch (err) {
    logger.forBot().error('Attio getRecord failed', err)
    return { data: [] }
  }
}

export const createRecord = async ({ ctx, input, logger }: any) => {
  const accessToken = ctx.configuration.accessToken

  const { object } = input.path
  const { values } = input.body

  try {
    const url = `https://api.attio.com/v2/objects/${encodeURIComponent(object)}/records`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    })
    const json = (await response.json()) as any
    return { data: json.data ?? [] }
  } catch (err) {
    logger.forBot().error('Attio createRecord failed', err)
    return { data: [] }
  }
}

export const updateRecord = async ({ ctx, input, logger }: any) => {
  const accessToken = ctx.configuration.accessToken

  const { object, record_id } = input.path
  const { values } = input.body

  try {
    const url = `https://api.attio.com/v2/objects/${encodeURIComponent(object)}/records/${encodeURIComponent(
      record_id
    )}`
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    })
    const json = (await response.json()) as any
    return { data: json.data ?? [] }
  } catch (err) {
    logger.forBot().error('Attio updateRecord failed', err)
    return { data: [] }
  }
}