#!/bin/bash

echo "Testing Bikeathon API Endpoints"
echo "================================"

# Test athletes endpoint
echo -e "\n1. Testing /api/athletes endpoint:"
curl -s http://localhost:3000/api/athletes | head -c 200
echo "..."

# Test teams endpoint
echo -e "\n\n2. Testing /api/teams endpoint:"
curl -s http://localhost:3000/api/teams | head -c 200
echo "..."

# Test create-payment-intent endpoint
echo -e "\n\n3. Testing /api/create-payment-intent endpoint:"
curl -X POST http://localhost:3000/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{"amount": 50, "athleteId": 1}' \
  -s | head -c 300

echo -e "\n\nAll API endpoints tested!"