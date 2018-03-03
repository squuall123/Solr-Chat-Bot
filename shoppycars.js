const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const request = require('request');
const apiaiApp = require('apiai')("8fbb01d488f74d32bf3ce8cfa9930092");

const SolrNode = require('solr-node');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



var client = new SolrNode({
    host: '127.0.0.1',
    port: '8983',
    core: 'shoppycars',
    protocol: 'http'
});

const server = app.listen(process.env.PORT || 5000, () => {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});

/* For Facebook Validation */
app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] && req.query['hub.verify_token'] === 'shoppyCars') {
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
    console.log(text);
    var finalResult = '';
    var strQuery = client.query().q('brand:'+text);
    client.search(strQuery, function (err, result) {
      console.log("Solr", result);
       if (err) {
          console.log(err);
          return;
       }
       if (JSON.parse(result).response.numFound) {
         var arr = [];
         for (var i = 0; i < JSON.parse(result).response.numFound; i++) {
           console.log(JSON.parse(result).response.docs[i]);
           arr.push(JSON.parse(result).response.docs[i]);
          }
       //console.log('Response:', JSON.parse(result).response.docs[0].model[0]);
       //finalResult = JSON.parse(result).response.docs[0].model[0];

       console.log(arr);

       finalResult = JSON.parse(arr);

       return res.json({
         speech: finalResult,
         displayText: finalResult,
         source: 'search'});

     }
      else {
        return res.status(400).json({
          status: {
            code: 400,
            errorType: 'Je ne peux pas vous trouver une voiture pour le moment.'}});
      }

  });
}
});

function sendMessage(event) {
  let sender = event.sender.id;
  let text = event.message.text;

  let apiai = apiaiApp.textRequest(text, {
    sessionId: 'ShoppyCarsBot'
  });

  apiai.on('response', (response) => {
    console.log(response);
    let aiText = response.result.fulfillment.speech;
console.log("ai Text = ", aiText);
      request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: "EAACA9UfZBHrsBAPGK8bgZC2wHVTvdeSK8JrjT3xhqyTcbw6N6bf7SoJf5jybEB3iCDaxPaGR52DMrsZBy7XX2LfYtj0BWFkXW0eR0qKmWB2shCYeZAJs3WsIjTyZCIWhVzdraTBqyZBmqkcaINLsiEntDBbuzFWtysZASGXJHpzZCgZDZD"},
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
