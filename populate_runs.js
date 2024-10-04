// Calling MongoDB
const axios = require('axios');
const baseURL = ""
const apiKey = ""

async function callDatabase(action, data) {
    try{
        const response = await axios({
            method: 'post',
            url: baseURL + action,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Request-Headers': '*',
                'api-key': apiKey,
            },
            data: data
        })

        return response
    }
    catch(e) {
        console.log(e)
    }
}

async function postData(collection, documents) {
    const data = {
        "collection": collection,
        "database": "leaderboards",
        "dataSource": "Evades-Runs",
        "documents": documents
    }
    const status = await callDatabase("insertMany", data)

    await status
    if (status.status != 201) {
        console.log(status)
    }
}

async function limitPost(limit, collection, documents) {
    if (Number.isInteger(limit) && limit > 0) {
        for (let i = 0 ; i < documents.length ; i = i + limit) {
            let limitedDocuments = []
            for (let j = i ; j < i + limit ; j++) {
                if (documents[j]) {
                    limitedDocuments.push(documents[j])
                }
                else {
                    break
                }
            }
            
            await postData(collection, limitedDocuments)
        }

        return "Attempted to post data"
    }

    return new Error("Limit is not an integer")
}

// Calling Evades API
async function getRuns(offset = 0) {
    const response = await fetch(`https://evades.io/api/runs?offset=${offset}`)
    return response.json();
}

async function getTotalAmountOfRuns() {
    let count = await getRuns()

    return count[0].id
}

async function getRangedRuns(amount, start = 0) {
    let runs = []

    for (let offset = start; offset > amount; offset = offset - 50) {
        const newRuns = await getRuns(offset);

        try {
            if (!newRuns[0].id) continue
        }
        catch {
            console.log("Up to date Call")
            break
        }
        runs = runs.concat(newRuns);
        //console.log(`Run number: ${runs[runs.length - 1].id}, Latest run added: ${runs[runs.length - 1].username}`);
    }
    runs.sort((a, b) => a.id - b.id)

    return runs;
}

// Formatting
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

function isSameDuoNames(desiredRun, differentRun) {
    // Does not include same run
    if (desiredRun.username === differentRun.interactions[0] || desiredRun.interactions[0] === differentRun.username) {
        return true
    }

    return false
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

function handleOffload(run) {
    if (offloadRuns.has(run)) {
        offloadRuns.delete(run)
    }
    else {
        offloadRuns.add(run)
    }
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

function hasDuoRunBeenFormatted(desiredRun, allRuns) {
    for (let differentRun of allRuns) {
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

    //return runs  146423
}

// Populate Players
function calcPlayerRank(maps, desiredPlayerName) {
    const calcSoloCount = (username, runs) => {
        for (let i = 0; i < runs.length ; i++) {
            if (runs[i].username === username) {
                return i + 1
            }
        }
        return runs.length + 1
    }
    const calcDuoCount = (username, runs) => {
        for (let i = 0; i < runs.length ; i++) {
            for (const player of [runs[i].players[0].username, runs[i].players[1].username]) {
                if (player === username){
                    return i + 1
                }
            }
        }
        
        return runs.length + 1
    }

    const rank = {}
    for (const [map, runs] of Object.entries(maps)) {
        rank[map] = { "solo": calcSoloCount(desiredPlayerName, runs.solo), "duo": calcDuoCount(desiredPlayerName, runs.duo) }
    }

    return rank
}

function findPlayerPoints(mapRankings) {
    let soloPoints = 0;
    let duoPoints = 0;

    for (const place of Object.values(mapRankings)) {
        soloPoints += place.solo
        duoPoints += place.duo
    }

    return { "solo": soloPoints, "duo": duoPoints, "overall": soloPoints + duoPoints }
}

function rankPlayers(allPlayers) {
    const soloRanked = [...allPlayers].sort((a, b) => a.points.solo - b.points.solo)
    const duoRanked = [...allPlayers].sort((a, b) => a.points.duo - b.points.duo)
    const overallRanked = [...allPlayers].sort((a, b) => a.points.overall - b.points.overall)

    for (const player of allPlayers) {
        player.position = {
            solo: soloRanked.findIndex(p => p.username === player.username) + 1,
            duo: duoRanked.findIndex(p => p.username === player.username) + 1,
            overall: overallRanked.findIndex(p => p.username === player.username) + 1
        }
    }
}

function formatPlayer(maps, username) {
    const map_rankings = calcPlayerRank(maps, username)
    return {
        username: username,
        "map_rankings": map_rankings,
        "points": findPlayerPoints(map_rankings)
    }
}

function filterSoloRuns(map, newRun) {
    // Adding and Filtering players and runs
    const addRun = (position, map, newRun) => {
        map = map.filter((currentRun) => newRun.username !== currentRun.username);
        map.splice(position, 0, newRun)

        return map
    }
    const handleEndlessRuns = (map, newRun) => {
        for (let i = 0 ; i < map.length ; i++) {
            const currentRun = map[i]

            if (newRun.area_index > currentRun.area_index) {
                // Put runs with higher area_indexes first
                return addRun(i, map, newRun)
            }
            
            if (newRun.area_index === currentRun.area_index) {
                if (newRun.survival_time < currentRun.survival_time) {
                    return addRun(i, map, newRun)
                }
                
                if (newRun.username === currentRun.username) {
                    if (newRun.area_index === currentRun.area_index) {
                        // New run is slower than current run
                        return map
                    }
                }
                
                if (i + 1 === map.length) {
                    // Slowest Run
                    map.push(newRun)
                    return map
                }
            }
            else {
                // newRun.area_index < currentRun.area_index
                // Skip to runs with same area index
                for (let j = i ; j < map.length ; j++) {
                    const cRun = map[i]
                    if (newRun.area_index === cRun.area_index) {
                        i = j - 1
                        break
                    }
                }
            }
        }

        return map
    }

    if (map.length < 1) {
        map.push(newRun)
        return map
    }
    
    if ("Endless Echo Hard".includes(newRun.region_name)) {     
        return handleEndlessRuns(map, newRun)
    }

    // Normal Runs
    for (let i = 0 ; i < map.length ; i++) {
        const currentRun = map[i]
        
        if (newRun.survival_time < currentRun.survival_time) {
            return addRun(i, map, newRun)
        }

        if (newRun.area_index === currentRun.area_index && newRun.username === currentRun.username) {
            // New run is slower than current run
            return map
        }
        
        if (i + 1 === map.length) {
            // Slowest Run
            map.push(newRun)
            return map
        }
    }

    return map
}

function filterDuoRuns(map, newRun) {
    const getDuoIdentifier = (usernames) => {
      usernames.sort()
      return `${usernames[0]} & ${usernames[1]}`
    }
    const isSameDuoNames = (desiredRun, differentRun) => {
      const desiredId = getDuoIdentifier([desiredRun.players[0].username, desiredRun.players[1].username])
      const differentId = getDuoIdentifier([differentRun.players[0].username, differentRun.players[1].username])

      return desiredId === differentId
    }
    const addRun = (position, map, newRun) => {
        map = map.filter((currentRun) => (!isSameDuoNames(currentRun, newRun)));
        map.splice(position, 0, newRun);
    
        return map
    }
    const handleEndlessRuns = (map, newRun) => {
        for (let i = 0 ; i < map.length ; i++) {
            const currentRun = map[i]

            if (newRun.area_index > currentRun.area_index) {
                // Put runs with higher area_indexes first
                return addRun(i, map, newRun)
            }
            
            if (newRun.area_index === currentRun.area_index) {
                if (newRun.final_survival_time < currentRun.final_survival_time) {
                    return addRun(i, map, newRun)
                }
                
                if (isSameDuoNames(newRun, currentRun)) {
                    if (newRun.area_index === currentRun.area_index) {
                        // New run is slower than current run
                        return map
                    }
                }
                
                if (i + 1 === map.length) {
                    // Slowest Run
                    map.push(newRun)
                    return map
                }
            }
            else{ // newRun.area_index < currentRun.area_index
                //Skip to runs with same area index
                for (let j = i ; j < map.length ; j++) {
                    const cRun = map[i]
                    if (newRun.area_index === cRun.area_index) {
                        i = j - 1
                        break
                    }
                }
            }
        }

        return map
    }

    if (map.length < 1) {
        map.push(newRun)
        return map
    }

    if ("Endless Echo Hard".includes(newRun.region_name)) {
        return handleEndlessRuns(map, newRun)
    }

    // Normal Runs
    for (let i = 0 ; i < map.length ; i++) {
        const currentRun = map[i]
        
        if (newRun.final_survival_time < currentRun.final_survival_time) {
            return addRun(i, map, newRun)
        }

        if (newRun.area_index === currentRun.area_index && isSameDuoNames(newRun, currentRun)) {
            //New run is slower than current run
            return map
        }

        if (i + 1 === map.length) {
            // Slowest Run
            map.push(newRun)
            return map
        }
    }
   
    return map
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
    const bannedIds = new Set([148714, 148802, 150085, 39029])
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

    // xanyewest = Exobyte

    const findMap = (region_name, area_index) => {
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
                59: "Mysterious Mansion Hedge", // Hat
                60: "Mysterious Mansion Liminal",
                61: "Mysterious Mansion Attic",
                62: "Mysterious Mansion Cryptic" // Hero
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

        // Converts region_names into acceptable formats and checks if region_name is allowed
        if (multipleWinRegions[region_name]) {
            return multipleWinRegions[region_name][area_index]
        }
        else {
            if ("Endless Echo Hard".includes(region_name)) {
                return region_name
            }
    
            return (regions[region_name] === area_index) ? region_name : undefined
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

        // Validating by Id
        if (bannedIds.has(run.id)) {
            return false
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
        return [run, map, false]
    }

    if (run.is_solo) {
        if (!validateRun(run)) {
            return [run, map, false]
        }

        run.username = getAltName(run.username)
    }
    else{
        for (let player of run.players) {
            if (!validateRun(convertDuoPlayerToSolo(player.username, run))) {
                return [run, map, false]
            }

            player.username = getAltName(player.username)
        }

        // Check if person is duoing by themselves
        if (run.players[0].username === run.players[1].username) {
            return [run, map, false]
        }
    }

    return [run, map, true]
}

function populatePlayers(runs) {
    let usernames = new Set()
    let checkedUsers = []
    let maps = {
        "Burning Bunker": { "solo": [], "duo": [] },
        "Burning Bunker Hard": { "solo": [], "duo": [] },
        "Central Core": { "solo": [], "duo": [] },
        "Central Core Hard": { "solo": [], "duo": [] },
        "Cyber Castle": { "solo": [], "duo": [] },
        "Cyber Castle Hard": { "solo": [], "duo": [] },
        "Catastrophic Core": { "solo": [], "duo": [] },
        "Coupled Corridors": { "solo": [], "duo": [] },
        "Dangerous District": { "solo": [], "duo": [] },
        "Dangerous District Hard": { "solo": [], "duo": [] },
        "Dusty Depths": { "solo": [], "duo": [] },
        "Elite Expanse": { "solo": [], "duo": [] },
        "Elite Expanse Hard": { "solo": [], "duo": [] },
        "Endless Echo": { "solo": [], "duo": [] },
        "Endless Echo Hard": { "solo": [], "duo": [] },
        "Frozen Fjord": { "solo": [], "duo": [] },
        "Frozen Fjord Hard": { "solo": [], "duo": [] },
        "Glacial Gorge": { "solo": [], "duo": [] },
        "Glacial Gorge Hard": { "solo": [], "duo": [] },
        "Grand Garden": { "solo": [], "duo": [] },
        "Grand Garden Hard": { "solo": [], "duo": [] },
        "Humongous Hollow": { "solo": [], "duo": [] },
        "Humongous Hollow Hard": { "solo": [], "duo": [] },
        "Haunted Halls": { "solo": [], "duo": [] },
        "Infinite Inferno": { "solo": [], "duo": [] },
        "Monumental Migration 120": { "solo": [], "duo": [] },
        "Monumental Migration 480": { "solo": [], "duo": [] },
        "Magnetic Monopole": { "solo": [], "duo": [] },
        "Magnetic Monopole Dipole": { "solo": [], "duo": [] },
        "Magnetic Monopole Hard": { "solo": [], "duo": [] },
        "Magnetic Monopole Dipole Hard": { "solo": [], "duo": [] },
        "Mysterious Mansion Hedge": { "solo": [], "duo": [] }, // Hat
        "Mysterious Mansion Liminal": { "solo": [], "duo": [] },
        "Mysterious Mansion Attic": { "solo": [], "duo": [] },
        "Mysterious Mansion Cryptic": { "solo": [], "duo": [] }, // Hero
        "Ominous Occult": { "solo": [], "duo": [] },
        "Ominous Occult Hard": { "solo": [], "duo": [] },
        "Peculiar Pyramid Inner": { "solo": [], "duo": [] },
        "Peculiar Pyramid Perimeter": { "solo": [], "duo": [] },
        "Peculiar Pyramid Inner Hard": { "solo": [], "duo": [] },
        "Peculiar Pyramid Perimeter Hard": { "solo": [], "duo": [] },
        "Quiet Quarry": { "solo": [], "duo": [] },
        "Quiet Quarry Hard": { "solo": [], "duo": [] },
        "Restless Ridge": { "solo": [], "duo": [] },
        "Restless Ridge Hard": { "solo": [], "duo": [] },
        "Shifting Sands": { "solo": [], "duo": [] },
        "Toxic Territory": { "solo": [], "duo": [] },
        "Toxic Territory Hard": { "solo": [], "duo": [] },
        "Vicious Valley": { "solo": [], "duo": [] },
        "Vicious Valley Hard": { "solo": [], "duo": [] },
        "Wacky Wonderland": { "solo": [], "duo": [] },
        "Wacky Wonderland Hard": { "solo": [], "duo": [] },
        "Withering Wasteland": { "solo": [], "duo": [] }
    }

    for (let run of runs) {
        [run, mapName, valid] = checkSpecificCase(run)

        if (valid){
            if (run.is_solo) {
                usernames.add(run.username);    
                maps[mapName].solo = filterSoloRuns(maps[mapName].solo, run)
            }
            else {
                for (const player of run.players) {
                    usernames.add(player.username)
                }
    
                maps[mapName].duo = filterDuoRuns(maps[mapName].duo, run)
            }
        }
    }
    console.log("Filtered all runs")
    
    for (const name of usernames) {
        checkedUsers.push(formatPlayer(maps, name))
    }
    console.log("Formatted all players")
    
    rankPlayers(checkedUsers)
    console.log("Ranked all players")

    return checkedUsers
}

// Main
let offloadRuns = new Set()

async function main() {
    const total = await getTotalAmountOfRuns()
    const difference = 1000
    let allRuns = []

    console.log("Total: ", total)
    
    // Finding every username and valid runs (while ordering the runs)
    for (let count = 205 ; total - count > 0 ; count += difference) {
        const start = total - count - 51
        let runs = await getRangedRuns(start - difference, start)
        runs = await formatRuns(runs)

        await postData("runs", runs)
        allRuns = [...allRuns, ...runs]

        if (runs.length > 0) {
            console.log(`Run Number: ${runs[runs.length - 1].id || runs[runs.length - 1].players[1].id}, Amount of runs left: ${start - difference}`)
        }
        
        if (count >= total){
            console.log(`There are no more runs left`)
            break
        }
    }

    const allPlayerRanks = populatePlayers(allRuns)
    console.log(await limitPost(500, "players", allPlayerRanks))
}

main()