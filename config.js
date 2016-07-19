var rules = [];

var hosts = function(){
/*

#127.0.0.1 v.qq.com

*/
};

var headers = {
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1"
};

var noProxy = [
  'qq.com'
];

module.exports = {
  rules: rules,
  hosts: hosts,
  headers: headers,
  noProxy: noProxy
};