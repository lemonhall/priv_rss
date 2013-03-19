'use strict';

var request = require('request');

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

var root={};

var root.douban={};

var requestDoubanAPI=function(username,req,succ_cb,fail_cb){
  if(root.douban[username]){
        var access_token=root.douban[username].access_token;
        var refresh_token=root.douban[username].refresh_token;
        var req_url=req.url;
        var req_arg=req_arg;

  if(access_token&&refresh_token){
              console.log(access_token);
  request.post(req_url,req_arg,
      function (e, r, body) {
      if(!e){
          var body_jObject=JSON.parse(body);
	        //如果是有code则多半意味着失败了，则打印错误代码
	        //console.log(body_jObject);
	        if(body_jObject.code){
		            var code=body_jObject.code;
		            console.log(db_err_message[code]);
                fail_cb(code);
          }else{
                succ_cb(res);
          }//End of body_jObject.code...not null or undefied...
      }//End of request not error
      else{
                fail_cb();
      }
  });//End of request....
  }//End of access_token  && refresh_token exist.....
  else{
                fail_cb();
  }
  }//End of username exist......
  else{
                fail_cb();
  }
};
var refreshDoubnKey=function(username,callback){
    var req.arg.form=db_app_token;
    var refresh_token=root.douban[username].refresh_token;
        req.arg.form.refresh_token=refresh_token;
        req.arg.form.grant_type="refresh_token";
        req.url="https:///www.douban.com/service/auth2/token";
    requestDoubanAPI(username,req,function(res){
          root.douban[username].access_token=res.access_token;
          root.douban[username].refresh_token=res.refresh_token;
    });
};//ENd of refresh_token........

var prepareShuo=function(shuo_fromUser){
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
  return shuo;
},succPushShuo=function(){
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
 


},requestShuoAPI=function(username,shuo_fromUser,callback){
};//End of function


//对外暴露的接口API
var pushToDoubanShuo=function(username,shuo_fromUser,callback){
    var shuo=prepareShuo(shuo_fromUser);
    var header={'Authorization':'Bearer '+access_token};
    var req={};
        req.url='https://api.douban.com/shuo/v2/statuses/'
        req.arg={headers:header,form:shuo};

    requestDoubanAPI(username,req,function(){
        succPushShuo();    
    },function(){
        refreshDoubnKey(username,function(){
          pushToDoubanShuo(username,shuo_fromUser,callback);
        });  
    });
};//End of push message to douban shuo... 


var succ_getAccess_token=function(access_token){
      console.log(access_token);
     var header={'Authorization':'Bearer '+access_token};
    request.get('https://api.douban.com/v2/user/~me',{headers:header},
    
    requestDoubanAPI(req,function(res){
         if(res.uid){
          var uid="db_"+res.uid;
              console.log(uid);
              root.douban[uid]={};
              root.douban[uid].access_token=res.access_token;
              root.douban[uid].refresh_token=res.refresh_token;
              root.douban[uid].displayname=res.name;
        }
    });
},
//对外暴露的函数......处理login请求......  
handleLogin=function(code){
//从全局变量中复制app_token模版，并载入对应的code....
var request_arg=db_app_token;
    request_arg.code=code;
https:///www.douban.com/service/auth2/token',{form:request_arg},
  
  requestDoubanAPI(req,function(res){
      if(res.access_token){
          succ_getAccess_token(res.access_token);
      }  
  });
};//End of function
          
exports.handleDoubanLogin =handleLogin;
exports.pushToDoubanShuo  =pushToDoubanShuo;
