var initRss=function(result,parse_url,headers,callback){

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
			my_rss.title=item.title[0];
			if(item.link&&typeof item.link[0]==="string"){
        my_rss.link=item.link[0];
      }else{
        my_rss.link=item.link;
      }
			
      if(item['content:encoded']){
				my_rss.description=item['content:encoded'];
			}else{
				my_rss.description=item.description;
			}
      //console.log(my_rss.description);

			ptr[item.title[0]]=my_rss;
			ptr[item.title[0]].readed=false;
			//console.log(my_rss.title);
      //console.log(my_rss.link);
		//first time use push is wright way.........but when new coming....need some 
		//trick...to handle...
			ptr.index.push(item.title[0]);
			unreaded_counter++;
	    });//end of 循环遍历RSS内容
	    	
	    	root.unreaded[parse_url]=unreaded_counter;
      if(ptr.index.length===0){
          callback({url:parse_url,e:"no vaild item found in rss..."});
      }else{
          //成功，调用callback....
          callback({e:false},parse_url,headers);
      }

},initAtom=function(result,parse_url){

		root.rss[parse_url]={};
		var ptr=root.rss[parse_url];
		//取得该条目的TITLE.....
		if(result.feed.title){
			ptr.title=result.feed.title[0];
		}

		ptr.index=[];
		console.log("==========================");
		console.log(result.feed.title[0]);
		var unreaded_counter=0;
		//遍历开始
		result.feed.entry.forEach(function(entry){

			//规范化ATOM的内容，不需要的字段不储存。。
			var my_rss={};
      if(entry.title[0]._&&typeof entry.title[0]._==="string"&&entry.link[0].$.href&&typeof entry.link[0].$.href==='string'){

          my_rss.title=entry.title[0]._;
          my_rss.link=entry.link[0].$.href;

          //console.log(my_rss.title);
          //console.log(my_rss.link);
          //console.log(entry.content);
          
          if(entry.content&&entry.content[0]){
              //console.log("I am adding...an content to rss cache..");
              my_rss.description=[entry.content[0]._];
              //console.log(entry.content[0]._);
          }else{
            console.log("fail>>>to ..read content?");
          }
          //console.log(entry.content);
			    ptr[my_rss.title]=my_rss;
			    ptr[my_rss.title].readed=false;
		      //first time use push is wright way.........but when new coming....need some 
		      //trick...to handle...
			    ptr.index.push(my_rss.title);
			    unreaded_counter++;
      }//check typeof entry.title[0]._
	    });//end of 循环遍历RSS内容
	    	root.unreaded[parse_url]=unreaded_counter;
 
},
initRDF=function(result,parse_url){
		root.rss[parse_url]={};
		var ptr=root.rss[parse_url];
		//取得该条目的TITLE.....
		if(result.feed.title){
			ptr.title=result.feed.title[0];
		}

		ptr.index=[];
		console.log("==========================");
		console.log(result.feed.title);
		var unreaded_counter=0;

		//遍历开始
		result.feed.entry.forEach(function(entry){

			//规范化RDF的内容，不需要的字段不储存。。
			var my_rss={};
			var entry_title=[];
      if(entry_title&&typeof entry_title==="string"){
          entry_title.push(entry.title[0]._);
          my_rss.title=entry_title;
          console.log(entry.link);
			    my_rss.link=entry.link;
				  if(entry['content']){
				      my_rss.description=entry['content'];
			    }else{
				      my_rss.description=entry.summary;
			    }
			    ptr[entry_title]=my_rss;
			    ptr[entry_title].readed=false;
		      //first time use push is wright way.........but when new coming....need some 
		      //trick...to handle...
			    ptr.index.push(entry_title);
			    unreaded_counter++;
      }//check typeof entry.title[0]._
	    });//end of 循环遍历RSS内容
	    	
	    	root.unreaded[parse_url]=unreaded_counter;
 


},
//供上一层解析层调用的函数，分别处理html/feed/rss/rdf/错误，这五种情况......
initFeed=function(result,parse_url,headers,callback){
  if(result&&(result.html||result.feed||result.rss||result['rdf:RDF'])){
    if(result&&result.html){
        //need tobe mark as error rss..
        callback({url:parse_url,e:"Html not rss..."});
    }
    if(result&&result.feed){
        console.log("%%%%%%%%I am an Aotm%%%%%%%%%%%");
        //console.dir(result);
        console.log(result.feed.title);
        initAtom(result,parse_url,headers,callback);
    }
    if(result&&result['rdf:RDF']){
        console.log("^^^^^^^I am an RDF%%%%%%%%%%%%%");
        //initRDF(result,parse_url);
       console.log(result['rdf:RDF'].channel[0]);
       console.log(result['rdf:RDF'].item[0]);
    }
    if(result&&result.rss&&result.rss.channel&&result.rss.channel[0]&&result.rss.channel[0].item&&result.rss.channel[0].item[0].title){
        initRss(result,parse_url,headers,callback);

    }//强判断条件的结尾......必须存在rss/rss.channel/rss.channel[0].item
    if(result&&result.rss&&result.rss.channel&&result.rss.channel[0]&&!result.rss.channel[0].item){
        callback({url:parse_url,e:"rss is ok but no item found..."});
    }
     if(result&&result.rss&&!result.rss.channel){
        callback({url:parse_url,e:"rss is ok but no channle found..."});
    }
    
  }else{

        log_error(result);
        callback({url:parse_url,e:"rss null or not feed/rss/rdf"});
  }
};//End of init an rss....

var addtoExistRss=function(ptr,result,parse_url,headers,callback){
if(false&&result&&result.rss&&result.rss.channel&&result.rss.channel[0]&&result.rss.channel[0].item&&result.rss.channel[0].item[0].title){
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

var onParse=function(err,result,url1,headers,callback){
	var parse_url=url1;
	log("i am in onParse...closure..."+parse_url);
		if(!err){
		var ptr=root.rss[parse_url];
	    	//取内存里的值，如果存在，则开始建立索引以及其余的东西，如果不存在则需要初始化...
	    	if(ptr){
	    		addtoExistRss(ptr,result,parse_url,headers,callback);
	    	}else{//如果不存在则建立该url的数据内容....
	    		initFeed(result,parse_url,headers,callback);
	    	}//End of判断数据库中是否存在该条目内容的判断表达式的结束41行左右
	    }//if err?
	    else{
          callback({url:url1,e:"something error on parser stage..."});
	    	  log_error(err);
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
			    log("i am getting....:"+url1);
          var checkbody=typeof body;
			    if(checkbody==="string"){
				    	xml2js_parser(body,function(err,result){
				    		if(!err)
                {
                  onParse(err,result,url1,respones.headers,callback);
                
                }else{
                  callback({url:reqObj.uri,e:"on parse stage sth error..."});
                }
			    	});
			    }//end of判断body是否为string的判断句
			    else{
            callback({url:reqObj.uri,e:"respones body is not a string.."});
					  console.log("body is not a string ....");
			    }//end of body is string?????
			}//end of statusCode==200
      else{
            callback({url:reqObj.uri,e:"respones status not 200...or something else happen.."});
      }
		});//End of request
	});//End of forEach(url in root.feeds)
}//End of sync function...

function gotOpmlFromAir(tmp_path,succ_cb,fail_cb){

opmlparser.parseStream(fs.createReadStream(tmp_path),function(error,meta,feeds,outline){  
  if (error){
    if(fail_cb&&typeof fail_cb==="function"){
              fail_cb();
    }
  	console.log(error);
  }else {
    console.log('OPML info');
    console.log('%s - %s - %s', meta.title, meta.dateCreated, meta.ownerName);
    console.log('Feeds');
    //将读取到的opml赋予内存
    //root.feeds=feeds;
    feeds.forEach(function (feed){
        console.log('%s - %s (%s)', feed.title, feed.htmlurl, feed.xmlurl);
        //if(feed.xmlurl){
        //	root.feeds[feed.xmlurl]=feed.title;
        //}
        //fetch_feed(feed.xmlurl);
        //console.log(feed);
    });//End of forEach feed
    if(succ_cb&&typeof succ_cb==="function"){
          succ_cb(feeds);
    }
  }//End of if error?
});
}//End of gotOpmlFromAir.......




