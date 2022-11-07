---
id: requirements
title: Requirements
---

--------------------

You want to use Botpress to create the best chatbot ever? Then, take a look at the list below to know what the minimum (and sometimes maximum) hardware and software specification you need.

## Supported Browsers

You can use your favorite browser. Remember that if you encounter a problem, you can contact us!

## Mimimum Hardware Requirements

### Botpress

- CPU: 1
- RAM: 2GB
- Optimal: 40 messages/second
- Maximum: 60 messages/second

### PostgreSQL (database)

- CPU: 2 
- RAM: 4 GB
- Minimum: 60 messages/second 
- Maximum: 600-800 messages/second

## Messaging

The volume of messages contained in a single session is highly variable. It depends mainly on the targeted product, the domain, and the customers. See the following examples:

- Simple Q&A Bot:
    - Example: Covid-19 information Bot
    - #msg/session: 4-5 msgs/session

- Complex contextual Bot:
    - Example: Customer service Bot:
    - #msg/session: 10-20 msgs/session

- Special Cases (Persistent Sessions):
    - Example: Classroom bot with persistent session
    - #msg/session: 1000-5000 msgs/session

## Supported Operating Systems

- Windows 10
- Mac OS catalina or BigSur
- Ubuntu 18.04 or 20.04
- Debian 8.11
- Red Hat 7.5
- CentOS 7.5

## Infrastructure Best Practices

- Use at least 2 environments (development, staging, production…) to minimalize the impact on the end-user experience.
- Create backups and continue maintenance of all components (especially the databases and storage components to mitigate and prevent data loss). 
- Gradually execute maintenance and upgrades to ensure the system safety and its accuracy before exposing it to users (A/B, Canary deployments). For simpler implementations, predefine time ranges with low or null usage for the components maintenance. Don't forget to warn your users!
- Allocate the least privileges and accesses possible. This ensures the environment security, prevents breaches, and preserves the data integrity.