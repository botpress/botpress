import json
import hashlib

with open("./nlu-tests.json", "r") as json_file:
    dic_json = json.load(json_file)

for obj in dic_json:
    obj["id"] = hashlib.md5(obj["utterance"].encode()).hexdigest()

with open("./nlu-tests.json", "w+") as json_file:
    json.dump(dic_json, json_file, indent=2)
