var game = new Phaser.Game(320,480, Phaser.CANVAS, 'trmbs-game', {preload: preload, create: create, update: update, render: render });

function preload() {
    // what a mess, need an atlas
    game.load.image('hero', 'assets/img/hero.png');
    game.load.image('spike', 'assets/img/spike.png');
    game.load.image('spikeghost', 'assets/img/spikeghost.png');
    game.load.image('ear', 'assets/img/ear.png');
    game.load.image('arm', 'assets/img/arm.png');
    game.load.image('body', 'assets/img/body.png');
    game.load.image('head', 'assets/img/head.png');
    game.load.image('leg', 'assets/img/leg.png');
    game.load.image('liftMeter', 'assets/img/jumpMeter.png');
    game.load.image('bear2', 'assets/img/bear2.png');
    game.load.image('banana', 'assets/img/banana.png');
    game.load.image('honey', 'assets/img/honey.png');
    game.load.tilemap('level01', 'assets/maps/level01.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.tileset('tiles', 'assets/img/tiles01.png', 16, 16);
}

var player,
    spike,
    liftTimer = 0,
    lifting,
    map,
    tileset,
    layer,
    tempvel,
    holdables;

var LIFT_METER_HEIGHT = 75,
    PLAYER_MAX_VELOCITY = 2200;

// bodySize and locations to place all bananas
var bananas = {
    bodySize: [25, 10, 0, 5],
    loc: [
        [68, 1287],
        [50, 1120],
        [210, 1000],
        [110, 890],
        [28, 618],
        [220, 550]],
        name: 'banana'
};
var honey = {
    bodySize: [16, 22, 1, 1],
    loc: [
        [225, 1210],
        [120, 709],
        [200, 438],
        [60, 390],
        [48, 150],
        [260, 22]],
        name: 'honey'
};

function playerCollidesWithSpike() {
    // set the emitter to the location of the player before we blow em up
    deadPlayerEmitter.x = player.body.x;
    deadPlayerEmitter.y = player.body.y;
    player.kill();
    spike.body.velocity.x = 0;
    spike.body.velocity.y = 0;
    // start the emitter, (all at once?, how long each particle lasts, how often to emit, num particles)
    deadPlayerEmitter.start(true, 12000, null, 50);
}

function playerCollidesWithLayer() {
   if (player.squished) {
       playerCollidesWithSpike();
   }
}

function setUpSprite(sprite, grav) {
    // util func to set up sprites
    sprite.anchor.setTo(0.5, 0.5);
    sprite.body.drag.setTo(400, 400);
    sprite.body.gravity.y = grav || 100;
    sprite.body.collideWorldBounds = true;
    sprite.squished = false; // if sprite reaches to high velocity, gets squished
}

// this takes a sprite name, body size, and a list of locations to
// to place multiple sprites in the world and add to the holdables group
function addToGroup(sprites) {
    for (var i = 0; i < sprites.loc.length; i++) {
        sprite = holdables.create(sprites.loc[i][0], sprites.loc[i][1], sprites.name);
        sprite.body.setSize(sprites.bodySize[0], sprites.bodySize[1], sprites.bodySize[2], sprites.bodySize[3]);
        setUpSprite(sprite, 90);
    }
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
    player.body.setSize(10, 24, 0, 0);
    setUpSprite(player);    
    player.holding = false; // player will be holding an item, or false if nothing
    game.camera.follow(player);

    // Set up emitter with players body parts as particles
    deadPlayerEmitter = game.add.emitter(0, 0, 200);
    deadPlayerEmitter.bounce.setTo(0.5, 0.5);
    deadPlayerEmitter.setXSpeed(-150, 150);
    deadPlayerEmitter.setYSpeed(-30, 30);
    // particles are the array of body parts for emitter to choose from
    deadPlayerEmitter.makeParticles(['ear', 'arm', 'head', 'leg']);
    // lower the gravity to make it more dramatic
    deadPlayerEmitter.gravity = 2;

    spike = game.add.sprite(160, 1300, 'spike')
    spike.body.allowGravity = false;
    spike.anchor.setTo(0.5, 0.5);

    // sprite to display how much lift energy is left
    liftMeter = game.add.sprite(game.camera.x + 5, game.camera.y + 5, 'liftMeter')
    liftMeter.body.allowGravity = false;
    liftMeter.height = LIFT_METER_HEIGHT;
    liftMeter.width = 10;

    // sprites for player to pick up
    // there's probably a better way to do this but time is ticking
    holdables = game.add.group();
    //var bear2 = holdables.create(100, )
    bear2 = holdables.create(270, 1360, 'bear2');
    bear2.body.setSize(8, 25, 0, 0);
    setUpSprite(bear2);
    addToGroup(bananas);
    addToGroup(honey);
}

function update() {
    // check for collisions
    game.physics.collide(player, spike, playerCollidesWithSpike, null, this);
    game.physics.collide(player, layer, playerCollidesWithLayer);
    game.physics.collide(spike, layer);
    game.physics.collide(holdables, layer);
    game.physics.collide(deadPlayerEmitter, layer);
    liftMeter.body.x = game.camera.x + 5;
    liftMeter.body.y = game.camera.y + 5;

    if (game.input.activePointer.isDown) {
            spike.body.x = game.input.activePointer.worldX-8;
            spike.body.y = game.input.activePointer.worldY-8;
        if (!lifting && player.body.touching.down) {
            lifting = true;
            liftTimer = game.time.now + 400;
        } else if (lifting && game.time.now < liftTimer) {
            game.physics.moveToPointer(player, 600);
            modifier = liftTimer < game.time.now ? 1 : (liftTimer - game.time.now) / 400;
            liftMeter.height *= modifier;
        }
    } else {
    
    }
    if (player.body.touching.down && lifting && game.time.now > liftTimer) {
        lifting = false;
        liftMeter.height = LIFT_METER_HEIGHT;
    }
    if (player.body.velocity.y > PLAYER_MAX_VELOCITY) {
        player.squished = true;
    }

    // debug, find velocity for various height falls
    // if (player.body.velocity.y > tempvel) {
    //     tempvel = player.body.velocity.y;
    //     console.log(tempvel);
    // }
}
function render() {
    // game.debug.renderSpriteInfo(player, 32, 32);
    // game.debug.renderSpriteBody(player, 'yellow', true);
}
