#!/usr/bin/env bash
# Resolve this script's own directory, so nothing here carries a user name.
here=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
input=$(cat)
pct=$(echo "$input" | python3 -c "
import sys, json
d = json.load(sys.stdin)
pct = d.get('context_window', {}).get('used_percentage')
if pct is not None:
    print(f'{pct:.1f}')
" 2>/dev/null)

result=$(echo "$input" | npx -y ccstatusline@latest --config "$here/ccstatusline-config.json")
result=$(echo "$result" | sed $'s/Model:\xc2\xa0Claude\xc2\xa0//' | sed $'s/Model:\xc2\xa0//')

if [ -n "$pct" ]; then
  nbsp=$'\xc2\xa0'
  result=$(echo "$result" | sed "s/Ctx:${nbsp}\\([^${nbsp}]*\\)${nbsp}/Ctx:${nbsp}\\1 (${pct}%)${nbsp}/")
fi

echo "$result"
