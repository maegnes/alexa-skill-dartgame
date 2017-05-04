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

const docClient = new AWS.DynamoDB.DocumentClient();

const table = "Game";
let type = "501";
let sessionId = "SessionId.ef14f013-fe8d-402f-a6be-5df405d0f6a8";

const params = {
    TableName: table,
    Key: {
        sessionId: sessionId
    }
};

docClient.get(params, function(err, data) {
    if (err) {
        console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("GetItem succeeded:", JSON.stringify(data, null, 2));

        //console.log("Dieses Spiel spielen " + data.Item.players.length + " Spieler!");
    }
});

