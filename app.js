// Requirements (browser support):
// * <canvas>
// * Function.prototype.bind (ES5)

function Game() {
    this.timeLeft = 60;
    this.score = 0;
    this.topScore = 0; //TODO: fetch from localstorage
    this.pointsPerSecond = 0;
    this.showIntroOverlay = true;
    this.gameStartTime = null;      // Game start time, in milliseconds
    this.enemies = [];
}
Game.prototype.update = function(inputCommands) {
    // update enemies
    // pass input to ship for update
    // check for collisions

    if (this.showIntroOverlay) {
        if (inputCommands.startGame) {
            this.start();
        }
    }
    else {
        var elapsedTimeInMs = (new Date()).getTime() - this.gameStartTime;
        this.timeLeft = 60 - elapsedTimeInMs/1000;
        if (this.timeLeft <= 0) {
            this._endGame();
        }
    }
}
Game.prototype._endGame = function() {
    this.showIntroOverlay = true;
    this.timeLeft = 0.01;
}
Game.prototype.start = function() {
    this.showIntroOverlay = false;
    this.timeLeft = 60;
    this.score = 0;
    this.gameStartTime = (new Date()).getTime();
    // TODO: init enemies here
    this.enemies = [new Enemy(100,100), ];
}



function Enemy(x, y) {
    this.x = x;
    this.y = y;
    this.spawnedAt = (new Date()).getTime();    // spawn timestamp in milliseconds
}

// Return the time since the enemy was spawned, in milliseconds:
Enemy.prototype.getAge = function() {
    return (new Date()).getTime() - this.spawnedAt;
}

// Fade out the enemy's colour as it ages:
Enemy.prototype.getColourString = function() {
    var maxOpacity = 1, minOpacity = 0.4;
    var opacity = Math.max(minOpacity, maxOpacity - this.getAge()/5000);
    return 'rgba(255,0,0,' + opacity.toFixed(2) + ')';
}

// Shrink the enemy's size as it ages:
Enemy.prototype.getRadius = function() {
    var maxRadius = 30, minRadius = 10;
    return Math.max(minRadius, maxRadius - this.getAge()/500);
}



function GameView(game, canvas) {
    this.game = game;
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.setDefaults();
    this.render();
}

GameView.prototype.setDefaults = function() {
    this.context.fillStyle = 'white';
    this.context.strokeStyle = 'white';
    this.context.font = '1em Orbitron,monospace';
}

GameView.prototype.render = function() {
    // TODO: only render if the game state has changed since last render
    this.context.clearRect(0,0,400,400);    // Reset the canvas
    this.drawStats();
    this.drawEnemies(this.game.enemies);
    this.game.showIntroOverlay ? this.drawIntroOverlay() : null;
    this._getNextFrame();
}

// Draw an overlay on the canvas, with the game name, controls, etc.
GameView.prototype.drawIntroOverlay = function() {
    this.context.save();
    this.context.textAlign = 'center';
    // Display main title:
    this.context.font = '2em Orbitron,monospace';
    this.context.fillText('Canvasulative', this.canvas.width/2, this.canvas.height/2 - 30);
    this.context.font = '1em Orbitron,monospace';
    this.context.fillText('Press SPACE to play', this.canvas.width/2, this.canvas.height/2);

    // Display attribution text at the bottom:
    this.context.font = '0.8em Orbitron,monospace';
    this.context.fillText('This is a clone of Cumulative, by Guy Lima', this.canvas.width/2, this.canvas.height - 85);
    this.context.fillText('http://www.guylima.com/cumulative/', this.canvas.width/2, this.canvas.height - 70);
    this.context.restore();
}

GameView.prototype.drawStats = function() {
    var width = this.canvas.width;
    var height = this.canvas.height;
    var textPadding = 5;
    this.context.textAlign = 'left';
    this.context.fillText('Time Left: ' + this.game.timeLeft.toFixed(1), textPadding, 20);
    this.context.textAlign = 'right';
    this.context.fillText('Score: ' + this.game.score, width - textPadding, 20);
    this.context.fillText('Top: ' + this.game.topScore, width - textPadding, 40);
    this.context.fillText('Pts/s: ' + this.game.pointsPerSecond, width - textPadding, height - textPadding);
}

// Draw each enemy on the canvas
GameView.prototype.drawEnemies = function(enemies) {
    this.context.save();
    this.context.lineWidth = 4;
    this.context.lineCap = 'round';
    for (var i = 0; i < enemies.length; i++) {
        var enemy = enemies[i];
        var radius = enemy.getRadius();
        var rotationAngle = enemy.getAge()/500;
        this.context.strokeStyle = enemy.getColourString();
        this.context.beginPath();
        this.context.arc(enemy.x, enemy.y, radius,
                         Math.PI/8 + rotationAngle, 7*Math.PI/8 + rotationAngle, false);
        this.context.stroke();
        this.context.beginPath();
        this.context.arc(enemy.x, enemy.y, radius,
                         9*Math.PI/8 + rotationAngle, 15*Math.PI/8 + rotationAngle, false);
        this.context.stroke();
    }
    this.context.restore();
}

// Use requestAnimationFrame (if available) to trigger the next rendering
// of the GameView.
GameView.prototype._getNextFrame = function() {
    this.render_func = this.render_func || this.render.bind(this);
    this.requestAnimFrame = this.requestAnimFrame || (function(){
        return window.requestAnimationFrame       ||
               window.webkitRequestAnimationFrame ||
               window.mozRequestAnimationFrame    ||
               window.oRequestAnimationFrame      ||
               window.msRequestAnimationFrame     ||
               function(callback, element){
                   window.setTimeout(callback, 1000 / 60);
               };
    })();

    // Call this.render (with the appropriate "this" value) for each frame.
    // We also need to bind our requestAnimFrame to window, or it won't run
    // properly.
    this.requestAnimFrame.bind(window)(this.render_func, this.canvas);
}



function InputController(game) {
    this.game = game;       // Game model object
    this._commands = {};    // Queued commands to be sent to the model

    // Map javascript key codes to game commands that can be sent to the model:
    this.keyMap = {
        32: 'startGame',    // space
        37: 'shipLeft',     // left arrow
        38: 'shipUp',       // up arrow
        39: 'shipRight',    // right arrow
        40: 'shipDown'      // down arrow
    }
    this.bindKeyboardListeners();
    this.startUpdateLoop();
}
InputController.prototype.bindKeyboardListeners = function() {
    that = this;
    window.addEventListener('keydown', function(e) {
        if (e.keyCode in that.keyMap) {
            var commandName = that.keyMap[e.keyCode];
            that._commands[commandName] = true;
        }
    });
    window.addEventListener('keyup', function(e) {
        if (e.keyCode in that.keyMap) {
            var commandName = that.keyMap[e.keyCode];
            delete that._commands[commandName];
        }
    });
}
InputController.prototype.startUpdateLoop = function() {
    var ticksPerSecond = 50;
    var updateFn = this.callUpdate.bind(this);
    setInterval(updateFn, 1000/ticksPerSecond);
}
InputController.prototype.callUpdate = function() {
    var commands = {};
    this.game.update(this._commands);
}



window.onload = function() {
    var canvas = document.getElementById('game');
    var game = new Game();
    var view = new GameView(game, canvas);
    var controller = new InputController(game);
}
