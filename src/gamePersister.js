const AWS = require('aws-sdk');
const tableName = "Game";

AWS.config.update({
    region:'eu-west-1',
    endpoint: 'http://localhost:8000'
});

/**
 * Handles persisting of game objects
 *
 * @type {GamePersister}
 */
GamePersister = class GamePersister {

    /**
     * Constructor - Connect to AWS DynamoDB and set debug mode to default value (false)
     */
    constructor() {
        this.docClient = new AWS.DynamoDB.DocumentClient();
        this.debug = false;
    }

    /**
     * Create a new game object
     *
     * @param sessionId - The sessionId of the current skill conversation
     * @param createCallback - Callback function
     */
    create(sessionId, createCallback) {
        this.docClient.put({
                TableName: tableName,
                Item: {
                    sessionId: sessionId,
                    players: [],
                    state: 'CREATED'
                }
            },
            function(err, data) {
                if (err) {
                    console.log(err);
                    //throw new Error('The game could not be created!');
                } else {
                    createCallback(data);
                }
            });
    }

    /**
     * Read an existing game object
     *
     * @param sessionId - The sessionId of the current skill conversation
     * @param callback - Callback function
     */
    read(sessionId, callback) {
        this.docClient.get({
            TableName: tableName,
            Key: {
                sessionId: sessionId
            }
        }, function(err, data) {
            if (err) {
                throw new Error('Could not retreive game!');
            } else {
                callback(data.Item);
            }
        })
    }

    /**
     * Update a n existing game object
     *
     * @param game - The game object (JSON)
     * @param updateCallback
     */
    update(game, updateCallback) {
        this.docClient.put(
            {
                TableName: tableName,
                Item: game,
            },
            function(err, updatedGame) {
                if (err) {
                    console.log(err)
                } else {
                    updateCallback(game);
                }
            }
        );
    }

    setDebugging(debugging) {
        this.debug = debugging;
    }

};

module.exports = GamePersister;