/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var mongoose = require('mongoose');
var fetch = require('node-fetch');

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

mongoose.connect(CONNECTION_STRING, {useNewUrlParser: true});

var Schema = mongoose.Schema;

var stockLikesModel = new Schema({
stockName: {type: String, required: true},
ipAddress: {type: String, required: true}
});

var stockLike = mongoose.model('stockLike', stockLikesModel);


module.exports = function (app) {
  app.route('/api/stock-prices')
    .get(function (req, res){
    
    var ipAddress = req.ip;
    var likeBool  = req.query.like;
    var count;
    
    if(req.query.stock[0] && req.query.stock[1]){
      
      console.log('two sent');
      console.log(req.query.stock[0] + req.query.stock[1]);
      var firstStock = req.query.stock[0].toLowerCase();
      var secondStock = req.query.stock[1].toLowerCase();
      
    }
    
    
    var stockName = req.query.stock.toLowerCase();
    
    var url = 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol='+req.query.stock+'&apikey='+process.env.EXTERNAL_API_KEY;
    
    var Promise0 = new Promise((resolve,reject) => {
        LikeChecker(likeBool,stockName,ipAddress);
        resolve('success');
      });
    
    Promise0.then(()=>{
      var Promise1 = new Promise((resolve,reject) => {stockLike.countDocuments({stockName: stockName}, (err,data) => {
      if (err) return err.message; 
      count = data;
      resolve(count);
        
      Promise1.then(fetch(url)
      .then(res => res.json())
      .then(data => { 
      res.json({stockData: {
        stock:  data['Global Quote']['01. symbol'],
        price:  data['Global Quote']['05. price'],
        likes:  count
      }
      })
      })         
      .catch(err => console.log(err)));
    })})});
    
    function LikeChecker(likeBool,stock,ip) {
    if(likeBool){
    
      stockLike.find({stockName: stock, ipAddress: ip},(err,data) => {
        
        if(err) return err.message;
        
        if(!data[0]){
      var addLike = new stockLike({stockName: stock, ipAddress: ip});
      addLike.save((err,data) => err ? err.message : console.log('Saved'));
        }else{
         return; //console.log('A like for ' + stock + ' has already been registered from ipAddress: ' + ip); 
        }
      });
    }
  }      
});
}