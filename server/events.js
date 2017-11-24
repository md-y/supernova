var events = {
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
            soc.emit("event", {type: "ping"});
            events.sync.client(data);
            turnClock.innerHTML = "5";
            clearInterval(clockUpdater);
            clockUpdater = setInterval(updateClock, 1000);
            if (!primed) {
                clearSelected();
                selectedMove = {};
            }
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
                    listing.innerHTML = escape(data.players[i].username);
                    listing.style.color = escape(data.players[i].color);
                    playerList.appendChild(listing);
                }
            }
            players = data.players;
            player = players[soc.id];
            for (let i in moves.sacrifice) {
                if (moves.sacrifice[i].cost <= player.sp) {
                    document.getElementById(i.replace(" ", "")).setAttribute("available", "true");
                } else {
                    document.getElementById(i.replace(" ", "")).setAttribute("available", "false");
                }
            }
            hpBar.style.width = player.hp.toString() + '%';
            spBar.style.width = player.sp.toString() + '%';
            stats.defense.innerHTML = "Defense: " + Math.round((100 - player.armour * 100)).toString() + '%';
            stats.hp.innerHTML = "Health: " + player.hp.toString() + '%';
            stats.sp.innerHTML = "SP: " + player.sp.toString() + '%';
        }
    },
    "setup": {
        client: function(data) {
            cameraX = player.x - 10;
            cameraY = player.y - 10;
            tilesSR = data.boardSize;
            clockUpdater = setInterval(updateClock, 1000);
            console.log("Setup Complete \nGLHF");
        }
    },
    "playerDisconnect": {
        client: function(data) {
            document.getElementById(data.player.id).remove();
        }
    },
    "message": {
        server: function(data, meta) {
            meta.io.in("game").emit("event", data);
        },
        client: function(data) {
            var message = document.createElement("div");
            message.className = "message";
            message.innerHTML = "<h5 style=\"color:" + escape(data.color) + "\">" + escape(data.author) + ": </h5>" +
                                "<h5>" + escape(data.message) + "<h5>";
            messages.appendChild(message);
            message.scrollIntoView();
        }
    },
    "sendMove": {
        server: function(data, meta) {
            meta.players[meta.soc.id].move = data.move;
        }
    },
    "gameOver": {
        client: function(data) {
            clearInterval(drawFrame);
            bd.fillStyle = "#ff0000";
            bd.fillRect(0, 0, bde.width, bde.height);

            alert("Game Over\n" + data.reason);
            location.reload(true);
        }
    }
};

var moves = {
    "natural": {
        "move": {
            info:   "Move up to 5 tiles.",
            area: 5
        },
        "attack": {
            info:   "Do damage to an enemy from up to 5 tiles away.<br>" +
                    "-25 health for a direct hit<br>" +
                    "-15 health for hitting the tile next to them<br>" +
                    "(Executes after movement)",
            area: 5
        },
        "charge": {
            info:   "Do 25 damage to an enemy directly in a melee hit.<br>" +
                    "(Executes before movement)",
            area: 1
        }
    },
    "sacrifice": {
        "guard": {
            cost: 5,
            info:   "Blocks 10% of damage from one attack.<br>" +
                    "(Executes first & is multiplicative)",
            area: 0
        },
        "half block": {
            cost: 25,
            info:   "Defend against half of incoming damage for two turns. <br>" +
                    "(Executes first & is multiplicative)",
            area: 0
        },
        "full block": {
            cost: 50,
            info:   "Defend against all damage from one attack for one turn.<br>" +
                    "Removes all defense after one turn." +
                    "(Executes first)",
            area: 0
        },
        "supernova": {
            cost: 100,
            info:   "Deliver a massive explosion that covers the entire board and kills everyone except you. <br>" +
                    "You win instantly. <br>" +
                    "(Executes last)",
            area: 0
        }
    }
}

try {
    module.exports = {events, moves};
} catch(err) {
    console.log("This is a client, ignoring Node.js module export.");
}