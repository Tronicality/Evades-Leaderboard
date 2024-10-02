# Evades Leaderboard
 Evades.io script to show recent runs on a leaderboard cuz HS managers can't.

- Using script

If you would like to use the script there are 2 ways to use it.
The direct link for the code is https://raw.githubusercontent.com/Tronicality/Evades-Leaderboard/refs/heads/main/script.js (you can just copy all of it with ctrl/cmd + a)

First method is to paste all of it into your console (for example if you are on chrome you can press f12 to access it) while on evades.io. The problem with this method is that you would need to paste it every time you refresh the page.

Second method is to get the web extension Tampermonkey. The you can paste all of it there, turn on updates and it will auto-update and apply the code everytime you refresh (Don't forget to turn on developer mode for tampermonkey otherwise it will not work).

If there's any errors you can open an issue or contact me on discord (.realityy)

 - API Endpoints

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