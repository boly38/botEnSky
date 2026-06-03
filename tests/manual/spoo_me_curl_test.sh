#!/bin/sh
#
# Test spoo.me URL shortener API with curl
# Usage: ./spoo_me_curl_test.sh
# Requirements: SPOO_ME_API_KEY environment variable set
#
# API Docs: https://docs.spoo.me/quickstart
#

set -e

SPOO_ME_API_KEY="${SPOO_ME_API_KEY:-}"
SPOO_ME_BASE_URL="https://spoo.me/api/v1/shorten"
USER_AGENT="botensky"
LONG_URL="https://avibase.bsc-eoc.org/species.jsp?lang=EN&avibaseid=69544B59&sec=flickr"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ -z "$SPOO_ME_API_KEY" ]; then
    printf "%b\n" "${RED}❌ Error: SPOO_ME_API_KEY environment variable is not set${NC}"
    printf "Usage: export SPOO_ME_API_KEY='your-api-key' && %s\n" "$0"
    exit 1
fi

printf "%b\n" "${BLUE}========================================${NC}"
printf "%b\n" "${BLUE}spoo.me URL Shortener API Test${NC}"
printf "%b\n" "${BLUE}========================================${NC}"
printf "\n"

printf "%b\n" "${YELLOW}Configuration:${NC}"
printf "  API Base URL: %s\n" "$SPOO_ME_BASE_URL"
API_KEY_MASKED=$(printf "%.10s" "$SPOO_ME_API_KEY")
printf "  API Key: %s... (masked)\n" "$API_KEY_MASKED"
printf "  User Agent: %s\n" "$USER_AGENT"
printf "  Long URL: %s\n" "$LONG_URL"
printf "\n"

printf "%b\n" "${YELLOW}Request (POST with JSON body):${NC}"
printf "\n"

# Make POST request with JSON body (per docs.spoo.me)
curl -v \
  -X POST \
  --user-agent "$USER_AGENT" \
  --header "Content-Type: application/json" \
  --header "Authorization: Bearer $SPOO_ME_API_KEY" \
  --data "{\"long_url\":\"$LONG_URL\"}" \
  --connect-timeout 5 \
  --max-time 10 \
  "$SPOO_ME_BASE_URL" \
  2>&1 | tee /tmp/spoo_me_response.log

printf "\n"
printf "%b\n" "${YELLOW}Response summary:${NC}"

printf "\n"
printf "%b\n" "${BLUE}--- Response Headers ---${NC}"
grep "^< " /tmp/spoo_me_response.log | head -20

printf "\n"
printf "%b\n" "${BLUE}--- Response Body ---${NC}"
grep "^{" /tmp/spoo_me_response.log | tail -1 | python3 -m json.tool 2>/dev/null || \
  grep "^{" /tmp/spoo_me_response.log | tail -1

printf "\n"
printf "%b\n" "${GREEN}✅ Test complete. Full log saved to: /tmp/spoo_me_response.log${NC}"
