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
            meta.players[meta.soc.id] = new meta.Player(data.username, meta.soc.id, data.color, meta.players.length);
            meta.io.in("game").emit("event", {type: "sync", players: meta.players});
            meta.soc.emit("event", {type: "setup", boardSize: meta.cfg.boardSize});
        }
    },
    "turn": {
        client: function(data) {
            console.log("Turn");
            players = data.players;
            soc.emit("event", {type: "ping"});
            events.sync.client(data);
        }
    },
    "ping": {
        client: function(data) {
            soc.emit("event", {type: "ping"});
        },
        server: function(data, meta) {
            meta.players[meta.soc.id].lastPing = new Date().getTime();
        }
    },
    "sync": {
        client: function(data) {
            for (let i in data.players) {
                if (!(i in players)) {
                    var listing = document.createElement("h5");
                    listing.id = data.players[i].id;
                    listing.innerHTML = data.players[i].username;
                    listing.style.color = data.players[i].color;
                    playerList.appendChild(listing);
                }
            }
            players = data.players;
            player = players[soc.id];
        }
    },
    "setup": {
        client: function(data) {
            cameraX = player.x - 10;
            cameraY = player.y - 10;
            tilesSR = data.boardSize;
            console.log("Setup Complete \nGLHF");
        }
    },
    "playerDisconnect": {
        client: function(data) {
            document.getElementById(data.player.id).remove();
        }
    }
};

try {
    module.exports = {events};
} catch(err) {
    console.log("This is a client, ignoring Node.js module export.");
}