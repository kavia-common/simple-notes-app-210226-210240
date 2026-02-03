#!/bin/bash
cd /home/kavia/workspace/code-generation/simple-notes-app-210226-210240/notes_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

