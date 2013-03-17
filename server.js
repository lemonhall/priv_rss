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

	//我自己咯，测试用户.....
	var lemonhall={
		"db_lemonhall2012":{
						feeds:{
								"http://www.36kr.com/feed":"36氪 | 关注互联网创业",
								"http://cn.engadget.com/rss.xml":"Engadget 瘾科技"
							  }
		}
	};

	root.user=lemonhall;

	//这是单独建立的一个表
	//{
	//		"url1":number,
	//		"url2":number
	//}
	root.unreaded={};

var initRss=function(result,parse_url){
if(result&&result.rss&&result.rss.channel&&result.rss.channel[0]&&result.rss.channel[0].item&&result.rss.channel[0].item[0].title){

		root.rss[parse_url]={};
		var ptr=root.rss[parse_url];
		//取得该条目的TITLE.....
		if(result.rss.channel[0].title){
			ptr.title=result.rss.channel[0].title[0];
		}

		ptr.index=[];
		console.log("==========================");
		console.log(result.rss.channel[0].title);
		var unreaded_counter=0;

		//遍历开始
		result.rss.channel[0].item.forEach(function(item){

			//规范化RSS的内容，不需要的字段不储存。。
			var my_rss={};
			my_rss.title=item.title;
			my_rss.link=item.link;
				if(item['content:encoded']){
				my_rss.description=item['content:encoded'];
			}else{
				my_rss.description=item.description;
			}
			ptr[item.title[0]]=my_rss;
			ptr[item.title[0]].readed=false;
			console.log(item.title);
		//first time use push is wright way.........but when new coming....need some 
		//trick...to handle...
			ptr.index.push(item.title[0]);
			unreaded_counter++;
	    });//end of 循环遍历RSS内容
	    	
	    	root.unreaded[parse_url]=unreaded_counter;
  }//强判断条件的结尾......必须存在rss/rss.channel/rss.channel[0].item

};//End of init an rss....

var addtoExistRss=function(ptr,result,parse_url){
if(result&&result.rss&&result.rss.channel&&result.rss.channel[0]&&result.rss.channel[0].item&&result.rss.channel[0].item[0].title){
    var item_length=result.rss.channel[0].item.length;
    //这里使用for循环倒序扫描新取到的rss项目，按照先后顺序unshift到列表的头部去
    for(item_itor=item_length-1;item_itor>=0;item_itor--){
        var tt=result.rss.channel[0].item[item_itor];
            if(tt){
	    	//如果存在该条目，什么也别做.....
	    		if(ptr[tt.title[0]]){

	    		}else{
				console.log("=========New item added=================");
                console.log(result.rss.channel[0].title);
				console.log(tt.title);

					//规范化RSS的内容，需要重构....
                    var my_rss={};
                    my_rss.title=tt.title;
                              my_rss.link=tt.link;
                    if(tt['content:encoded']){
                            my_rss.description=tt['content:encoded'];
                    }else{
                            my_rss.description=tt.description;
                    }
	
					ptr[tt.title[0]]=my_rss;
					ptr[tt.title[0]].readed=false;	    					
					ptr.index.unshift(tt.title[0]);
					root.unreaded[parse_url]=root.unreaded[parse_url]+1;
				}//end of 如果存在该条目的else分支...
			}//end of tt exist?
	  }//end of foreach rss items.....
}//End of 强内容判断if句
};//End of add to ExistRss...

var onParse=function(err,result,url1){
	var parse_url=url1;
	console.log("i am in onParse...closure..."+parse_url);
		if(!err){
		var ptr=root.rss[parse_url];
	    	//取内存里的值，如果存在，则开始建立索引以及其余的东西，如果不存在则需要初始化...
	    	if(ptr){
	    		addtoExistRss(ptr,result,parse_url);
	    	}else{//如果不存在则建立该url的数据内容....
	    		initRss(result,parse_url);
	    	}//End of判断数据库中是否存在该条目内容的判断表达式的结束41行左右
	    }//if err?
	    else{
	    	console.log(err);
	    }
};//end of onParse

//自动抓取RSS地址的函数
function syncFeeds(url_list,callback){
	url_list.forEach(function(url1){
		//fetch_feed(feed.xmlurl);

var reqObj={};
if(root.feedsMeta[url1]){
  reqObj = {'uri': url1,'headers': {'If-None-Match' :root.feedsMeta[url1].etag}};
}else{
  reqObj = {'uri': url1};
}
		request(reqObj, function (error, response, body) {
			if (!error && response.statusCode == 200) {
			    //console.log(body) // Print the google web page.
			    console.log("i am getting....:"+url1);
          var checkbody=typeof body;
			    if(checkbody==="string"){
				    	xml2js_parser(body,function(err,result){
				    		onParse(err,result,url1);
				    		if(callback&&typeof callback==="function"){
				    			   callback(url1,response.headers);
				    		}
				    	});
			    }//end of判断body是否为string的判断句
			    else{
					console.log("body is not a string ....");
			    }//end of body is string?????
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
  //每5分钟成功抓取时，就缓存最新的etag信息到内存中...
	syncFeeds(url_list,function(xmlurl,headers){
    if(headers.etag){
      root.feedsMeta[xmlurl]={};
      root.feedsMeta[xmlurl].etag=headers.etag;
    }
  });

},1000*60*5);

//强迫用户登陆
app.get('/',function(req,res){
  var username=req.signedCookies.db_username;
  if(username){
    res.redirect("/index.html");
  }else{
    res.redirect("/signin.html");
  }
});

//给客户端返回所有的feeds列表....
//TODO:这里需要改造成多用户的系统....
app.post('/feeds', function (req, res) {
  var username=req.body.username;
  //这里需要加强验证逻辑
      username=req.signedCookies.db_username;
      console.log(username);

  if(username){
  		res.send(JSON.stringify(root.user[username]));
	}else{
		var re={error:"错误：没有该用户"};
  		res.send(re);
   }
});//End of取得某用户订阅了的Rss的列表......

//给当前用户添加一个feed地址
//In feeds.js
//$http.post('/addFeed',{username:username,xmlurl:url})
app.post('/addFeed', function (req, res) {
	var username=req.body.username;
	var xmlurl=req.body.xmlurl;
      username=req.signedCookies.db_username;
	var re={};

	if(username&&xmlurl){
		var list=[];
			list.push(xmlurl);
		console.log("I got a address to add to user's sub.."+list);
		if(root.rss[xmlurl]){
				//如果内存里已有这个条目。。那么只需要将该url加入到用户的订阅列表内即可....
			    console.log("I have the url in my memory...."+xmlurl);
			    root.user[username].feeds[xmlurl]=root.rss[xmlurl].title;
			    res.send(JSON.stringify(root.user[username]));
		}else{
			//1、成功取得RSS后，在root.feeds...列表里加入该条目...
			//2、另外要在当前用户的订阅列表里加上该条目.....
			syncFeeds(list,function(){
				//1、将提交的URL添加用户的订阅列表里去....
				//   因为是HASH TABLE的，所以自然是去重过了的....
				//2、将该URL提交到全局抓取列表root.feeds里面去.....
				//   正好也是去重过了的......
				if(root.rss[xmlurl]){
					root.user[username].feeds[xmlurl]=root.rss[xmlurl].title;
					root.feeds[xmlurl]=root.rss[xmlurl].title;
				}
			    console.log("I got the right feed!!!"+xmlurl);
			    res.send(JSON.stringify(root.user[username]));
			});//End of 如果成功抓取并验证该地址可以取得合法的RSS的话....
		}
	}else{
		re={error:"错误：没有该用户"};
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
  console.log(xmlurl);
  
  if(root.rss[xmlurl]){
  	res.send(JSON.stringify(root.rss[xmlurl]));
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
//======================================================================
app.post("/uploadopml",function(req,res){
var username=req.signedCookies.db_username;
    console.log(username);
    console.log(req.files);
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
},1000*3);

//====================================================================
//豆瓣登陆处理逻辑....

//{
//    "user_uid":{
//            access_token:"";
//    }
//}

root.douban={};

var db_err_message={
		100:'invalid_request_scheme 错误的请求协议',
		101:'invalid_request_method 错误的请求方法',
		102:'access_token_is_missing 未找到access_token',
		103:'invalid_access_token access_token不存在或已被用户删除',
		104:'invalid_apikey apikey不存在或已删除',
		105:'apikey_is_blocked apikey已被禁用',
		106:'access_token_has_expired access_token已过期',
		107:'invalid_request_uri 请求地址未注册',
		108:'invalid_credencial1 用户未授权访问此数据',
		109:'invalid_credencial2 apikey未申请此权限',
		110:'not_trial_user 未注册的测试用户',
		111:'rate_limit_exceeded1 用户访问速度限制',
		112:'rate_limit_exceeded2 IP访问速度限制',
		113:'required_parameter_is_missing 缺少参数',
		114:'unsupported_grant_type 错误的grant_type',
		115:'unsupported_response_type 错误的response_type',
		116:'client_secret_mismatch client_secret不匹配',
		117:'redirect_uri_mismatch redirect_uri不匹配',
		118:'invalid_authorization_code authorization_code不存在或已过期',
		119:'invalid_refresh_token refresh_token不存在或已过期',
		120:'username_password_mismatch 用户名密码不匹配',
		121:'invalid_user 用户不存在或已删除',
		122:'user_has_blocked 用户已被屏蔽',
		123:'access_token_has_expired_since_password_changed 因用户修改密码而导致access_token过期',
		124:'access_token_has_not_expired access_token未过期',
		125:'invalid_request_scope 访问的scope不合法，开发者不用太关注，一般不会出现该错误',
		999:'unknown 未知错误'
};//End of error code table...

//douban app token..
var db_app_token={
			client_id		  : '0bc6b936fe5d77e123542ba4fb1867a3',
			client_secret	: '96ce1dffac124fe8',
			redirect_uri	: 'http://test.wukong.com/callback',
 			grant_type		: 'authorization_code',
 			code 			    :  ''
};


var refreshDoubnKey=function(username,callback){
  if(root.douban[username]){
        var access_token=root.douban[username].access_token;
        var refresh_token=root.douban[username].refresh_token;
        if(access_token&&refresh_token){
              console.log(access_token);
            var request_arg=db_app_token;
                request_arg.refresh_token=refresh_token;
                request_arg.grant_type="refresh_token";

              request.post('https://www.douban.com/service/auth2/token',{form:request_arg},
              function (e, r, body) {
              if(!e){
                    	var body_jObject=JSON.parse(body);
	                    //如果是有code则多半意味着失败了，则打印错误代码
	                    //console.log(body_jObject);
	                    if(body_jObject.code){
		                      var code=body_jObject.code;
		                      console.log(db_err_message[code]);
                      }else{
                      //{
                      //  "access_token":"0e63c03dfb66c4172b2b40b9f2344c45",
                      //  "expires_in":3920,
                      //  "refresh_token":"84406d40cc58e0ae8cc147c2650aa20a",
                      //  "douban_user_id":"1000"
                      //}
                      //如果没问题就更新access_token和refresh_token；
                          root.douban[username].access_token=body_jObject.access_token;
                          root.douban[username].refresh_token=body_jObject.refresh_token;
                          if(callback &&typeof callback==="function"){
                              callback();
                          }
                      }//End of body_jObject.code...not null or undefied...
                    }//End of if(!e)
              });//End of request....
        }//End of access_token  && refresh_token exist.....
  
  }//End of username exist......
};//ENd of refresh_token........

var pushToDoubanShuo=function(username,shuo_fromUser,callback){


if(root.douban[username]){
        var access_token=root.douban[username].access_token;
        var refresh_token=root.douban[username].refresh_token;
if(access_token&&refresh_token){
              console.log(access_token);
//curl "https://api.douban.com/shuo/v2/statuses/" -H "Authorization: Bearer TOKEN"  -F "text=TestText"  -F "image=@upload.png"
              var header={'Authorization':'Bearer '+access_token};
              var shuo={
                  source:db_app_token.client_id,
                  text:"分享自我的阅读器#lReader#:http://126.am/bR8Z83",
                  rec_title:"百度",
                  rec_url:"http://www.baidu.com",
                  rec_desc:"百度描述？",
                  rec_image:"http://www.baidu.com/img/shouye_b5486898c692066bd2cbaeda86d74448.gif"
              };
              shuo.rec_title  =shuo_fromUser.rec_title;
              shuo.rec_url    =shuo_fromUser.rec_url;
              shuo.rec_desc   =shuo_fromUser.rec_desc;
              shuo.rec_image  =shuo_fromUser.rec_image;
              shuo.text       =shuo_fromUser.text+"【"+shuo.text+"】";

request.post('https://api.douban.com/shuo/v2/statuses/',{headers:header,form:shuo},function(e,r,body){
              if(!e){
                    	var body_jObject=JSON.parse(body);
	                    //如果是有code则多半意味着失败了，则打印错误代码
	                    //console.log(body_jObject);
	                    if(body_jObject.code){
		                      var code=body_jObject.code;
		                      console.log(db_err_message[code]);
                          //如果产生错误106，则更新access_token后，再尝试调用一次自己....
                          if(code=='106'){
                              refreshDoubnKey(username,function(){
                                  pushToDoubanShuo(username,shuo_fromUser,callback);  
                              });    
                          }//End of access_token expire.....error--106
                      }else{
                        console.log(body_jObject);
// http://www.douban.com/people/lemonhall2012/status/1116656390/
// user:
//    { screen_name: '柠檬',
//      description: '',
//      small_avatar: 'http://img3.douban.com/icon/u55895127-24.jpg',
//      uid: 'lemonhall2012',
//      type: 'user',
//      id: '55895127',
//      large_avatar: 'http://img3.douban.com/icon/ul55895127-24.jpg' },
//   is_follow: false,
//   has_photo: false,
//   type: null,
//   id: 1116656390 }
                        var rec_usr    =body_jObject.user.uid;
                        var rec_uuid   =body_jObject.id;
                        var rec_url    ="";
                        if(rec_usr&&rec_uuid){
                          rec_url="http://www.douban.com/people/"+rec_usr+"/status/"+rec_uuid+"/";
                          if(callback&&typeof callback==="function"){
                            callback(rec_url);
                          }
                        }else{
                        }
                      
                      }//End of respone's exist error code?
                }else{
                
                }//End of esist error code?
});//end of request to shuo 's API..
}else{
    
}//end of if(access_token&&refreshDoubnKey)
}//end of if(root.douban[username]).........
};//End of push message to douban shuo... 

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
  		//res.send(JSON.stringify(root.user[username]));
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

//从全局变量中复制app_token模版，并载入对应的code....
var request_arg=db_app_token;
    request_arg.code=req.query.code;

request.post('https://www.douban.com/service/auth2/token',{form:request_arg}, function (e, r, body) {
	var body_jObject=JSON.parse(body);
	//如果是有code则多半意味着失败了，则打印错误代码
	//console.log(body_jObject);
	if(body_jObject.code){
		var code=body_jObject.code;
		console.log(db_err_message[code]);
	}else{
		//如果成功，则返回该用户的字符串
		// {"access_token":"$!@#$!@#$!@#$!@#",
		// "douban_user_name":"柠檬",
		// "douban_user_id":"55895127",
		// "expires_in":604800,
		// "refresh_token":"%!@#%!@!@#%!@%!%!@#%"}
          if(body_jObject.access_token){
 			            var access_token=body_jObject.access_token;
                      console.log(access_token);
            var header={'Authorization':'Bearer '+access_token};
            request.get('https://api.douban.com/v2/user/~me',{headers:header},
            function (e, r, body) {
            	if(!e){
                    var jjBody_obj=JSON.parse(body);
                    console.log(body);
                    //res.send(jjBody_obj.uid);
                    if(jjBody_obj.uid){
                      var uid="db_"+jjBody_obj.uid;
                      console.log(uid);
                      root.douban[uid]={};
                      root.douban[uid].access_token=body_jObject.access_token;
                      root.douban[uid].refresh_token=body_jObject.refresh_token;
                      root.douban[uid].displayname=jjBody_obj.name;
                      res.cookie('db_username',uid,{signed: true});
                      console.log(root.douban[uid]);
                      //将登陆的豆瓣用户和内存中的泛化用户表相关联...要注意判断是否已经存在....
                      if(root.user[uid]){
                      
                      }else{
                        root.user[uid]={};
                        root.user[uid].feeds=[];
                        root.user[uid].unreaded={};
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
