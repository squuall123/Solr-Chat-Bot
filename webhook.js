const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const request = require('request');
const apiaiApp = require('apiai')("f18b051c0070482e85929d39bdb7c760");

const SolrNode = require('solr-node');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



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

app.post('/ai', (req, res) => {
  if (req.body.result.action === 'search') {
    let text = req.body.result.parameters['any'];

    var finalResult = '';
    var strQuery = client.query().q('text:'+text);
    client.search(strQuery, function (err, result) {
       if (err) {
          console.log(err);
          return;
       }
       if (JSON.parse(result).response.numFound) {

       console.log('Response:', JSON.parse(result).response.docs[0].title[0]);
       finalResult = JSON.parse(result).response.docs[0].title[0];

       return res.json({
         speech: finalResult,
         displayText: finalResult,
         source: 'search'});

     }
      else {
        return res.status(400).json({
          status: {
            code: 400,
            errorType: 'Je ne peux pas vous trouver un job pour le moment.'}});
      }

  });
}
});

function sendMessage(event) {
  let sender = event.sender.id;
  let text = event.message.text;

  let apiai = apiaiApp.textRequest(text, {
    sessionId: 'SkilledBot'
  });

  apiai.on('response', (response) => {
    let aiText = response.result.fulfillment.speech;

      request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: "EAAU4Q1fCB24BACvdZAbatnvSZC57lv7RUpDt89Ufr25aTOCtxMQZCZADIbn0ZAdb4OmYQyvaxnSCZC14Ya85AZBAoiuNjiczicivaEAs8FtZCQWgJxRSCp24ZCcxgHRIwmtYakUDqMif5w0RDhpWPvUvSKVRZAUgxKWuWRXmDwne38GwZDZD"},
        method: 'POST',
        json: {
          recipient: {id: sender},
          message: {text: aiText}
        }
      }, (error, response) => {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
      });
   });

  apiai.on('error', (error) => {
    console.log(error);
  });

  apiai.end();
}
