// game control
Game = {
    activeSession: false,
    speed: 4,
    stage: function () { return document.getElementById('stage') },
    balls: [],
    ballsCleared: 0,
    frameTime: 32,
    ballFrequency: 5000,
    lastBallDropped: +new Date,
    colorChange: +new Date,
    colorChangeFrequency: 10000,
    activeBalls: 0,
    score: 0,
    lives: 10,
    streak: 0,
    colors: [
        'blue',
        'orange',
        'yellow',
        'green',
        'red'
    ],
    colorToCatch: null,
    addBall: function (settings) {
        // stopp too many balls being added to the stage
        if (Game.activeBalls < 15 && Game.activeSession) {
            Game.balls.push(Ball(Game.balls.length,settings).init());
            Game.updateScore();
        }
    },
    destroyBall: function (id) {
        Game.balls[id].removeBall();
    },

    gameLoop: function () {
        if (Game.activeSession) {
           var lastFrame = +new Date,
                timer;
            timer = setInterval(function() {
                var now = +new Date,
                    deltaT = now - lastFrame;

                // logic start
                for (var i = 0; i < Game.balls.length; i++) {
                    Game.balls[i].move((deltaT / Game.frameTime));
                }

                // add a new ball at set intervals
                if(lastFrame - Game.lastBallDropped > Game.ballFrequency) {
                    Game.addBall({ color: Game.randomColor(), speed: Math.floor((Math.random() * (10 - 2)) + 2) });
                    Game.lastBallDropped = lastFrame;
                }
                // add a new ball at set intervals
                if(lastFrame - Game.colorChange > Game.colorChangeFrequency) {
                    Game.colorToCatch = Game.randomColor();
                    document.getElementById('color-to-catch').className = Game.colorToCatch;
                    Game.colorChange = lastFrame;
                }

                if(Game.lives < 1) {
                    Game.activeSession = false;
                    clearInterval(timer);
                    for (var i = 0; i < Game.balls.length; i++) {
                        Game.balls[i].removeBall();
                    }
                    document.getElementById('play').style.display = 'block';
                    Game.activeBalls = 0;
                }

                // check streak
                if(Game.streak > 10 && Game.lives < 10) {
                    Game.lives += 1;
                    Game.streak = 0;
                }

                // meh... maybe get rid
                if(Game.activeBalls > 10) {
                    document.body.className = 'shake';
                    document.getElementById('score').className = 'shake';
                    Game.frameTime = 128;
                } else {
                    document.body.className = '';
                    document.getElementById('score').className = '';
                    Game.frameTime =32;
                }

                // logic end
                lastFrame = now;

            }, Game.frameTime);
        }
    },
    updateCleared: function (ball) {
        if (ball.getAttribute('data-color') === Game.colorToCatch) {
            Game.score += 5;
        } else {
            Game.score -= 3;
            Game.lives -= 1;
        }
        Game.ballsCleared += 1;
        Game.updateScore();
    },
    updateScore: function () {
        console.log('go');
        var added = document.getElementById('balls-added'),
            active = document.getElementById('balls-active'),
            cleared = document.getElementById('balls-cleared'),
            score = document.getElementById('score'),
            lives = document.getElementById('lives');

        Game.activeBalls = Game.balls.length - Game.ballsCleared;
        added.innerHTML = Game.balls.length;
        cleared.innerHTML = Game.ballsCleared;
        active.innerHTML = Game.activeBalls;
        score.innerHTML = Game.score;

        while (lives.lastChild) {
          lives.removeChild(lives.lastChild);
        }

        for (var i=0; i < Game.lives; i++) {
            var node = document.createElement('li');
            var lifeBall = document.createElement('span');
            lifeBall.className = 'life';
            node.appendChild(lifeBall);
            lives.appendChild(node);
        }
    },
    randomColor: function () {
        var color = Math.floor(Math.random() * Game.colors.length);
        return Game.colors[color];
    },
    init: function () {

        Game.balls = [];
        Game.activeBalls = 0;
        Game.ballsCleared = 0;
        Game.lives = 10;
        Game.score = 0;
        Game.activeSession = true;
        Game.lastBallDropped = +new Date;
        Game.colorChange = +new Date;
        Game.streak = 0;

        document.getElementById('play').style.display = 'none';
        this.stage();
        this.colorToCatch = this.randomColor();
        document.getElementById('color-to-catch').className = Game.colorToCatch;
        Game.addBall({ color: Game.randomColor(), speed: Game.speed });
        this.gameLoop();
    }
}




// ball object
var Ball = function (id,settings) {
    var stage = '',
        instance = '',
        velocity = {
            x: 0,
            y: 0,
        },
        speed = settings.speed,
        direction = {
            x: 1,
            y: 1
        },
        createBall = function () {
            instance = document.createElement('div');
            instance.className = 'ball ' + settings.color;
            instance.setAttribute('data-id',id);
            instance.setAttribute('data-color',settings.color);
            instance.ontouchstart = function (e) {
                e.stopPropagation();

                if(settings.color === Game.colorToCatch) {
                    instance.className = 'ball-die good';
                    Game.streak += 1;
                } else {
                    instance.className = 'ball-die bad';
                    Game.streak = 0;
                }

                instance.ontouchstart = '';
                setTimeout(function (){
                    removeBall(id);
                },500);
                Game.updateCleared(this);
            }
            stage.appendChild(instance);
        },
        removeBall = function () {
            if (stage.contains(instance)) {
                stage.removeChild(instance);
            }
        },
        move = function (vel) {
            var topPos = parseInt(instance.style.top),
                leftPos = parseInt(instance.style.left);

            velocity.x = (speed*vel)*direction.x;
            velocity.y = (speed*vel)*direction.y;

            instance.style.top = topPos+velocity.y + 'px';
            instance.style.left = leftPos+velocity.x + 'px';
            checkForWalls();
        },
        checkForWalls = function () {
            var ballBox = instance.getBoundingClientRect(),
                stageBox = stage.getBoundingClientRect();

            if (ballBox.bottom > stageBox.bottom && direction.y > 0 ||
                ballBox.top < stageBox.top && direction.y < 0) {
                direction.y *= -1;
            }
            if (ballBox.right > stageBox.right && direction.x > 0 ||
                ballBox.left < stageBox.left && direction.x < 0) {
                direction.x *= -1;
            }
        },
        // initialize ball and add to stage
        init = function (id) {
            stage = Game.stage();
            createBall();
            direction.x = Math.random() < 0.5 ? -1 : 1;
            direction.y = Math.random() < 0.5 ? -1 : 1;
            instance.style.top = (Math.floor(Math.random() * (stage.clientHeight - 0 + 1)) + 0) + 'px';
            instance.style.left = (Math.floor(Math.random() * (stage.clientWidth - 0 + 1)) + 0) + 'px';
            Game.activeSession = true;
            return this;
        };
    return {
        init: init,
        move: move,
        removeBall: removeBall
    }
}


// bindings
document.getElementById('add-blue').addEventListener('touchstart', function (e) {
    e.preventDefault();
    Game.addBall({color: 'blue', speed: Game.speed});
});
document.getElementById('add-orange').addEventListener('touchstart', function (e) {
    e.preventDefault();
    Game.addBall({color: 'orange', speed: Game.speed});
});
document.getElementById('add-yellow').addEventListener('touchstart', function (e) {
    e.preventDefault();
    Game.addBall({color: 'yellow', speed: Game.speed});
});
document.getElementById('add-green').addEventListener('touchstart', function (e) {
    e.preventDefault();
    Game.addBall({color: 'green', speed: Game.speed});
});
document.getElementById('add-red').addEventListener('touchstart', function (e) {
    e.preventDefault();
    Game.addBall({color: 'red', speed: Game.speed});
});


// start game on load

document.getElementById('play').addEventListener('touchstart', function (e) {
    e.preventDefault();
    Game.init();
});