#!/usr/bin/env bash
if [ -z "$NODE_ENV" ]; then
  echo "Error: NODE_ENV environment variable is not set"
  exit 1
fi
exec node --unhandled-rejections=strict ./bin/www