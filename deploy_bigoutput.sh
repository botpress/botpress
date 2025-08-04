cd bigoutput
pnpm bp deploy --profile local -y
cd -

cd interfaces/typing-indicator
pnpm bp deploy --profile local -y
cd -

cd integrations/telegram
pnpm bp add --profile local -y typing-indicator
pnpm bp deploy --profile local -y --allowDeprecated
cd -

cd bigoutputbot
pnpm bp add --profile local -y telegram
pnpm bp add --profile local -y bigoutput
pnpm bp deploy --profile local -y --botId 303d323b-e79b-4835-8751-bf495d79e318
cd -
