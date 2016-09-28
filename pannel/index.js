var $list = $('#data-list');
var session = {
  index: 0,
  data: {}
};
function updateRequestData(data){
  session.index += 1;
  if ( !(data && data.url) ) {
    return;
  }
  var HostData = getUrlHostData(data.url);

  session.data [ data.id ] = data;
  session.data [ data.id ].index = session.index;
  session.data [ data.id ].protocol = HostData.protocol;
  session.data [ data.id ].host = HostData.hostname;
  session.data [ data.id ].pathname = HostData.pathname;
  session.data [ data.id ].query = data.query;

  if (
      !session.filter ||
     (session.filter && data.url && data.url.indexOf(session.filter)>-1)
  ) {
    var html = template('tpl-req-list', {
      index: session.index,
      status: '',
      protocol: HostData.protocol,
      host: HostData.hostname,
      url: HostData.pathname,
      serverip: data.hostname,
      id: data.id,
      useHOST: ''
    });
    $(html).appendTo($list);
  }
}

function updateResponseData(data){
  if ( !(data && data.sid) ) return;
  var sid = data.sid;
  if ( !(session.data && session.data[sid]) )  return;
  session.data[sid]['resHeaders'] = data.resHeaders;
  session.data[sid]['body'] = data.body;
  session.data[sid]['useHOST'] = !!data.useHOST;
  session.data[sid]['mapLocal'] = !!data.mapLocal;
  session.data[sid]['hostname'] = data.hostname;
  session.data[sid]['reqEndTime'] = data.reqEndTime;
  session.data[sid]['postBody'] = data.postBody;
  session.data[sid]['statusCode'] = data.statusCode;
  session.data[sid].timespend = session.data[sid].reqEndTime- session.data[sid].reqStartTime;
  if (data.resHeaders && data.resHeaders["content-length"]) {
    session.data[sid]['filesize'] = formatFileSize(data.resHeaders["content-length"]);
  }
  if (
      !session.filter ||
     (session.filter && session.data[sid].url && session.data[sid].url.indexOf(session.filter)>-1)
  ) {
    var $sid = $('[data-id=' + sid + ']');
    $sid.find('td.data-serverip').html( data.hostname );
    $sid.find('td.data-status').html( data.statusCode );
    $sid.find('td.data-timespend').html( session.data[sid].timespend );
    if (data.useHOST) {
      $sid.addClass('tr-host-selected');
    }
    if (data.mapLocal) {
      $sid.addClass('tr-maplocal-selected');
    }
    if ( (data.statusCode+'').indexOf('4')===0 ) {
      $sid.addClass('tr-status-400');
    }
    $sid.find('td.data-filesize').html( session.data[sid].filesize );
  }
}
function formatFileSize(fs){
  var size = parseFloat(fs);
  if (size > 1024) {
    size = parseInt(size / 102.4)/10 + 'k';
  }else{
    size += 'b';
  }
  return size;
}

function getUrlHostData(url){
  var a=document.createElement('a');
  a.href = url;
  return {
    protocol: a.protocol.replace(':',''),
    hostname: a.hostname,
    pathname: a.pathname
  }
}

function selectUp(){
  var $current = $('#data-list li.selected');
  var $prev = $current.prev();
  if ($prev && $prev.length) {
    $prev.addClass('selected');
    $current.removeClass('selected');
  }
}

function selectDown(){
  var $current = $('#data-list li.selected');
  var $next = $current.next();
  if ($next && $next.length) {
    $next.addClass('selected');
    $current.removeClass('selected');
  }
}


function clear(){
  session.index = 0;
  clearDataList();
}
function clearDataList(){
  $list.html('');
}

$('#data-list').on('dblclick', function(e){
  var tar = e.target;
  var $this;
  var sid;
  if (tar.nodeName.toLowerCase()==='tr') {
    $this = $(tar);
  }else{
    $this = $(e.target).parents('tr');
  }
  sid = $this.attr('data-id');
  showResponse(sid);
})
.on('click', function(e){
  var tar = e.target;
  var $this;
  var sid;
  if (tar.nodeName.toLowerCase()==='tr') {
    $this = $(tar);
  }else{
    $this = $(e.target).parents('tr');
  }
  $this.addClass('click-selected').siblings().removeClass('click-selected');
});

$('#filter-handler').on('keyup', function(e){
  if (e.keyCode!==13) return;
  var txt = $.trim( $(this).val() );
  session.filter = txt;
  if (!txt) return;
  var list = [];
  $.each(session.data, function(idx, item){
    if (item && item.url && item.url.indexOf(txt)>-1) {
      list.push(item);
    }
  });
  updateFilter(list);
});

function updateFilter(data){
  var html = template('tpl-filter-list', {
    dataList: data
  });
  $list.html(html);
}

function getCookies(cookie){
  if (!cookie) return null;
  var list = cookie.split('; ');
  var cookieData = {};
  $.each(list, function(idx, item){
    if (item && item.indexOf('=')>-1) {
      var kv = item.split('=');
      if (kv && kv.length===2){
        cookieData[kv[0]] = kv[1];
      }
    }
  })
  return cookieData;
}

function showResponse(sid){
  var listData = session.data[sid];
  if (!listData) return;
  var cookies = getCookies(listData.reqHeaders.cookie);
  var html = template('tpl-req-headers', {
    resHd: listData.resHeaders,
    reqHd: listData.reqHeaders,
    body: listData.body,
    query: listData.query,
    cookies: cookies
  });
  var showUrlHtml = '<a href="' +listData.url+ '" target="_blank;">' +listData.url+ '</a>';
  document.getElementById('response-pannel').innerHTML = html;
  $('#layer-pannel').show();
  $('#response-url-title').html( listData.method + '&nbsp;&nbsp;' + showUrlHtml );
}
function closeLayer(){
  $('#layer-pannel').hide();
}

// hot key
$(document).on('keydown', function(e){
  if (e.shiftKey && e.keyCode === 88) {
    clear();
  }
  if (!e.shiftKey) {
    if (e.keyCode===38) {
      selectUp();
    }
    if (e.keyCode===40) {
      selectDown();
    }
    if (e.keyCode===27) {
      closeLayer();
    }
  }
});

// click
$('#close-layer-dialog').on('click', function(){
  closeLayer();
});