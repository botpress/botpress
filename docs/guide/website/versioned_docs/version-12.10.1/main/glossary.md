---
id: version-12.10.1-glossary
title: Glossary
original_id: glossary
---

## Glossary

+ **Intent**: It signifies what the user wants to accomplish. Ex: I want to book a flight.
+ **Entities**: It's a variable that complements the intent. Ex: I want to book a flight from _Montreal_ to _Paris_ / Cities are entities because they are variables that can be extracted from the intent.
+ **Slots**: When you create an intent, you can tag different slots that can be used to extract information required to act on the intent successfully. Ex: I want to book a flight from New York to San Francisco for tomorrow. Your slots are the departing city, New York, the arrival city, San Francisco and the date of departure, tomorrow. 
+ **Utterances**: They represent the different ways an intent can be written by a user. It can take the form of a question, a command or a statement. Ex: 
  + Can you book me a flight? 
  + Book flight. 
  + I want to book a flight.
+ **Flow**: A series of logical steps put together to help a user to accomplish a goal.
+ **Node**: A step in a flow. They can be used to say something, to execute an action, to transition based on conditions, and more.
+ **Start Node**: The node where the flow begins. It's the first step of a user.
+ **On enter**: This is what happens when the user enters a node.
+ **Transition**: This is composed of a condition and an action to be executed if the condition is met.
+ **On receive**: Action that happens after the user has said something
