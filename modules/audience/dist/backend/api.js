"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _default = async bp => {
  const router = bp.http.createRouterForBot('audience');
  router.post('/users', async (req, res) => {
    const {
      from,
      limit
    } = req.body;

    try {
      const users = await bp.users.getAllUsers({
        start: from,
        count: limit
      });
      res.send(users);
    } catch (err) {
      res.status(500).send({
        message: err.message
      });
    }
  });
  router.get('/users/count', async (req, res) => {
    try {
      const userCount = await bp.users.getUserCount();
      res.status(200).send(userCount.toString());
    } catch (err) {
      res.status(500).send({
        message: err.message
      });
    }
  });
};

exports.default = _default;