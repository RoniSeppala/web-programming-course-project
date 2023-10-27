let game;
let bullets;

const gameOptions = {
    windowWidth: 800,
    windowHeight: 448,
    widthOfTile: 32,
    characterGravity: 400,
    characterSpeed: 250,
    doubleJumpFrames: 300,
    jetPackLiftGravity: 200,
    bulletSpeed: 1000,
    bulletDrop: 100
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
                },
                debug: false
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
        //background
        this.load.image("bg","assets/stageObjects/Background/Background.png")

        //Stage Tiles
        this.load.image("sideBlock","assets/stageObjects/Tiles/IndustrialTile_05.png")
        this.load.image("innerBlock", "assets/stageObjects/Tiles/IndustrialTile_21.png")
        this.load.image("innerCornerSide", "assets/stageObjects/Tiles/IndustrialTile_17.png")
        this.load.image("outerCornerSide", "assets/stageObjects/Tiles/IndustrialTile_04.png")
        this.load.image("pipeMid", "assets/stageObjects/Tiles/IndustrialTile_61.png")
        this.load.image("pipeEnd", "assets/stageObjects/Tiles/IndustrialTile_70.png")
        this.load.image("redBlockLeft", "assets/stageObjects/Tiles/IndustrialTile_58.png")
        this.load.image("redBlockMid", "assets/stageObjects/Tiles/IndustrialTile_59.png")
        this.load.image("redBlockRight", "assets/stageObjects/Tiles/IndustrialTile_60.png")
        this.load.image("doorBlock", "assets/stageObjects/Tiles/IndustrialTile_54.png")
        this.load.image("finishBlock", "assets/stageObjects/Objects/Flag.png")

        //character sprites
        this.load.spritesheet("characterIdle", "assets/character/Idle.png",{frameWidth: 72, frameHeight: 72})
        this.load.spritesheet("characterWalk","assets/character/Walk.png",{frameWidth: 72, frameHeight: 72})
        this.load.spritesheet("characterJump","assets/character/Attack4.png",{frameWidth: 72, frameHeight: 72})

        //objects
        this.load.spritesheet("bullet","assets/character/Bullet.png",{frameWidth: 12, frameHeight: 6, startFrame: 1, endFrame: 1})
        this.load.image("reticle","assets/reticle.png")
        this.load.spritesheet("card","assets/animatedObjects/Card.png",{frameWidth: 24, frameHeight: 24})
        this.load.spritesheet("money","assets/animatedObjects/Money.png",{frameWidth: 24, frameHeight: 24})

        //enemies
        this.load.spritesheet("enemyDestroyer","assets/enemies/Destroyer/Idle.png",{frameWidth:128, frameHeight:128})

        //score
        this.load.image("scoreBoardBase","assets/scoreBoardBase.png")
        this.load.html("nameform","assets/text/nameform.html")
        this.load.image("play","assets/play.png")

        //load audio elements
        this.load.audio("jumpSound","assets/audio/phaseJump1.mp3")
        this.load.audio("jetpackSound","assets/audio/lowDown.mp3")
        this.load.audio("pickMoney","assets/audio/phaserUp3.mp3")
        this.load.audio("pickCard","assets/audio/phaserUp6.mp3")
        this.load.audio("backgroundMusic","assets/music/backGroundMusic.mp3")

        //load arrowkey
        this.load.image("arrow","assets/arrowKey.png")
        this.isDownArrowDown = false
        this.isUpArrowDown = false
        this.isLeftArrowDown = false
        this.isRightArrowDown = false



    }

    create () {
        
        this.loadAnims()

        //background
        this.background = this.add.image(0,0,"bg").setOrigin(0,0);
        this.background.displayWidth = gameOptions.windowWidth;
        this.background.displayHeight = gameOptions.windowHeight;
        
        //create all
        this.groundGroup = this.physics.add.group({
            immovable: true,
            allowGravity: false
        })

        this.groundRescueGroup = this.physics.add.group({
            immovable: true,
            allowGravity: false
        })

        this.groundToggleGroup = this.physics.add.group({
            immovable: true,
            allowGravity: false
        })
        this.character = this.physics.add.sprite(200,200,"characterIdle",0);
        this.reticle = this.add.image(-gameOptions.windowWidth/2,-gameOptions.windowHeight/2,"reticle")
        this.reticle.setDepth(5)
        this.moneyGroup = this.physics.add.group({})
        this.cardGroup = this.physics.add.group({})
        this.enemyDestroyerGroup = new EnemyDestroyerGroup(this)
        this.bulletGroup = new BulletGroup(this);
        this.moveLevelTrigger = this.physics.add.image(200,200,"finishBlock")
        this.levelTextGroup = this.add.group({classType: Phaser.GameObjects.Text});

        //initialization
        this.hasCard = -1 //-1 for not in leve, 0 for not aquired, 1 for aquired
        this.character.isFacingLeft = false;
        this.character.body.gravity.y = gameOptions.characterGravity;
        this.character.jumpcount = 1;
        this.character.hasReleasedJumpFor = 0;
        this.character.hasHeldJumpFor = 0;
        this.character.hasTouchedGroundFor = 0;
        this.character.doubleJumpTimer = 0;
        this.character.jumpAnimationCounter = 0;
        this.character.jumpAnimationTimeCounter = 0;
        this.money = 0
        this.nextLevel = 1
        this.scores = [{name: "example", score: 500}]
        this.textScore = ""
        this.finishAllowedToHit = true

        //load scoreboard elements
        this.scoreboardBack = this.add.image(gameOptions.windowWidth/2,gameOptions.windowHeight/2,"scoreBoardBase")        
        this.scoreTitleText = this.add.text(gameOptions.windowWidth/2,gameOptions.windowHeight/2-110,"SCORES", {fontSize: "26px",fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif' }).setOrigin(0.5,0.5)
        this.scoreText = this.add.text(gameOptions.windowWidth/2,gameOptions.windowHeight/2-80,this.textScore, {fontSize: "16px",fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif' }).setOrigin(0.5,0)
        this.playButton = this.add.image(gameOptions.windowWidth/2,gameOptions.windowHeight/2+100,"play").setDepth(20)
        this.setScoreBoardInVisible()

        //relations
        this.physics.add.collider(this.character, this.groundGroup);
        this.physics.add.collider(this.character, this.groundRescueGroup);
        this.cursors = this.input.keyboard.createCursorKeys()
        this.physics.add.overlap(this.character, this.cardGroup, this.collectCard , null, this)
        this.physics.add.overlap(this.character,this.moneyGroup, this.collectMoney , null , this)
        this.physics.add.overlap(this.bulletGroup,this.groundGroup,this.bulletTouchGround, null, this)
        this.physics.add.overlap(this.character,this.moveLevelTrigger,this.finishFlagHit,null,this)


        //bullet listener and add resqueplane + box around view
        this.addEvents();
        for (let index = 0; index < (gameOptions.windowWidth/gameOptions.widthOfTile)*3; index++) {
            this.groundRescueGroup.create(((index*gameOptions.widthOfTile)+(gameOptions.widthOfTile/2)-gameOptions.windowWidth),(gameOptions.windowHeight-gameOptions.widthOfTile)+(gameOptions.widthOfTile/2),("innerBlock"));
        }
        for (let index = 0; index < (gameOptions.windowHeight/gameOptions.widthOfTile); index++) {
            this.groundRescueGroup.create((-16),((index*gameOptions.widthOfTile)+(gameOptions.widthOfTile/2)),("innerBlock"));
            
        }
        for (let index = 0; index < (gameOptions.windowHeight/gameOptions.widthOfTile); index++) {
            this.groundRescueGroup.create((-16+(26*gameOptions.widthOfTile)),((index*gameOptions.widthOfTile)+(gameOptions.widthOfTile/2)),("innerBlock"));
            
        }
        for (let index = 0; index < (gameOptions.windowWidth/gameOptions.widthOfTile)*3; index++) {
            this.groundRescueGroup.create(((index*gameOptions.widthOfTile)+(gameOptions.widthOfTile/2)-gameOptions.windowWidth),(-17),("innerBlock"));
        }



        //add sounds
        this.jumpSound = this.sound.add("jumpSound")
        this.jetpackSound = this.sound.add("jetpackSound")
        this.jetpackSound.loop = true
        this.jetpackSound.rate = 3
        this.jetpackSound.play()
        this.jetpackSound.pause()
        this.moneySound = this.sound.add("pickMoney")
        this.cardSound = this.sound.add("pickCard")
        this.bgMusic = this.sound.add("backgroundMusic")
        this.bgMusic.loop = true
        this.bgMusic.rate = 1
        this.bgMusic.play()
        this.bgMusic.volume = 0.2
        




        //loads
        this.loadNextLevel()
        this.loadHud()
    }

    update () {
        //character movements
        if(this.cursors.left.isDown || this.isLeftArrowDown) {
            this.character.setFlipX(true)
            this.character.isFacingLeft = true;
            this.character.body.velocity.x = -gameOptions.characterSpeed
        }
        else if(this.cursors.right.isDown || this.isRightArrowDown) {
            this.character.setFlipX(false)
            this.character.isFacingLeft = false;
            this.character.body.velocity.x = gameOptions.characterSpeed
        }
        else {
            this.character.body.velocity.x = 0
        }

        //jump logic
        if(this.character.hasHeldJumpFor > 1 && this.character.hasTouchedGroundFor > 4 && this.character.jumpcount == 1) { //normal jump
            this.jumpSound.play()
            this.character.body.velocity.y = -gameOptions.characterGravity / 1.6
            this.character.jumpcount = 0;
            this.character.hasTouchedGroundFor = 0;
            this.character.jumpAnimationCounter = 1;
        }else if((this.cursors.up.isDown || this.isUpArrowDown) && (this.character.jumpcount == 0 || this.character.jumpcount == 1) && this.character.hasReleasedJumpFor > 1) { //initiate jetpack in air
            //this.character.body.velocity.y = -gameOptions.characterGravity / 1.6
            this.character.jumpAnimationCounter = 1;
            this.character.jumpcount = this.character.jumpcount = -1
        }else if (this.character.jumpcount == -1 && this.character.doubleJumpTimer < gameOptions.doubleJumpFrames && this.character.hasHeldJumpFor > 3){ //use jetpack
            this.character.body.velocity.y = -(gameOptions.jetPackLiftGravity)*((gameOptions.doubleJumpFrames-this.character.doubleJumpTimer)/gameOptions.doubleJumpFrames)//caluclation so jetpack power gradually goes down
            this.jetpackSound.resume()
        }else if(this.character.hasTouchedGroundFor > 4) {
            this.character.jumpcount = 1
            this.character.doubleJumpTimer = 0
            this.character.jumpAnimationCounter = 0;
            this.jetpackSound.pause()
        }

        //character animation handling
        if (this.character.jumpcount == 1){
            if(this.cursors.left.isDown || this.isLeftArrowDown) {
                this.character.anims.play("walk", true)
            }
            else if(this.cursors.right.isDown || this.isRightArrowDown) {
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


        //frame trackers (maybe combine later)
        if (this.cursors.up.isDown || this.isUpArrowDown){//tracker for how long has up been held
            this.character.hasReleasedJumpFor = 0;
        } else {
            this.character.hasReleasedJumpFor = this.character.hasReleasedJumpFor + 1;
        }

        if (!this.cursors.up.isDown && !this.isUpArrowDown){//tracker for how long has up been released
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


        //jump animation tracker
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

    showScoreBoard(){
        this.finishAllowedToHit = false
        this.scores.sort((a,b) => {
            const scoreA = a.score
            const scoreB = b.score

            if (scoreA < scoreB) {
                return 1;
              }
              if (scoreA > scoreB) {
                return -1;
              }
            
            
            return 0;
        })


        this.textScore = ""

        for (let index = 0; index < this.scores.length; index++) {
            const element = this.scores[index];
            this.textScore = this.textScore + element.name + "   " + element.score + "\n\n"
            if (index == 3){
                break
            }
        }

        this.setScoreBoardVisible()
        this.scoreText = this.add.text(gameOptions.windowWidth/2,gameOptions.windowHeight/2-80,this.textScore, {fontSize: "16px",fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif' }).setOrigin(0.5,0)

        this.playButton.setInteractive().on('pointerdown', function(pointer){
            this.nextLevel = 1
            this.setScoreBoardInVisible()
            this.loadNextLevel()
            this.finishAllowedToHit = true
        },this)

       

    }

    setScoreBoardInVisible(){
        this.scoreboardBack.setVisible(false)
        this.scoreTitleText.setVisible(false)
        this.scoreText.destroy()
        this.playButton.setVisible(false)
        this.playButton.setActive(false)
    }

    setScoreBoardVisible(){
        this.scoreboardBack.setVisible(true)
        this.scoreTitleText.setVisible(true)
        this.scoreText.setVisible(true)
        this.playButton.setVisible(true)
        this.playButton.setActive(true)
    }

    loadAnims(){
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
            frames: this.anims.generateFrameNumbers("characterJump", {start: 2, end: 2}),
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

        this.anims.create({
            key:"cardAnimated",
            frames: this.anims.generateFrameNumbers("card", {start:0, end: 7}),
            frameRate: 8,
            repeat: -1
        })

        this.anims.create({
            key:"moneyAnimated",
            frames: this.anims.generateFrameNumbers("money", {start:0, end: 5}),
            frameRate: 6,
            repeat: -1
        })

    }

    finishFlagHit(){
        if (this.finishAllowedToHit){
            this.loadNextLevel()
        }
    }

    loadNextLevel(){
        if (this.nextLevel == 1){
            this.unloadLevel()
            this.loadLevel1()
            this.nextLevel = 2
        } else if (this.nextLevel == 2){
            this.unloadLevel()
            this.loadLevel2()
            this.nextLevel = 3
        } else {
            this.scores.push({name: "player", score: this.money})
            this.money = 0 
            this.moneyText.setText(this.money)
            this.showScoreBoard()
        }
    }

    unloadLevel(){
        const childrenOfGround = this.groundGroup.getChildren()
        for (let index = childrenOfGround.length; index >= 0; index--) {
            const element = childrenOfGround[index];
            if (element){
                element.destroy()
            }
        }

        const childrenOfToggleable = this.groundToggleGroup.getChildren()
        for (let index = childrenOfToggleable.length; index >= 0; index--) {
            const element = childrenOfToggleable[index];
            if (element){
                element.destroy()
            }
        }

        const childrenMoney = this.moneyGroup.getChildren()
        for (let index = childrenMoney.length; index >= 0; index--) {
            const element = childrenMoney[index];
            if (element){
                element.destroy()
            }
        }
        const childrenCard = this.cardGroup.getChildren()
        for (let index = childrenCard.length; index >= 0; index--) {
            const element = childrenCard[index];
            if (element){
                element.destroy()
            }
        }
        const childrenText = this.levelTextGroup.getChildren()
        for (let index = childrenText.length; index >= 0; index--) {
            const element = childrenText[index];
            if (element){
                element.destroy()
            }
        }
    }


    loadLevel1() {//level width 25 blocks, level height 14 blocks
        let level1PhysicsObjects = [] //should be three dimensional matrix as follows: [z(height)][y(width)][0,1], where 0 is the name of the block in string form and 1 is the roation of the block in int form
        let level1ToggleObjects = []
        let level1Objects = []
        let characterSpawnBlock = [0,13]
        let finishBlock = [23,3]
        this.initializeLevelToEmpty(level1PhysicsObjects)
        this.initializeLevelToEmpty(level1ToggleObjects)
        this.initializeLevelToEmpty(level1Objects)
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

        this.levelTextGroup.create(50,50,"Get to flag to finish", {fontSize: "25px",fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif', color: "black"}).setOrigin(0,0)



        this.loadLevel(level1PhysicsObjects,characterSpawnBlock,level1ToggleObjects,level1Objects,finishBlock)

    }

    loadLevel2() {//level width 25 blocks, level height 14 blocks
        let level2PhysicsObjects = [] //should be three dimensional matrix as follows: [z(height)][y(width)][0,1], where 0 is the name of the block in string form and 1 is the roation of the block in int form
        let level2ToggleObjects = []
        let level2Objects = []
        let characterSpawnBlock = [0,13]
        let finishBlock = [1,1]
        this.initializeLevelToEmpty(level2PhysicsObjects)
        this.initializeLevelToEmpty(level2ToggleObjects)
        this.initializeLevelToEmpty(level2Objects)
        for (let index = 0; index < 25; index++) {
            level2PhysicsObjects[13][index] = ["sideBlock",0]
            
        }


        //first obstacle
        level2PhysicsObjects[12][6] = ["sideBlock",-90]
        level2PhysicsObjects[13][6] = ["innerCornerSide",0]
        level2PhysicsObjects[13][7] = ["innerCornerSide",90]
        level2PhysicsObjects[12][7] = ["sideBlock",90]
        level2PhysicsObjects[11][6] = ["outerCornerSide",0]
        level2PhysicsObjects[11][7] = ["outerCornerSide",90]

        //platfrom on right
        level2PhysicsObjects[5][20] = ["pipeEnd",90]
        for (let index = 0; index < 4; index++) {
            level2PhysicsObjects[5][21+index]=["pipeMid",90]            
        }

        //house on top left
        for (let index = 0; index < 5; index++) {
            level2PhysicsObjects[4][0+index] = ["redBlockMid",0]
        }
        level2PhysicsObjects[4][5] = ["redBlockRight",0]

        level2PhysicsObjects[0][5] = ["redBlockRight",90]

        for (let index = 0; index < 3; index++) {
            level2ToggleObjects[1+index][5] = ["doorBlock",0]
        }

        level2Objects[4][23] = ["card"]
        level2Objects[12][23] = ["money"]
        level2Objects[4][22] = ["money"]
        level2Objects[12][21] = ["money"]



        this.levelTextGroup.create(500,300,"Collect money to get score", {fontSize: "25px",fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif', color: "black"}).setOrigin(0,0)
        this.levelTextGroup.create(450,50,"Collect the card to open doors", {fontSize: "25px",fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif', color: "maroon"}).setOrigin(0,0)



        this.loadLevel(level2PhysicsObjects,characterSpawnBlock,level2ToggleObjects,level2Objects,finishBlock)

    }

    
    loadLevel(levelPhysicsData,characterSpawn,levelToggleObjects,otherObjects,finishBlock){
        
        for (let indexZ = 0; indexZ < levelPhysicsData.length; indexZ++) {
            const element = levelPhysicsData[indexZ];

            for (let indexY = 0; indexY < element.length; indexY++) {
                const innerElement = element[indexY];

                if (innerElement[0] != ""){
                    this.groundGroup.create(indexY*gameOptions.widthOfTile+(gameOptions.widthOfTile/2), indexZ*gameOptions.widthOfTile+(gameOptions.widthOfTile/2),innerElement[0]).angle = innerElement[1]
                }
                
            }

            
        }

        for (let indexZ = 0; indexZ < levelToggleObjects.length; indexZ++) {
            const element = levelToggleObjects[indexZ];

            for (let indexY = 0; indexY < element.length; indexY++) {
                const innerElement = element[indexY];

                if (innerElement[0] != ""){
                    this.groundToggleGroup.create(indexY*gameOptions.widthOfTile+(gameOptions.widthOfTile/2), indexZ*gameOptions.widthOfTile+(gameOptions.widthOfTile/2),innerElement[0]).angle = innerElement[1]
                }
                
            }

            
        }

        for (let indexZ = 0; indexZ < otherObjects.length; indexZ++) {
            const element = otherObjects[indexZ];

            for (let indexY = 0; indexY < element.length; indexY++) {
                const innerElement = element[indexY];

                if (innerElement[0] == "money"){
                    this.moneyGroup.create(indexY*gameOptions.widthOfTile+(gameOptions.widthOfTile/2), indexZ*gameOptions.widthOfTile+(gameOptions.widthOfTile/2)).anims.play("moneyAnimated",true)
                } else if (innerElement[0] == "card"){
                    this.cardGroup.create(indexY*gameOptions.widthOfTile+(gameOptions.widthOfTile/2), indexZ*gameOptions.widthOfTile+(gameOptions.widthOfTile/2)).anims.play("cardAnimated",true)
                    this.toggleGroupCollider = this.physics.add.collider(this.character, this.groundToggleGroup);
                }
                
            }

            
        }

        this.character.x = characterSpawn[0]*gameOptions.widthOfTile+(72/2)+10
        this.character.y = characterSpawn[1]*gameOptions.widthOfTile-(72/2)-1
        this.character.isFacingLeft = false;

        this.moveLevelTrigger.x = finishBlock[0]*gameOptions.widthOfTile+16
        this.moveLevelTrigger.y = finishBlock[1]*gameOptions.widthOfTile+32
    }


    toggleBlocksOff(){

        this.groundToggleGroup.setVisible(false)
        this.groundToggleGroup.setActive(false)
        this.toggleGroupCollider.destroy()

    }

    toggleBlocksOn(){

        this.groundToggleGroup.setVisible(true)
        this.groundToggleGroup.setActive(true)

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

    loadHud(){
        this.hudElementCard = this.physics.add.sprite(0,0,"card",0).setOrigin(0,0)
        this.hudElementMoney = this.physics.add.sprite(0,20,"money",0).setOrigin(0,0)
        
        this.hudElementCard.anims.play("cardAnimated",true)
        this.hudElementMoney.anims.play("moneyAnimated",true)

        this.cardText = this.add.text(24,4,"Not Aquired", {fontSize: "16px", fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif' })
        this.moneyText = this.add.text(24,24,"0", {fontSize: "16px",fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif' })

        if (this.hasCard) {
            this.cardText.setText("Card Aquired")
        }

        this.arrowPositioning = [690,340]
        this.upArrow = this.add.image(this.arrowPositioning[0],this.arrowPositioning[1],"arrow").setScale(1).setDepth(20)
        this.downArrow = this.add.image(this.arrowPositioning[0],this.arrowPositioning[1]+64+5,"arrow").setAngle(180).setScale(1).setDepth(20)
        this.leftArrow = this.add.image(this.arrowPositioning[0]-64-5,this.arrowPositioning[1]+64+5,"arrow").setAngle(270).setScale(1).setDepth(20)
        this.rightArrow = this.add.image(this.arrowPositioning[0]+64+5,this.arrowPositioning[1]+64+5,"arrow").setAngle(90).setScale(1).setDepth(20)

        
        this.upArrow.setInteractive().addListener('pointerdown', function(pointer){
            this.isUpArrowDown = true
        },this)

        this.upArrow.setInteractive().addListener('pointerup', function(pointer){
            this.isUpArrowDown = false
        },this)

        this.downArrow.setInteractive().addListener('pointerdown', function(pointer){
            this.isDownArrowDown = true
        },this)

        this.downArrow.setInteractive().addListener('pointerup', function(pointer){
            this.isDownArrowDown = false
        },this)

        this.leftArrow.setInteractive().addListener('pointerdown', function(pointer){
            this.isLeftArrowDown = true
        },this)

        this.leftArrow.setInteractive().addListener('pointerup', function(pointer){
            this.isLeftArrowDown = false
        },this)

        this.rightArrow.setInteractive().addListener('pointerdown', function(pointer){
            this.isRightArrowDown = true
        },this)

        this.rightArrow.setInteractive().addListener('pointerup', function(pointer){
            this.isRightArrowDown = false
        },this)
        

    }

    addEvents(){
        this.input.on("pointermove", (pointer) => {
            this.reticle.x = pointer.x;
            this.reticle.y = pointer.y;
        })

        this.input.on("pointerdown", pointer => {
            this.shootBullet()
        })
    }

    shootBullet(){
        this.bulletGroup.fireBullet(this.character.x, this.character.y,this.reticle.x, this.reticle.y, this.character.isFacingLeft)
    }

    bulletTouchGround(bullet, end){
        bullet.body.reset(-100,-100)
        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.setGravity(0,0)
    }

    collectMoney(character, start){ //for score
        start.disableBody(true,true)
        this.money += 500
        this.moneyText.setText(this.money)
        this.moneySound.play()

    }

    collectCard(character, start){ //for opening doors
        start.disableBody(true,true)
        this.hasCard = true
        this.cardText.setText("Card Aquired")
        this.toggleBlocksOff()
        this.cardSound.play()
    }

}

class EnemyDestroyerGroup extends Phaser.Physics.Arcade.Group{
    constructor(scene) {
		super(scene.physics.world, scene);
    }
}

class EnemyDestroyer extends Phaser.Physics.Arcade.Sprite{
    constructor(scene, x, y) {
		super(scene, x, y, "enemyDestroyer");
	}
}

class BulletGroup extends Phaser.Physics.Arcade.Group{
	constructor(scene) {
		super(scene.physics.world, scene);
		// Initialize the group
		this.createMultiple({
			classType: Bullet, 
			frameQuantity: 40,
			active: false,
			visible: false,
			key: 'bullet'
		})
	}

    fireBullet(xStart,yStart,xEnd,yEnd,characterIsFacingLeft){
        const bullet = this.getFirstDead(false);
        if (bullet){
            bullet.fire(xStart,yStart,xEnd,yEnd,characterIsFacingLeft)
        }
    }
 
}
 
class Bullet extends Phaser.Physics.Arcade.Sprite {
    preUpdate(time, delta) {
		super.preUpdate(time, delta);
 
		if (this.y <= 0 || this.y > gameOptions.windowHeight || this.x <= 0 || this.x > gameOptions.windowWidth) {
            
            this.body.reset(-100,-100)
            this.body.setGravity(0,0)
			this.setActive(false);
			this.setVisible(false);
		}
	}

	constructor(scene, x, y) {
		super(scene, x, y, "bullet");
	}

    fire (xStart,yStart,xEnd,yEnd,characterIsFacingLeft){
        this.body.reset(xStart,yStart-10);
        let xDirection = (xEnd-xStart)
        let yDirection = (yEnd-yStart)
        let vectorLength = Math.sqrt(xDirection**2+yDirection**2)
        let finalX = xDirection/vectorLength
        let finalY = yDirection/vectorLength

        this.setActive(true);
        this.setVisible(true);


        this.setGravity(0,gameOptions.bulletDrop)

        if (characterIsFacingLeft){
            if (finalX < 0){
                this.setVelocityY(finalY*gameOptions.bulletSpeed);
                this.setVelocityX(finalX*gameOptions.bulletSpeed)
            } else {
                if (finalY > 0){
                    this.setVelocityY(gameOptions.bulletSpeed)
                } else {
                    this.setVelocityY(-gameOptions.bulletSpeed)
                }

            }

        } else {
            if (finalX > 0){
                this.setVelocityY(finalY*gameOptions.bulletSpeed);
                this.setVelocityX(finalX*gameOptions.bulletSpeed)
            } else {
                if (finalY > 0){
                    this.setVelocityY(gameOptions.bulletSpeed)
                } else {
                    this.setVelocityY(-gameOptions.bulletSpeed)
                }

            }
        }
    }
}

/*EOF*/
