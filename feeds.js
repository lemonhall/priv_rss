function FeedsCtrl($scope,$http) { 

  var updatePages=function(){
      $http.get('/feeds').success(function(data) {
                $scope.feeds = data;
      });//end of update $scope.feeds;
  };

  //载入feed
  $scope.loadFeed = function(xmlurl) {

      $http.post('/feedcontent',{xmlurl:xmlurl}).success(function(data) {
              $scope.content = data;
      });//end of update $scope.feeds;
      // $http.get(xmlurl).success(function(data) {
      //           $scope.feeds = data;
      // });//end of update $scope.feeds;
  };


  updatePages();
}