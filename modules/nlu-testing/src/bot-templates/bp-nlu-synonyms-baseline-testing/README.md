## This bot aims to improve synonyms recognition

#### Without anything bp scores at ~40%(+-2%) tested on 10 bots

#### With string replacement from entities (medium matching), it gains ~13% tested on the 10 bots

### Contexts

- Splittable : Two easily splitable intents to ensure a baseline
- Intersection : Two intents created with almost the same words, just the name of the food differs, tests sentences are 'normal'
  - E.g I want to eat a lunch / I want to eat a dessert
- Unbalanced : One intent have more training sentences to test for unbalanced datas tests sentences are 'normal'
- Switched : Two intents were test sentences are the train sentences of the other intent with only one word switched
  - E.g :
    - train intent 1 => What is my bank status // train intent 2 => Check flight informations
    - test intent 1 => Check account informations // test intent 2 => What is my plane status

Each contexts have random garbages sentences to test the oos/none detection of all intents

### Entities (synonyms)

- account <= RER / CELI / DR / CR / PLS / ROI / IRA
- boss <= CEO/CFO/CTO and acronyms FastText have never seen
- cake <= banana split/lemon pie/brownie and others
- cars <= pickup/RAV4/GMC/Fiat brands and acronyms FastText have never seen
- dish <= bagel/smoked meat and other dish names
- flights <= \w{1,2}-?\d{3,5} (DG-5684 or A782)
- guns <= glock/magnum/P90/M16 acronyms and names FastText have never seen
- paris <= The louvre/Paris city/City of light and many names to refer to paris
- restaurants <= Burger king / Subway / McDonald / Thai zone...

### Intents

- <unbalanced> Buy_car & buy_gun check if botpress can still learn buy_gun which have 10x less utterances
- <Intersection> eat_sweet and eat_salty are constructed with the sames training utterances execpted dish names, check if botpress can deal with only one synonyms words (most difficult) ex : I'm craving for some smoked meat / I'm craving for some brownie
- <Splittable> get restaurant paris & schedule appointment boss are made with differents training utterances and it should be our baseline which botpress can perform on easy task
- <Switched> Status flight & status bank are constructed with different utterances but the test set is the train set of the other intent with words switched
