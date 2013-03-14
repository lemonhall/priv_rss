var express = require('express');
var app=express();
var server = require('http').createServer(app);
var fs = require('fs');
var OpmlParser = require('opmlparser');
var opmlparser = new OpmlParser();
var feedparser = require('feedparser');
var request = require('request');
var xml2js_parser = require('xml2js').parseString;


//这句很关键，没有它，POST解析就无法进行
app.use(express.bodyParser({}));

//将三个重要文件屏蔽掉
app.get('/server.js',function(req,res){
	res.send("???????");
});


app.use('/', express.static(__dirname + '/'));

server.listen(8799);
var root={};



//给客户端返回所有的feeds列表....
app.get('/feeds', function (req, res) {
  res.send(JSON.stringify(root.feeds));
});

//给客户端返回所有的feeds列表....
app.post('/feedcontent', function (req, res) {
  var xmlurl=req.body.xmlurl;
  console.log(xmlurl);
  fetch_feed(xmlurl,function(body){
  		res.send(body);
  });
});

//读入OPML文件后的回调
//第一步当然是读入opml后把所有的title都写到页面的左边去...
function gotOpml (error, meta, feeds, outline){
  if (error){
  	console.log(error);
  }else {
    console.log('OPML info');
    console.log('%s - %s - %s', meta.title, meta.dateCreated, meta.ownerName);
    console.log('Feeds');
    //将读取到的opml赋予内存
    root.feeds=feeds;
    // feeds.forEach(function (feed){
    //   console.log('%s - %s (%s)', feed.title, feed.htmlurl, feed.xmlurl);
    //   //fetch_feed(feed.xmlurl);
    //   //console.log(feed);
    // });
  }
}

function gotArticles (error, meta, articles,callback){
  if (error){
  	console.log(error);
  }else {
    console.log('Feed info');
    //console.log('%s - %s - %s', meta.title, meta.link, meta.xmlurl);
    console.log('Articles');
    callback(articles);

    // articles.forEach(function (article){
    //   console.log("%s\n", article.title);
    // });
  }
}


function gotfeed(err, response, body,callback){
	  //console.log("got feed?");
	if (err){
  		console.log(err);
  	}else {
	  //console.log(body);
	  if(body){
	  	console.log("I got the body....");
	  	console.log(body);
	  	feedparser.parseString(body).on('article', gotArticles(callback));
	  }
	}
}


function fetch_feed(feedurl,callback){
	var reqObj = {'uri': feedurl}
 //             'headers': {'If-Modified-Since' : <your cached 'lastModified' value>,
 //                         'If-None-Match' : <your cached 'etag' value>}};
 	//console.log("feed url?");
 	//console.log(feedurl);
	// parseString()
	var checkurl=typeof feedurl;
	//console.log(feedurl);
	//console.log(checkurl);
	if(checkurl!='string'){
		console.log(feedurl);
	}
if(feedurl){
console.log("I am fetch....%s",feedurl);
//request(reqObj, gotfeed());
// feedparser.parseUrl(feedurl).on('article', 
//     function(error, meta, articles){
//       if (error){
// 	  	//console.log(error);
// 	  }else {
// 	    console.log('Feed info');
// 	    //console.log('%s - %s - %s', meta.title, meta.link, meta.xmlurl);
// 	    console.log('Articles');
// 	    console.log(articles);
// 	    callback(articles);
// 	    // articles.forEach(function (article){
// 	    //   console.log("%s\n", article.title);
// 	    // });
// 	  }
// });//End of feedparser.parseUrl

request(feedurl, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    //console.log(body) // Print the google web page.
    xml2js_parser(body, function (err, result) {
    	    callback(result);
	});

  }
});
}//End of vaild xmlurl
}





//读入根目录下的OPML文件
opmlparser.parseStream(fs.createReadStream('./subscriptions.xml'),gotOpml);





