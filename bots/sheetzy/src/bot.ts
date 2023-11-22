import * as bp from '.botpress'

const telegram = new bp.telegram.Telegram({
  enabled: true,
  config: {
    botToken: '6402478878:AAE-zzePKjgIl23G4VoP_S1StPaf4JoBzHU',
  },
})

const gsheets = new bp.gsheets.Gsheets({
  enabled: true,
  config: {
    spreadsheetId: '1d5Vgaixn8-QrBJmqUZifXWFB53bUWKlKAOerw6Y08A8',
    clientEmail: 'fleur-tmp-3@fleur-tmp.iam.gserviceaccount.com',
    privateKey:
      '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCyIjWkOCZHM4kw\nChekMPQ2dNPdIXqm4ciFfsCmCk1T7onbdyEemuR6iEBR48DPZFpTa7hS1I5QUvgF\nBeWsgU9FQGsjHDdq8cTKlQK/VoqPRyzRhnK1ZvtR1MIk9vOu2MVbvE0tkWHIg/V4\nojL+ZUIEoRmVSSldW46jseeB60f1dX4QlOUuZ+d4KOypSyKCI9F795U2VWmWEs9n\ns5jdxTP90c1MRfcyrab3vuUmutr6KEqXmPub0N3DfLG93V1NegREByudzft33/wF\nO63aLyLXQyDQrJmsgF6pjTaFi5gvePiN93TShOe7H1aDqT6pBRuJt6or8nitGBAk\nAc1hmfpxAgMBAAECggEACKMOxKiOTMuZur9IvypW7BKTRviS3iA6h7J75uLbi0+m\n1hA7Pwh5Pk4jQK4YXx0Adw+N9olIYPiJU+ghysKaFEqQsfIq50Nh0AVpsTCFnlso\n1G3pIrFOS263DRxUaZ5E8wFVWcDDTpZSeBmfbTphTnYLMuWmnPTqORps3TommTUl\nZ/NlM+ebu+YSPaGo4DBYKDJ/+uW12V40C9Rs7ojqj4uUNU8nWVOEAXKFIm+5frdO\nnNAhPkATOnVn6MskOXPVrMzQ/OPUxhcrzOom2tKo/DWYFd2+sRNUBBaKWeOdn9y9\nz/OzQmyL9YDXuLZtn95WgCXKBVGMC4tRWpd2g+XLmwKBgQDY6h8wLr3uJaCisQkr\nsvefpI7KByYROa5CkKoy2N9dgdJGYry4NpYmKEVHDDMypnb3C+u9LRNUHq8NEIn1\niBYHvJhBpmYFPDVuFMR3glGxG24D/T+15pqLTu84V50V3oDbGY5i1zbpZMrgSXk8\n0It7bfvn7L6n+zzlBvJTjbkQ9wKBgQDSOzGvfLtdT27VQKJd7NDVoOU4DCtOWxKb\nHXAuYA3tr3HYJbgnFfayKumqhdxrpjy1+KfGQleRc4TTCMnPZAdy5J+tL9i5b6pi\nWz5Ekt4k/5bN30lOqOE7BzvTlJFnOMi3VETcul9ebqY3QN3hllgk1EXCfSVbJ2n+\nXiFf8lVd1wKBgByrZQ/jPas6Qe7+4y1pbB0njM/a/gcMzqFxqW0rCOq8++PdrP/U\nByhn7jAjxqiNI/AnHTNVv9ZAb/aUFwfiwranEKCss5NBj/ZKvGTnTpDQBUx1rnQG\nVKrQ9gFGYza+v901lYIu280hS0c1rtaA4c6gjMjsm45sQHIs5t5wPuOlAoGAaXay\nlTOAlu3bTvXOvkmn9hNyCizoqLU9Xz1kYo9jTWKfPOynNkxpZrXqZNYkXoiVmkA0\nglwTq+8Eqg2VmAm5RuT0SaBgG56uHgth8GqxMGRb1cl28BP+cWtOkvTMALlWz8lh\nhk2kvC3MCpnq9VlDvK4UlN3NGK5sGORF3+kk9B8CgYAp8ohyB2zSC9x/wBLYc1Oh\n96Litgsj1775pr0gqO2RHt+k2CacYpLN4jvOjJ6hSwLIJ1lrhDxZdOOCcR9JmJd2\nMD9m6h8H/Ng/3FG8O+AM8Croo7alYo4Hdo9Pubutd/sbpFOAJeYDHwu411DkAaXk\nl8CFg01jGSQ8oLmnBuVEfw==\n-----END PRIVATE KEY-----\n',
  },
})

export const bot = new bp.Bot({
  integrations: {
    telegram,
    gsheets,
  },
  events: {},
  recurringEvents: {},
  conversation: {
    tags: {
      downstream: {
        title: 'Downstream Conversation ID',
        description: 'ID of the downstream conversation binded to the upstream one',
      },
      upstream: {
        title: 'Upstream Conversation ID',
        description: 'ID of the upstream conversation binded to the downstream one',
      },
    },
  },
})
