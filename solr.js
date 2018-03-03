const SolrNode = require('solr-node');




var client = new SolrNode({
    host: '127.0.0.1',
    port: '8983',
    core: 'shoppycars',
    protocol: 'http'
});

var finalResult = '';
var strQuery = client.query().q('brand:renault');
client.search(strQuery, function (err, result) {
   if (err) {
      console.log(err);
      return;
   }
   if (JSON.parse(result).response.numFound) {
     var arr = [];
     for (var i = 0; i < JSON.parse(result).response.numFound; i++) {
       console.log(JSON.parse(result).response.docs[i]);
       //arr.push(JSON.parse(result).response.docs[i]);
      }
   //console.log('Response:', JSON.parse(result).response.docs[0].model[0]);
   //finalResult = JSON.parse(result).response.docs[0].model[0];

   console.log(arr);

 }
  else {
    console.log("no index found");
  }

});
