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

DELIVER_DIRECTORY="./dist-$TARGET_ENV-compose"

if [ -e "${DELIVER_DIRECTORY}" ]; then
  echo "$(dateNow) | Reset deliver directory ${DELIVER_DIRECTORY}"
  rm -rf "${DELIVER_DIRECTORY}" || true
fi
echo "$(dateNow) | Create deliver directory ${DELIVER_DIRECTORY}"
mkdir -p "${DELIVER_DIRECTORY}"

echo "$(dateNow) | Deliver docker compose"
cp "docker-compose-$TARGET_ENV.yaml" "${DELIVER_DIRECTORY}/docker-compose.yaml"

echo "$(dateNow) | ${DELIVER_DIRECTORY} - branch ${GITHUB_REF_NAME} - DONE"
