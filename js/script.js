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
                debug: true
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
        this.load.spritesheet("bullet","assets/character/Bullet.png",{frameWidth: 12, frameHeight: 6, startFrame: 1, endFrame: 1})
        this.load.image("reticle","assets/reticle.png")
        this.load.spritesheet("card","assets/animatedObjects/Card.png",{frameWidth: 24, frameHeight: 24})
        this.load.spritesheet("money","assets/animatedObjects/Money.png",{frameWidth: 24, frameHeight: 24})
        this.load.spritesheet("enemyDestroyer","assets/enemies/Destroyer/Idle.png",{frameWidth:128, frameHeight:128})

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

        this.reticle = this.add.image(-gameOptions.windowWidth/2,-gameOptions.windowHeight/2,"reticle")
        this.addEvents();

        this.bulletGroup = new BulletGroup(this);
        this.physics.add.overlap(this.bulletGroup,this.groundGroup,this.bulletToucGround,null,this)

        this.moneyGroup = this.physics.add.group({})
        this.money = 0
        this.physics.add.overlap(this.character,this.moneyGroup, this.collectMoney , null , this)

        this.cardGroup = this.physics.add.group({})
        this.hasCard = false
        this.physics.add.overlap(this.character, this.cardGroup, this.collectCard , null, this)

        this.enemyDestroyerGroup = new EnemyDestroyerGroup(this)





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

        
        //this.cardGroup.create(400,400).anims.play("cardAnimated",true) //test if card works
        //this.moneyGroup.create(400,400).anims.play("moneyAnimated",true) //test if money works

        this.loadHud()
    }

    update () {
        if(this.cursors.left.isDown) {
            this.character.setFlipX(true)
            this.character.isFacingLeft = true;
            this.character.body.velocity.x = -gameOptions.characterSpeed
        }
        else if(this.cursors.right.isDown) {
            this.character.setFlipX(false)
            this.character.isFacingLeft = false;
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
                    this.groundGroup.create(indexY*gameOptions.widthOfTile+(gameOptions.widthOfTile/2), indexZ*gameOptions.widthOfTile+(gameOptions.widthOfTile/2),innerElement[0]).angle = innerElement[1]
                }
                
            }

            
        }

        
        this.character = this.physics.add.sprite(characterSpawn[0]*gameOptions.widthOfTile+(72/2),characterSpawn[1]*gameOptions.widthOfTile-(72/2),"characterIdle",0);
        this.character.isFacingLeft = false;

    }

    levelEssentialLoad(){
        this.hasCard = false
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

    loadHud(){
        this.hudElementCard = this.physics.add.sprite(0,0,"card",0).setOrigin(0,0)
        this.hudElementMoney = this.physics.add.sprite(0,18,"money",0).setOrigin(0,0)
        
        this.hudElementCard.anims.play("cardAnimated",true)
        this.hudElementMoney.anims.play("moneyAnimated",true)

        this.cardText = this.add.text(24,4,"Not Aquired", {fontSize: "16px", fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif' })
        this.moneyText = this.add.text(24,24,"0", {fontSize: "16px",fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif' })

        if (this.hasCard) {
            this.cardText.setText("Card Aquired")
        } 

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

    bulletToucGround(bullet){
        bullet.setActive(false);
        bullet.setVisible(false);
    }

    collectMoney(character, start){ //for score
        start.disableBody(true,true)
        this.money += 500
        this.moneyText.setText(this.money)

    }

    collectCard(character, start){ //for opening doors
        start.disableBody(true,true)
        this.hasCard = true
        this.cardText.setText("Card Aquired")
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

class BulletGroup extends Phaser.Physics.Arcade.Group
{
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
    p
    reUpdate(time, delta) {
		super.preUpdate(time, delta);
 
		if (this.y <= 0 || this.y > gameOptions.windowHeight || x < 0 || x > gameOptions.windowWidth) {
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

        /*this.setVelocityY(finalY*gameOptions.bulletSpeed);
        this.setVelocityX(finalX*gameOptions.bulletSpeed)*/

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
