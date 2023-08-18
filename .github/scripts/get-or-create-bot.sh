#!/bin/bash

function debug { 
  echo "$1" >&2 
}

function get_or_create_bot() {
  if [ -z "$1" ]; then
    debug "Error: bot name is not provided"
    exit 1
  fi

  bot_name=$1

  all_bots=$(pnpm bp bots ls --json)
  bots_with_name=$(echo $all_bots | jq "[ .[] | select(.name==\"$bot_name\") ]")
  bots_count=$(echo $bots_with_name | jq length)


  if [ $bots_count -gt 1 ]; then
    debug "Error: more than one bot with name $bot_name"
    exit 1
  fi

  bot_id=""
  if [ $bots_count -eq 0 ]; then
    debug "Creating bot $bot_name"
    bot_id=$(pnpm bp bots new --name $bot_name --json | jq -r ".id")
  else
    debug "Bot $bot_name already exists"
    bot_id=$(echo $bots_with_name | jq -r ".[0].id")
  fi

  debug "Bot id: $bot_id"
  echo "$bot_id"
  exit 0
}

get_or_create_bot $@
