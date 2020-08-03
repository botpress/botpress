import json
import hashlib
from os import replace
import requests
import numpy as np
import spacy
from tqdm import tqdm
from gensim.models.wrappers import FastText as ft
# ft.load_fasttext_format('/home/pedro/botpress/embeddings/bp.en.300.bin')

nlp = spacy.load("en_core_web_lg")
BASE_URL = "https://api.datamuse.com//words?rel_syn="

with open('./raw_set.json', 'r') as json_file:
    dataset = json.load(json_file)

test_set = dataset['train']+dataset['val']

test_set = [test_set[i] for i in range(
    len(test_set)) if i in np.random.choice(range(len(test_set)), 1000, replace=False)]

tests = []
for test_utt, test_intent in tqdm(test_set):
    doc = nlp(test_utt)
    sentence = [str(s) for s in list(doc)]
    changed_words = 0
    for i in range(1, len(doc)-1):
        if doc[i].pos_ in ["NOUN", "ADJ", "VERB"]:
            synonym = requests.get(
                f"{BASE_URL}{doc[i]}&lc={doc[i-1]}&rc={doc[i+1]}").json()
            # synonym = ft.most_similar(doc[i])

            if ((len(synonym) > 1) and (type(synonym) is list)):
                sentence[i] = synonym[np.random.choice(
                    range(min(len(synonym), 3)))]['word']
                changed_words += 1
    if changed_words > 3:
        synonym_test_utt = " ".join(sentence)
        tests.append({
            "id": hashlib.md5(synonym_test_utt.encode()).hexdigest(),
            "utterance": synonym_test_utt,
            "context": "*",
            "conditions": [
                ["intent", "is", test_intent]
            ]
        })

with open(f'./nlu-testing.json', 'w+') as test_file:
    json.dump(tests, test_file, indent=4)
