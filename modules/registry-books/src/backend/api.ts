import * as sdk from 'botpress/sdk'

export default async (bp: typeof sdk) => {
  const router = bp.http.createRouterForBot('registry-books')
  const knex = bp.database

  //Get all categories
  router.get('/category', async (req, res) => {
    const { dateBegin, dateEnd, showAll } = req.query
    const { botId } = req.params
    let categories = []
    if (showAll == 'true') {
      categories = await knex('registry_books').select('category').countDistinct('data as registry_count').orderBy('category')
        .where('botId', botId)
        .groupBy('category')
    } else {
      categories = await knex('registry_books').select('category').countDistinct('data as registry_count').orderBy('category')
        .where('registered_on', '>=', dateBegin).where('registered_on', '<=', dateEnd)
        .where('botId', botId)
        .groupBy('category');
    }

    res.send({ categories })
  })

  router.get('/category/:id', async (req, res) => {
    const { dateBegin, dateEnd, showAll, limit = null, offset = 0 } = req.query
    const { id, botId } = req.params
    const query = knex('registry_books').select(['data', 'data_key']).sum('hit_count as hit_count')
      .where({ 'category': id, botId: botId }).clone()

    // Will consider date
    if (showAll != 'true') {
      query.where('registered_on', '>=', dateBegin).where('registered_on', '<=', dateEnd).clone()
    }

    //Will consider offset and limit
    if (limit != null) {
      query.limit(limit).offset(offset).clone()
    }

    const category = await query.groupBy(['data', 'data_key']).orderBy('hit_count', 'desc');
    res.send(category)
  })

  router.post('/registry/delete', async (req, res) => {
    const { data_key, dateBegin, dateEnd, deleteAll } = req.body
    const { botId } = req.params;
    const query = knex('registry_books')
      .where('data_key', data_key)
      .where('botId', botId).clone()

    // Will consider date
    if (deleteAll != true) {
      query.where('registered_on', '>=', dateBegin).where('registered_on', '<=', dateEnd).clone()
    }

    const rows = await query.del();
    res.send({ affectedRows: rows })
  })



}