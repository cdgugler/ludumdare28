var game = new Phaser.Game(320,465, Phaser.CANVAS, 'trmbs-game', {preload: preload, create: create, update: update, render: render });

function preload() {
    game.load.image('hero', 'assets/img/hero.png');
    game.load.image('spike', 'assets/img/spike.png');
    game.load.image('ear', 'assets/img/ear.png');
    game.load.image('arm', 'assets/img/arm.png');
    game.load.image('body', 'assets/img/body.png');
    game.load.image('head', 'assets/img/head.png');
    game.load.image('leg', 'assets/img/leg.png');
}

var player,
    spike,
    jumpTimer = 0;

function playerCollidesWithSpike() {
    deadPlayerEmitter.x = player.body.x;
    deadPlayerEmitter.y = player.body.y;
    player.kill();
    deadPlayerEmitter.start(true, 2000, null, 20);
}

function create() {
    game.stage.backgroundColor = '#000';
    player = game.add.sprite(10, 50, 'hero')
    spike = game.add.sprite(-20, -20, 'spike')
    deadPlayerEmitter = game.add.emitter(0, 0, 200);
    deadPlayerEmitter.bounce.setTo(0.5, 0.5);
    deadPlayerEmitter.setXSpeed(-150, 150);
    deadPlayerEmitter.setYSpeed(-30, 30);
    deadPlayerEmitter.makeParticles(['ear', 'arm', 'body', 'head', 'leg']);
    deadPlayerEmitter.gravity = 10;

    player.anchor.setTo(0.5, 0.5);
    spike.anchor.setTo(0.5, 0.5);
    player.body.drag.setTo(400, 400);
    player.body.collideWorldBounds = true;
    player.body.gravity.y = 100;
}

function update() {
    spike.body.x = game.input.activePointer.x-16;
    spike.body.y = game.input.activePointer.y-16;
    game.physics.collide(player, spike, playerCollidesWithSpike, null, this);
    if (game.input.activePointer.isDown) {
        game.physics.moveToPointer(player, 600);
        // game.physics.velocityFromAngle(game.physics.angleToPointer(player), 900, player.velocity);
        // player.body.velocity.x += game.input.activePointer.x > player.body.x ? game.input.activePointer.x : -(game.input.activePointer.x);
        // player.body.velocity.y -= game.input.activePointer.y;
    } else {
    }
}

function render() {
    // game.debug.renderSpriteInfo(player, 32, 32);
}
