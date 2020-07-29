"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.splitTrainToTrainAndTest = splitTrainToTrainAndTest;
exports.getTrainTestDatas = getTrainTestDatas;

var _crypto = _interopRequireDefault(require("crypto"));

var _lodash = _interopRequireDefault(require("lodash"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

async function splitTrainToTrainAndTest(state) {
  // Backup the real intent folder
  if (!(await state.ghost.fileExists('./', 'raw_intents'))) {
    const intentsFiles = await state.ghost.directoryListing('./intents', '*.json');

    for (const file of intentsFiles) {
      const intentData = await state.ghost.readFileAsObject('./intents', file);
      await state.ghost.upsertFile('./raw_intents', file, JSON.stringify(intentData));
    }
  } // In the new


  const intentsFiles = await state.ghost.directoryListing('./raw_intents', '*.json');
  const tests = [];

  for (const file of intentsFiles) {
    const intentDatas = await state.ghost.readFileAsObject('./raw_intents', file);
    const languages = Object.keys(intentDatas.utterances);

    for (const lang of languages) {
      const test_utts = _lodash.default.sampleSize(intentDatas.utterances[lang], _lodash.default.floor(intentDatas.utterances[lang].length / 4));

      const train_utts = intentDatas.utterances[lang].filter(s => !test_utts.includes(s));
      intentDatas.utterances[lang] = train_utts;
      tests.concat(test_utts.map(s => {
        return {
          id: _crypto.default.createHash('md5').update(s).digest('hex'),
          conditions: [['context', 'is', intentDatas.contexts[0]], ['intent', 'is', intentDatas.name]],
          utterance: s,
          context: intentDatas.contexts[0]
        };
      }));
    }

    await state.ghost.upsertFile('./intents', file, JSON.stringify(intentDatas));
  }

  await state.ghost.upsertFile('./', 'nlu-tests.json', JSON.stringify(tests));
}

async function getTrainTestDatas(state) {
  if ((await state.ghost.fileExists(`. / datas / ${state.embedder.model_name}`, 'test_set.json')) && (await state.ghost.fileExists(`. / datas / ${state.embedder.model_name}`, 'train_set.json'))) {
    const vectorized_train = await state.ghost.readFileAsObject(`./datas/${state.embedder.model_name}`, 'train_set.json');
    const vectorized_test = await state.ghost.readFileAsObject(`./datas/${state.embedder.model_name}`, 'test_set.json');
    state.trainDatas = vectorized_train;
    state.testDatas = vectorized_test;
    return {
      train: vectorized_train,
      test: vectorized_test
    };
  }

  const rawTrain = [];
  let rawTest = [];
  const intentsFiles = await state.ghost.directoryListing('./intents', '*.json');

  for (const file of intentsFiles) {
    const jsonData = await state.ghost.readFileAsObject('./intents', file);
    rawTrain.push(jsonData);
  }

  const testFileExist = await state.ghost.fileExists('./', 'nlu-tests.json');

  if (testFileExist) {
    rawTest = await state.ghost.readFileAsObject('./', 'nlu-tests.json');
  } else {
    console.log('No test file found : You need a test file to run confusion matrix !');
    console.log('Running a splitter to create 1/4 of training datas to test');
    await splitTrainToTrainAndTest(state);
    rawTest = await state.ghost.readFileAsObject('./', 'nlu-tests.json');
  }

  const intents = _lodash.default.uniqBy(rawTrain, 'name').map(o => o.name);

  const number2intents = { ...intents
  };

  const intent2number = _lodash.default.zipObject(Object.values(number2intents), Object.keys(number2intents));

  const vectorized_test = [];
  const vectorized_train = [];

  for (const entry of rawTest) {
    const utt_emb = await state.embedder.embed(entry.utterance);
    vectorized_test.push({
      utt: entry.utterance,
      utt_emb,
      label: parseInt(intent2number[entry.conditions[0][2]]),
      intent: entry.conditions[1][2]
    });
  }

  const config = await state.ghost.readFileAsString('./', 'bot.config.json');
  const lang = JSON.parse(config).languages[0];
  console.log('LANG', JSON.parse(config).id, lang);

  for (const entry of rawTrain) {
    // console.log(entry.utterances)
    // console.log(entry.utterances[lang])
    for (const utt of entry.utterances[lang]) {
      const utt_emb = await state.embedder.embed(utt);
      vectorized_train.push({
        utt,
        utt_emb,
        label: parseInt(intent2number[entry.name]),
        intent: entry.name
      });
    }
  }

  console.log('going to write');
  await state.ghost.upsertFile(`. / datas / ${state.embedder.model_name}`, 'test_set.json', JSON.stringify(vectorized_test, undefined, 2));
  console.log('written test');
  await state.ghost.upsertFile(`. / datas / ${state.embedder.model_name}`, 'train_set.json', JSON.stringify(vectorized_train, undefined, 2));
  console.log('written train');
  state.trainDatas = vectorized_train;
  state.testDatas = vectorized_test;
  return {
    train: vectorized_train,
    test: vectorized_test
  };
}
//# sourceMappingURL=data_loader.js.map