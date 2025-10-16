#!/bin/bash
set -e
TARGET_ENV="${1}"

if [ "$TARGET_ENV" != "prod" ]; then
  echo "Error: TARGET_ENV ($TARGET_ENV) must be in ['prod']"
  exit 1
fi

# Set timezone to Paris/France
export TZ=Europe/Paris

# Function to get current date and time in format YYYY-MM-DD HH:MM:SS
dateNow() {
  date +"%Y-%m-%d %H:%M:%S"
}

DELIVER_DIRECTORY="./dist-$TARGET_ENV"

if [ -e "${DELIVER_DIRECTORY}" ]; then
  echo "$(dateNow) | Reset deliver directory ${DELIVER_DIRECTORY}"
  rm -rf "${DELIVER_DIRECTORY}" || true
fi
echo "$(dateNow) | Create deliver directory ${DELIVER_DIRECTORY}"
mkdir -p "${DELIVER_DIRECTORY}/bin"

echo "$(dateNow) | Deliver source"
cp -r src/ package.json pnpm-*.yaml "${DELIVER_DIRECTORY}/"
cp -r bin/www.js bin/commonEnv.js "${DELIVER_DIRECTORY}/bin"

echo "$(dateNow) | Deliver docker"
cp "Dockerfile.$TARGET_ENV" "${DELIVER_DIRECTORY}/Dockerfile"

echo "$(dateNow) | ${DELIVER_DIRECTORY} - branch ${GITHUB_REF_NAME} - DONE"

if [  "$VERBOSE_MODE" == "true" ]; then
echo """
compose build
$ time docker build . -t local-botensky

verify image content

$ docker run --rm -it local-botensky sh
$ docker run --rm -it local-botensky node bin/www.js
"""
fi