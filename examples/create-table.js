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

const dynamoDb = new AWS.DynamoDB();
dynamoDb.deleteTable({TableName: "Game"}, function(err, data) {
   if (err) {
       console.log("table does not exists");
   } else {
       console.log("table deleted");
   }
});

const params = {
    TableName: "Game",
    KeySchema: [
        {
            AttributeName: "sessionId",
            KeyType: "HASH"
        }
    ],
    AttributeDefinitions: [
        {
            AttributeName: "sessionId",
            AttributeType: "S"
        }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 10,
        WriteCapacityUnits: 10
    }
};

dynamoDb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});