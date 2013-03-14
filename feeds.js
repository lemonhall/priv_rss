angular.module('myApp', ['ngSanitize']);

function FeedsCtrl($scope,$http) { 

  $scope.rss_content={};

  var updatePages=function(){
      $http.get('/feeds').success(function(data) {
                $scope.feeds = data;
      });//end of update $scope.feeds;
  };

  //载入feed
  //http://stackoverflow.com/questions/9381926/insert-html-into-view-using-angularjs
  $scope.loadFeed = function(xmlurl) {
      console.log(xmlurl);
      $http.post('/feedcontent',{xmlurl:xmlurl}).success(function(data) {
              $scope.content = data;
      });//end of update $scope.feeds;
      // $http.get(xmlurl).success(function(data) {
      //           $scope.feeds = data;
      // });//end of update $scope.feeds;
  };

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


