let game

const gameOptions = {
    windowWidth: 800,
    windowHeight: 1000

}

window.onload = function() {
    let gameConfig = {
        type: Phaser.AUTO,
        backgroundColor: "#ADD8E6",
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: gameOptions.windowWidth,
            height: gameOptions.windowHeight,
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
        //add loading of assets here
    }

    create () {

    }

    update () {

    }
}