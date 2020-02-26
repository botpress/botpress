"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _lodash = _interopRequireDefault(require("lodash"));

var _moment = _interopRequireDefault(require("moment"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = ({
  bp,
  botId
}) => {
  const graphs = [];
  const knex = bp.database;

  async function update(name, operation, value, racing = false) {
    if (!_lodash.default.isString(name)) {
      throw new Error('Invalid name, expected a string');
    }

    const today = (0, _moment.default)().format('YYYY-MM-DD');
    name = name.toLowerCase().trim();

    if (!name.includes('~')) {
      name += '~';
    }

    const result = await knex('analytics_custom').where('date', today).andWhere('botId', botId).andWhere('name', name).update('count', operation).then();

    if (result == 0 && !racing) {
      await knex('analytics_custom').insert({
        botId,
        name: name,
        date: today,
        count: value
      }).catch(err => {
        return update(name, operation, value, true);
      });
    }
  }

  async function increment(name, count = 1) {
    if (!_lodash.default.isNumber(count)) {
      throw new Error('Invalid count increment, expected a valid number');
    }

    const countQuery = count < 0 ? 'count - ' + Math.abs(count) : 'count + ' + Math.abs(count);
    return update(name, knex.raw(countQuery), count);
  }

  async function decrement(name, count = 1) {
    return increment(name, count * -1);
  }

  async function set(name, count = 1) {
    return update(name, count, count);
  } // { name, type, description, variables }


  function addGraph(graph) {
    if (!_lodash.default.includes(['count', 'countUniq', 'percent', 'piechart'], graph.type)) {
      throw new Error('Unknown graph of type ' + graph.type);
    }

    graphs.push(graph);
  }

  const countUniqRecords = async (from, to, variable) => {
    const uniqRecordsQuery = function () {
      this.select(knex.raw('distinct name')).from('analytics_custom').where('date', '>=', from).andWhere('botId', botId).andWhere('date', '<=', to).andWhere('name', 'LIKE', variable + '~%').as('t1');
    };

    const {
      count
    } = await knex.count('*').from(uniqRecordsQuery).first();
    return count;
  };

  const getters = {
    count: async function (graph, from, to) {
      const variable = _lodash.default.first(graph.variables);

      const rows = await knex('analytics_custom').select(['date', knex.raw('sum(count) as count')]).where('date', '>=', from).andWhere('botId', botId).andWhere('date', '<=', to).andWhere(function () {
        if (variable.indexOf('~') > -1) {
          return this.where('name', 'LIKE', variable);
        } else {
          return this.where('name', 'LIKE', variable + '~%');
        }
      }).groupBy('date').then(rows => rows.map(row => ({ ...row,
        count: parseInt(row.count)
      })));
      return { ...graph,
        results: rows
      };
    },

    async countUniq(graph, from, to) {
      const variable = _lodash.default.first(graph.variables);

      const countUniq = await countUniqRecords(from, to, variable);
      const results = await this.count(graph, from, to);
      return { ...graph,
        ...results,
        countUniq
      };
    },

    percent: async function (graph, from, to) {
      const variable1 = _lodash.default.first(graph.variables);

      const variable2 = _lodash.default.last(graph.variables);

      const count1 = await getters.count({
        variables: [variable1]
      }, from, to);
      const count2 = await getters.count({
        variables: [variable2]
      }, from, to);

      const allDates = _lodash.default.uniq([..._lodash.default.map(count1.results, 'date'), ..._lodash.default.map(count2.results, 'date')]);

      const records = allDates.map(date => [_lodash.default.find(count1.results, {
        date
      }) || {
        count: 0,
        date
      }, _lodash.default.find(count2.results, {
        date
      }) || {
        count: 1,
        date
      }]);
      const results = records.map(([n1, n2]) => {
        const percent = _lodash.default.isFunction(graph.fn) ? graph.fn(_lodash.default.get(n1, 'count'), _lodash.default.get(n2, 'count')) : _lodash.default.get(n1, 'count') / _lodash.default.get(n2, 'count');
        return {
          date: n1.date,
          percent: percent > 1 ? 1 : percent
        };
      });
      let percent = undefined;

      if (graph.fnAvg) {
        const n1Uniq = await countUniqRecords(from, to, variable1);
        const n2Uniq = await countUniqRecords(from, to, variable2);
        percent = graph.fnAvg(n1Uniq, n2Uniq) * 100;
      }

      return { ...graph,
        results,
        percent
      };
    },
    piechart: async function (graph, from, to) {
      const variable = _lodash.default.first(graph.variables);

      const rows = await knex('analytics_custom').select(['name', knex.raw('sum(count) as count')]).where('date', '>=', from).andWhere('botId', botId).andWhere('date', '<=', to).andWhere('name', 'LIKE', variable + '~%').groupBy('name').then(rows => {
        return rows.map(row => {
          const name = _lodash.default.drop(row.name.split('~')).join('~');

          return { ...row,
            name: _lodash.default.isEmpty(name) ? 'unknown' : name,
            count: parseInt(row.count)
          };
        });
      });
      return { ...graph,
        results: rows
      };
    }
  };

  function getAll(from, to) {
    return Promise.map(graphs, graph => getters[graph['type']](graph, from, to));
  }

  return {
    increment,
    decrement,
    set,
    addGraph,
    getAll
  };
};

exports.default = _default;
//# sourceMappingURL=custom-analytics.js.map