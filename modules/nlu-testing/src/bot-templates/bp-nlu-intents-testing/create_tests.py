import json
import hashlib

with open('./raw_set.json', 'r') as json_file:
    dataset = json.load(json_file)

test_set = dataset['test']

tests = []
for test_utt, test_intent in test_set:
    tests.append({
        "id": hashlib.md5(test_utt.encode()).hexdigest(),
        "utterance": test_utt,
        "context": "*",
        "conditions": [
            ["intent", "is", test_intent]
        ]
    })

with open(f'./nlu-tests.json', 'w+') as test_file:
    json.dump(tests, test_file, indent=4)
