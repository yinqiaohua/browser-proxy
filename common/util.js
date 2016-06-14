var colors = require('colors');
var util = {};

function getOSType(){
  var type = os.type().toLowerCase();
  if (type.indexOf('darwin')>-1){
    return 'mac';
  }
  else if(type.indexOf('windows')>-1){
    return 'windows';
  }
  else if(type.indexOf('linux')>-1){
    return 'linux';
  }
}
util.getOSType = getOSType;

// get level 1 domain
function getTopDomain(host){
  if (!host) return host;
  host = host.split('.');
  return [ host[host.length-2], host[host.length-1]].join('.');
}
util.getTopDomain = getTopDomain;


// date format
function dateFormat(fmt, time){
  time = time || new Date();
  fmt = fmt || 'yyyy-MM-dd hh:mm:ss';
  var o = {
    "M+": time.getMonth() + 1, //月份
    "d+": time.getDate(), //日
    "h+": time.getHours(), //小时
    "m+": time.getMinutes(), //分
    "s+": time.getSeconds(), //秒
    "q+": Math.floor((time.getMonth() + 3) / 3), //季度
    "S": time.getMilliseconds() //毫秒
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (time.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o)
  if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
  return fmt;
}
util.dateFormat = dateFormat;

// format url's terminal style
function urlStyleFormat(url){
  if (url && /\.mp4/.test(url) ) {
    return (url)['underline'];
  }
  return url;
}
util.urlStyleFormat = urlStyleFormat;


// show log on terminal
function showLog(){
  var list = [],item, tmp, colors;
  for(var i=0, len = arguments.length;i<len;i++){
    item = arguments[i];
    if ( !item || item.constructor!==Array ) return;
    // 多个样式
    if (item[1] && item[1].indexOf('.')>-1) {
      tmp = item[1].split('.');
      colors = item[0];
      tmp.forEach(function(c,idx){
        colors = (colors+'')[c];
      });
      colors = util.urlStyleFormat(colors);
      list.push( colors );
    }else{
      tmp = util.urlStyleFormat( (item[0]+'')[item[1]] );
      list.push( tmp );
    }
  }
  console.log( list.join(' ') );
}
util.showLog = showLog;

function getCodeFromNote(fn){
  var _str = fn.toString(),
    s_pos = _str.indexOf("/*")+2,
    e_pos = _str.lastIndexOf("*/");
  return (s_pos<0 || e_pos<0) ? "" : _str.substring(s_pos, e_pos);
}
util.getCodeFromNote = getCodeFromNote;

module.exports = util;