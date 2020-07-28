import json
import os
import numpy as np

if not os.path.exists('./intents'):
    os.mkdir('./intents')

with open('./raw_set.json', 'r') as json_file:
    dataset = json.load(json_file)

train_set = dataset['train']  # +dataset['val']
train_intents = np.random.choice(list(set([elt[1] for elt in train_set])),
                                 50,
                                 replace=False)

for intent in train_intents:
    intent_dic = {"name": intent,
                  "utterances": {'en': []},
                  "slots": [],
                  "contexts": ["global"]}
    for train_utt, train_intent in train_set:
        if train_intent == intent:
            if len(intent_dic["utterances"]["en"]) < 20:
                intent_dic["utterances"]["en"].append(train_utt)

    with open(f'./intents/{intent}.json', 'w+') as intent_file:
        json.dump(intent_dic, intent_file, indent=4)
