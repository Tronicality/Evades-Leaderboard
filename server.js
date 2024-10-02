// Server hosted on glitch.com

const fs = require('fs');
const axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');


// Setting up server
const app = express()
const PORT = 3000

// Middleware
app.use(bodyParser.json())
app.use(cors())

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.get('/', (req, res) => {
  res.send('Server is running and received a ping!');
});

// Handling database
async function getRuns(offset = 0) {
    while (true) {
        try {
            const response = await axios.get(`https://evades.io/api/runs?offset=${offset}`)
            return response.data
        }
        catch {
            console.log("Evades API is bugging")
        }
    }
}

async function getRangedRuns(amount, start = 0, step = 50) {
    let runs = [];

    for (let offset = start; offset < amount; offset = offset + step) {
        const newRuns = await getRuns(offset);
        runs = runs.concat(newRuns);
    }
  
    console.log(`latest_run_added: ${runs[0].username}(${runs[0].hero}) doing ${runs[0].region_name}(${runs[0].area_index}) with ${runs[0].survival_time}s`);
    //console.log("Returning: " + runs[runs.length - 1].username)
    return runs;
}

async function getTotalAmountOfRuns() {
    const count = await getRuns()

    return count[0].id
}

const baseURL = process.env.baseURL
const apiKey = process.env.apiKey
async function callDatabase(query, data, controller) {
    const response = await axios({
        method: 'POST',
        url: baseURL + query,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Request-Headers': '*',
            'api-key': apiKey
        },
        data: data,
        signal: controller.signal
    })
    
    if (query.includes("One")) {
        return response.data.document
    }
    return response.data.documents
}

async function callDatabaseStatus(action, data) {
    const response = await axios({
        method: 'post',
        url: baseURL + action,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Request-Headers': '*',
            'api-key': apiKey
        },
        data: data
    })

    return response
}

function readJson(filePath) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
}

function writeJson(file, data) {
    fs.writeFileSync(file, JSON.stringify(data), 'utf8');
}

async function getDocumentCountInDatabase() {
    const count = await readJson("amount.json")
    return count.amount
    
    /*
    const data = {
        "collection": "runs",
        "database": "leaderboards",
        "dataSource": "Evades-Runs",
        "pipeline": [{"$count": "amount"}]
    }

    const databaseData = await callDatabase("aggregate", data)

    return databaseData.data.documents[0].amount
    */
}

async function postNewRuns(newRuns) {
    const data = {
        "collection": "runs",
        "database": "leaderboards",
        "dataSource": "Evades-Runs",
        "documents": newRuns
    }
    const status = await callDatabaseStatus("insertMany", data)

    if (status && status.status !== 200) {
        console.log(status)
    }
}

function removeDuplicateRuns(newRuns, runAmountDifference) {
    const length = newRuns.length
    for (let i = 0; i < length - runAmountDifference; i++) {
        newRuns.pop()
    }
    return newRuns
}

let offloadRuns = new Set()
function handleOffload(run) {
    if (offloadRuns.has(run)) {
        offloadRuns.delete(run)
    }
    else {
        offloadRuns.add(run)
    }
}

function findAdjacentTimestamps(epochTimestamp, timeRange) {
    const date = new Date(epochTimestamp * 1000);
    //const timeRange = 60 //seconds

    // Calculate before and after
    const timeBefore = new Date(date.getTime() - timeRange * 1000);
    const timeAfter = new Date(date.getTime() + timeRange * 1000);

    // Convert back to epoch timestamps (in seconds)
    const epochTimeBefore = Math.floor(timeBefore.getTime() / 1000);
    const epochTimeAfter = Math.floor(timeAfter.getTime() / 1000);

    return {"before": epochTimeBefore, "after": epochTimeAfter};
}

function validateLinkedRun(desiredRun, differentRun, timestamps = undefined) {
    if (desiredRun.id === differentRun.id) {
        return false // Same run found
    }

    if (!isSameDuoNames(desiredRun, differentRun)) {
        return false
    }

    if (desiredRun.region_name !== differentRun.region_name) {
        return false
    }

    if (desiredRun.area_index !== differentRun.area_index) {
        return false
    }

    if (timestamps) {
        if (timestamps.before > differentRun.created_at || timestamps.after < differentRun.created_at) {
            return false
        }
    }

    return true
}

async function findDuoPair(desiredRun, allRuns) {
    const timestamps = findAdjacentTimestamps(desiredRun.created_at, 60);

    // If given a list check if its in the list
    for (const differentRun of allRuns) {
        if (validateLinkedRun(desiredRun, differentRun, timestamps)) { // Find potential pairs
            offloadRuns.delete(desiredRun)

            return differentRun;
        }
    }

    //Handle Offload
    handleOffload(desiredRun);

    /*
    //find within 2 minutes of created_at time
    // original as a optional parameter
    const result = await findCloseByRuns(originalRun, desiredRun)
    return result
    */
   return undefined
}

function isSameDuoNames(desiredRun, differentRun) {
    // Does not include same run
    if (desiredRun.username === differentRun.interactions[0] || desiredRun.interactions[0] === differentRun.username) {
        return true
    }

    return false
}

function hasDuoRunBeenFormatted(desiredRun, AllRuns) {
    for (let differentRun of AllRuns) {
        if (differentRun.region_name === desiredRun.region_name && differentRun.area_index === desiredRun.area_index) {
            if (!differentRun.interactions) {
                // This specific run has already been formatted, so reversing the format (interactions does not exist in the new format)
    
                differentRun = {
                    "username": differentRun.players[0].username,
                    "interactions": [differentRun.players[1].username]
                }
            }

            if (isSameDuoNames(desiredRun, differentRun)) {
                return true
            }
        }   
    }

    return false
}

async function formatDuoRuns(runs) {
    let duoPairs = []
    //Find duo pair
    for (const run of [...Array.from(offloadRuns), ...runs]) {
        if (!hasDuoRunBeenFormatted(run, duoPairs)) {
            const duoPairRun = await findDuoPair(run, runs)

            if (duoPairRun) {
                //combine duo pair run into 1

                const formattedResult = {
                    "players": [
                        {
                            "id": run.id,
                            "username": run.username,
                            "hero": run.hero,
                            "exp_level": run.exp_level,
                            "survival_time": run.survival_time,
                            "created_at": run.created_at
                        },
                        {
                            "id": duoPairRun.id,
                            "username": duoPairRun.username,
                            "hero": duoPairRun.hero,
                            "exp_level": duoPairRun.exp_level,
                            "survival_time": duoPairRun.survival_time,
                            "created_at": duoPairRun.created_at
                        }
                    ],
                    "final_survival_time": run.survival_time > duoPairRun.survival_time ? run.survival_time : duoPairRun.survival_time,
                    "region_name": run.region_name,
                    "area_index": run.area_index,
                    "is_solo": false
                }

                duoPairs.push(formattedResult)
            }            
        }    
    }
    
    return duoPairs
}

function formatSoloRuns(runs) {
    for (let run of runs) {
        run.is_solo = true;
        delete run.interactions
    }
    return runs
}

async function formatRuns(runs) {
    let soloRuns = runs.filter(run => run.interactions.length === 0)
    let duoRuns = runs.filter(run => run.interactions.length === 1)

    soloRuns = formatSoloRuns(soloRuns)
    duoRuns = await formatDuoRuns(duoRuns)
    
    return soloRuns.concat(duoRuns)

    //return runs
}

const databaseCrossCheck = async () => {
    try {
        const evadesRunAmount = await getTotalAmountOfRuns()
        const runAmountDifference = evadesRunAmount - await getDocumentCountInDatabase()
        
        if (runAmountDifference > 0) {
        let missingRuns = await getRangedRuns(runAmountDifference)

        missingRuns = removeDuplicateRuns(missingRuns, runAmountDifference)
        missingRuns = await formatRuns(missingRuns)
        
        if (missingRuns.length > 0) {
            await postNewRuns(missingRuns)
        }
        
        writeJson("amount.json", {"amount": evadesRunAmount})
        
        console.log("new amount: " + evadesRunAmount)
        console.log(`${runAmountDifference} new run(s) added`)
        }
        else {
            console.log("No new runs added")
        }
    }
    catch {
        console.log("Evades or Mongodb is down :(")
    }
    console.log()
}

// Handle calls
const regions = {
    "Burning Bunker": 36,
    "Burning Bunker Hard": 36,
    "Central Core": 40,
    "Central Core Hard": 40,
    "Cyber Castle": 15,
    "Cyber Castle Hard": 22,
    "Catastrophic Core": 40,
    "Coupled Corridors": 64,
    "Dangerous District": 80,
    "Dangerous District Hard": 80,
    "Dusty Depths": 20,
    "Elite Expanse": 80,
    "Elite Expanse Hard": 80,
    "Endless Echo": 0,
    "Endless Echo Hard": 0,
    "Frozen Fjord": 40,
    "Frozen Fjord Hard": 40,
    "Glacial Gorge": 40,
    "Glacial Gorge Hard": 40,
    "Grand Garden": 28,
    "Grand Garden Hard": 28,
    "Humongous Hollow": 80,
    "Humongous Hollow Hard": 80,
    "Haunted Halls": 16,
    "Infinite Inferno": 38,
    "Monumental Migration 120": 120,
    "Monumental Migration 480": 480,
    "Magnetic Monopole": 36,
    "Magnetic Monopole Dipole": 35,
    "Magnetic Monopole Hard": 36,
    "Magnetic Monopole Dipole Hard": 35,
    "Mysterious Mansion Hedge": 59, //Hat
    "Mysterious Mansion Liminal": 60,
    "Mysterious Mansion Attic": 61,
    "Mysterious Mansion Cryptic": 62, //Hero
    "Ominous Occult": 16,
    "Ominous Occult Hard": 16,
    "Peculiar Pyramid Inner": 29,
    "Peculiar Pyramid Perimeter": 31,
    "Peculiar Pyramid Inner Hard": 29,
    "Peculiar Pyramid Perimeter Hard": 31,
    "Quiet Quarry": 40,
    "Quiet Quarry Hard": 40,
    "Restless Ridge": 43,
    "Restless Ridge Hard": 47,
    "Shifting Sands": 47,
    "Toxic Territory": 20,
    "Toxic Territory Hard": 20,
    "Vicious Valley": 40,
    "Vicious Valley Hard": 40,
    "Wacky Wonderland": 80,
    "Wacky Wonderland Hard": 80,
    "Withering Wasteland": 40
}
const multipleWinRegions = { // Key: area number, Value: Specified map end point
    "Monumental Migration": {
        120: "Monumental Migration 120",
        480: "Monumental Migration 480"
    },
    "Magnetic Monopole": {
        35: "Magnetic Monopole Dipole",
        36: "Magnetic Monopole"
    },
    "Magnetic Monopole Hard": {
        35: "Magnetic Monopole Dipole Hard",
        36: "Magnetic Monopole Hard"
    },
    "Mysterious Mansion": {
        59: "Mysterious Mansion Hedge", //Hat
        60: "Mysterious Mansion Liminal",
        61: "Mysterious Mansion Attic",
        62: "Mysterious Mansion Cryptic" //Hero
    },
    "Peculiar Pyramid": {
        29: "Peculiar Pyramid Inner",
        31: "Peculiar Pyramid Perimeter"
    },
    "Peculiar Pyramid Hard": {
        29: "Peculiar Pyramid Inner Hard",
        31: "Peculiar Pyramid Perimeter Hard"
    }
}

const altList = { // key: AltName, value: Main Name
    "ö": "Vikenti",
    "WeDieAtEEH": "Vikenti",
    "Maytuix": "R0YqL",
    "Evelynn": "R0YqL",
    "R0‎YqL": "R0YqL",
    "WeDieAtCC2": "R0YqL",
    "Oplus": "R0YqL",
    "चमक" : "Bluemonkey14",
    "HumogousHollowWR": "Bluemonkey14",
    "Oriku": "Zxynn",
    "Aеther": "Rxpct",
    "globeX": "Invi",
    "Ventinari0": "Ventinari",
    "Purplegorilla15": "Jimbo",
    "Flamingo": "Oxymoronic",
    "Br2h": "Br1h",
    "Br3h": "Br1h",
    "Br4h": "Br1h",
    "Tronical": "Br1h",
    "𝓐𝓜𝓐𝓢𝓣𝓔𝓡": "Amasterclasher",
    "VentriloquistMan": "Amasterclasher",
    "LadicalRarry": "RadicalLarry",
    "notlind": "lindsay",
    "Stym": "lindsay",
    "Bot1": "Strat",
    "Bot2": "Strat",
    "Bot3": "Strat",
    "Bot4": "Strat",
    "Bot5": "Strat",
    "yespiger": "piger",
    "nopiger": "piger",
    "🐻‍❄️": "merin",
    "begro": "tтеуmlI", 
    "Gսest9113": "9113Guest",
    "crunchypoop43": "9113Guest",
    "PoppaSnail": "9113Guest",
    "vessel": "9113Guest",
    "owen1514": "9113Guest",
    "lemmeeyp😭": "9113Guest",
    "gangstermonkey69": "9113Guest",
    "squirrelkiller11": "9113Guest",
    "sgtsquirt": "9113Guest",
    "Purplegorilla15": "9113Guest",
    "MikuMikuMikuMiku": "bonox2",
    "tvorecsnovMiku": "bonox2",
    "itsu": "bonox2",
    "банда крутых": "bonox2",
    "Sqwed": "CIROATM",
    "eagle451": "eagle45",
    "eagle452": "eagle45",
    "eagle453": "eagle45",
    "ofwkpow": "Greeny",
    "carnation": "Greeny",
    "Groen": "Greeny",
    "Mirage​​": "Greeny",
    "hoodlumgorilla69": "Unluckyuser",
    "ThatHodgeGuy": "Hodge",
    "TheSnake": "lazer3",
    "NoJoker:D": "JokeR:D",
    "Bun Bun 🐰": "Bunny 🐰 :)",
    "TamagoPudding": "Lilial",
    "Jungle ‮🐵yeknoM": "Tsuba",
    "trentsigma": "Darkai",
    "õ": "Exobyte",
    "GayDogPower": "Exobyte",
    "rainstorm": "Lunari",
    "Bo1t": "Lunari",
    "Kwazi": "denji",
    "zxсursed": "CatManPro",
    "CatManAlt1": "CatManPro",
    "CatManAlt2": "CatManPro",
    "CatManAlt3": "CatManPro",
    "CatManAlt5": "CatManPro",
    "Cookiezi": "Ardently",
    "NameGame2": "ThenameGame",
    "NameGame3": "ThenameGame",
    "NameGame5": "ThenameGame",
    "themfwhoasked1": "themfwhoasked",
    "themfwhoasked2": "themfwhoasked",
    "themfwhoasked3": "themfwhoasked",
    "Lumik1": "Lumik",
    "Lumik2": "Lumik",
    "Lumik3": "Lumik",
    "Lumik4": "Lumik",
    "Frauderix": "•RoSe•",
    "•eSoR•": "•RoSe•",     
    "🌔Moon🌔": "MagmaxOnly",
    "типаПРO": "GayFuryFemboy",
    "Somebody77Alt": "Somebody77",
    "𝓟𝓘𝓝𝓔𝓜𝓞_alt": "𝓟𝓘𝓝𝓔𝓜𝓞",
    "nightmare001alt1": "nightmare001",
    "Kingbob14": "Kingbob13",
    "Kingbob15": "Kingbob13",
    "Kingbob13alt1": "Kingbob13",
    "bobbyalt123456": "bobby123456",
    "SharkyAlt": "Sharkys",
    "SharkyAlt2": "Sharkys",
    "ProgramAlt": "Program",
    "SJK1": "SJK",
    "Dman4q2Alt": "Dman4q2",
    "DonovanDeliaAlt0": "DonovanDelia",
    "DonovanDeliaAlt": "DonovanDelia",
    "DonovanDeliaAlt2": "DonovanDelia",
    "DonovanDeliaAlt3": "DonovanDelia",
    "DonovanDeliaAlt4": "DonovanDelia",
    "DonovanDeliaAlt5": "DonovanDelia",
    "DonovanDeliaAlt6": "DonovanDelia",
    "DonovanDeliaAlt7": "DonovanDelia",
    "DonovanDeliaAlt8": "DonovanDelia",
    "DonovanDeliaAlt9": "DonovanDelia",
    "mrztraineralt": "MrzTrainer",
    "VNPMVPalt": "VNPMVP",
    "VNPMVPalt2": "VNPMVP",
    "giorg1": "giorg",
    "giorg2": "giorg",
    "giorg3": "giorg",
    "Young💕_alt": "Young💕",
    "Young💕_alt2": "Young💕",
    "a single friend": "a single friend",
    "rainstorm": "Lunari",
    "░▒▓गớჳӣҭӣɃ▓▒░1": "░▒▓गớჳӣҭӣɃ▓▒░",
    
    "░▒▓गớჳӣҭӣɃ▓▒░2": "░▒▓गớჳӣҭӣɃ▓▒░",
    "𝓟𝓘𝓝𝓔𝓜𝓞2": "𝓟𝓘𝓝𝓔𝓜𝓞",
    "♔𝒢𝒜𝑀𝐸~oVeR♔✭": "♔𝒢𝒜𝑀𝐸~oVeR♔✭",
    "Airporthobo2": "Airporthobo",
    "Excord": "JaaZ1",
    "𝖦𝗎𝖾𝗌𝗍Hihi": "hihi:D",
    "0144": "Zero〩"
}

function findMap(region_name, area_index) {
    // Converts region_names into acceptable formats and checks if region_name is allowed
    try {
        return multipleWinRegions[region_name][area_index]
    }
    catch {
        if ("Endless Echo Hard".includes(region_name)) {
            return region_name
        }

        return (regions[region_name] === area_index) ? region_name : undefined
    }
}

function checkSpecificCase(run) {
    // Filter out runs based on scenarios (given scenarios are the if statements)
    const bannedNames = new Set([
        "DDBus", // Dev
        "Lime", // Dev
        "PotaroNuke", // Dev
        "Amasterdevster", // Dev
        "TheTroll", // Too much effort to segregate
        "myballshurt", // Too much effort to segregate
        "Pono", // Bug with mod hidden names
        "Weyofae60", // Bug with mod hidden names
        "puvuo80", // Bug with mod hidden names
        "SharedAccount01", // TAS / Shared Account
        "helmet", // Shared Account
        "Aekiyra", // TAS
        "5302", // TAS
        "7989", // TAS
        "dominant", // TAS
        "fushimirio", // TAS
        "nienawiść", // TAS
        "Игорь72019", // TAS
        "femalevent", // TAS
        "Ayubbie2", // TAS
        "Вишня", // TAS
        "EvadesTAS" // TAS
    ])
    const caseChanges = { // Every attribute from the run is able to be checked upon
        "hero": {
            "Euclid": 1722801600,
            "Glob": 1722801600,
            "Stheno": 1722801600,
            "Demona": 1720123200,
            "Cybot": 1727463600,
            "Factorb": 1722801600,
            "Ignis": 1722801600,
            "Mortuus": 1722801600,
            "Rime": 17233632000
        },
        "region_name": {
            "Glacial Gorge Hard": 1718568000,
            "Quiet Quarry Hard": 1720987200,
            "Quiet Quarry": 1722801600,
            "Cyber Castle": 1722801600,
            "Cyber Castle Hard": 1722801600,
            "Humongous Hollow": 1722801600,
            "Endless Echo": 1722801600,
            "Endless Echo Hard": 1722801600,
            "Shifting Sands": 1722801600
        }
    }
    
    const validateRun = (run) => {
        // Validating by created_at time
        // Checking for updates against case (eg: hero, map) changes
        for (const [key, values] of Object.entries(caseChanges)) {
            for (const [attribute, time] of Object.entries(values)) {
                if (run[key] === attribute) {
                    if (run.created_at < time) {
                        return false
                    }
                }
            }
        }

        // Validating by name
        if (bannedNames.has(run.username)) {
            return false
        }

        return true
    }
    const convertDuoPlayerToSolo = (desiredPlayerName, run) => {
        let player = run.players.find(player => player.username === desiredPlayerName)
        
        const { region_name, area_index, is_solo } = run
        return {...player, region_name, area_index, is_solo }
    }
    const getAltName = (username) => {
        return (altList[username] || username)
    }

    // Validate by map
    const map = findMap(run.region_name, run.area_index)
    if (!map) {
        return [run, false]
    }

    if (run.is_solo) {
        if (!validateRun(run)) {
            return [run, false]
        }

        run.username = getAltName(run.username)
    }
    else{
        for (let player of run.players) {
            if (!validateRun(convertDuoPlayerToSolo(player.username, run))) {
                return [run, false]
            }

            player.username = getAltName(player.username)
        }

        // Check if person is duoing by themselves
        if (run.players[0].username === run.players[1].username) {
            return [run, false]
        }
    }

    return [run, true]
}

function FilterSoloRuns(runs, limit = undefined) {
    let result = []
    let usernames = new Set()
    
    for (let run of runs) {
        // Limiting amount of results
        if (limit) {
            if (result.length >= limit) {
                break
            }
        }

        [run, valid] = checkSpecificCase(run);

        // Adding run
        if (valid) {
            if (!usernames.has(run.username)) {
                usernames.add(run.username)
                result.push(run)
            }
        }
    }

    if (result.length === 0) {
        return null
    }
    else if (result.length === 1) {
        return result[0]
    }

    return result
}

function getDuoIdentifier(usernames) {
    usernames.sort()
    return `${usernames[0]} & ${usernames[1]}`
}

function FilterDuoRuns(runs, limit = undefined) {
    let result = []
    let usernames = new Set()
    
    for (let run of runs) {
        // Limiting amount of results
        if (limit) {
            if (result.length >= limit) {
                break
            }
        }

        [run, valid] = checkSpecificCase(run);

        // Adding run
        if (valid) {
            const duoId = getDuoIdentifier([run.players[0].username, run.players[1].username]);

            if (!usernames.has(duoId)) {
                usernames.add(duoId)
                result.push(run)
            }
        }
    }

    if (result.length === 0) {
        return null
    }
    else if (result.length === 1) {
        return result[0]
    }
    
    return result
}

app.post('/get_rankings/player', async (req, res) => {
    // request = {"username"}
    const username = (altList[req.body.username] || req.body.username)
    
    const data = {
        "collection": "players",
        "database": "leaderboards",
        "dataSource": "Evades-Runs",
        "filter": { username: username }
    }

    const controller = new AbortController()
    req.socket.on("close", () => {
        controller.abort(`${username} has disconnected`)
    })

    try {
        const rank = await callDatabase('findOne', data, controller)
        if (res.headersSent) {
            res.send(rank)
        }
    }
    catch (err){
        if (err.name !== axios.CanceledError.name) {
            console.log(err)
            res.status(500).send("Internal Error")
        }
    }
})

app.post('/get_rankings/player/map', async (req, res) => {
    // request = {"username", "region_name"}
    console.log(req.body)

    const username = (altList[req.body.username] || req.body.username)
    const area_index = req.body.area_index
    const region_name = findMap(req.body.region_name, area_index) || req.body.region_name
    const map_rank_key = `map_rankings.${region_name}`
    
    const data = {
        "collection": "players",
        "database": "leaderboards",
        "dataSource": "Evades-Runs",
        "filter": { username: username },
        "projection": { _id: 0, [map_rank_key]: 1 }
    }

    const controller = new AbortController()
    req.socket.on("close", () => {
        controller.abort(`${username} has disconnected`)
    })

    try {
        const map_rank = await callDatabase('findOne', data, controller)

        if (!res.headersSent) {
            res.send(map_rank.map_rankings[region_name])
        }
        else {
            console.log("Aborted")
        }
    }
    catch (err){
        if (err.name !== axios.CanceledError.name) {
            console.log(err)
            res.status(500).send("Internal Error")
        }
    }
})

app.post('/get_runs/solo/map', async (req, res) =>{
    //request = {"region_name": "string", "area_index": "integer"}
    const region_name = req.body.region_name
    const area_index = req.body.area_index
    
    let pipeline
    if ("Endless Echo Hard".includes(region_name)) {
        pipeline = [
            {
                '$match': {
                    'is_solo': true,
                    'region_name': region_name
                }
            }, {
                '$sort': {
                    'area_index': -1,
                    'survival_time': 1,
                    'created_at': 1
                }
            }
        ]
    }
    else {
        pipeline = [
            {
                '$match': {
                    'is_solo': true,
                    'region_name': region_name,
                    'area_index': area_index
                }
            }, {
                '$sort': {
                    'survival_time': 1,
                    'created_at': 1
                }
            }
        ]
    }

    const data = {
        "collection": "runs",
        "database": "leaderboards",
        "dataSource": "Evades-Runs",
        "pipeline": pipeline
    }

    const controller = new AbortController()
    req.socket.on("close", () => {
        controller.abort("Player has disconnected")
    })

    try {
        const runs = await callDatabase('aggregate', data, controller)
        
        if (!res.headersSent) {
            res.send(FilterSoloRuns(runs))
        }
    }
    catch (err){
        if (err.name !== axios.CanceledError.name) {
            console.log(err)
            res.status(500).send("Internal Error")
        }
    }
})

app.post('/get_runs/solo/map/top', async (req, res) => {
    // request = {"region_name": string, "area_index": integer}

    const controller = new AbortController()
    req.socket.on("close", () => {
        controller.abort(`Player has disconnected`)
    })

    const region_name = req.body.region_name;
    const area_index = req.body.area_index
  
    let pipeline = []
    if ("Endless Echo Hard".includes(region_name)) {
        pipeline = [
            {
                '$match': {
                    'is_solo': true,
                    'region_name': region_name
                }
            }, {
                '$sort': {
                    'area_index': -1,
                    'survival_time': 1,
                    'created_at': 1
                }
            }, {
                '$limit': 3000
            }
        ]
    }
    else {
        pipeline = [
            {
                '$match': {
                    'is_solo': true,
                    'region_name': region_name,
                    'area_index': area_index
                }
            }, {
                '$sort': {
                    'survival_time': 1,
                    'created_at': 1
                }
            }, {
                '$limit': 200
            }
        ]
    }

    const data = {
        "collection": "runs",
        "database": "leaderboards",
        "dataSource": "Evades-Runs",
        "pipeline": pipeline
    }

    try {
        const runs = await callDatabase('aggregate', data, controller)
        if (!res.headersSent) {
            res.json(FilterSoloRuns(runs, 10))
        }
    }
    catch (err){
        if (err.name !== axios.CanceledError.name) {
            console.log(err)
            res.status(500).send("Internal Error")
        }
    }
})

app.post('/get_runs/solo/map/single', async (req, res) => {
    // request = {"region_name": string, "area_index": integer, "username": string}
    const region_name = req.body.region_name;
    const area_index = req.body.area_index
    const username = (altList[req.body.username] || req.body.username)
    
    let pipeline = []
    if ("Endless Echo Hard".includes(region_name)) {
        pipeline = [
            {
                '$match': {
                    'is_solo': true,
                    'username': username,
                    'region_name': region_name
                }
            }, {
                '$sort': {
                    'area_index': -1,
                    'survival_time': 1,
                    'created_at': 1
                }
            }, {
                '$limit': 500
            }
        ]
    }
    else {
        pipeline = [
            {
                '$match': {
                    'is_solo': true,
                    'username': username,
                    'region_name': region_name,
                    'area_index': area_index
                }
            }, {
                '$sort': {
                    'survival_time': 1,
                    'created_at': 1
                }
            }, {
                '$limit': 10
            }
        ]
    }

    const data = {
        "collection": "runs",
        "database": "leaderboards",
        "dataSource": "Evades-Runs",
        "pipeline": pipeline
    }

    const controller = new AbortController()
    req.socket.on("close", () => {
        controller.abort(`${username} has disconnected`)
    })

    try {
        const runs = await callDatabase('aggregate', data, controller)

        if (!res.headersSent) {
            res.json(FilterSoloRuns(runs, 1))
        }
    }
    catch (err){
        if (err.name !== axios.CanceledError.name) {
            console.log(err)
            res.status(500).send("Internal Error")
        }
    }
})

app.post('/get_runs/duo/map', async (req, res) =>{
    //request = {"region_name": "string", "area_index": "integer"}
    const region_name = req.body.region_name;
    const area_index = req.body.area_index
    
    let pipeline = []
    if ("Endless Echo Hard".includes(region_name)) {
        pipeline = [
            {
                '$match': {
                    'is_solo': false,
                    'region_name': region_name
                }
            }, {
                '$sort': {
                    'area_index': -1,
                    'final_survival_time': 1,
                    'created_at': 1
                }
            }
        ]
    }
    else {
        pipeline = [
            {
                '$match': {
                    'is_solo': false,
                    'region_name': region_name,
                    'area_index': area_index
                }
            }, {
                '$sort': { 'final_survival_time': 1, 'created_at': 1 }
            }
        ]
    }

    const data = {
        "collection": "runs",
        "database": "leaderboards",
        "dataSource": "Evades-Runs",
        "pipeline": pipeline
    }

    const controller = new AbortController()
    req.socket.on("close", () => {
        controller.abort("Player has disconnected")
    })


    try {
        const runs = await callDatabase('aggregate', data, controller)

        if (!res.headersSent) {
            res.send(FilterDuoRuns(runs))
        }
    }
    catch (err){
        if (err.name !== axios.CanceledError.name) {
            console.log(err)
            res.status(500).send("Internal Error")
        }
    }
})

app.post('/get_runs/duo/map/top', async (req, res) => {
    // request = {"region_name": string, "area_index": integer}
    const region_name = req.body.region_name;
    const area_index = req.body.area_index
    

    let pipeline = []
    if ("Endless Echo Hard".includes(region_name)) {
        pipeline = [
            {
                '$match': {
                    'is_solo': false,
                    'region_name': region_name
                }
            }, {
                '$sort': {
                    'area_index': -1,
                    'final_survival_time': 1,
                    'created_at': 1
                }
            }, {
                '$limit': 3000
            }
        ]
    }
    else {
        pipeline = [
            {
                '$match': {
                    'is_solo': false,
                    'region_name': region_name,
                    'area_index': area_index
                }
            }, {
                '$sort': { 'final_survival_time': 1, 'created_at': 1 }
            }, {
                '$limit': 200
            }
        ]
    }

    const data = {
        "collection": "runs",
        "database": "leaderboards",
        "dataSource": "Evades-Runs",
        "pipeline": pipeline
    }

    const controller = new AbortController()
    req.socket.on("close", () => {
        controller.abort("Player has disconnected")
    })

    try {
        const runs = await callDatabase('aggregate', data, controller)

        if (!res.headersSent) {
            res.json(FilterDuoRuns(runs, 10))
        }
    }
    catch (err){
        if (err.name !== axios.CanceledError.name) {
            console.log(err)
            res.status(500).send("Internal Error")
        }
    }
})

app.post('/get_runs/duo/map/single', async (req, res) => { // note needs huge changes if picking slower duo run
    // request = {"region_name": string, "area_index": integer, "username": string}
    const region_name = req.body.region_name;
    const area_index = req.body.area_index
    const username = (altList[req.body.username] || req.body.username)

    
    let pipeline = []
    if ("Endless Echo Hard".includes(region_name)) {
        pipeline = [
            {
                '$match': {
                    'is_solo': false,
                    'players': { "$elemMatch": { "username": username } },
                    'region_name': region_name
                }
            }, {
                '$sort': {
                    'area_index': -1,
                    'final_survival_time': 1,
                    'created_at': 1
                }
            }, {
                "$limit": 500
            }
        ]
    }
    else {
        pipeline = [
            {
                '$match': {
                    'is_solo': false,
                    'players': { "$elemMatch": { "username": username } },
                    'region_name': region_name,
                    'area_index': area_index
                }
            }, {
                '$sort': { 'final_survival_time': 1, 'created_at': 1 }
            }, {
                '$limit': 10
            }
        ]
    }

    const data = {
        "collection": "runs",
        "database": "leaderboards",
        "dataSource": "Evades-Runs",
        "pipeline": pipeline
    }

    const controller = new AbortController()
    req.socket.on("close", () => {
        controller.abort(`${username} has disconnected`)
    })

    try {
        const runs = await callDatabase('aggregate', data, controller)

        if (!res.headersSent) {
            const run = FilterDuoRuns(runs, 1)

            if (run !== null) {
                run.players.find(player => player.username === username).username = req.body.username
            }
            
            res.json(run)   
        }
    }
    catch (err){
        if (err.name !== axios.CanceledError.name) {
            console.log(err)
            res.status(500).send("Internal Error")
        }
    }
})

databaseCrossCheck()
setInterval(databaseCrossCheck, 60 * 1000) // Every minute