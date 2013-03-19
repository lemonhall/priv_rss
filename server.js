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
app.use(express.cookieParser('very secrect....'));


//将三个重要文件屏蔽掉
app.get('/server.js',function(req,res){
	res.send("???????");
});
app.get('/feeds.json',function(req,res){
	res.send("???????");
});
app.get('/user.json',function(req,res){
	res.send("???????");
});




app.use('/', express.static(__dirname + '/'));

server.listen(8798);
var root={};
	//feeds表是维护待抓取的rss的url的一个列表....
	//{
	//		"xmlurl1":"title1",
	//		"xmlurl2":"title2",
	//}
	//结构很简单：{feed.xmlurl:feed.title}
	//TODO:加入抓取时间戳...失败次数等Meta信息....可能最好把user信息也加进去？
	//	   需要加一个引用技术系统，如果长时间没有用户订阅该URL，将其剔除
	root.feeds={};

  //用一种看上去很浪费，后患无穷的方式....
  //单独去维护了一个feeds的抓取信息引用计数等等信息的表
  //{
  //    "xmlurl1":{
  //              etag:"",
  //              If-Last-Modified:"",
  //              }
  //
  //}
  root.feedsMeta={};

	//rss表是维持抓取后内容的一个数据项
	//{
	//	"feed_url":{
	//		index:["title1","title2"],
	//		title:"META的TITLE信息",
	//		"title1":{
	//				title:"....",
	//				link:"xxxx",
	//				description:".....",
	//				time:"datatime"
	//		},
	//		"title2":{readed:true/false,title:"....",link:"xxxx",description:"....."}
	//		}
	//}
	root.rss={};

	//用户表.....
	//{
	//		"user_name":{
	//					feeds:{
  //					    "url1":"title1",
  //					    "url2":"title2"
  //					},//用户所订阅的url的列表
	//					unreaded:{
	//						unreaded_title:["title1","title2"],
	//						"url1":number,	
	//						"url2":number
	//					}
	//		}
	//}
	root.user={};

	//这是单独建立的一个表
	//{
	//		"url1":number,
	//		"url2":number
	//}
	root.unreaded={};

var syncTofs=function(){

  fs.writeFile('feeds.json', JSON.stringify(root.feeds), function (err) {
      if (err) throw err;
        console.log('feeds.json saved');
  });
  fs.writeFile('user.json', JSON.stringify(root.user), function (err) {
      if (err) throw err;
        console.log('users.json saved');
  });
},syncFromfs=function(){
  fs.readFile('feeds.json', function (err, data) {
      if (err) throw err;
      console.log(data);
      root.feeds=JSON.parse(data);
  });
  fs.readFile('user.json', function (err, data) {
      if (err) throw err;
      console.log(data);
      root.users=JSON.parse(data);
  });
};

//每半小时写一次数据库
//setInterval(function(){
//  syncTofs();
//},1000*60*30);


var log=function(message){
    console.log(message);
},
log_error=function(message){
    console.log(message);
},
dblog=function(){

},
userlog=function(){

};



//第一次启动预热后读取全局抓取列表和用户订阅列表...只有这两个数据重要...rss可以缓存后放在多个node中...
//setTimeout(function(){
//  syncFromfs();
//},1000*60*10);

//每5分钟抓取一次feeds...填入内存
setInterval(function(){
	var url_list=[];
	for(urlkey in root.feeds){
	  if(urlkey){
		url_list.push(urlkey);
	  }//End of vaild xmlurl	
	}
  //每5分钟成功抓取时，就缓存最新的etag信息到内存中...
	syncFeeds(url_list,function(err,xmlurl,headers){
    if(!err.e){
        if(headers.etag){
          root.feedsMeta[xmlurl]={};
          root.feedsMeta[xmlurl].etag=headers.etag;
        }
    }
  });

},1000*60*5);

//强迫用户登陆
app.get('/',function(req,res){
  var username=req.signedCookies.db_username;
  if(username&&root.user[username]){
    res.redirect("/index.html");
  }else{
    res.redirect("/signin.html");
  }
});
//给客户端返回所有的feeds列表....
//TODO:这里需要改造成多用户的系统....
app.post('/feeds', function (req, res) {
//console.log(root.user["db_lemonhall2012"]);
  var username="";
  //这里需要加强验证逻辑
      username=req.signedCookies.db_username;
      log(username+" is getting..his/her SUBSCRIBE");
  if(root.user[username]){
  		res.send(root.user[username]);
      //console.log(root.user[username].feeds);
	}else{
		var re={error:"Loginfail"};
      log_error("when getting user's SUBSCRIBE,error..");
  		res.send(re);
   }
});//End of取得某用户订阅了的Rss的列表......

//给当前用户添加一个feed地址
//In feeds.js
//$http.post('/addFeed',{username:username,xmlurl:url})
app.post('/addFeed', function (req, res) {
	var username="";
	var xmlurl=req.body.xmlurl;
      username=req.signedCookies.db_username;
	var re={};
 
  if(username&&root.user[username]&&xmlurl){
		var list=[];
			list.push(xmlurl);
		  log("I got a address to add to user's sub.."+xmlurl);
		if(root.feeds[xmlurl]){
				//如果全局抓取列表里已有该条目。。那么只需要将该url加入到用户的订阅列表内即可....
			    log("I have the url in my memory...."+xmlurl);
			    root.user[username].feeds[xmlurl]=root.feeds[xmlurl];
			    res.send(JSON.stringify(root.user[username]));
		}else{
			syncFeeds(list,function(){
			    log("I got the right feed!!!"+xmlurl);
			    res.send(JSON.stringify(root.user[username]));
			});//End of 如果成功抓取并验证该地址可以取得合法的RSS的话....
		}
	}else{
		re={error:"Loginfail"};
    res.cookie('db_username',"");
	 	log_error("when I addFeed...I got an error..may be..username? or xmlurl is null..");	
    res.send(re);
	}

});//END of  给当前用户添加一个feed地址

//给客户端返回所有的feeds的已读以及未读情况
//TODO:这里也需要改成多用户的...
app.get('/feedunreaded', function (req, res) {
  res.send(JSON.stringify(root.unreaded));
});

//给客户端返回所有的feeds列表....
//需要加入缓存逻辑，加上时间戳.....
//入口参数要加上一个本地缓存版本的时间戳，和服务器上的时间戳对比
//如果一致，就不返回数据了，节省流量.....
app.post('/feedcontent', function (req, res) {
  var xmlurl=req.body.xmlurl;
  log("user is requesting..."+xmlurl);
  
  if(root.rss[xmlurl]){
  	res.send(JSON.stringify(root.rss[xmlurl]));
  }else{
	var re={error:"错误：内存中无该条目"};
  	log_error("when I get content...I found nothing in memory..");
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
   checkLogin(username,function(){
      res.cookie('db_username',"");
      res.redirect("/");
  });
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

//======================================================================
//导入opml文件的处理过程...
//
//
var upload_succ=function(username,feeds){
    //如果成功则返回成功解析后的feeds即可.......
    //客户端那边可能要修改成基于XMLHttpRequest2Ajax的了？否则不好弄啊。。。
    //加到待加入列表里....
if(feeds){//如果闭包返回的feeds结果木问题的话.....
var list=[];
feeds.forEach(function(feed){//########################
  //console.log(feed);
  if(feed.xmlurl){//防御编程&&&&&&&&&&&&&&&
            root.feeds[feed.xmlurl]=feed.title;//在全局抓取列表中添加该条目...
            root.user[username].feeds[feed.xmlurl]=feed.title;
            list.push(feed.xmlurl);
  }//END of 判断feed.xmlurl not null&&&&&&&&
});//END of forEach feed..............###############
          syncFeeds(list,function(err){
                console.log("!!!!!!!!!!!!:"+err.e+"  error_url:  "+err.url); 
                delete root.feeds[err.url];
                delete root.user[username].feeds[err.url];
          });
} //END of 防止闭包返回的结果有问题....
};//END of upload_succ.....


app.post("/uploadopml",function(req,res){
var username=req.signedCookies.db_username;
    if(username&&root.user[username]){
        if(req.files.opmlfile){
          var tmp_path=req.files.opmlfile.path;
          //============================================================
          if(req.files.opmlfile.type==="text/xml"){
              gotOpmlFromAir(tmp_path,
              function(feeds){
               res.send(feeds);
               upload_succ(username,feeds);  
 
              },function(){
                //error is the closure var from the gotOpmlFromAir...
                res.send({error:error});
              });
              //End of gotOpmlFromAir.....
          }else{//else fork of isXML?
            res.send({error:"not a xml file..."});
          }//END of isXML?==============================================
        }//else fork of opmlfile exist?
        else{
            res.send({error:"file not exist..."});
        }//End of opmlfile exist...
    }else{
           res.send({error:"Loginfail"});
           console.log("I am null");
    }//END of check userlogin....
// { opmlfile:
//    { domain: null,
//      _events: null,
//      _maxListeners: 10,
//      size: 44363,
//      path: '/tmp/0b3300384c5cb49bcef1bb010792ffdf',
//      name: 'subscriptions.xml',
//      type: 'text/xml',
//      hash: false,
//      lastModifiedDate: Sun Mar 17 2013 17:36:10 GMT+0800 (CST),
//      _writeStream:
//       { domain: null,
//         _events: null,
//         _maxListeners: 10,
//         path: '/tmp/0b3300384c5cb49bcef1bb010792ffdf',
//         fd: 10,
//         writable: false,
//         flags: 'w',
//         encoding: 'binary',
//         mode: 438,
//         bytesWritten: 44363,
//         busy: false,
//         _queue: [],
//         _open: [Function],
//         drainable: true },
//      length: [Getter],
//      filename: [Getter],
//      mime: [Getter] } }
});




//====================================================================
//
//豆瓣登陆处理逻辑....
//{
//    "user_uid":{
//            access_token:"";
//    }
//}

root.douban={};

//推荐到豆瓣....
//
app.post('/pushToDoubanShuo', function (req, res) {
  var username=req.body.username;
  var shuo=req.body.shuo;
  //这里需要加强验证逻辑
      username=req.signedCookies.db_username;
      console.log(username);

  if(root.douban[username]){
      pushToDoubanShuo(username,shuo,function(rec_url){
        res.send({message:"sucess rec",url:rec_url});
      });
  		//res.send(JSON.stringify(oot.user[username]));
	}else{
		var re={error:"错误：没有该用户"};
  		res.send(re);
   }
});//End of取得某用户订阅了的Rss的列表......


    
app.get('/callback/',function(req,res){

    
if(req.query.error){
    	res.redirect("/");
}//End of has a req.query.error??

if(req.query.code){
        var db_user={};
        db_user=handleDoubanLogin(req.query.code);
        var uid=db_user.uid;

        res.cookie('db_username',uid,{signed: true});
        console.log(root.douban[uid]);
        //将登陆的豆瓣用户和内存中的泛化用户表相关联...要注意判断是否已经存在....
                      if(root.user[uid]){
                      
                      }else{
                          root.user[uid]={};
                          root.user[uid].feeds={};
                      }
                      res.redirect("/");
                    }
                }else{
                	res.redirect("/");
                }
            });//end of get user's profile which is a priv API -->
          }//End of if(body_jObject.access_token){
	}//End of has a code?   if(body_jObject.code){
});//End of request.post('https://www.douban.com/service/auth2/token'
   //用code开始去换access_token去了.......		

    }//End of if(req.query.code) Exist...

});//End of app.get("/callback/")
