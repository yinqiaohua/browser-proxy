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
  var html = [
    '<li data-id="'+data.id+'">',

    '<span class="data-index">',
      session.index,
    '</span>',

    '<span class="data-status">',
      200,
    '</span>',

    '<span class="data-protocol">',
      HostData.protocol,
    '</span>',

    '<span class="data-host">',
      HostData.hostname,
    '</span>',

    '<span class="data-url">',
      HostData.pathname,
    '</span>',

    '</li>'
  ].join('');
  $(html).appendTo($list);
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
  if (tar.nodeName.toLowerCase()==='li') {
    $this = $(tar);
  }else{
    $this = $(e.target).parents('li');
  }
  $this.addClass('selected').siblings().removeClass('selected');
})
.on('dblclick', function(e){
  var tar = e.target;
  if (tar.nodeName.toLowerCase()==='li') {
    $this = $(tar);
  }else{
    $this = $(e.target).parents('li');
  }
  alert( $this.attr('data-id') )
});


$(document).on('keydown', function(e){
  console.log(e.keyCode);
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
  }
})