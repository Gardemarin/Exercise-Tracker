Exercise Tracker
------

How to use

GET users's exercise log: ```GET /api/exercise/log/{userId}?[&from][&to][&limit]```

{ } = required, [ ] = optional

from, to = dates (yyyy-mm-dd); limit = number

Example: ```/api/exercise/log/5894bc6ef2f49c313d0871e2?from="2017-02-06"&to="2017-02-20"&limit=5```
