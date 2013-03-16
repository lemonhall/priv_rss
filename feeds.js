angular.module('myApp', ['ngSanitize']);

function FeedsCtrl($scope,$http) { 

  $scope.rss_content={};
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
          }
      });//end of update $scope.feeds;
  };//End of 初始化页面.......

  //载入feed
  //http://stackoverflow.com/questions/9381926/insert-html-into-view-using-angularjs
  $scope.loadFeed = function(xmlurl) {
      console.log(xmlurl);
      $http.post('/feedcontent',{xmlurl:xmlurl}).success(function(data) {
              $scope.content = data;
      });
      
      $scope.mainRight="";
      //end of update $scope.feeds;
      // $http.get(xmlurl).success(function(data) {
      //           $scope.feeds = data;
      // });//end of update $scope.feeds;
  };


  $scope.share_douban=function(title){
	var url=$scope.content[title].link[0];
	//var img_url=findUrlInDescripetion();
	
	if(url&&title){
		var r='http://shuo.douban.com/!service/share?image=&href='+
		      encodeURIComponent(url)+
                      '&name='+encodeURIComponent(title);
		window.open(r);
	}

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


