'use strict';
var url                 = require('url');
var net                 = require('net');
var ca                  = require('./ca.js');
var rs                  = ca.init();
var colors              = require('colors');
var https               = require('https');
var forge               = require('node-forge');
var pki                 = forge.pki;
var fs                  = require('fs');
var tls                 = require('tls');
var requestHandler      = require('./request-handler');
var certificatePem      = fs.readFileSync(rs.caCertPath);
var certificateKeyPem   = fs.readFileSync(rs.caKeyPath);
var localCertificate    = forge.pki.certificateFromPem(certificatePem);
var localCertificateKey = forge.pki.privateKeyFromPem(certificateKeyPem);
var cache = {};

if (rs.create) {
  if (rs.create) {
    console.log(colors.cyan('CA Cert saved in: ' + rs.caCertPath));
    console.log(colors.cyan('CA private key saved in: ' + rs.caKeyPath));
  }
}

var connectHandler = (req, socket, head) => {
  var httpsParams = url.parse('https://' + req.url);
  if (1 || httpsParams.hostname==='v.qq.com') {
    getServerCertificate(httpsParams.hostname, httpsParams.port).then( (port) => {
      connect(req, socket, head, '127.0.0.1', port);
    })
  } else {
    connect(req, socket, head, httpsParams.hostname, httpsParams.port);
  }
}

var connect = (req, socket, head, hostname, port) => {
  // tunneling https
  var socketAgent = net.connect(port, hostname, () => {
    var agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36";
    socket.write('HTTP/1.1 200 Connection Established\r\n' + 'Proxy-agent: '+agent+'\r\n' + '\r\n');
    socketAgent.write(head);
    socketAgent.pipe(socket);
    socket.pipe(socketAgent);
  });
  socketAgent.on('error', (e) => {
    console.log(colors.red(e));
  });
  return socketAgent;
}

var getServerCertificate = (hostname, port) => {
  var promise = new Promise( (resolve, reject) => {
    getCertificateByHostname(hostname, port).then( (certificate)=>{
      var certPem = pki.certificateToPem(certificate.cert);
      var keyPem = pki.privateKeyToPem(certificate.key);
      var localServer = new https.Server({
        key: keyPem,
        cert: certPem,
        SNICallback: (hostname, done)=>{
          done(null, tls.createSecureContext({
            key: pki.privateKeyToPem(certificate.key),
            cert: pki.certificateToPem(certificate.cert)
          }));
        }
      });
      var localServerData = {
        cert: certificate.cert,
        key: certificate.key,
        server: localServer,
        port: 0
      };
      localServer.listen(0, ()=>{
        localServerData.port = localServer.address().port;
        resolve(localServerData.port);
      });
      localServer.on('request', (req, res)=>{
        req.httpsURL = 'https://' + hostname + req.url
        req.url = 'http://' + hostname + req.url
        // console.log('localServer.request', req.url);
        req.protocol='https'
        requestHandler(req, res)
      });
      localServer.on('error', (e)=>{
        console.log(colors.red(e));
      });
    }).catch((e)=>{
      console.log(colors.red(e));
    });
  });
  return promise;
}

var getCertificateByHostname = (hostname, port)=>{
  var hostKey = hostname+':'+port;
  if (cache && cache[hostKey]) {
    return new Promise((resolve, reject)=>{
      resolve( cache[hostKey] );
    })
  }
  var promise = new Promise( (resolve, reject)=>{
    var certificate = void 0;
    var requestConfig = {};
    if (0) {
      requestConfig = {
        method: 'HEAD',
        // host: 'www.zobor.me',
        port: 8080,
        path: 'https://' + hostname
      }
    }else{
      requestConfig = {
        method: 'HEAD',
        port: port,
        host: hostname,
        path: '/'
      }
    }
    var _resolve = function(cert){
      cache[hostKey] = cert;
      resolve(cert);
    }
    var requestCertificate = https.request(requestConfig, (certificateResp)=>{
      try {
        var serverCertificate = certificateResp.socket.getPeerCertificate();
        if (serverCertificate && serverCertificate.raw) {
          certificate = ca.createFakeCertificateByCA(localCertificateKey, localCertificate, serverCertificate);
        } else {
          certificate = ca.createFakeCertificateByDomain(localCertificateKey, localCertificate, hostname);
        }
        _resolve(certificate);
      } catch (e) {
        console.log(colors.red(e));
        reject(e);
      }
    });
    requestCertificate.setTimeout(4000, ()=>{
      if (!certificate) {
        certificate = ca.createFakeCertificateByDomain(localCertificateKey, localCertificate, hostname);
        _resolve(certificate);
      }
    });
    requestCertificate.on('error', (e)=>{
      if (!certificate) {
        certificate = ca.createFakeCertificateByDomain(localCertificateKey, localCertificate, hostname);
        _resolve(certificate);
      }
    });
    requestCertificate.end();
  });
  return promise
}

module.exports = connectHandler;