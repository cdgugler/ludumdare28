var game = new Phaser.Game(320,480, Phaser.CANVAS, 'trmbs-game', {preload: preload, create: create, update: update, render: render });

function preload() {
    game.load.image('hero', 'assets/img/hero.png');
    game.load.image('spike', 'assets/img/spike.png');
    game.load.image('spikeghost', 'assets/img/spikeghost.png');
    game.load.image('ear', 'assets/img/ear.png');
    game.load.image('arm', 'assets/img/arm.png');
    game.load.image('body', 'assets/img/body.png');
    game.load.image('head', 'assets/img/head.png');
    game.load.image('leg', 'assets/img/leg.png');
    game.load.image('jumpMeter', 'assets/img/jumpMeter.png');
    game.load.tilemap('level01', 'assets/maps/level01.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.tileset('tiles', 'assets/img/tiles01.png', 16, 16);
}

var player,
    spike,
    jumpTimer = 0,
    jumping,
    map,
    tileset,
    layer;

var JUMPMETERHEIGHT = 50;


function playerCollidesWithSpike() {
    // set the emitter to the location of the player before we blow em up
    deadPlayerEmitter.x = player.body.x;
    deadPlayerEmitter.y = player.body.y;
    player.kill();
    spike.body.velocity.x = 0;
    spike.body.velocity.y = 0;
    // start the emitter, (all at once?, how long each particle lasts, how often to emit, num particles)
    deadPlayerEmitter.start(true, 12000, null, 20);
}

function create() {
    game.stage.backgroundColor = '#000';
    // tilemap contains the actual map of the level, ie the TILED json file
    map = game.add.tilemap('level01');
    // tileset, contains the image of tiles and collision data for each tile
    tileset = game.add.tileset('tiles');
    // tileset.setCollisionRange(start tile index, end tile index, collides left?, right, up, down)
    tileset.setCollisionRange(0, tileset.total-1, true, true, true, true);

    layer = game.add.tilemapLayer(0, 0, 320, 480, tileset, map, 0);
    // make the world the same size as this layer
    layer.resizeWorld();

    // make a sprite using the hero graphic (x position, y position, image texture to use, atlas/spritesheet frame)
    player = game.add.sprite(160, 1400, 'hero')
    player.anchor.setTo(0.5, 0.5);
    player.body.drag.setTo(400, 400);
    player.body.gravity.y = 100;
    player.body.collideWorldBounds = true;
    player.body.setSize(10, 24, 0, 0);
    game.camera.follow(player);

    jumpMeter = game.add.sprite(game.camera.x + 5, game.camera.y + 5, 'jumpMeter')
    jumpMeter.body.allowGravity = false;
    jumpMeter.height = JUMPMETERHEIGHT;
    jumpMeter.width = 3;

    spike = game.add.sprite(160, 1300, 'spike')
    spike.body.allowGravity = false;
    spike.anchor.setTo(0.5, 0.5);

    // Set up emitter with players body parts as particles
    deadPlayerEmitter = game.add.emitter(0, 0, 200);
    deadPlayerEmitter.bounce.setTo(0.5, 0.5);
    deadPlayerEmitter.setXSpeed(-150, 150);
    deadPlayerEmitter.setYSpeed(-30, 30);
    // particles are the array of body parts for emitter to choose from
    deadPlayerEmitter.makeParticles(['ear', 'arm', 'body', 'head', 'leg']);
    // lower the gravity to make it more dramatic
    deadPlayerEmitter.gravity = 2;

}

function update() {
    // check for collisions
    game.physics.collide(player, spike, playerCollidesWithSpike, null, this);
    game.physics.collide(player, layer);
    game.physics.collide(spike, layer);
    game.physics.collide(deadPlayerEmitter, layer);
    jumpMeter.body.x = game.camera.x + 5;
    jumpMeter.body.y = game.camera.y + 5;

    if (game.input.activePointer.isDown) {
            spike.body.x = game.input.activePointer.worldX-8;
            spike.body.y = game.input.activePointer.worldY-8;
        if (!jumping && player.body.touching.down) {
            jumping = true;
            jumpTimer = game.time.now + 400;
        } else if (jumping && game.time.now < jumpTimer) {
            game.physics.moveToPointer(player, 600);
            modifier = jumpTimer < game.time.now ? 1 : (jumpTimer - game.time.now) / 400;
            jumpMeter.height *= modifier;
        }
    } else {
    }
    if (player.body.touching.down && jumping && game.time.now > jumpTimer) {
        jumping = false;
        jumpMeter.height = JUMPMETERHEIGHT;
    }
}

function render() {
    // game.debug.renderSpriteInfo(player, 32, 32);
    // game.debug.renderSpriteBody(player, 'yellow', true);
}
