game = class game {

    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.registerEvents();
    }

    /**
     * Registers the game events for handling game internal logic
     */
    registerEvents() {

        let obj = this;

        // Set the game type to the matched game type (301, 401, 501)
        this.eventEmitter.on('SET_GAME_TYPE', function(type, game) {
            game = game.getItem();
            game.gameType = type;
        });

        // Add the players (without names yet)
        this.eventEmitter.on('ADD_PLAYERS', function(playerAmount, game) {

            game = game.getItem();

            for(let i = 0; i < playerAmount; i++) {
                game.players.push(
                    {
                        "name": null,
                        "score": game.gameType,
                        "throws": []
                    }
                );
            }
        });

        this.eventEmitter.on('SET_PLAYER_NAME', function(playerName, game) {

            let gameModel = game;
            game = game.getItem();

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
                obj.eventEmitter.emit('START_GAME', gameModel);
            }

        });

        // Start game
        this.eventEmitter.on('START_GAME', function(game) {
            game.start();
        });

        // Stop game
        this.eventEmitter.on('STOP_GAME', function(game) {
            game.stop();
        });

        // Player score intent
        this.eventEmitter.on('SCORE', function(score, game) {

            let currentPlayer = game.getCurrentPlayer();

            try {

                // First, validate the given score
                obj.validateScore(score);

                if (score > currentPlayer.score) {
                    throw 'OVERTHROWN'
                }

                currentPlayer.score -= score;

                if (0 === currentPlayer.score) {
                    obj.eventEmitter.emit('STOP_GAME', game);
                    game.setMessage('Spiel beendet. ' + game.getCurrentPlayer().name + ' ist der Gewinner.');
                } else {
                    game.increaseCurrentThrows();
                    if (3 === game.getCurrentThrows()) {
                        obj.eventEmitter.emit('NEXT_PLAYER', game);
                    }
                }

            } catch (err) {
                switch (err) {
                    case 'OVERTHROWN':
                        game.setMessage('Du hast Dich überworfen. Nächster Spieler.');
                        obj.eventEmitter.emit('NEXT_PLAYER', game);
                        break;
                    case 'TOO_HIGH':
                        game.setMessage('Dein Score darf nicht höher als sechzig sein.');
                        break;
                    case 'TOO_LOW':
                        game.setMessage('Dein Score darf nicht kleiner als null sein.');
                        break;
                    default:
                        console.log(err);
                        game.setMessage('Es ist ein Fehler aufgetreten. Bitte versuche es erneut.');
                }
            }

        });

        this.eventEmitter.on('NEXT_PLAYER', function(game) {
            let response = game.getCurrentPlayer().score + ' Rest. ';
            game.setNextPlayer();
            response += game.getCurrentPlayer().name + ' ist nun an der Reihe. ' + game.getCurrentPlayer().score + ' Rest.';
            game.setMessage(response);
        });
    }

    /**
     * Validates the given score
     *
     * @param score
     */
    validateScore(score) {
        if (isNaN(score)) {
            throw 'IS_NOT_A_NUMBER';
        }
        if (score > 60) {
            throw 'TOO_HIGH';
        }
        if (score < 0) {
            throw 'TOO_LOW';
        }
    }
};

module.exports = game;