var events = {
    "debug": {
        server: function(data, meta) {
            if (data.pass = meta.pass) {
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
            meta.players.push(new meta.Player(data.username, meta.soc.id, data.color));
            meta.io.in("game").emit("event", {type: "syncPlayers", players: meta.players});
        }
    },
    "turn": {
        client: function(data) {
            players = data.players;
        }
    },
    "syncPlayers": {
        client: function(data) {
            players = data.players;
        }
    }
};

try {
    module.exports = {events};
} catch(err) {
    console.log("This is a client, ignoring Node.js module export.");
}