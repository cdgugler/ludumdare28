var game = new Phaser.Game(320,480, Phaser.AUTO, 'trmbs-game', {preload: preload, create: create, update: update, render: render });

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
    game.load.image('restartBtn', 'assets/img/restartBtn.png');
    game.load.image('bear2', 'assets/img/bear2.png');
    game.load.image('honey', 'assets/img/honey.png');
    game.load.image('exit', 'assets/img/exit.png');
    game.load.audio('explosion', ['assets/audio/explosion.mp3', 'assets/audio/explosion.ogg']);
    game.load.audio('pickup', ['assets/audio/pickup.mp3', 'assets/audio/pickup.ogg']);
    game.load.tilemap('level01', 'assets/maps/level01.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.tileset('tiles', 'assets/img/tiles01.png', 16, 16);
    game.canvas.style.cursor = 'inherit';
}

var player,
    score = 0,
    spike,
    liftTimer = 0,
    lifting,
    map,
    tileset,
    layer,
    tempvel,
    holdables,
    discardedHoldables,
    breakables,
    endText,
    introText,
    mainText,
    elapsedTime = 0,
    restartBtn;

var LIFT_METER_HEIGHT = 75,
    PLAYER_MAX_VELOCITY = 2200;

// bodySize and locations to place honey jars
var honey = {
    bodySize: [16, 22, 1, 1],
    loc: [
        [18, 14],
        [3, 20],
        [15, 29],
        [6, 35],
        [13, 38],
        [12, 45],
        [2, 49],
        [5, 53],
        [15, 62],
        [6, 66],
        [10, 73],
        [16, 87]],
    name: 'honey',
    points: 5
};

function playerCollidesWithSpike() {
    // set the emitter to the location of the player before we blow em up
    deadPlayerEmitter.x = player.body.x;
    deadPlayerEmitter.y = player.body.y;
    player.kill();
    spike.body.velocity.x = 0;
    spike.body.velocity.y = 0;
    // start the emitter, (all at once?, how long each particle lasts, how often to emit, num particles)
    deadPlayerEmitter.start(true, 5000, null, 15);
    explosionSound.play();
    restartBtn = game.add.button(game.camera.x + 130, game.camera.y + 300, 'restartBtn', restartGame, this, 2, 1, 0);
}

function playerCollidesWithLayer() {
   if (player.squished) {
       playerCollidesWithSpike();
   }
}

function collidesWithLayer() {
   if (this.squished) {
       this.kill();
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
// to place multiple sprites in the world and add to the given group
function addToGroup(sprites, group) {
    for (var i = 0; i < sprites.loc.length; i++) {
        sprite = group.create(sprites.loc[i][0]*16, sprites.loc[i][1]*16-5, sprites.name);
        sprite.body.setSize(sprites.bodySize[0], sprites.bodySize[1], sprites.bodySize[2], sprites.bodySize[3]);
        setUpSprite(sprite, 20);
        sprite.attached = false; // if player is holding 
        sprite.points = sprites.points;
        sprite.name = sprites.name;
    }
}

function grabHoldable(player, holdable) {
    // if player is already holding something
    // and collision holdable is not attached
    if (player.holding && !holdable.attached) {
    //     // launch it outta here
    //     var valX = Math.floor(Math.random() * 600 + 300);
    //     // go left on odd velocity
    //     valX = (valX % 2) == 0 ? valX : -valX;
    //     player.holding.body.velocity.x = valX;
    //     player.holding.body.velocity.y = -800;
    //     holdables.remove(player.holding);
    //     discardedHoldables.add(player.holding);
    //     player.holding = false;
        return;
    }
    holdable.attached = true;
    player.holding = holdable;
    // if (!pickupSound.isPlaying) { pickupSound.play(); }
}

function collideBreakable (player, breakable) {
        var valX = Math.floor(Math.random() * 600 + 300);
        // go left on odd velocity
        valX = (valX % 2) == 0 ? valX : -valX;
        breakable.body.y -= 50;
        breakable.body.gravity.y = 100;
        breakable.body.velocity.x = valX;
        breakable.body.velocity.y = -800;
        breakables.remove(breakable);
        discardedHoldables.add(breakable);
}

// blows up discarded holdables once they're on
// the way back down
function checkVelocity(sprite) {
    if (sprite.body.velocity.y > 0) {
        deadPlayerEmitter.x = sprite.body.x;
        deadPlayerEmitter.y = sprite.body.y;
        deadPlayerEmitter.start(true, 3000, null, 10);
        sprite.kill();
        explosionSound.play();
    }
}

// calc score and time, display
function endGame() {
    var timePassed = game.time.now - elapsedTime;
    // convert to seconds and round two dec places
    var endTime = Math.round((timePassed / 1000) * 100) / 100;
    holdables.forEach(calcScore, this, true);
    breakables.forEach(calcScore, this, true);
    console.log("Exit Hit");
    console.log(endTime);

    // add time bonus
    var bonus = 10;
    if (endTime <= 15) {
        bonus -= 3;
    } else if (endTime > 15 && endTime <= 20) {
        bonus -= 5;
    } else if (endTime > 20 && endTime <= 25) {
        bonus -= 7;
    } else { 
        bonus -= 8;
    }
    console.log(bonus);
    
    // player should exit holding something, or lose bonus
    switch (player.holding.name) {
        case 'bear':
            bonus += 5;
            break;
        case 'honey':
            bonus += 3;
            break;
        default:
            bonus = 1;
            break;
    }
    console.log(score);
    console.log(bonus);
    score *= bonus;
    mainText.content = 'Score: ' + score + '\n';
    mainText.content += 'Time: ' + endTime + '\n';

    mainText.visible = true;
    playerCollidesWithSpike();

}

function restartGame() {
    holdables.destroy();
    liftMeter.destroy();
    breakables.destroy();
    bear2.destroy();
    spike.destroy();
    player.destroy();
    restartBtn.destroy();
    mainText.content = '';
    mainText.visible = false;
    score = 0;
    elapsedTime = game.time.now;
    create();
}

function calcScore(sprite) {
    score += sprite.points; 
}

function create() {
    game.stage.backgroundColor = '#000000';
    // tilemap contains the actual map of the level, ie the TILED json file
    map = game.add.tilemap('level01');
    // tileset, contains the image of tiles and collision data for each tile
    tileset = game.add.tileset('tiles');
    // tileset.setCollisionRange(start tile index, end tile index, collides left?, right, up, down)
    tileset.setCollisionRange(0, tileset.total-1, true, true, true, true);
    layer = game.add.tilemapLayer(0, 0, 320, 480, tileset, map, 0);

    // make the world the same size as this layer
    layer.resizeWorld();

    game.input.maxPointers = 1;

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

    spike = game.add.sprite(260, 1300, 'spike')
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
    breakables = game.add.group();
    //var bear2 = holdables.create(100, )
    // multiply x and y by tile size, minus 10 height
    bear2 = holdables.create(17*16, 95*16-10, 'bear2');
    bear2.body.setSize(8, 25, 0, 0);
    bear2.points = 7;
    bear2.name = 'bear';
    setUpSprite(bear2);
    addToGroup(honey, breakables);

    // when player contacts another item
    // old item inserted in here
    discardedHoldables = game.add.group();

    mainText = game.add.text(game.camera.x + 160, game.camera.y + 260, '', {fontSize: '16px', fill: '#fff' });
    mainText.anchor.setTo(0.5, 0.5);
    mainText.visible = false;

    explosionSound = game.add.audio('explosion', 0.7);
    pickupSound = game.add.audio('pickup', 0.3);

    exit = game.add.sprite(5*16, 5*16, 'exit');
}

function update() {
    // check for collisions
    // collide params
    // object1 object2 collideCallback processCallback context
    // if using processCallback it must return true for collideCallback to run
    game.physics.collide(player, spike, playerCollidesWithSpike, null, this);
    game.physics.collide(player, holdables, grabHoldable);
    game.physics.collide(player, breakables, collideBreakable);
    game.physics.collide(player, layer, playerCollidesWithLayer);
    // game.physics.collide(spike, layer);
    game.physics.collide(breakables, layer, collidesWithLayer, null, this);
    game.physics.collide(holdables, layer, collidesWithLayer, null, this);
    game.physics.collide(deadPlayerEmitter, layer);
    liftMeter.body.x = game.camera.x + 5;
    liftMeter.body.y = game.camera.y + 5;

    if (game.input.activePointer.isDown && game.input.activePointer.worldX > 0 && game.input.activePointer.worldX < 320) {
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
    if (player.holding) {
        player.holding.body.x = player.body.x + 5;
        player.holding.body.y = player.body.y;
    }

    // forEach (callback, context, true=childre that exist only)
    discardedHoldables.forEach(checkVelocity, this, true);

    // debug, find velocity for various height falls
    // if (player.body.velocity.y > tempvel) {
    //     tempvel = player.body.velocity.y;
    // }
    game.physics.overlap(player, exit, endGame);
}
function render() {
    // game.debug.renderSpriteInfo(player, 32, 32);
    // game.debug.renderSpriteBody(player, 'yellow', true);
}
