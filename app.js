// Requirements (browser support):
// * <canvas>
// * Function.prototype.bind (ES5)

function Game() {
    this.timeLeft = 60;
    this.score = 0;
    this.pointsPerSecond = 0;
    this.enemies = [];
}
Game.prototype.tick = function() {
    // update enemies
    // pass input to ship for update
    // check for collisions
}


function Enemy() {
    this.spawnedAt = (new Date()).getTime();    // spawn time in milliseconds
}


function GameView(game, canvas) {
    this.game = game;
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.context.fillStyle = 'white';
    this.render();
}
GameView.prototype.render = function() {
    // Simple placeholder render function:
    var x = 400*Math.random();
    this.context.fillRect(x,x, 100, 100);
    this.context.fillRect(x,300-x, 100, 100);
    this._getNextFrame();
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


window.onload = function() {
    var canvas = document.getElementById('game');
    var game = new Game();
    var view = new GameView(game, canvas);
}
