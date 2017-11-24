var server = require("http").createServer(reqHandler),
io = require("socket.io")(server),
eventsjs = require("./events.js"),
events = eventsjs.events,
moves = eventsjs.moves,
fs = require("fs"),
cfg,
players = {},
gameState = 0, //0 = Stopped; 1 = Running
gameLoop;

try {
    cfg = require("./config-override.json");
    console.log("Module config-overide.json found. Assuming dev version.");
} catch (err) {
    cfg = require("./config.json");
    console.log("Module config-overide.json not found. Assuming shipped version.");
}

server.listen(process.env.PORT || cfg.port);
io.origins(cfg.origins);

function reqHandler(req, res) {
    switch(req.url.split('?')[0]) {
    case "/events":
        fs.readFile(__dirname +  "/events.js", function(err, data) {
            if(err) {
                res.writeHead(500);
                console.log("Unable to load events.js \n" + err);
                res.end();
                return;
            }
            res.writeHead(200);
            res.end(data);
        });
    break;
    case "/players":
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        var total = Object.keys(players).length;
        res.end(JSON.stringify({
            total: total,
            print: total + " player(s)"
        }));
    break;
    default:
        res.writeHead(302, {"Location": "https://midymyth.github.io/supernova"});
        res.end();
    break;
    }
}



class Player {
    constructor(username_, id_, color_, index_) {
        this.username = username_;
        this.id = id_;
        this.index = index_;
        this.hp = 100;
        this.sp = 0;
        this.color = color_;
        this.lastPing = new Date().getTime();
        this.move = null;
        this.status = "alive";
        this.armour = 1;
        this.killerName = undefined;
        do {
            var cont = false;
            this.x = Math.floor(Math.random() * cfg.boardSize);
            this.y = Math.floor(Math.random() * cfg.boardSize);
            for (let i in players) {
                if (Math.abs(players[i].x - this.x) < cfg.boardSize/10 && Math.abs(players[i].y - this.y) < cfg.boardSize/10) {
                    cont = true;
                }
            }
        } while (cont);
        this.px = this.x;
        this.py = this.y;
        this.onHit = [];
        this.onTurn = [];
    }
    execTurn() {
        this.sp = this.sp > 100 ? 100 : this.sp;
        for (let i in this.onTurn) {
            this.onTurn[i].turn--;
            if (this.onTurn[i].turn <= 0) {
                if (this.onTurn[i].value == 0) {
                    this.armour = 1;
                } else {
                    this.armour /= this.onTurn[i].value;
                }
                this.onTurn.splice(i, 1);
            }
        }
    }
    damage(dmg, dealer) {
        this.hp-= dmg * this.armour;
        if (this.hp <= 0) {
            this.kill(dealer);
        }
        for (let i in this.onHit) {
            this.armour /= this.onHit[i];
            this.onHit.splice(i, 1);
        }
    }
    kill(killer) {
        this.status = "dead";
        this.killerName = players[killer].username;
        players[killer].sp += 15;
    }
}

io.on("connection", function(soc) {
    console.log("New connection on socket", soc.id);
    soc.join("game");
    soc.on("event", function(data) {
        try {
            var event = events[data.type];
            var meta = {players: players, 
                        soc: soc,
                        Player: Player,
                        cfg: cfg,
                        io: io};

            if ("exec" in event) {
                event.exec(data);
            }
            if ("server" in event) {
                event.server(data, meta);
            }
        } catch (err) {
            console.log("Unable to execute event\n" + err);
        }
    });
    soc.on("disconnect", function(data){disconnect(soc.id)});
    if (gameState == 0) {
        gameState = 1;
        console.log("Game Started");
        gameLoop = setInterval(turn, 5000);
    }
});

function disconnect(id) {
    if(id in players) {
        io.in("game").emit("event", {type: "playerDisconnect", player: players[id]});
        console.log("Player " + players[id].username + " (" + id + ") has disconnected.");
        delete players[id];
    }
    if (id in io.sockets.connected) {
        io.sockets.connected[id].disconnect();
    }
    if (Object.keys(players).length == 0) {
        gameState = 0;
        clearInterval(gameLoop);
        console.log("Game stopped.");
    }
}

function turn() {
    var time = new Date().getTime();
    var player, 
    queue = {"guard": {}, "half block": {}, "full block": {}, "charge": {}, "move": {}, "attack": {}, "supernova": {}};
    for (let i in players) {
        player = players[i];
        if (time - player.lastPing > 10000) {
            disconnect(i);
            console.log("Player " + player.username + " (" + i + ") has been timed out.");
            continue;
        }
        if (player.move == null) {
            player.sp += 5;
        } else {
            if (player.move.name in moves.natural || player.sp >= moves.sacrifice[player.move.name].cost) {
                queue[player.move.name][player.id] = player.move;
            }
            player.move = null;
        }
        player.execTurn();
    }
    var player;
    for (let i in queue["guard"]) {
        player = players[i];
        player.armour *= 0.9;
        player.onHit.push(0.9);
        player.sp -= moves.sacrifice.guard.cost;
    }
    for (let i in queue["half block"]) {
        player = players[i];
        player.armour *= 0.5;
        player.onTurn.push({turn: 2, value: 0.5});
        player.sp -= moves.sacrifice["half block"].cost;
    }
    for (let i in queue["full block"]) {
        player = players[i];
        players[i].armour *= 0;
        player.onTurn.push({turn: 1, value: 0});
        player.sp -= moves.sacrifice["full block"].cost;
    }
    for (let i in queue["charge"]) {
        var move = queue["charge"][i];
        var target = findPlayerFromPoint(move.x, move.y);
        player = players[i];
        if (target && within(player.x, player.y, target.x, target.y, moves.natural.charge.area)) {
            target.damage(25, i);
        }
    }
    for (let i in queue["move"]) {
        player = players[i];
        var move = queue["move"][i];
        if (Math.abs(player.x - move.x) <= moves.natural.move.area && Math.abs(player.y - move.y) <= moves.natural.move.area) {
            player.px = player.x;
            player.py = player.y;
            player.x = move.x;
            player.y = move.y;
        }
    }
    for (let i in queue["attack"]) {
        var move = queue["attack"][i];
        player = players[i];
        if (within(player.x, player.y, move.x, move.y, moves.natural.attack.area)) {
            var target = findPlayerFromPoint(move.x, move.y);
            if (target && target.x == move.x && target.y == move.y) {
                target.damage(20, i);
                continue;
            }
            for (let p in players) {
                target = players[p];
                if (within(target.x, target.y, move.x, move.y, 1)) {
                    target.damage(15, i);
                }
            }
        }
    }
    for (let i in queue["supernova"]) {
        io.in("game").emit("event", {type: "gameOver", reason: players[i].username + " has activated supernova."})
    }
    io.in("game").emit("event", {type: "turn", players: players});
}

function findPlayerFromPoint(x, y) {
    for (let p in players) {
        if (players[p].x == x && players[p].y == y) {
            return players[p];
        }
    }
    return false;
}

function within(x1, y1, x2, y2, range) {
    if (Math.abs(x1 - x2) <= range && Math.abs(y1 - y2) <= range) {
        return true;
    } else {
        return false;
    }
}