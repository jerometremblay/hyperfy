#!/bin/sh
set -eu

key=$(/usr/bin/security find-generic-password -a codex -s polyfork-hyperfy -w)
printf '{"Authorization":"Bearer %s"}\n' "$key"
