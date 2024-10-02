# Evades Leaderboard
 Evades.io script to show recent runs on a leaderboard cuz HS managers can't.

API Endpoints
POST

- /get_runs/solo/map
Gets fastest solo runs from a certain map

body = {
    "region_name": "string",
    "area_index": "integer"
}

- /get_runs/solo/map/top
Gets top 10 solo runs from a certain map

body = {
    "region_name": "string",
    "area_index": "integer"
}

- /get_runs/solo/map/single
Gets a single players fastest run from a certain map

body = {
    "region_name": "string",
    "area_index": "integer",
    "username": "string"
}

- /get_runs/duo/map
Gets fastest duo runs from a certain map

body = {
    "region_name": "string",
    "area_index": "integer"
}

- /get_runs/duo/map/top
Gets top 10 duo runs from a certain map

body = {
    "region_name": "string",
    "area_index": "integer"
}

- /get_runs/duo/map/single
Gets a single duos fastest run from a certain map

body = {
    "region_name": "string",
    "area_index": "integer",
    "username": "string"
}

/get_rankings/player
Gets a map_rankings, points and position for a single player

body = {
    "username": "string"
}

/get_rankings/player/map
Gets a single map rank for a player

body = {
    "username": "string",
    "region_name": "string"
}

WIP
/get_runs/solo/limit - range of solo runs
/get_runs/duo/limit - range of duo runs


Definitions = {
    "region_name": "The area name that the user has won on",
    "area_index": "The area number that the user has won on, this is needed as it's only way to distinguish areas with multiple wins (like PP)",
    "username": "Self explanatory"
}