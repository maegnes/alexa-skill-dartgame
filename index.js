const express = require('express');
const bodyParser = require('body-parser');
const app = express();

const events = require('events');
const eventEmitter = new events.EventEmitter();
const game = new(require('./src/game'))(eventEmitter);
const gamePersister = new(require('./src/gamePersister'))();
gamePersister.setDebugging(true);

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
    "AMAZON.StopIntent": function() {
        this.emit(':tell', "Bis zum nächsten Mal!");
    },
    "AMAZON.CancelIntent": function() {
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

            if (gameType !== 301 && gameType !== 401 && gameType !== 501) {
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

            console.log(game);

            // Extract player name from intent
            const playerName = obj.event.request.intent.slots.playername.value;

            eventEmitter.emit('SET_PLAYER_NAME', playerName, game);

            gamePersister.update(game, function(game) {
                if (game.state === 'CREATED') {
                    obj.emit(':ask', 'Wie heißt der nächste Spieler?');
                } else if (game.state === 'STARTED') {
                    obj.handler.state = states.GAMEMODE;
                    obj.emit(':ask', 'Das Spiel wurde gestartet. Sagt mir nun bitte eure Scores.');
                } else {
                    obj.emit(':ask', 'Alle Namen wurden erfasst und das Spiel gestartet.');
                }
            });
        });

    },

    "Unhandled": function() {
        console.log("NOT HANDLED!");
        console.log(this.event.request.intent);
    }
});

const GameModeHandlers = Alexa.CreateStateHandler(states.GAMEMODE, {

    'NewSession': function () {
        this.emit('NewSession');
    },

    'PlayerScoreIntent': function() {
        const score = this.event.request.intent.slots.score.value;
        this.emit(':ask', 'Nächster Pfeil');
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