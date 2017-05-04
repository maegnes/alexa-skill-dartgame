const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// Event handling
const events = require('events');
const eventEmitter = new events.EventEmitter();

// Game controller
const gameController = new(require('./src/game/controller'))(eventEmitter);

// AWS Dynamo operations handled by gamePersister
const gamePersister = new(require('./src/game/persister'))();

// Initialize the Alexa SDK
const Alexa = require('alexa-sdk');
const AWS = require('aws-sdk');

app.use(bodyParser.json());

// Build the context manually, because Amazon Lambda is missing
app.post('/', function(req, res) {

    const context = {
        succeed: function (result) {
            res.json(result);
        },
        fail:function (error) {
            console.log(error);
        }
    };

    AWS.config.update({
        region:'eu-west-1',
        endpoint: 'http://localhost:8000'
    });

    // Delegate the request to the Alexa SDK and the declared intent-handlers
    const alexa = Alexa.handler(req.body, context);
    alexa.registerHandlers(newSessionHandlers, startGameHandlers, GameModeHandlers);
    alexa.execute();
});

const states = {
    STARTMODE: '_STARTMODE',    // Set game type, player amounts and player names
    GAMEMODE: '_GAMEMODE'       // Gamemode - users are playing
};

const newSessionHandlers = {

    // New Session and no state given - Start a new game!
    'NewSession': function() {

        this.handler.state = states.STARTMODE;
        obj = this;

        gamePersister.create(this.event.session.sessionId, function(game) {
            obj.emit(':ask', 'Hi. Welchen Typ willst Du spielen? Sage Typ: 301, 401 oder 501?');
        });

    },
    'AMAZON.StopIntent': function() {
        this.emit(':tell', "Bis zum nächsten Mal!");
    },
    'AMAZON.CancelIntent': function() {
        this.emit(':tell', "Bis zum nächsten Mal!");
    },
    'SessionEndedRequest': function () {
        this.emit(":tell", "Bis zum nächsten Mal!");
    }
};

const startGameHandlers = Alexa.CreateStateHandler(states.STARTMODE, {

    'NewSession': function() {
        this.emit('NewSession');
    },

    'GameTypeIntent': function() {

        const gameType = parseInt(this.event.request.intent.slots.gametype.value);
        let obj = this;

        gamePersister.read(this.event.session.sessionId, function(game) {

            if (gameType !== 201 && gameType !== 301 && gameType !== 401 && gameType !== 501) {
                obj.emit(':ask', 'Das ist kein gültiger Spieltyp. Bitte wähle zwischen 301, 401 und 501.');
            } else {
                eventEmitter.emit('SET_GAME_TYPE', gameType, game);
                gamePersister.update(game, function(game) {
                    obj.emit(':ask', 'Wie viele Spieler spielen mit?');
                });
            }
        });

    },

    'PlayerAmountIntent': function() {

        let playerAmount = parseInt(this.event.request.intent.slots.playeramount.value);
        let obj = this;

        if (isNaN(playerAmount)) {
            this.emit(':ask', 'Das konnte ich nicht verstehen. Für zwei Spieler sage zum Beispiel: Zwei Spieler');
        } else {
            gamePersister.read(this.event.session.sessionId, function(game) {

                if (playerAmount === undefined) {
                    playerAmount = 1;
                }

                eventEmitter.emit('ADD_PLAYERS', playerAmount, game);

                gamePersister.update(game, function(game) {
                    obj.emit(':ask', 'Alles klar. Nenne mir nun die Namen der Spieler. Sage dazu zum Beispiel Spieler: Magnus');
                });
            });
        }
    },

    'PlayerNameIntent': function() {

        let obj = this;

        gamePersister.read(this.event.session.sessionId, function(game) {

            const playerName = obj.event.request.intent.slots.playername.value;

            eventEmitter.emit('SET_PLAYER_NAME', playerName, game);

            gamePersister.update(game, function(game) {

                // Now check the different states to evaluate state of the current game
                if (game.getState() === game.STATE_CREATED) {
                    obj.emit(':ask', 'Wie heißt der nächste Spieler?');
                } else if (game.getState() === game.STATE_STARTED) {
                    obj.handler.state = states.GAMEMODE;
                    obj.emit(':ask', 'Das Spiel wurde gestartet. ' + game.getCurrentPlayer().name + ' beginnt. Game on!');
                } else {
                    obj.emit(':ask', 'Alle Namen wurden erfasst und das Spiel gestartet.');
                }

            });
        });

    },

    'Unhandled': function() {
        console.log("NOT HANDLED!");
        console.log(this.event.request.intent);
    }
});

const GameModeHandlers = Alexa.CreateStateHandler(states.GAMEMODE, {

    'NewSession': function () {
        this.emit('NewSession');
    },

    'GameTypeIntent': function() {
        this.emit(':ask', 'Das Spiel wurde bereits gestartet. Du kannst den Typ des Spiels nun nicht mehr ändern.');
    },

    'PlayerAmountIntent': function() {
        this.emit(':ask', 'Das Spiel wurde bereits gestartet. Du kannst die Spielerzahl nicht mehr ändern.');
    },

    'PlayerScoreIntent': function() {

        const score = parseInt(this.event.request.intent.slots.score.value);
        let obj = this;
        let response = null;

        gamePersister.read(this.event.session.sessionId, function(game) {

            eventEmitter.emit('SCORE', score, game);

            console.log(game.getItem());

            if (game.getMessage() !== null) {
                response = game.getMessage();
                game.setMessage(null);
            }

            gamePersister.update(game, function(game) {
                if (response !== null) {
                    obj.emit(':ask', response);
                } else {
                    obj.emit(':ask', 'Nächster Pfeil');
                }
            });
        });
    },

    'IntermediateResultIntent': function() {

        let obj = this;
        const playerName = this.event.request.intent.slots.playername.value;

        gamePersister.read(this.event.session.sessionId, function(game) {
            let response = '';
            if (playerName !== undefined) {
                player = game.getPlayerByName(playerName);
                if (null === player) {
                    obj.emit(':ask', 'Den Spieler ' + playerName + ' gibt es nicht.');
                } else {
                    obj.emit(':ask', player.score + ' Punkte.');
                }
            } else {
                game.getPlayers().forEach(function(player) {
                    response += player.name + ': ' + player.score + ', ';
                });
                obj.emit(':ask', response);
            }
        });
    },

    'Unhandled': function() {
        this.emit(':ask', 'Dieses Kommando verstehe ich während einem laufenden Spiel leider nicht!');
    }

});

/**
 *
 GameTypeIntent Typ {gametype}

 PlayerAmountIntent Anzahl {playeramount}

 PlayerNameIntent Spieler {playername}

 */

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});