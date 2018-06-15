#!/bin/sh

echo -e "\nGlobally installed Botpress version: $(botpress --version)\n"

if [ ! -z ${BP_PLUGIN_INSTALL+x} ];
then
  echo "Variable should be called BP_PLUGINS_INSTALL - plural pluginS."
  exit 1
fi

if [ ! -z ${BP_PLUGINS_INSTALL+x} ];
then
  OIFS=$IFS
  IFS=','

  for x in $BP_PLUGINS_INSTALL
  do
    echo "Installing plugin: ${x}"
    botpress install ${x}
  done
  IFS=$OIFS
fi

echo -e "\n$(botpress list)\n"
yarn start
