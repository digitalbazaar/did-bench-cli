#!/bin/bash

# This generates a file every 5 minutes

while true; do
node handler.js | jq
done
