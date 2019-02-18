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
    
  function LikeAdder(stock) {
  
       stockLike.find({stockName: stock, ipAddress: ipAddress},(err,data) => {
        
        if(err) err.message;
        
        if(!data[0]){
      var addLike = new stockLike({stockName: stock, ipAddress: ipAddress});
      addLike.save((err,saved) => {
      if (err) return false;
        
        return true;
  });
        }
       });
  }
  
    
 function CountLikes(stock,url) {
    
    if(likeBool) LikeAdder(stockName);
    
    stockLike.countDocuments({stockName: stock},(err,countLikes) => {
      if (err) err.message;
    
      fetch(url)
      .then(res => res.json())
      .then(data => {  
      res.json({stockData: {
        stock:  data['Global Quote']['01. symbol'],
        price:  data['Global Quote']['05. price'],
        likes:  countLikes
      }
      })
      })
      .catch(err => err.message);
      });          
         
     return;
  
}
    
    function HandleTwoUrl(obj,url1,url2){
    
    let firstCall = fetch(url1);
    let secondCall = fetch(url2);
      
      Promise.all([firstCall,secondCall])
      .then(values => Promise.all(values.map(res => res.json())))
      .then((data) => {
    
          res.json({stockData: [{stock: data[0]['Global Quote']['01. symbol'], price: data[0]['Global Quote']['05. price'], rel_likes: obj.first-obj.second},
                                {stock: data[1]['Global Quote']['01. symbol'], price: data[1]['Global Quote']['05. price'], rel_likes: obj.second-obj.first}]});  
        }).catch(err => err.message);
       
  
    }
    
    function AddTwoLikes(stock1,stock2){
    
      stockLike.find({stockName: stock1, ipAddress: ipAddress},(err,data) => {
        
        if(err) err.message;
        
        if(!data[0]){
      var addLike = new stockLike({stockName: stock1, ipAddress: ipAddress});
      addLike.save((err,saved) => {
      if (err) console.log(err);
      //if(saved) console.log('saved Like for: '+stock1);
  });
        }
       });
      
      stockLike.find({stockName: stock2, ipAddress: ipAddress},(err,data) => {
        
        if(err) err.message;
        
        if(!data[0]){
      var addLike = new stockLike({stockName: stock2, ipAddress: ipAddress});
      addLike.save((err,saved) => {
      if (err) console.log(err);
        
        //if(saved) console.log('saved Like for: '+stock2);
  });
        }
       });
    
    }
    
    if(Array.isArray(req.query.stock)){
      
      var firstStock = req.query.stock[0].toLowerCase();
      var secondStock = req.query.stock[1].toLowerCase();
      var firstUrl = 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol='+firstStock+'&apikey='+process.env.EXTERNAL_API_KEY;
      var secondUrl = 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol='+secondStock+'&apikey='+process.env.EXTERNAL_API_KEY;
      
      var relLikesObj = {};
  
      if(likeBool) AddTwoLikes(firstStock,secondStock);
      
      stockLike.countDocuments({stockName: firstStock}, (err,countFirst) => {
      if (err) console.log(err.message); 
      relLikesObj = Object.assign(relLikesObj, {first: countFirst});
      });
      
      stockLike.countDocuments({stockName: secondStock}, (err,countSecond) => {
      if (err) console.log(err.message); 
      relLikesObj = Object.assign(relLikesObj, {second: countSecond});
      HandleTwoUrl(relLikesObj, firstUrl, secondUrl);
      });
      
        
}else{
    
    var stockName = req.query.stock.toLowerCase();
    var url = 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol='+req.query.stock+'&apikey='+process.env.EXTERNAL_API_KEY;
     
      CountLikes(stockName,url);
        
    }
  
  })
}