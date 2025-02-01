#!/bin/sh
# An example of script. Memoize to not make request every second. 
MEMOIZE() {
    local CMD="$1"
    local TTL=${2:-60}  # Default 60s TTL
    
    # Generate a unique hash for the command
    local HASH=$(printf "%s" "$CMD" | sha256sum | cut -d' ' -f1)
    
    # Use variables with prefix MEMO_${HASH}_ to avoid collisions
    local LAST_TS_VAR="MEMO_${HASH}_TS"
    local LAST_RESULT_VAR="MEMO_${HASH}_RESULT"
    
    local CURRENT_TIME=$(date +%s)
    local LAST_TS=${!LAST_TS_VAR:-0}
    local LAST_RESULT=${!LAST_RESULT_VAR:-}
    
    # Return cached result if valid
    if [ $((CURRENT_TIME - LAST_TS)) -le $TTL ]; then
        printf "%s" "$LAST_RESULT"
        return 0
    fi
    
    # Execute and cache
    local RESULT=$(eval "$CMD" 2>&1)
    declare -g "$LAST_TS_VAR"=$CURRENT_TIME
    declare -g "$LAST_RESULT_VAR"="$RESULT"
    printf "%s" "$RESULT"
}

#######################################
# Main i3status loop
#######################################
i3status | while :
do
    read line
    
    SLOW_DATA=$(MEMOIZE "cryptopricectl" 30)  # 30s cache
    
    # Add your custom outputs before i3status
    echo "$SLOW_DATA | $line" || exit 1
done