var util = module.exports;
util.getUrlParam = (p, u) => {
  var reg = new RegExp("(^|&|\\\\?)" + p + "=([^&]*)(&|$|#)"),
    r = null;
  r = u.match(reg);
  if (r) {
    return r[2];
  }
  return "";
}
util.GUID = (len) => {
  len = len || 32;
  var guid = "";
  for (var i = 1; i <= len; i++) {
    var n = Math.floor(Math.random() * 16.0).toString(16);
    guid += n;
  }
  return guid;
}

util.getOptionsFormRequest = (req, ssl) => {
  var externalProxy = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

  var urlObject = url.parse(req.url);
  var defaultPort = ssl ? 443 : 80;
  var protocol = ssl ? 'https:' : 'http:';
  var headers = Object.assign({}, req.headers);

  delete headers['proxy-connection'];
  var agent = false;
  if (!externalProxy) {
    // keepAlive
    if (headers.connection !== 'close') {
      if (protocol == 'https:') {
        agent = httpsAgent;
      } else {
        agent = httpAgent;
      }
      headers.connection = 'keep-alive';
    }
  } else {
    agent = util.getTunnelAgent(protocol === 'https:', externalProxy);
  }

  var options = {
    protocol: protocol,
    hostname: req.headers.host.split(':')[0],
    method: req.method,
    port: req.headers.host.split(':')[1] || defaultPort,
    path: urlObject.path,
    headers: req.headers,
    agent: agent
  };

  if (protocol === 'http:' && externalProxy && url.parse(externalProxy).protocol === 'http:') {
    var externalURL = url.parse(externalProxy);
    options.hostname = externalURL.hostname;
    options.port = externalURL.port;
    options.path = 'http://' + urlObject.host + urlObject.path;
  }

  // mark a socketId for Agent to bind socket for NTLM
  if (req.socket.customSocketId) {
    options.customSocketId = req.socket.customSocketId;
  } else if (headers['authorization']) {
    options.customSocketId = req.socket.customSocketId = socketId++;
  }

  return options;
};

util.getTunnelAgent = (requestIsSSL, externalProxy) => {
  var urlObject = url.parse(externalProxy);
  var protocol = urlObject.protocol || 'http:';
  var port = urlObject.port;
  if (!port) {
    port = protocol === 'http:' ? 80 : 443;
  }
  var hostname = urlObject.hostname || 'localhost';

  if (requestIsSSL) {
    if (protocol === 'http:') {
      if (!httpsOverHttpAgent) {
        httpsOverHttpAgent = tunnelAgent.httpsOverHttp({
          proxy: {
            host: hostname,
            port: port
          }
        });
      }
      return httpsOverHttpAgent;
    } else {
      if (!httpsOverHttpsAgent) {
        httpsOverHttpsAgent = tunnelAgent.httpsOverHttps({
          proxy: {
            host: hostname,
            port: port
          }
        });
      }
      return httpsOverHttpsAgent;
    }
  } else {
    if (protocol === 'http:') {
      return false;
    } else {
      if (!httpOverHttpsAgent) {
        httpOverHttpsAgent = tunnelAgent.httpOverHttps({
          proxy: {
            host: hostname,
            port: port
          }
        });
      }
      return httpOverHttpsAgent;
    }
  }
};

util.getLocalIP = ()=>{
  var os=require('os');  
  var ifaces=os.networkInterfaces(); 
  var iplist = []; 
  for (var dev in ifaces) {  
    ifaces[dev].forEach(function(details){  
      if (details.family=='IPv4') {  
        iplist.push(details.address)
      }  
    });  
  }
  return iplist;
}