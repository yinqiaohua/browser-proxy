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
  session.data [ data.id ] = data;
  var HostData = getUrlHostData(data.url);
  // var html = [
  //   '<tr data-id="'+data.id+'" class="tr-host-selected">',

  //   '<td class="data-index">',
  //     session.index,
  //   '</td>',

  //   '<td class="data-status">',
  //     200,
  //   '</td>',

  //   '<td class="data-protocol">',
  //     HostData.protocol,
  //   '</td>',

  //   '<td class="data-host">',
  //     HostData.hostname,
  //   '</td>',

  //   '<td class="data-url">',
  //     HostData.pathname,
  //   '</td>',

  //   '<td class="data-serverip">',
  //     data.hostname,
  //   '</td>',

  //   '<td class="data-timespend"></td>',

  //   '</tr>'
  // ].join('');
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

function updateResponseData(data){
  if ( !(data && data.sid) ) return;
  var sid = data.sid;
  if ( !(session.data && session.data[sid]) )  return;
  session.data[sid]['resHeaders'] = data.resHeaders;
  session.data[sid]['body'] = data.body;
  session.data[sid]['useHOST'] = !!data.useHOST;
  session.data[sid]['hostname'] = data.hostname;
  session.data[sid]['reqEndTime'] = data.reqEndTime;
  $('[data-id=' + sid + '] td.data-serverip').html( data.hostname );
  $('[data-id=' + sid + '] td.data-timespend').html( session.data[sid].reqEndTime- session.data[sid].reqStartTime );
  if (data.useHOST) {
    $('[data-id=' + sid + ']').addClass('tr-host-selected');
  }
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

$('#data-list').on('click', function(e){
  var tar = e.target;
  var $this;
  var sid;
  if (tar.nodeName.toLowerCase()==='tr') {
    $this = $(tar);
  }else{
    $this = $(e.target).parents('tr');
  }
  $this.addClass('selected').siblings().removeClass('selected');
  sid = $this.attr('data-id');
  showResponse(sid);
});

function showResponse(sid){
  var listData = session.data[sid];
  if (!listData) return;
  var html = template('tpl-req-headers', {
    resHd: listData.resHeaders,
    reqHd: listData.reqHeaders,
    body: listData.body
  });
  document.getElementById('response-pannel').innerHTML = html;
  $('#layer-pannel').show();
  $('#response-url-title').html( listData.method + '&nbsp;&nbsp;' + listData.url );
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