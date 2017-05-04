/**
 * Alexa Skill to control dart games
 *
 * @author Magnus Buk <MagnusBuk@gmx.de>
 */
const AWS = require('aws-sdk');

AWS.config.update({
    region:'eu-west-1',
    endpoint: 'http://localhost:8000'
});

var docClient = new AWS.DynamoDB.DocumentClient();

var params = {
    TableName: "Game",
    Item: {
        "sessionId": "DHASH23232DHASDHASDEASHDHASD",
        "type": 501,
        "players": [
            {
                id: "player1",
                name: "maeg",
                pointsRemaining: 501
            },
            {
                id: "player2",
                name: "peter",
                pointsRemaining: 501
            },
            {
                id: "player3",
                name: "thomas",
                pointsRemaining: 501
            }
        ]
    }
};

docClient.put(params, function(err, data) {
    if (err) {
        console.log("FEHLER!");
        console.log(err);
    } else {
        console.log("ERFOLGREICH!");
        console.log(data);
    }
});

