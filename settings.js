
function SettingsCtrl($scope,$http) { 

 
    $scope.feeds=[];
    $scope.rss=[];
    $scope.uploadfile=function(){

    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      // Great success! All the File APIs are supported.
   var file = document.getElementById('opmlfile').files[0];
    if (file) {
        var fileSize = 0;
    if (file.size > 1024 * 1024)
      fileSize = (Math.round(file.size * 100 / (1024 * 1024)) / 100).toString() + 'MB';
    else
      fileSize = (Math.round(file.size * 100 / 1024) / 100).toString() + 'KB';
          
    }
    if(file.size<1024*1024){
          console.log(fileSize);
        var fd = new FormData();
            fd.append("opmlfile",file);
        var xhr = new XMLHttpRequest();
            
         xhr.onload = function(e) {
            if (xhr.status == 200) {
                var res=JSON.parse(xhr.responseText);
                    if(!res.error){
                          console.log("sucess add feeds?:"+res.length);
                          $scope.feeds=res;
                          var target=$("#trToadd");
                          $scope.feeds.forEach(function(feed){
                              console.log(feed.title);
                              target.after("<tr><td>"+feed.title+"</td></tr>");
                          });
                    }
            }
         };
          /* Be sure to change the url below to the url of your upload server side script */
            xhr.open("POST", "/uploadopml");
            xhr.send(fd);
     }//END of check file size.....
     } else {
      alert('The File APIs are not fully supported in this browser.');
    }//API check....
  }//End of uploadfile....
}
