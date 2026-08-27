---
description: 'Sets a one-off wake-up timer. Argument: a time such as "3h", "90m", "01:45" or "in 2 hours". Example: `/wake 3h`'
---

# Wake-Up Timer

The user wants to be woken in a given amount of time. The argument is: $ARGUMENTS

## Step 1: find the current time

```bash
date +"%M %H %d %m"
```

## Step 2: work out the target time

Interpret the argument:
- `Xh` or `X hours` → current hour + X
- `Xm` or `X minutes` → current minute + X (carrying into hours)
- `HH:MM` → that exact time today (local time)
- `in X hours/minutes` → add accordingly

Derive minute, hour, day and month for the cron expression from it.
Pick a minute that does NOT end on :00 or :30 (shift by ±2 minutes if needed).

## Step 3: call CronCreate

Set up a **one-off** (recurring: false) job with:
- `cron`: `"<minute> <hour> <day> <month> *"` (local time, 5 fields)
- `recurring`: false
- `prompt`: `"Wake-up! The timer for '$ARGUMENTS' has fired. Tell the user their wake-up timer ($ARGUMENTS) has elapsed, that you are back, and ask what they want to do."`

## Step 4: confirm

Confirm briefly to the user:
- when the timer fires (local time)
- the job id
- the caveat that the session has to stay open
