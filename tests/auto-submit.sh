#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: ./auto-submit.sh 'email,Name - Ward - Purpose,MM/DD/YYYY,Start Time,MM/DD/YYYY,End Time,Building'"
  echo ""
  echo "Example:"
  echo "  ./auto-submit.sh 'test@gmail.com,John Test - 8th Ward - Testing,04/22/2026,8:00 AM,04/22/2026,10:00 PM,Stake Center'"
  exit 1
fi

# Load Kindoo credentials from .env
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$SCRIPT_DIR/.env" ]; then
  export $(cat "$SCRIPT_DIR/.env" | xargs)
fi

BATCH="$1" RUN_REAL=1 npx playwright test submit-batch.spec.js --headed
