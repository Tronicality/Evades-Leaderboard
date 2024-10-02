const maps = {
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

const multipleWinMaps = { //Key: area number, Value: Specified map end point
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

const reverseMultipleWinMaps = {
    "Monumental Migration 120": "Monumental Migration",
    "Monumental Migration 480": "Monumental Migration",
    "Magnetic Monopole": "Magnetic Monopole",
    "Magnetic Monopole Dipole": "Magnetic Monopole",
    "Magnetic Monopole Hard": "Magnetic Monopole Hard",
    "Magnetic Monopole Dipole Hard": "Magnetic Monopole Hard",
    "Mysterious Mansion Hedge": "Mysterious Mansion", //Hat
    "Mysterious Mansion Liminal": "Mysterious Mansion",
    "Mysterious Mansion Attic": "Mysterious Mansion",
    "Mysterious Mansion Cryptic": "Mysterious Mansion", //Hero
    "Peculiar Pyramid Inner": "Peculiar Pyramid",
    "Peculiar Pyramid Perimeter": "Peculiar Pyramid",
    "Peculiar Pyramid Inner Hard": "Peculiar Pyramid Hard",
    "Peculiar Pyramid Perimeter Hard": "Peculiar Pyramid Hard"
}

function findMap(regionName, areaIndex) {
    // Converts region_names into acceptable formats and checks if region_name is allowed

    if (multipleWinMaps[regionName]) {
        return multipleWinMaps[regionName][areaIndex]
    }
    else {
        if ("Endless Echo Hard".includes(regionName)) {
            return regionName
        }

        return (maps[regionName] === areaIndex) ? regionName : undefined
    }
}

function convertPlayerDuoToSolo(desiredPlayerName, run) {
    let player = run.players.find(player => player.username === desiredPlayerName)
    let pair = run.players.find(player => player.username !== desiredPlayerName)?.username

    const { region_name, area_index, is_solo, final_survival_time } = run
    return {...player, region_name, area_index, is_solo, final_survival_time, pair }
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
            if (!validateRun(convertPlayerDuoToSolo(player.username, run))) {
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

function findDuoIdentifier(usernames) {
    usernames.sort()
    return `${usernames[0]} & ${usernames[1]}`
}

function filterSoloRuns(runs, limit = undefined) {
    let result = []
    let usernames = new Set()
    
    for (let run of runs) {
        if (limit) {
            if (result.length >= limit) {
                break
            }
        }

        [run, valid] = checkSpecificCase(run)

        // Adding run
        if (valid && !usernames.has(run.username)) {
            usernames.add(run.username)
            result.push(run)
        }
    }

    return result
}

function filterDuoRuns(runs, limit = undefined) { 
    let result = []
    let usernames = new Set()
    
    for (let run of runs) {
        if (limit) {
            if (result.length >= limit) {
                break
            }
        }

        [run, valid] = checkSpecificCase(run)

        // Adding run
        if (valid) {
            const duoId = findDuoIdentifier([run.players[0].username, run.players[1].username])

            if (!usernames.has(duoId)) {
                usernames.add(duoId)
                result.push(run)
            }
        }
    }

    return result
}

async function getFasterSoloRuns(playerRun) {
    let pipeline = []
    let runs = []
    if ("Endless Echo Hard".includes(playerRun.region_name)) {
        pipeline = [
            {
                '$match': {
                    'is_solo': true,
                    'region_name': playerRun.region_name,
                    'area_index': { '$gte': playerRun.area_index }
                }
            }, {
                '$sort': {
                    'area_index': -1,
                    'survival_time': 1,
                    'created_at': 1
                }
            }
        ]

        
        const response = await context.services.get("Evades-Runs").db("leaderboards").collection("runs").aggregate(pipeline).toArray()

        // Filtering for lower survival time, higher area index
        for (const run of response) {
            if (run.area_index > playerRun.area_index) {
                runs.push(run)
            }
            else if (run.survival_time <= playerRun.survival_time) {
                runs.push(run)
            }
        }
        
    }
    else {
        pipeline = [
            {
                '$match': {
                    'is_solo': true,
                    'region_name': playerRun.region_name,
                    'area_index': playerRun.area_index,
                    'survival_time': { '$lte': playerRun.survival_time }
                }
            }, {
                '$sort': { 'survival_time': 1, 'created_at': 1 }
            }
        ]

        runs = await context.services.get("Evades-Runs").db("leaderboards").collection("runs").aggregate(pipeline).toArray()
    }

    return filterSoloRuns(runs)
}

async function getFasterDuoRuns(playerRun) {
    let pipeline = []
    let runs = []
    if ("Endless Echo Hard".includes(playerRun.region_name)) {
        pipeline = [
            {
                '$match': {
                    'is_solo': false,
                    'region_name': playerRun.region_name,
                    'area_index': { "$gte": playerRun.area_index }
                }
            }, {
                '$sort': { 'area_index': -1, 'final_survival_time': 1, 'created_at': 1 }
            }
        ]

        
        response = await context.services.get("Evades-Runs").db("leaderboards").collection("runs").aggregate(pipeline).toArray()

        // Filtering for lower survival time, higher area index
        for (const run of response) {
            if (run.area_index > playerRun.area_index) {
                runs.push(run)
            }
            else if (run.final_survival_time <= playerRun.final_survival_time) {
                runs.push(run)
            }
        }
        
    }
    else {
        pipeline = [
            {
                '$match': {
                    'is_solo': false,
                    'region_name': playerRun.region_name,
                    'area_index': playerRun.area_index,
                    'final_survival_time': { "$lte": playerRun.final_survival_time }
                }
            }, {
                '$sort': { 'final_survival_time': 1, 'created_at': 1 }
            }
        ]

        
        runs = await context.services.get("Evades-Runs").db("leaderboards").collection("runs").aggregate(pipeline).toArray()
    }

    return filterDuoRuns(runs)
}

async function getSoloPlayerRun(username, regionName, areaIndex) {
    let pipeline
    if ("Endless Echo Hard".includes(regionName)) {
        pipeline = [
            {
                '$match': {
                    'is_solo': true,
                    'username': username,
                    'region_name': regionName
                }
            }, {
                '$sort': {
                    'area_index': -1,
                    'survival_time': 1,
                    'created_at': 1
                }
            }, {
                '$limit': 200
            }
        ]
    }
    else {
        pipeline = [
            {
                '$match': {
                    'is_solo': true,
                    'username': username,
                    'region_name': regionName,
                    'area_index': areaIndex
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

    const runs = await context.services.get("Evades-Runs").db("leaderboards").collection("runs").aggregate(pipeline).toArray()

    const run = filterSoloRuns(runs, 1)
    return run[0]
}

async function getDuoPlayerRun(username, regionName, areaIndex) {
    let pipeline
    if ("Endless Echo Hard".includes(regionName)) {
        pipeline = [
            {
                '$match': {
                    'is_solo': false,
                    'players': { "$elemMatch": { "username": username } },
                    'region_name': regionName
                }
            }, {
                '$sort': {
                    'area_index': -1,
                    'final_survival_time': 1,
                    'created_at': 1
                }
            }, {
                "$limit": 200
            }
        ]
    }
    else {
        pipeline = [
            {
                '$match': {
                    'is_solo': false,
                    'players': { "$elemMatch": { "username": username } },
                    'region_name': regionName,
                    'area_index': areaIndex
                }
            }, {
                '$sort': { 'final_survival_time': 1, 'created_at': 1 }
            }, {
                '$limit': 10
            }
        ]
    }

    const runs = await context.services.get("Evades-Runs").db("leaderboards").collection("runs").aggregate(pipeline).toArray()

    const run = filterDuoRuns(runs, 1)
    return run[0]
}

async function getSoloRunCount(regionName, areaIndex) {
    let pipeline
    if ("Endless Echo Hard".includes(regionName)) {
        pipeline = [
            {
                '$match': {
                    'is_solo': true,
                    'region_name': regionName
                }
            }
        ]
    }
    else {
        pipeline = [
            {
                '$match': {
                    'is_solo': true,
                    'region_name': regionName,
                    'area_index': areaIndex,
                }
            }
        ]
    }

    let runs = await context.services.get("Evades-Runs").db("leaderboards").collection("runs").aggregate(pipeline).toArray()

    runs = filterSoloRuns(runs)
    return runs.length
}

async function getDuoRunCount(regionName, areaIndex) {
    let pipeline
    if ("Endless Echo Hard".includes(regionName)) {
        pipeline = [
            {
                '$match': {
                    'is_solo': false,
                    'region_name': regionName
                }
            }, {
                '$sort': { 'area_index': -1, 'final_survival_time': 1, 'created_at': 1 }
            }
        ]
    }
    else {
        pipeline = [
            {
                '$match': {
                    'is_solo': false,
                    'region_name': regionName,
                    'area_index': areaIndex,
                }
            }, {
                '$sort': { 'final_survival_time': 1, 'created_at': 1 }
            }
        ]
    }

    let runs = await context.services.get("Evades-Runs").db("leaderboards").collection("runs").aggregate(pipeline).toArray()

    runs = filterDuoRuns(runs)
    return runs.length
}

async function calcSingleMapRank(oldRank, playerRun) {
    let newRank
    
    if (playerRun.is_solo) {
        const fasterSoloRuns = await getFasterSoloRuns(playerRun)
        const isWR = (fasterSoloRuns.length === 1 && fasterSoloRuns[0].id === playerRun.id)

        if (isWR) {
            // get_faster_runs contains runs (notably the run that has just been inserted that are equal to the same time (for created_at reasons)
            newRank = 1
        }
        else {
            newRank = fasterSoloRuns.length
        }

        if (oldRank.solo <= newRank) {
            // Preventing rank changes if there is a faster run
            return null
        }

        console.log(`Old Rank: ${oldRank.solo}`)
    }
    else {
        const fasterDuoRuns = await getFasterDuoRuns(playerRun)
        const isWR = (fasterDuoRuns.length === 1 && fasterDuoRuns[0].players.some((player) => player.id === playerRun.id))

        if (isWR) {
            // get_faster_runs contains runs (notably the run that has just been inserted) that are equal to the same time (for created_at reasons)
            newRank = 1
        }
        else {
            newRank = fasterDuoRuns.length
        }

        if (oldRank.duo <= newRank) {
            // Preventing rank changes if there is a faster run
            return null
        }

        console.log(`Old Rank: ${oldRank.duo}`)
    }

    console.log(`New Rank: ${newRank}`)
    return newRank
}

async function calcNewPlayerRank(username) {
    const calcSoloCount = async (username, regionName, areaIndex) => {
        const soloPlayerRun = await getSoloPlayerRun(username, regionName, areaIndex)
    
        let soloCount
        if (soloPlayerRun) {
            soloCount = await getFasterSoloRuns(soloPlayerRun)
            soloCount = soloCount.length
        }
        else {
            soloCount = await getSoloRunCount(regionName, areaIndex) + 1
        }
    
        return soloCount
    }

    const calcDuoCount = async (username, regionName, areaIndex) => {
        const duoPlayerRun = await getDuoPlayerRun(username, regionName, areaIndex)
    
        let duoCount
        if (duoPlayerRun) {
            duoCount = await getFasterDuoRuns(duoPlayerRun)
            duoCount = duoCount.length
        }
        else {
            duoCount = await getDuoRunCount(regionName, areaIndex) + 1
        }
    
        return duoCount
    }

    const newMapRankings = {}
    for (const [map, areaIndex] of Object.entries(maps)) {
        const region = (reverseMultipleWinMaps[map] || map)
        const soloCount = calcSoloCount(username, region, areaIndex)
        const duoCount = calcDuoCount(username, region, areaIndex)

        newMapRankings[map] = { "solo": await soloCount, "duo": await duoCount }
    }

    return newMapRankings
}

async function updateRankings(playerCollection, newRun) {
    const handleRankChange = async (playerCollection, isNewPlayer, map, isSolo, newRank, oldRank = undefined, duoPairName = undefined) => {
        const map_rank_key = `map_rankings.${map}.${isSolo ? "solo" : "duo"}`
        const filter = { [map_rank_key]: { $gte: newRank } }
        const update = { $inc: { [map_rank_key]: 1 } }
    
        if (!isNewPlayer && oldRank) {
            // Keeping consistent numbers (eg 1, 2, 3 instead of 1, 3)
            filter[map_rank_key].$lte = oldRank
        }
    
        if (!isSolo && duoPairName) {
            filter.username = { $ne: duoPairName }
        }
    
        await playerCollection.updateMany(filter, update)
    }
    
    const handleNewPlayer = async (playerCollection, run) => {
        const mapRankings = await calcNewPlayerRank(run.username)

        console.log(`Adding ${run.username}`)

        await handleRankChange(playerCollection, true, findMap(run.region_name, run.area_index), run.is_solo, mapRankings[run.region_name][run.is_solo], undefined, run.pair)
        await playerCollection.insertOne({
            "username": run.username,
            "map_rankings": mapRankings,
            "points": {}, // Calculated in a different trigger
            "position":  {} // Calculated in a different trigger
        })
    }
    
    const handle_existing_player = async (playerCollection, oldMapRankings, run) => {
        const map = findMap(run.region_name, run.area_index)
        const isSolo = (run.is_solo) ? 'solo' : "duo"
        const newRank = await calcSingleMapRank(oldMapRankings[map], run)

        console.log(`Caught ${run.username} ${isSolo}ing ${map}`)
        
        if (newRank !== oldMapRankings[map][isSolo] && newRank !== null) {
            const mapRankKey = `map_rankings.${map}.${isSolo}`

            console.log(`Updating ${run.username}`)

            await handleRankChange(playerCollection, false, map, run.is_solo, newRank, oldMapRankings[map][isSolo], run.pair)
            await playerCollection.updateOne({ "username": run.username },
                { $set: { [mapRankKey]: newRank } }
            )   
        }
    }

    const updatePlayerRank = async (playerCollection, newRun) => {
        const player = await playerCollection.findOne({ "username": newRun.username })
        if (player === null) {
            await handleNewPlayer(playerCollection, newRun)
        }
        else {
            await handle_existing_player(playerCollection, player.map_rankings, newRun)
        }
    }

    if (newRun.is_solo) {
        await updatePlayerRank(playerCollection, newRun)
    }
    else {
        for (const player of newRun.players) {
            const run = convertPlayerDuoToSolo(player.username, newRun)

            await updatePlayerRank(playerCollection, run)
        }
    }
}

async function main(playerCollection, newRun) {
    let valid
    [newRun, valid] = checkSpecificCase(newRun)

    if (valid) {
        await updateRankings(playerCollection, newRun)
    }
}

exports = async function (changeEvent) {
    const playerCollection = context.services.get("Evades-Runs").db("leaderboards").collection("players")
    const newData = changeEvent.fullDocument

    if (Array.isArray(newData)) {
        for (const changedValue of newData) {
            main(playerCollection, changedValue)
        }
    }
    else {
        main(playerCollection, newData)
    }
}

// Testing data - DO NOT POST DATA IF IN USE
const changeEvent = {
    "_id": "",
    "operationType": "insert",
    "clusterTime": "",
    "wallTime": "",
    "ns": {
        "db": "leaderboards",
        "coll": "runs"
    },
    "documentKey": {
        "_id": "599af247bb69cd89961c986d"
    },
    "fullDocument": [
        {
            "_id": "65fcd17e81a29955d137e86f",
            "id": 113462,
            "username": "Br1h",
            "exp_level": 49,
            "hero": "Stheno",
            "survival_time": 279,
            "region_name": "Ominous Occult",
            "area_index": 16,
            "created_at": 1709756792,
            "is_solo": true,
        },
        {
            "players": [
              {
                "id": 154534,
                "username": "Zxynn",
                "hero": "Candy",
                "exp_level": 67,
                "survival_time": 179,
                "created_at": 1727516985
              },
              {
                "id": 154533,
                "username": "Invi",
                "hero": "Factorb",
                "exp_level": 66,
                "survival_time": 180,
                "created_at": 1727516985
              }
            ],
            "final_survival_time": 180,
            "region_name": "Grand Garden",
            "area_index": 28,
            "is_solo": false
          }
    ]
}

exports(changeEvent)