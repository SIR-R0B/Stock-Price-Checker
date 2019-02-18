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
    
    function LikeChecker(stock) {
    
      stockLike.find({stockName: stock, ipAddress: ipAddress},(err,data) => {
        
        if(err) return err.message;
        
        if(!data[0]){
      var addLike = new stockLike({stockName: stock, ipAddress: ipAddress});
      addLike.save((err,data) => err ? err.message : console.log('Saved'));
        }
         return; //console.log('A like for ' + stock + ' has already been registered from ipAddress: ' + ip); 
      });
  }  
    
    if(Array.isArray(req.query.stock)){
      
      var firstStock = req.query.stock[0].toLowerCase();
      var secondStock = req.query.stock[1].toLowerCase();
      var firstUrl = 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol='+firstStock+'&apikey='+process.env.EXTERNAL_API_KEY;
      var secondUrl = 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol='+secondStock+'&apikey='+process.env.EXTERNAL_API_KEY;
      
      var relLikesObj = {};
  
      if(likeBool) LikeChecker(firstStock)(secondStock);
      
      var Promise1 = new Promise((resolve,reject) => {stockLike.countDocuments({stockName: firstStock}, (err,data) => {
      if (err) return err.message; 
      resolve(data);
      })});
      
      var Promise2 = new Promise((resolve,reject) => {stockLike.countDocuments({stockName: secondStock}, (err,data) => {
      if (err) return err.message; 
      resolve(data);
      })});
      
      
      Promise1.then((firstLikesCount) => {
      
      Promise2.then((secondLikesCount) => {
      relLikesObj = Object.assign(relLikesObj,{first: firstLikesCount - secondLikesCount, second: secondLikesCount-firstLikesCount});
      var Promise3 = new Promise((resolve,reject) => resolve(relLikesObj));
        
      Promise3.then((relLikes) => {
      fetch(firstUrl)
      .then(res => res.json())
      .then(data => {
     
    var Promise4 = new Promise ((resolve,reject) => {
        
     resolve({ 
        stock:  data['Global Quote']['01. symbol'],
        price:  data['Global Quote']['05. price'],
        rel_likes1:  relLikes.first,
        rel_likes2:  relLikes.second
      })
      });
        
        
        
      Promise4.then((dataFirstStock) => {
      
        console.log(dataFirstStock);
        
        fetch(secondUrl)
        .then(res => res.json())
        .then(data => {
        
          res.json({stockData: [{},{}]});
          
        }
      
      ).catch(err => console.log(err));
      
      });
      })
      .catch(err => console.log(err));
      })
        
        
        
      });
      
      
      });
      
      
        
      /*
        .then(() => {
        console.log(JSON.stringify(firstStockObj));
       fetch(secondUrl)
      .then(res => res.json())
      .then(data => { 
      res.json({stockData: [{
        stock:  firstStockObj.firstStock,
        price:  firstStockObj.firstPrice,
        rel_likes:  firstStockObj.firstLikes - firstStockObj.secondLikes
      },{
        stock:  data['Global Quote']['01. symbol'],
        price:  data['Global Quote']['05. price'],
        rel_likes:  firstStockObj.secondLikes - firstStockObj.firstLikes
      }]
      })
      })         
      .catch(err => console.log(err));
      });
      */
    }else{
    
    
    var stockName = req.query.stock.toLowerCase();
    
    var url = 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol='+req.query.stock+'&apikey='+process.env.EXTERNAL_API_KEY;
    
    var Promise0 = new Promise((resolve,reject) => {
        if(likeBool) LikeChecker(stockName);
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
    }
  });
}