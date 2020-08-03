## This bot aims to improve synonyms recognition

### Without anything bp scores at 44.2%

### With string replacement from entities (medium matching), it gets to 51.2 %

## Contexts

- Splittable : Two easily splitable intents to ensure a baseline
- Intersection : Two "food" intents created with almost the same words, just the name of the food differs
- Unbalanced : One intent have more training sentences to test for unbalanced datas

## Entities (synonyms)

- boss <= CEO/CFO/CTO and acronyms FastText have never seen
- cake <= banana split/lemon pie/brownie and others
- cars <= pickup/RAV4/GMC/Fiat brands and acronyms FastText have never seen
- dish <= bagel/smoked meat and other dish names
- guns <= glock/magnum/P90/M16 acronyms and names FastText have never seen
- paris <= The louvre/Paris city/City of light and many names to refer to paris

## Intents

- <unbalanced> Buy_car & buy_gun check if botpress can still learn buy_gun which have 10x less utterances
- <Intersection> eat_sweet and eat_salty are constructed with the sames training utterances execpted dish names, check if botpress can deal with only one synonyms words (most difficult) ex : I'm craving for some smoked meat / I'm craving for some brownie
- <Splittable> travel & talk_to_boss are made with differents training utterances and it should be our baseline which botpress can perform on
