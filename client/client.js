var soc, self, drawFrame, bd, bde, width, height, players;
var args = {};
var frameRate = 30;
var viewScale = 50;

window.onload = function() {
    args.server = window.atob(getKey(location.href, "server", "aHR0cDovL2xvY2FsaG9zdA=="));
    args.username = window.atob(getKey(location.href, "name", "amVmZg=="));
    args.color = getKey(location.href, "color", "#ffffff");

    $.getScript(args.server + "/events", function() {
        setupSocket();
        drawFrame = setInterval(draw, 1000/frameRate);

        bde = document.getElementById("board");
        window.addEventListener("resize", resetDimensions);
        window.addEventListener("orientationchange", resetDimensions);
        resetDimensions();
        bd = bde.getContext("2d");
    }).fail(function() {
        console.log("Failed to get events.js from server.");
    });
}

function getKey(s, k, d) {
    try {
        return s.match("[?]" + k + "=([^?]+)")[1];
    } catch (err) {
        console.log("Cannot find " + k + ", using " + d)
        return d;
    }
}

function setupSocket () {
    soc = io(args.server);

    soc.on("event", function(data) {
        var event = events[data.type];

        if ("exec" in event) {
            event.exec(data);
        }
        if ("client" in event) {
            event.client(data);
        }
    });

    soc.emit("event", {type: "newPlayer", username: args.username, color: args.color});
}

function resetDimensions() {
    width = window.innerWidth;
    height = window.innerHeight;
    bde.width = width;
    bde.height = height;
}

function debug(de, pass, args) {
    soc.emit("event", {type: "debug", de: de, pass: pass});
}

function draw() {
    for (var y = 0; y < height / viewScale; y++) {
        for (var x = 0; x < width / viewScale; x++) {
            bd.fillStyle = "gray";
            for (let i in players) {
                if (players[i].x == x && players[i].y == y) {
                    bd.fillStyle = players[i].color;
                }
            }
            bd.fillRect(x * viewScale + x, y * viewScale + y, viewScale - 1, viewScale - 1);
        }
    }
}