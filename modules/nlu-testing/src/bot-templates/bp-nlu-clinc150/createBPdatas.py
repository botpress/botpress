import json
import hashlib
from typing import Dict, List, Tuple, TypedDict
import random
import numpy as np
import os
import glob

# IF SEED
SEED = -1
if SEED > 0:
    random.seed(SEED)
    np.random.seed(SEED)


# negative number to keep all
NB_INTENTS = -1
NB_UTT_TRAIN_INTENT = -1
NB_UTT_TEST_INTENT = -1


class TestEntry(TypedDict):
    id: str
    utterance: str
    context: str
    conditions: List[Tuple[str, str, str]]


class TrainEntry(TypedDict):
    name: str
    utterances: Dict[str, List[str]]
    slots: List[str]
    contexts: List[str]
    conditions: List[Tuple[str, str, str]]


# Remove old intents
for f in glob.iglob('./flows/*.intents.json'):
    os.remove(f)

# Load Datas
with open('./data_full.json', 'r') as file:
    datas: Dict[str, List[Tuple[str, str]]] = json.load(file)

# Load train oos and put it in a intent file
oos_train_datas: TrainEntry = {"name": 'oos',
                               "utterances": {"en": []},
                               "slots": [],
                               "contexts": ['global']}
random.shuffle(datas['oos_train'])

for train in datas['oos_train']:
    if(len(oos_train_datas['utterances']['en']) < NB_UTT_TRAIN_INTENT or NB_UTT_TRAIN_INTENT < 0):
        oos_train_datas['utterances']['en'].append(train[0])
with open('./flows/oos.intents.json', 'w') as dump_file:
    json.dump(oos_train_datas, dump_file, ensure_ascii=True, indent=2)

# Load all train intent in a dict and dump each key in a different file
train_datas: Dict[str, TrainEntry] = {}
random.shuffle(datas['train'])
for train in datas['train']:
    intent_data = train_datas.get(train[1],
                                  {"name": train[1],
                                   "utterances": {"en": []},
                                   "slots": [],
                                   "contexts": ['global'],
                                   "metadata": {
                                      "enabled": True
                                  }}
                                  )
    if(len(intent_data['utterances']['en']) < NB_UTT_TRAIN_INTENT or NB_UTT_TRAIN_INTENT < 0):
        intent_data['utterances']['en'].append(train[0])
        train_datas[train[1]] = intent_data

if NB_INTENTS > 0:
    intents_to_keep = np.random.choice(list(
        train_datas.keys()), NB_INTENTS, replace=False)
    pruned_train_datas = {key: train_datas[key] for key in intents_to_keep}
else:
    intents_to_keep = train_datas.keys()
    pruned_train_datas = train_datas

for intent, utterances in pruned_train_datas.items():
    with open(f'./flows/{intent}.intents.json', 'w') as dump_file:
        json.dump(utterances, dump_file, ensure_ascii=True, indent=2)

# TESTS
test_datas: List[TestEntry] = []
added_tests: Dict[str, int] = {key: 0 for key in intents_to_keep}

for test in datas['oos_test'] + datas['oos_val'] + datas['val'] + datas['test']:
    if test[1] in intents_to_keep:
        if added_tests[test[1]] < NB_UTT_TEST_INTENT or NB_UTT_TEST_INTENT < 0:
            test_datas.append({
                "id": hashlib.md5(test[0].encode('utf8')).hexdigest(),
                'utterance': test[0],
                'context': '*',
                'conditions': [['intent', 'is', test[1]]]
            })
            added_tests[test[1]] += 1

with open('./nlu-tests.json', 'w') as dumpFile:
    json.dump(test_datas, dumpFile, ensure_ascii=True, indent=2)
