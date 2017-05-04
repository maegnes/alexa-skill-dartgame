game = class game {

    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.registerEvents();
    }

    /**
     * Registers the game events for handling game internal logic
     */
    registerEvents() {

        // Set the game type to the matched game type (301, 401, 501)
        this.eventEmitter.on('SET_GAME_TYPE', function(type, game) {
            game.gameType = type;
        });

        // Add the players (without names yet)
        this.eventEmitter.on('ADD_PLAYERS', function(playerAmount, game) {
            game.players = [];
            for(let i = 0; i < playerAmount; i++) {
                game.players.push(
                    {
                        "name": null,
                        "score": game.gameType
                    }
                );
            }
        });

        this.eventEmitter.on('SET_PLAYER_NAME', function(playerName, game) {

            let nameSet = false;
            let i = 0;

            for(i = 0; i < game.players.length; i++) {
                if (game.players[i]['name'] === null) {
                    game.players[i]['name'] = playerName;
                    nameSet = i;
                    break;
                }
            }

            if ((game.players.length - 1) === i) {
                game.state = 'STARTED';
            }

        });

        // Player score intent
        this.eventEmitter.on('SCORE', function(d) {
            console.log("SCORE!");
            console.log(d);
        });
    }

};

module.exports = game;