let spawns = [];
let model = "adder";
let defaultTime = 600000;
let warning = false;
const {
    triggerAsyncId
  } = require("async_hooks");
  const { spawn } = require("child_process");


let lastUpdate = new Date(1970,1,1);
let startTime = new Date(1970,1,1);
let players = [];

on("playerDropped", (reason) => {

    console.log("players before", players);
    players = players.filter( (p) => p.id != global.source);
    console.log(`Player ${GetPlayerName(global.source)} dropped (Reason: ${reason}).`)
    console.log("players",players);
    emitNet('zombie:updateplayers',-1, players);

    
});

onNet('onServerResourceStart', (resource) => {
    // console.log("resource started: ",resource);
    if (resource == "zombie") {
        spawns = JSON.parse(LoadResourceFile(GetCurrentResourceName(),"spawnLocations.json"))
        //console.log(spawns);
    }

});

onNet('zombie:settimer', (seconds) => {
    defaultTime = seconds * 1000;
    console.log(`timer set to ${defaultTime}` );

})

onNet('zombie:repairall',() => {
    emitNet("zombie:repair",-1);
    emitNet('zombie:showNotify', -1,
            "Repair",
            `All Player Vehicles Repaired`,
            3000,
            "normal"
          );
})
onNet('zombie:setcar', (m) => {
    if(model != m){
    model = m;
    console.log("Model:",model);
    emitNet('zombie:setcar',-1, model);
    }

})

  onNet('zombie:registervehicle',(playerid,vehicleentityid) => {
    if( players.filter( (player) => playerid ==player.id ).length == 0){
        players.push({
            id: playerid,
            chaser: false,
            isin: false,
            position: {
                x: spawns[players.length].x,
                y: spawns[players.length].y,
                z: spawns[players.length].z,
                direction: spawns[players.length].direction,

            },
            name: GetPlayerName(playerid),
            vehicleid: vehicleentityid
        })
    } else {
        players.forEach( (player,index) =>{
            if(player.id == playerid){
                players[index].vehicleid = vehicleentityid;
            }
        })
    }
   // console.log(players)
    emitNet('zombie:updateplayers',-1, players);

  })


onNet('zombie:startlastin', () => {
    startLastIn();
})

function startLastIn() {

    emitNet('zombie:lastin', -1);
    
    startGame();
    //console.log(players);
}

onNet('zombie:gotin', (playerid) => {
    //console.log("Player Is in", playerid)
    players.forEach((player) => {
        if (player.id == playerid) {
            //console.log("Player Is in",playerid)
            player.isin = true;
        }
    });


    const playersout = players.filter((player) => !player.isin)
    //console.log(playersout.length)
    if (playersout.length == 1) {
        playersout[0].chaser = true;
        emitNet('zombie:showNotify', -1,
            "Game Starts",
            `Run for your Lives, ${playersout[0].name} is a zombie!`,
            10000,
            "ambulance"
        );

    }
})

function startGame() {
    emitNet('zombie:start', -1, defaultTime);
    lastUpdate = new Date();
    startTime = lastUpdate;

    setTick(() => {

        currentTime = new Date();
        //console.log("currentTime:",currentTime);
        //console.log("startTime:",startTime);
        //console.log("currentTime-startTime:",currentTime-startTime);
        // console.log("startTime+defaultTime:",startTime + defaultTime);

        //console.log("IsStarted",startTime)
        //console.log("timer:",currentTime - (startTime + defaultTime));

        if (startTime && !warning && (currentTime - startTime) + 10000 > defaultTime) {
            emitNet('zombie:showNotify', -1,
                "Time Remaining",
                `10 Seconds Left!`,
                3000,
                "warning"
            );
            warning = true;

        }

        //if time runs out
        const survivors = players.filter((player) => !player.chaser)

        if ((survivors && survivors.length == 0) || ((startTime && currentTime - startTime > defaultTime))) {
            const survivornames = [];
            console.log("killplayer")
            //kill the player
            players.forEach((player, index) => {
                if (player.chaser == false) {
                    survivornames.push(player.name);
                    emitNet('zombie:showNotify', -1,
                        "Survivor",
                        `${player.name} survived`,
                        5000,
                        "normal"
                    );

                }
                if (player.chaser == true) {
                    let chasername = player.name;
                    player.chaser = false;
                    startTime = undefined;
                    emitNet('zombie:killplayer', player.id);
                }



            })
            const names = survivornames.join(', ')
            if (survivornames.length == 0) {
                emitNet('zombie:showNotify', -1,
                    "WINNERS",
                    `Zombies Win!`,
                    10000,
                    "info"
                );
            }

            startTime = undefined;
            warning = false;
            emitNet('zombie:end', -1, players);
            emitNet('zombie:updateplayers', -1, players);
            //end the game


        }
        //if one player left



    })
}

function randomisechaser() {
    const randIndex = Math.floor(Math.random() * players.length);
    let name = undefined;
    players.forEach( (player,index) => {
        if(player.chaser == true && randIndex != index){
            
            player.chaser = false;
            emitNet('zombie:notchaser',player.id);
        }

        if(player.chaser == false && randIndex == index)
        {
            player.chaser = true;
            emitNet('zombie:chaser',player.id);
            name = player.name;
           



        }
    })
    
    emitNet('zombie:updateplayers',-1, players);
    
    emitNet('zombie:showNotify', -1,
            "Game Starts",
            `Run for your Lives, ${name} is a zombie!`,
            10000,
            "ambulance"
          );
  
    startGame();
  
    //console.log(players);

}

onNet('zombie:randomisechaser', () => { randomisechaser() })

onNet('zombie:touch', (victim,chaser) => {
    //console.log("victim",victim)
    //console.log("chaser",chaser)
    //console.log("lastUpdate",lastUpdate - new Date())
    if(new Date() - lastUpdate > 5000)
    {
        console.log("victim", victim);
        let chasername = "";
        players.forEach((player, index) => {
            if (player.id == chaser) {
                chasername = player.name;
            }
        })

        players.forEach( (player,index) => {


            if(player.id == victim && !player.chaser)
            {
                let victimname = player.name;
                const lastRun = new Date() - lastUpdate;
                const minutes = Math.floor(lastRun / 60000);
                const seconds = Math.floor((lastRun - (minutes * 60000)) / 1000);
                player.chaser = true;
                lastUpdate = new Date();
                emitNet('zombie:chaser',player.id);
                console.log("new chaser", player.id);
                emitNet('zombie:showNotify', -1,
            "Infected",
            `${victimname} was caught by ${chasername} and joined the infected!`,
            5000,
            "ambulance"
          );
               
            }
        })
    emitNet('zombie:updateplayers',-1, players);
    
    //console.log(players);
}
})
