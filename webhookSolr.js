const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const request = require('request');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Require module
var SolrNode = require('solr-node');

// Create client
var client = new SolrNode({
    host: '127.0.0.1',
    port: '8983',
    core: 'collection1',
    protocol: 'http'
});

const server = app.listen(process.env.PORT || 5000, () => {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});

/* For Facebook Validation */
app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] && req.query['hub.verify_token'] === 'verifyMe') {
    res.status(200).send(req.query['hub.challenge']);
  } else {
    res.status(403).end();
  }
});

/* Handling all messenges */
app.post('/webhook', (req, res) => {
  console.log(req.body);
  if (req.body.object === 'page') {
    req.body.entry.forEach((entry) => {
      entry.messaging.forEach((event) => {
        if (event.message && event.message.text) {
          sendMessage(event);
        }
      });
    });
    res.status(200).end();
  }
});

function sendMessage(event) {
  let sender = event.sender.id;
  let text = event.message.text;
  var finalResult = '';
  var strQuery = client.query().q('text:'+text);
  client.search(strQuery, function (err, result) {
     if (err) {
        console.log(err);
        return;
     }
     if (JSON.parse(result).response.numFound) {

     console.log('Response:', JSON.parse(result).response.docs[0].title[0]);
     finalResult = JSON.parse(result).response.docs[0].title[0];}
     else {
       finalResult = "404 NOT FOUND :D"
     }

     request({
       url: 'https://graph.facebook.com/v2.6/me/messages',
       qs: {access_token: "EAAU4Q1fCB24BACvdZAbatnvSZC57lv7RUpDt89Ufr25aTOCtxMQZCZADIbn0ZAdb4OmYQyvaxnSCZC14Ya85AZBAoiuNjiczicivaEAs8FtZCQWgJxRSCp24ZCcxgHRIwmtYakUDqMif5w0RDhpWPvUvSKVRZAUgxKWuWRXmDwne38GwZDZD"},
       method: 'POST',
       json: {
         recipient: {id: sender},
         message: {text: finalResult}
       }
     }, (error, response) => {
       if (error) {
           console.log('Error sending message: ', error);
       } else if (response.body.error) {
           console.log('Error: ', response.body.error);
       }
     });

  });


}
