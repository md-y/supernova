var events = {
    "debug": {
        server: function(data, meta) {
            if (data.pass = meta.cfg.debugPassword) {
                switch(data.de) {
                    case "listPlayers":
                        console.log(meta.players); 
                    break;
                }
            }
        }
    },
    "newPlayer": {
        exec: function(data) {
            console.log("New Player:", data.username);
        },
        server: function(data, meta) {
            meta.players.push(new meta.Player(data.username, meta.soc.id, data.color, meta.players.length));
            meta.io.in("game").emit("event", {type: "sync", players: meta.players, boardSize: meta.cfg.boardSize});
            meta.soc.emit("event", {type: "setup"});
        }
    },
    "turn": {
        client: function(data) {
            players = data.players;
        }
    },
    "sync": {
        client: function(data) {
            players = data.players;
            tilesSR = data.boardSize;
            for (let i in players) {
                if (players[i].id = soc.id) {
                    player = players[i];
                }
            }
        }
    },
    "setup": {
        client: function(data) {
            cameraX = player.x - 10;
            cameraY = player.y - 10;
            console.log("Setup Complete \nGLHF");
        }
    }
};

try {
    module.exports = {events};
} catch(err) {
    console.log("This is a client, ignoring Node.js module export.");
}