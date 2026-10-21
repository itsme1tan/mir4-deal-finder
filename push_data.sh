#!/bin/bash
# Box-side fallback: scrape locally, then push data.json. Needs GITHUB_TOKEN_MIR4 in env; token never stored.
set -e; cd /workspace/mir4-tool
U=https://github.com/itsme1tan/mir4-deal-finder.git
A="Authorization: Basic $(printf 'x-access-token:%s' "$GITHUB_TOKEN_MIR4" | base64 -w0)"
git -c http.extraheader="$A" pull -q --ff-only $U main
python3 scrape.py
git add data.json data cache/features.json cache/icons.json icons && git -c user.name=mir4-bot -c user.email=mir4@local commit -qm "Box refresh $(date +%F)" || exit 0
git -c http.extraheader="$A" push -q $U main
