// ==UserScript==
// @name        Evades Leaderboard
// @version     1.0.0
// @description	Evades.io script to show recent runs on a leaderboard cuz HS managers can't.
// @author      Script by: Br1h (.reality)
// @match       https://*.evades.io/
// @match       https://*.evades.online/
// @icon        https://www.google.com/s2/favicons?sz=64&domain=evades.io
// @run-at      document-start
// @downloadURL coming soon TM
// @updateURL   coming soon TM
// @grant       none
// ==/UserScript==

const baseURL = 'https://evades-runs-server.glitch.me/'
fetch(baseURL)

let currentRegion
let currentSelectedAreaIndex = ""
var savedRuns = {}
let heroColors
let isShowingRecords = false
let isSolo = true
let currentController = null
let isIngame = false

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

const multipleWinMaps = { // Key: area number, Value: Specified map end point
    "Monumental Migration": {
        120: "Monumental Migration 120",
        480: "Monumental Migration 480"
    },
    "Magnetic Monopole": {
        35: "Magnetic Monopole Dipole",
        36: "Magnetic Monopole",
    },
    "Magnetic Monopole Hard": {
        35: "Magnetic Monopole Dipole Hard",
        36: "Magnetic Monopole Hard"
    },
    "Mysterious Mansion": {
        59: "Mysterious Mansion Hedge", // Hat
        60: "Mysterious Mansion Liminal",
        61: "Mysterious Mansion Attic",
        62: "Mysterious Mansion Cryptic", // Hero
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

function getHeroColors() {
    try {
        let heroes = {}
        for (const obj of window.heroConfig) {
            heroes[obj.name] = window.getHeroColor(obj.name)
        }

        return heroes
    }
    catch (e) {
        // window.heroConfig doesn't exist

        return {
            "Magmax": "#ff0000",
            "Rime": "#3377ff",
            "Morfe": "#00dd00",
            "Aurora": "#ff7f00",
            "Necro": "#FF00FF",
            "Brute": "#9b5800",
            "Nexus": "#29FFC6",
            "Shade": "#826565",
            "Euclid": "#5e4d66",
            "Chrono": "#00b270",
            "Reaper": "#787b81",
            "Rameses": "#989b4a",
            "Jolt": "#e1e100",
            "Ghoul": "#bad7d8",
            "Cent": "#727272",
            "Jötunn": "#5cacff",
            "Candy": "#ff80bd",
            "Mirage": "#020fa2",
            "Boldrock": "#a18446",
            "Glob": "#14a300",
            "Magno": "#ff005d",
            "Ignis": "#cd501f",
            "Stella": "#fffa86",
            "Viola": "#d9b130",
            "Mortuus": "#7fb332",
            "Cybot": "#926be3",
            "Echelon": "#5786de",
            "Demona": "#7d3c9e",
            "Stheno": "#cfa6ec",
            "Factorb": "#6e391e"
        }
    }
}

function getCurrentRegionName() {
    try {
        const map = window.client.main.regionName

        if (multipleWinMaps[map] !== undefined) {
            return [map, true]
        }
        else if (maps[map] !== undefined) {
            return [map, false]
        }
    } catch (error) {
        //console.log(error)
    }

    return [undefined, null]
}

function formatSurvivalTime(timeInSeconds) {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}m ${seconds}s`;
}

function hexToRgba(hex, alpha = 1) {
    try {
        hex = hex.replace(/^#/, '');
        let r, g, b;

        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        } else if (hex.length === 6) {
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        }

        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    catch (error) {
        console.log(`Could not translate hex color. Hex: ${hex}`)
        return `rgba(0, 0, 0, ${alpha})`
    }
    
}

function setHeroSoloBackground(hero) {
    const heroColor = hexToRgba(heroColors[hero]);
    return `linear-gradient(to left, rgba(0, 0, 0, 0) 0%, ${heroColor} 100%);`
}

function setHeroDuoBackground(heroes) {
    const duoColors = [hexToRgba(heroColors[heroes[0]]), hexToRgba(heroColors[heroes[1]])]
    return `linear-gradient(to right, ${duoColors[0]}, ${duoColors[1]});`
}

function handleTopRuns(topRuns, isEE2) {
    let innerHTML = "";
    topRuns.solo.forEach((record, i) => {
        const classHTML = "spSoloRun"
        const styleHTML = `background: ${setHeroSoloBackground(record.hero)} display: ${(isSolo) ? "block" : "none"}`
        const contentHTML = `${i + 1}. ${record.username}: ${formatSurvivalTime(record.survival_time)}${(isEE2) ? ` (area: ${record.area_index}) ` : ""}`

        innerHTML += `<li class="${classHTML}" style="${styleHTML}">${contentHTML}</li>`
    })

    topRuns.duo.forEach((record, i) => {
        const heroes = [record.players[0].hero, record.players[1].hero]

        const classHTML = "spDuoRun";
        const styleHTML = `background: ${setHeroDuoBackground(heroes)} display: ${(isSolo) ? "none" : "block"}`;
        const contentHTML = `${i + 1}. ${record.players[0].username} & ${record.players[1].username} ${formatSurvivalTime(record.final_survival_time)}${(isEE2) ? ` (area: ${record.area_index}) ` : ""}`;

        innerHTML += `<li class="${classHTML}" style="${styleHTML}">${contentHTML}</li>`

    })

    return innerHTML
}

function rankPlacementText(rank) {
    if (rank === 1) {
        return `${rank}st`
    }
    else if (rank === 2) {
        return `${rank}nd`
    }
    else if (rank === 3) {
        return `${rank}rd`
    }
    return `${rank}th`
}

function handleUserRun(userRun, isEE2) {
    let innerHTML = "";

    if (userRun.solo !== null) {
        const classHTML = `spSoloRun`;
        const styleHTML = `background: ${setHeroSoloBackground(userRun.solo.hero)} display: ${(isSolo) ? "block" : "none"}`;
        const contentHTML = `Personal Best (${rankPlacementText(userRun.solo.rank)} place): ${formatSurvivalTime(userRun.solo.survival_time)}${(isEE2) ? ` (area: ${userRun.solo.area_index})` : ""}`;

        innerHTML += `<li class="${classHTML}" style="${styleHTML}">${contentHTML}</li>`
    }
    else {
        const styleHTML = `display: ${(isSolo) ? "block" : "none"}`;
        innerHTML += `<li class="spSoloRun" style="${styleHTML}"> Complete this Map!</li>`
    }
    

    if (userRun.duo !== null) {
        // Differentiating between user and duo partner
        const userDuoRun = {};
        const duoPartner = {};
        for (const player of userRun.duo.players) {
            if (player.username !== window.client.main.name) {
                duoPartner.hero = player.hero
                duoPartner.username = player.username
            } else {
                userDuoRun.hero = player.hero
            }
        }

        const classHTML = "spDuoRun";
        const styleHTML = `background: ${setHeroDuoBackground([userDuoRun.hero, duoPartner.hero])} display: ${(isSolo) ? "none" : "block"}`;
        const contentHTML = `Personal Best (${rankPlacementText(userRun.duo.rank)} place): ${formatSurvivalTime(userRun.duo.final_survival_time)}${(isEE2) ? ` (area: ${userRun.duo.area_index})` : ""} (with ${duoPartner.username})`;

        innerHTML += `<li class="${classHTML}" style="${styleHTML}">${contentHTML}</li>`

    }
    else {
        const styleHTML = `display: ${(isSolo) ? "none" : "block"}`;
        innerHTML += `<li class="spDuoRun" style="${styleHTML}"> Complete this map with someone!</li>`
    }
    
    return innerHTML
}

function populateContainers(map) {
    let isEE2 = false
    if ("Endless Echo Hard".includes(map)) {
        isEE2 = true
    }

    const topRuns = savedRuns[map].topRuns;
    const userRun = savedRuns[map].userRun;

    const spTopRuns = document.getElementById('spTopRuns');
    spTopRuns.innerHTML = handleTopRuns(topRuns, isEE2);

    const spUserRun = document.getElementById('spUserRun');
    spUserRun.innerHTML = handleUserRun(userRun, isEE2);

    hideLoading()
    setTimeout(() => { hideStatusMessage() }, 3000)
}

async function callMapRecords(map, areaIndex, directory, controller) {
    const body = { "region_name": map, "area_index": areaIndex }
    const response = await fetch(baseURL + directory, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        mode: "cors",
        body: JSON.stringify(body),
        signal: controller.signal
    })

    return response.json()
}

async function callSingleMapRecord(username, map, areaIndex, directory, controller) {
    const body = { "region_name": map, "area_index": areaIndex, "username": username }
    const response = await fetch(baseURL + directory, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        mode: "cors",
        body: JSON.stringify(body),
        signal: controller.signal
    })

    return response.json()
}

async function callPlayerMapRank(username, map, areaIndex, controller) {
    const body = { "username": username, "region_name": map, "area_index": areaIndex }
    const response = await fetch(baseURL + 'get_rankings/player/map', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        mode: "cors",
        body: JSON.stringify(body),
        signal: controller.signal
    })

    return response.json()
}

async function getMapRuns(regionName, hasMultipleAreaIndexes, controller) {
    let topRunsPromises, userRunPromises, playerRankPromise, areaIndex;

    if (hasMultipleAreaIndexes) {
        areaIndex = Number(document.getElementById("spAreaIndexes").value)
        regionName = reverseMultipleWinMaps[regionName]
    }
    else{
        areaIndex = maps[regionName]
    }

    topRunsPromises = {
        solo: callMapRecords(regionName, areaIndex, 'get_runs/solo/map/top', controller),
        duo: callMapRecords(regionName, areaIndex, 'get_runs/duo/map/top', controller)
    }

    userRunPromises = {
        solo: callSingleMapRecord(window.client.main.name, regionName, areaIndex, 'get_runs/solo/map/single', controller),
        duo: callSingleMapRecord(window.client.main.name, regionName, areaIndex, 'get_runs/duo/map/single', controller)
    }

    playerRankPromise = callPlayerMapRank(window.client.main.name, regionName, areaIndex, controller)
    

    const [topRuns, userRun, playerRank] = await Promise.all([
        Promise.all([topRunsPromises.solo, topRunsPromises.duo]),
        Promise.all([userRunPromises.solo, userRunPromises.duo]),
        Promise.all([playerRankPromise])
    ])

    const resolvedTopRuns = { solo: topRuns[0], duo: topRuns[1] }
    const resolvedUserRun = { solo: userRun[0], duo: userRun[1] }
    const resolvedPlayerRank = playerRank[0]

    if (resolvedUserRun.solo !== null) {
        resolvedUserRun.solo.rank = resolvedPlayerRank.solo
    }
    if (resolvedUserRun.duo !== null) {
        resolvedUserRun.duo.rank = resolvedPlayerRank.duo
    }

    // console.log(resolvedTopRuns, resolvedUserRun)
    return { topRuns: resolvedTopRuns, userRun: resolvedUserRun }
}

function handleAreaIndexes(map) {
    const areaIndexes = document.getElementById("spAreaIndexes");
    areaIndexes.innerHTML = "";

    //let innerHTML = "";

    for (const [areaIndex, mapName] of Object.entries(multipleWinMaps[map])) {
        const option = document.createElement("option");
        option.value = areaIndex;
        option.textContent = mapName;

        areaIndexes.appendChild(option)
    }
    
    areaIndexes.style.display = "block";
}

function showLoading() {
    const loadingElement = document.getElementById('spLoading');
    const spTopRuns = document.getElementById('spTopRuns');
    const spUserRun = document.getElementById('spUserRun');

    loadingElement.style.display = "block";
    spTopRuns.style.display = "none";
    spUserRun.style.display = "none";
}

function hideLoading() {
    const loadingElement = document.getElementById('spLoading');
    const spTopRuns = document.getElementById('spTopRuns');
    const spUserRun = document.getElementById('spUserRun');

    loadingElement.style.display = "none";
    spTopRuns.style.display = "block";
    spUserRun.style.display = "block";
}

function showStatusMessage(message, color) {
    const statusMessage = document.getElementById('statusMessage')
    statusMessage.textContent = message
    statusMessage.style.color = color
    statusMessage.style.display = "block"
}

function hideStatusMessage() {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.style.display = "none";
}

async function changeRuns() {
    const loadRuns = async (map, hasMultipleAreaIndexes, newAreaIndex = null) => {
        // console.log(map)


        // Handle map Abortion
        if (currentController !== null && !currentController.signal.aborted) {
            currentController.abort(`${window.client.main.name} has changed maps`)
        }
        const newController = new AbortController()
        currentController = newController
        
        // Handle Loading
        if (savedRuns[map] && (!hasMultipleAreaIndexes || newAreaIndex !== null)) {
            showStatusMessage(`Old ${map} runs`, "red")
            populateContainers(map)
        }
        else {
            hideStatusMessage()
            showLoading()
        }
        
        // Handle actually showing the runs
        try {
            savedRuns[map] = await getMapRuns(map, hasMultipleAreaIndexes, newController)
            populateContainers(map)
            showStatusMessage("Fetched Runs", "green")
        } 
        catch (error) {
            if (error !== `${window.client.main.name} has changed maps`) {
                console.log("Error fetching data: ", error)
                showStatusMessage("Error fetching data", "red")
                hideLoading()
            }
        }
    }
    const handleMultiWinMaps = async (regionName, newAreaIndex) => {
        currentSelectedAreaIndex = newAreaIndex
        await loadRuns(multipleWinMaps[regionName][newAreaIndex], true, newAreaIndex)
    }
    async function handleNewMap(hasMultipleAreaIndexes, regionName, areaIndexes) {
        if (hasMultipleAreaIndexes) {
            handleAreaIndexes(regionName)
            await handleMultiWinMaps(regionName, areaIndexes.value)

        } else {
            document.getElementById("spAreaIndexes").style.display = "none"
            await loadRuns(regionName, hasMultipleAreaIndexes)
        }
    }

    if (isShowingRecords) {
        const [regionName, hasMultipleAreaIndexes] = getCurrentRegionName()
        const areaIndexes = document.getElementById("spAreaIndexes")

        if (regionName) {
            if (currentRegion !== regionName) {
                currentRegion = regionName

                await handleNewMap(hasMultipleAreaIndexes, regionName, areaIndexes)
            }
            else if (currentSelectedAreaIndex !== areaIndexes.value) {
                // In a mutli win map but using different index
                await handleMultiWinMaps(regionName, areaIndexes.value)
            }
        } 
        else {
            showStatusMessage("Invalid map", "red")
        }
    }
}

function switchSoloDuo(button) {
    let soloTimes = document.getElementsByClassName("spSoloRun");
    let duoTimes = document.getElementsByClassName("spDuoRun");

    isSolo = !isSolo;
    if (isSolo) {
        button.innerHTML = "Solo";

        for (let i = 0; i < soloTimes.length; i++) {
            soloTimes[i].style.display = "flex";
        }
        for (let i = 0; i < duoTimes.length; i++) {
            duoTimes[i].style.display = "none";
        }
    } else {
        button.innerHTML = "Duo";

        for (let i = 0; i < soloTimes.length; i++) {
            soloTimes[i].style.display = "none";
        }
        for (let i = 0; i < duoTimes.length; i++) {
            duoTimes[i].style.display = "flex";
        }
    }
}

function setupContainer() {
    const overlay = document.createElement("div");
    overlay.id = "spOverlay";
    overlay.textContent = "Speedrun Times";
    overlay.style.display = "none";
    overlay.style.position = "absolute";
    overlay.style.top = "30%";
    overlay.style.left = "3%";
    overlay.style.background = "rgba(0, 0, 0, 0.8)";
    overlay.style.color = "white";
    overlay.style.fontSize = "20px";
    overlay.style.padding = "7px";
    overlay.style.borderRadius = "3px";

    const style = document.createElement('style');
    style.innerHTML = `
        .spinner {
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid #fff;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `

    // Create loading spinner element
    const loadingElement = document.createElement("div");
    loadingElement.id = "spLoading";
    loadingElement.style.display = "none";
    loadingElement.style.textAlign = "center";
    loadingElement.style.marginTop = "20px";
    loadingElement.innerHTML = `<div class="spinner"></div>`;

    const statusMessage = document.createElement("div");
    statusMessage.id = "statusMessage";
    statusMessage.style.display = "none";
    statusMessage.style.textAlign = "center";
    statusMessage.style.fontSize = "16px";
    statusMessage.style.marginTop = "10px";

    const soloDuoBtn = document.createElement("button");
    soloDuoBtn.id = "spSwitch";
    soloDuoBtn.textContent = "Solo";
    soloDuoBtn.style.position = "relative";
    soloDuoBtn.style.marginLeft = "10px";
    soloDuoBtn.onclick = () => { switchSoloDuo(soloDuoBtn); };

    const areaIndexes = document.createElement("select");
    areaIndexes.id = "spAreaIndexes";
    areaIndexes.style.display = "none";
    areaIndexes.style.position = "relative";

    const topRuns = document.createElement("div");
    topRuns.id = "spTopRuns";

    const userRuns = document.createElement("div");
    userRuns.id = "spUserRun";

    overlay.appendChild(style)
    overlay.appendChild(soloDuoBtn)
    overlay.appendChild(areaIndexes)
    overlay.appendChild(topRuns)
    overlay.appendChild(document.createElement("br"))
    overlay.appendChild(statusMessage)
    overlay.appendChild(loadingElement)
    overlay.appendChild(document.createElement("br"))
    overlay.appendChild(userRuns)
    
    

    new MutationObserver((_, observer) => {
        const leaderboard = document.getElementById("leaderboard")
        if (leaderboard) {
            console.log("In Game")
            isIngame = true
            leaderboard.parentElement.parentElement.appendChild(overlay)
            observer.disconnect()
        }
    }).observe(document, { childList: true, subtree: true })
}

function toggleRecords() {
    if (isIngame) {
        if (isShowingRecords) {
            document.getElementById('spOverlay').style.display = "none"
            isShowingRecords = false;
            console.log("off")
        }
        else {
            document.getElementById('spOverlay').style.display = "block"
            isShowingRecords = true;
            console.log("on")
        }   
    }
}

function handleKey (event) {
    if (event.key === '+'){
        toggleRecords()
    }
}

function init() {
    heroColors = getHeroColors()
    setupContainer()
    document.addEventListener('keydown', event => handleKey(event));
}

async function main() {
    init()
    setInterval(() => changeRuns(), 500)
}

setTimeout(() => {
    if (!window.tsmod) {
        // Allows script to get information from evades if ts mod script does not exist
        window.tsmod = true

        window.client = {
            areaData: {
                check: () => { return false }
            },

            events: {
                emit: () => {},
                events: {
                    chatMessage: {}
                }
            },

            drBefore: () => {return;},

            checkMsg: () => {return true;},
            checkMsgSend: (value) => { return value;},

            grb: { on: false }
        }

        window.replaces = {
            id2: () => {return ;}
        };

        window.tags = {
            getChatTag: () => {return false;}
        }

        window.loadGame = () => {}
    }

    main()
}, 4 * 1000)