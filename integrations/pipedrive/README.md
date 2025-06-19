# bp-integration
Tryout for Botpress team

# Objective
Make a CRUD integration between pipedrive and botpress focussing on leads and deals.

#  Setup
1. Setup Botpress webhook url in src/conf.ts
2. Setup Pipedrive webhook api key in src/conf.ts
3. Install dependencies using `npm install`
4. Build and deploy the botpress integration using `bp deploy -y`

# Documentation
https://developers.pipedrive.com/ \
https://botpress.com/docs/home
https://developers.pipedrive.com/docs/api/v1/Deals

# Feedback
L'intégration permet d'avoir une vue d'ensemble du système de Botpress. En peu de temps j'ai pu mettre la main à la pâte
et intéragir avec les APIs de botpress. La documentation m'a permis de mettre en place rapidement un setup TypeScript.
Je trouve aussi que les présentations de 1h que Michael a pris le temps de faire à chaque jour sont très profitable.
Le CLI est très bien fait et permet de déployer rapidement les changements. Cependant, il aurait été pertinent d'être dirigé
dès le début vers les repo des intégrations déja existantes. Aussi, il est difficile de debugger localement les intégrations;
un container docker qui mock les principaux endpoints de Botpress aurait permis de faire du développement local plus rapidement.
Sinon, il pourrait être intéressant de mieux documenter le bot as code avec le bp serve. Bref, je suis très satisfait
de l'expérience.