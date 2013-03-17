angular.module('myApp', ['ngSanitize']);

function FeedsCtrl($scope,$http) { 

  $scope.content={};
  $scope.feedNeedbeAdded="";
  $scope.douban_shuo={};
  $scope.rec_say="";

  $scope.mainRight="<div class='hero-unit'><h1>Hello, world!</h1><p>This is a template for a simple marketing or informational website. It includes a large callout called the hero unit and three supporting pieces of content. Use it as a starting point to create something more unique.</p><p><a href='#' class='btn btn-primary btn-large'>Learn more &raquo;</a></p></div>";

  var updatePages=function(){
      //我自己咯，测试用户.....
      // var lemonhall={
      //   "lemonhall2012@qq.com":{
      //           feeds:{
      //               "http://www.36kr.com/feed":"36氪 | 关注互联网创业",
      //               "http://cn.engadget.com/rss.xml":"Engadget 瘾科技"
      //               }
      //   }
      // };
      var username="lemonhall2012@qq.com";
      $http.post('/feeds',{username:username}).success(function(data) {
          if(data.feeds){
                $scope.feeds = data.feeds;
          }else{
            if(data.error)handleNotlogin_error();
          }
      });//end of update $scope.feeds;
  };//End of 初始化页面.......
  
  
  
  var handleNotlogin_error=function(){
  
                 document.cookie = escape("db_username") + "=" + escape("") + "; path=/";  
                location.href="/";
  
  
  };
  
  
  //给当前用户加一个feed地址.....
  $scope.addFeed=function(){
      var url=$scope.feedNeedbeAdded;
      var username="lemonhall2012@qq.com";

      if(url&&username){
          $http.post('/addFeed',{username:username,xmlurl:url})
          .success(function(data) {
              //$scope.content = data;
                    if(data.feeds){
                          //更新用户的订阅列表....并清零订阅INPUT BOX....
                          //并马上载入该订阅.........
                          $scope.feeds = data.feeds;
                          $scope.feedNeedbeAdded="";
                          $scope.loadFeed(url);
                    }else{
                      if(data.error){
                          console.log(data);
                          handleNotlogin_error();
                      }
                    }
          });
      }else{

      }
  }//End of 加一个订阅地址....



  //载入feed
  //http://stackoverflow.com/questions/9381926/insert-html-into-view-using-angularjs
  $scope.loadFeed = function(xmlurl) {
      console.log(xmlurl);
      $http.post('/feedcontent',{xmlurl:xmlurl}).success(function(data) {
            if(data.error){
              console.log(data);
            }else{  
              $scope.content = data;
            }
      });
      
      $scope.mainRight="";
      //end of update $scope.feeds;
      // $http.get(xmlurl).success(function(data) {
      //           $scope.feeds = data;
      // });//end of update $scope.feeds;
  };

  //准备推荐给豆瓣的项目
  $scope.prepare_douban=function(title){
    console.log(title);
    if($scope.content[title]){
        var url=$scope.content[title].link[0];
        var praser=$($scope.content[title].description[0]);
        var img=praser.find("img");
            console.log(img);
            console.log(img[0].src);
        var rec_img=img[0].src;
        if(rec_img){
      
        }else{
          rec_img="";
       }
        var shuo={
            rec_title:title,
            rec_url:url,
            rec_desc:title,
            rec_image:rec_img
        };//End of prepare data....shuo....link to globel $scope.douban_shuo...

        $scope.douban_shuo=shuo;
        console.log($scope.douban_shuo);

    }//防御式编程.....预防出错.....
  };//END OF 准备给豆瓣的数据

  $scope.share_douban=function(){
      $scope.douban_shuo.text=$scope.rec_say.substring(0,100);; 
      $http.post('/pushToDoubanShuo',{shuo:$scope.douban_shuo}).success(function(data) {
      //console.log(shuo);  
            if(data.error){
                handleNotlogin_error();              
            }
            if(data.message==="sucess rec"){
                console.log(data.url);
                //window.open(data.url);
                //location.href=data.url;
                $('#shareDoubanModal').modal('hide');
            }
      });
 

  }//End of share to douban...

  $scope.share_weibo=function(title){
	var url=$scope.content[title].link[0];
	if(url&&title){
		var r='http://service.weibo.com/share/share.php?title='+
		    title+'&url='+url+'&source=bookmark&appkey=2992571369';
		window.open(r);
	}
 }//End of share to weibo
  //查看内容并标记该条目为已读
  $scope.expand = function(title) {
              //console.log($scope.content[title].description[0]);
              $scope.rss_content[title]=$scope.content[title].description[0];
              console.log($scope.rss_content[title]);
  };

  function getUnreadedAsync(){
          $http.get('/feedunreaded').success(function(data) {
                $scope.feedunreaded = data;
          });//end of update $scope.feeds;
  }
  updatePages();

  //20秒钟后，等待抓取opml成功后....
  getUnreadedAsync();
  //每5分钟抓取一次feeds...填入内存
      setInterval(function(){
        getUnreadedAsync();
      },1000*60*5);
}


