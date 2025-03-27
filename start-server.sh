#!/bin/bash

# Get local IP address
IP_ADDRESS=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | grep -v '172.' | grep -v 'docker' | head -1 | awk '{print $2}')
PORT=5001

echo "==============================================="
echo "  Starting Phantom Bidders Server"
echo "==============================================="
echo ""
echo "Your server will be accessible at:"
echo "http://$IP_ADDRESS:$PORT"
echo ""
echo "Share this URL with others on your network to access the application"
echo ""
echo "==============================================="

# Start the server
cd server
node server.js 