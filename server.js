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
	root.feeds={};
	root.rss={};
	root.unreaded={};

var onParse=function(err,result,url1){
	var parse_url=url1;
	console.log("i am in onParse...closure..."+parse_url);
		if(!err){
			
	    	var ptr=root.rss[parse_url];
	    	//取内存里的值，如果存在，则开始建立索引以及其余的东西，如果不存在则需要初始化...
	    	if(ptr&&result.rss&&result.rss.channel&&result.rss.channel[0].item){
	    			result.rss.channel[0].item.forEach(function(item){
	    				//如果存在该条目，什么也别做.....
	    				if(ptr[item.title[0]]){

	    				}else{
	    					ptr[item.title[0]]=item;
	    					ptr[item.title[0]].readed=false;	    					
	    					ptr.index.push(item.title[0]);
	    					root.unreaded[parse_url]=root.unreaded[parse_url]+1;
	    				}
	    			});//end of foreach rss items.....
	    	}else{//如果不存在则建立该url的数据内容....
	    		if(result&&result.rss&&result.rss.channel&&result.rss.channel[0]&&result.rss.channel[0].item&&result.rss.channel[0].item[0].title){
		    		root.rss[parse_url]={};
		    		ptr=root.rss[parse_url];
		    		ptr.index=[];
		    		console.log("==========================");
		     		console.log(result.rss.channel[0].title);
		     		var unreaded_counter=0;
		   			result.rss.channel[0].item.forEach(function(item){
	    				ptr[item.title[0]]=item;
	    				ptr[item.title[0]].readed=false;
	    				console.log(item.title);
	    				ptr.index.push(item.title[0]);
	    				unreaded_counter++;
	    			});
	    			root.unreaded[parse_url]=unreaded_counter;
    			}//强判断条件的结尾......必须存在rss/rss.channel/rss.channel[0].item
	    	}//End of判断数据库中是否存在该条目内容的判断表达式的结束41行左右
	    }//if err?
	    else{
	    	console.log(err);
	    }
}//end of onParse

//自动抓取RSS地址的函数
function syncFeeds(url_list){
	url_list.forEach(function(url1){
		//fetch_feed(feed.xmlurl);
			request(url1, function (error, response, body) {
						  if (!error && response.statusCode == 200) {
						    //console.log(body) // Print the google web page.
						    console.log("i am getting....:"+url1);
						    var checkbody=typeof body;
							    if(checkbody==="string"){
							    	xml2js_parser(body,function(err,result){
							    		onParse(err,result,url1);
							    	});
								}//end of判断body是否为string的判断句
								else{
									console.log("body is not a string ....");
								}
						  }//end of statusCode==200
			});//End of request
	});//End of forEach(url in root.feeds)
}//End of sync function...

//每5分钟抓取一次feeds...填入内存
setInterval(function(){
	var url_list=[];
	for(urlkey in root.feeds){
	  if(urlkey){
		url_list.push(urlkey);
	  }//End of vaild xmlurl	
	}
	syncFeeds(url_list);

},1000*60*5);


//给客户端返回所有的feeds列表....
app.get('/feeds', function (req, res) {
  res.send(JSON.stringify(root.feeds));
});


//给客户端返回所有的feeds的已读以及未读情况
app.get('/feedunreaded', function (req, res) {
  res.send(JSON.stringify(root.unreaded));
});

//给客户端返回所有的feeds列表....
app.post('/feedcontent', function (req, res) {
  var xmlurl=req.body.xmlurl;
  console.log(xmlurl);
  
  if(root.rss[xmlurl]){
  	res.send(root.rss[xmlurl]);
  }else{
	var re={error:"错误：内存中无该条目"};
  	res.send(re);
  }//end of if no content in memory
});//End of get /feedcontent...method


//改变某条目的状态，主要是为了实现未读设计的
//入口参数为（feed的xmlurl地址，该条目的标题）
//改变数据存储层所对应的.readed标志.....
//
app.post('/readed', function (req, res) {
  var xmlurl=req.body.xmlurl;
  var readTitle=req.body.xmlurl;
  console.log("I have readed:"+xmlurl);
  console.log("I have readed:"+readTitle);
  
  if(root.rss[xmlurl]){
	var re={sucess:"ok"};
	var ptr=root.rss[xmlurl];
	ptr[readTitle].readed=true;
  	res.send(re);
  }else{
	var re={error:"错误：数据表中没有该条目"};
  	res.send(re);
  }//end of if no content in memory
});//End of get /feedcontent...method

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
    //root.feeds=feeds;
    feeds.forEach(function (feed){
        console.log('%s - %s (%s)', feed.title, feed.htmlurl, feed.xmlurl);
        if(feed.xmlurl){
        	root.feeds[feed.xmlurl]=feed.title;
        }
        //fetch_feed(feed.xmlurl);
        //console.log(feed);
    });
  }
}//读取opml文件的例程，这段程序倒是很少出错.....

//读入根目录下的OPML文件
opmlparser.parseStream(fs.createReadStream('./subscriptions.xml'),gotOpml);

//20秒钟后，等待抓取opml成功后....
setTimeout(function(){
	var url_list=[];
	for(urlkey in root.feeds){
	  if(urlkey){
		url_list.push(urlkey);
	  }//End of vaild xmlurl	
	}
	syncFeeds(url_list);
},1000*10);