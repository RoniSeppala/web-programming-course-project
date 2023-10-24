let game

const gameOptions = {
    windowWidth: 800,
    windowHeight: 448,
    widthOfTile: 32,
    characterGravity: 300,
    characterSpeed: 250
}

window.onload = function() {
    let gameConfig = {
        type: Phaser.AUTO,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: gameOptions.windowWidth,
            height: gameOptions.windowHeight,
            margin: 0,
        },
        physics: {
            default: "arcade",
            arcade: {
                gravity: {
                    y: 0
                }
            }
        },
        scene: PlayGame
    }
    game = new Phaser.Game(gameConfig)
}

class PlayGame extends Phaser.Scene {
    constructor() {
        super()
    }

    preload () {//all preloading stuffz
        this.load.image("bg","assets/stageObjects/Background/Background.png")
        this.load.image("sideBlock","assets/stageObjects/Tiles/IndustrialTile_05.png")
        this.load.image("innerBlock", "assets/stageObjects/Tiles/IndustrialTile_21.png")
        this.load.spritesheet("characterIdle", "assets/character/Idle.png",{frameWidth: 72, frameHeight: 72})
    }

    create () {
        this.loadLevel1()

        this.character = this.physics.add.sprite(200,200,"characterIdle",0);
        this.character.body.gravity.y = gameOptions.characterGravity;
        this.physics.add.collider(this.character, this.groundGroup);
        this.character.jumpcount = 1;

        this.cursors = this.input.keyboard.createCursorKeys()
        
    }

    update () {
        if(this.cursors.left.isDown) {
            this.character.body.velocity.x = -gameOptions.characterSpeed
            //this.character.anims.play("left", true)
        }
        else if(this.cursors.right.isDown) {
            this.character.body.velocity.x = gameOptions.characterSpeed
            //this.character.anims.play("right", true)
        }
        else {
            this.character.body.velocity.x = 0
            //this.character.anims.play("turn", true)
        }

        if(this.cursors.up.isDown && this.character.body.touching.down && this.character.jumpcount == 1) { //normal jump
            this.character.body.velocity.y = -gameOptions.characterGravity / 1.6
            this.character.jumpcount = 0
        }

        if(this.cursors.up.isDown && this.character.jumpcount == 0) { //jump in air
            this.character.body.velocity.y = -gameOptions.characterGravity / 1.6
            this.character.jumpcount = -1
        }

        if(this.character.body.touching.down) {
            this.character.jumpcount = 1
        }


        //console.log(this.character.jumpcount)


    }


    loadLevel1() {
        this.background = this.add.image(0,0,"bg").setOrigin(0,0);
        this.background.displayWidth = gameOptions.windowWidth;
        this.background.displayHeight = gameOptions.windowHeight;
        
        this.groundGroup = this.physics.add.group({
            immovable: true,
            allowGravity: false
        })

        for (let index = 0; index < gameOptions.windowWidth/gameOptions.widthOfTile; index++) {
            this.groundGroup.create((index*gameOptions.widthOfTile),(gameOptions.windowHeight-gameOptions.widthOfTile),("innerBlock")).setOrigin(0,0);
            
        }
        for (let index = 0; index < gameOptions.windowWidth/gameOptions.widthOfTile; index++) {
            this.groundGroup.create((index*gameOptions.widthOfTile),(gameOptions.windowHeight-gameOptions.widthOfTile),("sideBlock")).setOrigin(0,0);
            
        }



    }
}

