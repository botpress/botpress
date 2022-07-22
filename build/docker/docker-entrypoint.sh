#!/bin/bash

# Creates the Botpress data folder and sets botpress as the owner
mkdir -p $BP_DATA_PATH;
chown -R $BP_USER:$BP_GROUP $BP_DATA_PATH;

# Executes the command (CMD) passed to the container
exec "$@";
