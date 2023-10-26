let game

const gameOptions = {
    windowWidth: 800,
    windowHeight: 448,
    widthOfTile: 32,
    characterGravity: 400,
    characterSpeed: 250,
    doubleJumpFrames: 200,
    jetPackLiftGravity: 200
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
        this.load.image("innerCornerSide", "assets/stageObjects/Tiles/IndustrialTile_17.png")
        this.load.image("outerCornerSide", "assets/stageObjects/Tiles/IndustrialTile_04.png")
        this.load.spritesheet("characterIdle", "assets/character/Idle.png",{frameWidth: 72, frameHeight: 72})
        this.load.spritesheet("characterWalk","assets/character/Walk.png",{frameWidth: 72, frameHeight: 72})
        this.load.spritesheet("characterJump","assets/character/Attack4.png",{frameWidth: 72, frameHeight: 72})

    }

    create () {
        
        this.loadLevel2()

        this.character.body.gravity.y = gameOptions.characterGravity;
        this.physics.add.collider(this.character, this.groundGroup);
        this.character.jumpcount = 1;
        this.character.hasReleasedJumpFor = 0;
        this.character.hasHeldJumpFor = 0;
        this.character.hasTouchedGroundFor = 0;
        this.character.doubleJumpTimer = 0;
        this.character.jumpAnimationCounter = 0;
        this.character.jumpAnimationTimeCounter = 0;
        this.cursors = this.input.keyboard.createCursorKeys()

        this.anims.create({
            key: "walk",
            frames: this.anims.generateFrameNumbers("characterWalk", {start: 0, end: 5}),
            frameRate: 10,
            repeat: 1
        })

        this.anims.create({
            key: "idle",
            frames: this.anims.generateFrameNumbers("characterIdle", {start: 0, end: 3}),
            frameRate: 10,
            repeat: 1
        })

        this.anims.create({
            key: "jump",
            frames: this.anims.generateFrameNumbers("characterJump", {start: 1, end: 2}),
            frameRate: 2,
            repeat: -1
        })

        this.anims.create({
            key: "inAir",
            frames: this.anims.generateFrameNumbers("characterJump", {start: 2, end: 2}),
            frameRate: 1,
            repeat: 1
        })

        this.anims.create({
            key: "landing",
            frames: this.anims.generateFrameNumbers("characterJump", {start: 3, end: 3}),
            frameRate: 1,
            repeat: 1
        })
        
    }

    update () {    
        if(this.cursors.left.isDown) {
            this.character.setFlipX(true)
            this.character.body.velocity.x = -gameOptions.characterSpeed
        }
        else if(this.cursors.right.isDown) {
            this.character.setFlipX(false)
            this.character.body.velocity.x = gameOptions.characterSpeed
        }
        else {
            this.character.body.velocity.x = 0
        }

        if(this.character.hasHeldJumpFor > 1 && this.character.hasTouchedGroundFor > 4 && this.character.jumpcount == 1) { //normal jump
            this.character.body.velocity.y = -gameOptions.characterGravity / 1.6
            this.character.jumpcount = 0;
            this.character.hasTouchedGroundFor = 0;
            this.character.jumpAnimationCounter = 1;
        }else if(this.cursors.up.isDown && this.character.jumpcount == 0 && this.character.hasReleasedJumpFor > 1) { //initiate jetpack in air
            //this.character.body.velocity.y = -gameOptions.characterGravity / 1.6
            this.character.jumpcount = this.character.jumpcount - 1
        }else if (this.character.jumpcount == -1 && this.character.doubleJumpTimer < gameOptions.doubleJumpFrames && this.character.hasHeldJumpFor > 3){ //use jetpack
            this.character.body.velocity.y = -(gameOptions.jetPackLiftGravity)*((gameOptions.doubleJumpFrames-this.character.doubleJumpTimer)/gameOptions.doubleJumpFrames)//caluclation so jetpack power gradually goes down
        }else if(this.character.hasTouchedGroundFor > 4) {
            this.character.jumpcount = 1
            this.character.doubleJumpTimer = 0
            this.character.jumpAnimationCounter = 0;
        }

        //animation handling
        if (this.character.jumpcount == 1){
            if(this.cursors.left.isDown) {
                this.character.anims.play("walk", true)
            }
            else if(this.cursors.right.isDown) {
                this.character.anims.play("walk", true)
            }
            else {
                this.character.anims.play("idle",true)
            }
        } else if(this.character.jumpAnimationCounter == 1){
            this.character.anims.play("jump",true)
        } else if(this.character.jumpAnimationCounter == 2){
            this.character.anims.play("inAir",true)
        } else if (this.character.jumpAnimationCounter == 3){
            this.character.anims.play("landing",true)
        }

        if (this.cursors.up.isDown){//tracker for how long has up been held
            this.character.hasReleasedJumpFor = 0;
        } else {
            this.character.hasReleasedJumpFor = this.character.hasReleasedJumpFor + 1;
        }

        if (!this.cursors.up.isDown){//tracker for how long has up been released
            this.character.hasHeldJumpFor = 0;
        } else {
            this.character.hasHeldJumpFor = this.character.hasHeldJumpFor + 1;
        }

        if (!this.character.body.touching.down){//tracker for how long has character touched ground
            this.character.hasTouchedGroundFor = 0;
        } else {
            this.character.hasTouchedGroundFor = this.character.hasTouchedGroundFor + 1;
        }

        if (this.character.jumpcount == -1){ //tracker for jetpack frames
            this.character.doubleJumpTimer++
        }

        if (this.character.jumpAnimationCounter == 1 && this.character.jumpAnimationTimeCounter < 10){ //jump animation counter logic
            this.character.jumpAnimationTimeCounter++
        } else if(this.character.jumpAnimationCounter == 1 && this.character.jumpAnimationTimeCounter >= 10){
            this.character.jumpAnimationTimeCounter = 0
            this.character.jumpAnimationCounter = 2
        } else if(this.character.jumpAnimationCounter == 2 && this.character.doubleJumpTimer + 50 >= gameOptions.doubleJumpFrames){
            this.character.jumpAnimationCounter = 3
            this.character.jumpAnimationTimeCounter = 0
        }



    }


    loadLevel1() {//level width 25 blocks, level height 14 blocks
        let level1PhysicsObjects = [] //should be three dimensional matrix as follows: [z(height)][y(width)][0,1], where 0 is the name of the block in string form and 1 is the roation of the block in int form
        let characterSpawnBlock = [0,13]
        this.levelEssentialLoad()
        this.initializeLevelToEmpty(level1PhysicsObjects)
        console.log(level1PhysicsObjects)
        for (let index = 0; index < 25; index++) {
            level1PhysicsObjects[13][index] = ["sideBlock",0]
            
        }

        level1PhysicsObjects[13][5] = ["innerCornerSide",0]
        level1PhysicsObjects[13][6] = ["innerCornerSide",90]
        level1PhysicsObjects[12][5] = ["sideBlock",-90]
        level1PhysicsObjects[12][6] = ["sideBlock",90]
        level1PhysicsObjects[11][5] = ["outerCornerSide",0]
        level1PhysicsObjects[11][6] = ["outerCornerSide",90]

        level1PhysicsObjects[13][15] = ["innerCornerSide",0]
        level1PhysicsObjects[13][17] = ["innerCornerSide",90]
        for (let index = 0; index < 3; index++) {
            level1PhysicsObjects[12-index][15] = ["sideBlock",-90]
            
        }
        for (let index = 0; index < 3; index++) {
            level1PhysicsObjects[12-index][17] = ["sideBlock",90]
            
        }
        level1PhysicsObjects[12][6] = ["sideBlock",90]
        level1PhysicsObjects[9][15] = ["outerCornerSide",0]
        level1PhysicsObjects[9][16] = ["sideBlock",0]
        level1PhysicsObjects[9][17] = ["outerCornerSide",90]
        for (let index = 0; index < 4; index++) {
            level1PhysicsObjects[13-index][16] = ["innerBlock",0]
            
        }


        this.loadLevel(level1PhysicsObjects,characterSpawnBlock)

    }

    loadLevel2() {//level width 25 blocks, level height 14 blocks
        let level1PhysicsObjects = [] //should be three dimensional matrix as follows: [z(height)][y(width)][0,1], where 0 is the name of the block in string form and 1 is the roation of the block in int form
        let characterSpawnBlock = [0,13]
        this.levelEssentialLoad()
        this.initializeLevelToEmpty(level1PhysicsObjects)
        console.log(level1PhysicsObjects)
        for (let index = 0; index < 25; index++) {
            level1PhysicsObjects[13][index] = ["sideBlock",0]
            
        }

        


        this.loadLevel(level1PhysicsObjects,characterSpawnBlock)

    }
    
    loadLevel(levelPhysicsData,characterSpawn){
        
        for (let indexZ = 0; indexZ < levelPhysicsData.length; indexZ++) {
            const element = levelPhysicsData[indexZ];

            for (let indexY = 0; indexY < element.length; indexY++) {
                const innerElement = element[indexY];

                if (innerElement[0] != ""){
                    console.log(innerElement[1])
                    this.groundGroup.create(indexY*gameOptions.widthOfTile+(gameOptions.widthOfTile/2), indexZ*gameOptions.widthOfTile+(gameOptions.widthOfTile/2),innerElement[0]).angle = innerElement[1]
                }
                
            }

            
        }

        
        this.character = this.physics.add.sprite(characterSpawn[0]*gameOptions.widthOfTile+(72/2),characterSpawn[1]*gameOptions.widthOfTile-(72/2),"characterIdle",0);

    }

    levelEssentialLoad(){
        this.background = this.add.image(0,0,"bg").setOrigin(0,0);
        this.background.displayWidth = gameOptions.windowWidth;
        this.background.displayHeight = gameOptions.windowHeight;
        
        this.groundGroup = this.physics.add.group({
            immovable: true,
            allowGravity: false
        })

        for (let index = 0; index < (gameOptions.windowWidth/gameOptions.widthOfTile)*3; index++) {
            this.groundGroup.create(((index*gameOptions.widthOfTile)+(gameOptions.widthOfTile/2)-gameOptions.windowWidth),(gameOptions.windowHeight-gameOptions.widthOfTile)+(gameOptions.widthOfTile/2),("innerBlock"));
        }
        

    }

    initializeLevelToEmpty(level){
        let indexY = 0
        let indexZ = 0
        while(indexZ < 14){
            level.push([])
            while(indexY < 25){
                level[indexZ].push(["",0])
                indexY++
            }
            indexY = 0
            indexZ++
        }
    }
}

