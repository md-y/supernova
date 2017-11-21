var server = require("http").createServer(reqHandler),
io = require("socket.io")(server),
events = require("./events.js").events,
fs = require("fs"),
cfg = require("./config.json"),
players = [];

server.listen(80);

function reqHandler(req, res) {
    if (req.url.split('?')[0] == "/events") {
        res.writeHead(200);
        fs.readFile(__dirname +  "/events.js", function(err, data) {
            if(err) {
                res.writeHead(500);
                console.log("Unable to load events.js \n" + err);
                res.end();
                return;
            }
            res.end(data);
        });
    } else {
        res.writeHead(302, {"Location": "https://midymyth.github.io/supernova"});
        res.end();
    }
}

class Player {
    constructor(username_, id_, color_, index_) {
        this.username = username_;
        this.id = id_;
        this.index = index_;
        this.health = 100;
        this.sp = 0;
        this.color = color_;
        do {
            var bad = false;
            this.x = Math.floor(Math.random() * cfg.boardSize);
            this.y = Math.floor(Math.random() * cfg.boardSize);
            for (let i in players) {
                if (Math.abs(players[i].x - this.x) < cfg.boardSize/10 && Math.abs(players[i].y - this.y) < cfg.boardSize/10) {
                    bad = true;
                }
            }
        } while (bad);
    }
}

io.on("connection", function(soc) {
    console.log("New connection on socket", soc.id);
    soc.join("game");
    soc.on("event", function(data) {
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
    });
});