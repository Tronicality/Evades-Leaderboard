async function updateChangedRanks(player_collection, allPlayers, changedUsernames, limit) {
    for (let i = 0 ; i < changedUsernames.length ; i = i + limit) {
        const users = []

        for (let j = i ; j < i + limit ; j++) {
            const username = changedUsernames[j]

            if (username) {
                const player = allPlayers.find(p => p.username === username)
                
                users.push(player_collection.updateOne({ "username": username },
                    {
                        $set: {
                            "points": player.points,
                            "position": player.position
                        }
                    }))
            }    
        }

        await Promise.all(users)
    }
}

function rankPlayers(allPlayers, changedUsernames) {
    const soloRanked = [...allPlayers].sort((a, b) => a.points.solo - b.points.solo)
    const duoRanked = [...allPlayers].sort((a, b) => a.points.duo - b.points.duo)
    const overallRanked = [...allPlayers].sort((a, b) => a.points.overall - b.points.overall)

    let positionCount = 0
    for (const player of allPlayers) {
        const position = {
            solo: soloRanked.findIndex(p => p.username === player.username) + 1,
            duo: duoRanked.findIndex(p => p.username === player.username) + 1,
            overall: overallRanked.findIndex(p => p.username === player.username) + 1
        }

        if ((JSON.stringify(position) !== JSON.stringify(player.position))) {
            player.position = position

            changedUsernames.add(player.username)
            positionCount++
        }
    }

    console.log(`Amount of changed players by positions: ${positionCount}`)
}

function findAllPlayersPoints(allPlayers, changedUsernames) {
    const calcPlayerPoints = (map_rankings) => {
        let soloPoints = 0;
        let duoPoints = 0;
    
        for (const place of Object.values(map_rankings)) {
            soloPoints += place.solo
            duoPoints += place.duo
        }
    
        return { "solo": soloPoints, "duo": duoPoints, "overall": soloPoints + duoPoints }
    }

    let pointCount = 0
    for (const player of allPlayers) {
        const points = calcPlayerPoints(player.map_rankings)

        if ((JSON.stringify(points) !== JSON.stringify(player.points))) {
            player.points = points

            changedUsernames.add(player.username)
            pointCount++
        }
    }

    console.log(`Amount of changed players by points: ${pointCount}`)
}

exports = async function () {
    const player_collection = context.services.get("Evades-Runs").db("leaderboards").collection("players")
    const allPlayers = await player_collection.find({}).toArray()
    const changedUsernames = new Set()

    findAllPlayersPoints(allPlayers, changedUsernames)
    rankPlayers(allPlayers, changedUsernames)
    updateChangedRanks(player_collection, allPlayers, Array.from(changedUsernames), 1000)
}