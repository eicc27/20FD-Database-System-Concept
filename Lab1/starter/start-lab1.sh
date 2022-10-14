#!/bin/sh
has_node=$(type node)
if [[ "$has_node" =~ "not found" ]]; then
    echo "NodeJS does not exist on your computer PATH."
    exit 1
fi

echo "installing npm modules..."
npm install
echo "running lab1..."
npm run start