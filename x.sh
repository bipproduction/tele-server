#!/bin/bash

# send message
function sendMessage() {
  curl -X POST http://localhost:3000/api/send \
    -F "id=-1002622442948" \
    -F "message=Test message" \
    -H "x-api-key: makuro"
}

# Send image
function sendImage() {
  curl -X POST http://localhost:3000/api/send-image \
    -F "id=-1002622442948" \
    -F "image=@gambar.jpg" \
    -F "caption=Test image" \
    -H "x-api-key: makuro"
}

sendImage