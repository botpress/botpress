import json
import hashlib
from typing import Dict, List, Tuple, TypedDict
import random
import numpy as np
import os
import glob

SEED = -1
if SEED > 0:
    random.seed(SEED)
    np.random.seed(SEED)


# negative number to keep all
NB_INTENTS = 6
NB_UTT_TRAIN_INTENT = 10
NB_UTT_TEST_INTENT = 8


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


class RawEntry(TypedDict):
    author: str
    url: str
    text: str
    entities: List[TypedDict('Entity', {"text": str,
                                        "entity": str,
                                        "stop": int,
                                        "start": int})]
    intent: str
    answer: TypedDict('Answer', {"text": str, "author": str})
    training: bool


# Remove old intents
for f in glob.iglob('./flows/*.intents.json'):
    os.remove(f)

# Load Datas
with open('./snips.json', 'r') as file:
    datas: RawEntry = json.load(file)

all_intents = list(set([entry['intent'] for entry in datas]))

if(NB_INTENTS > 0):
    choosen_intents = np.random.choice(all_intents, NB_INTENTS, replace=False)
else:
    choosen_intents = all_intents

train: Dict[str, TrainEntry] = {}
slots_per_intents = {intent: [] for intent in choosen_intents}
tests: List[TestEntry] = []
added_tests: Dict[str, int] = {intent: 0 for intent in choosen_intents}


for entry in datas:
    if entry['training'] and (entry['intent'] in choosen_intents):
        intent_data = train.get(entry['intent'],
                                {"name": entry['intent'],
                                 "utterances": {"en": []},
                                 "slots": [],
                                 "contexts": ['global'],
                                 "metadata": {
                                    "enabled": True
                                }}
                                )

        if(len(intent_data['utterances']['en']) < NB_UTT_TRAIN_INTENT or NB_UTT_TRAIN_INTENT < 0):
            text_with_entities = entry['text']
            for ent in entry['entities']:
                text_with_entities = text_with_entities.replace(
                    ent['text'], f"${ent['entity']}")

                slot_entry = {"name": ent['entity'], "entity": ent['entity']}
                if slot_entry not in slots_per_intents[entry['intent']]:
                    slots_per_intents[entry['intent']].append(slot_entry)

            if text_with_entities not in intent_data['utterances']['en']:
                intent_data['utterances']['en'].append(text_with_entities)
                intent_data['slots'] = slots_per_intents[entry['intent']]
                train[entry['intent']] = intent_data

    else:
        if (entry['intent'] in choosen_intents and (added_tests[entry['intent']] < NB_UTT_TEST_INTENT or NB_UTT_TEST_INTENT < 0)):
            conditions = [['intent', 'is', entry['intent']]]

            for ent in entry['entities']:
                conditions.append([f"slot:{ent['entity']}", 'is', ent['text']])

            tests.append({
                "id": hashlib.md5(entry['text'].encode('utf8')).hexdigest(),
                'utterance': entry['text'],
                'context': '*',
                'conditions': conditions
            })
            added_tests[entry['intent']] += 1

for intent, utterances in train.items():
    with open(f'./flows/{intent}.intents.json', 'w') as dump_file:
        json.dump(utterances, dump_file, ensure_ascii=True, indent=2)


with open('./nlu-tests.json', 'w') as dumpFile:
    json.dump(tests, dumpFile, ensure_ascii=True, indent=2)
