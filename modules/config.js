'use strict';

var path = require('path');

var config              = exports;
config.caCertFileName   = 'z-proxy.ca.crt';
config.caKeyFileName    = 'z-proxy.ca.key.pem';
config.caName           = 'z-proxy-cert';
config.organizationName = 'zoborzhang';
config.OU               = 'http://zobor.me';
config.countryName      = 'CN';
config.provinceName     = 'GuangDong';
config.localityName     = 'ShenZhen';

config.getDefaultCABasePath = () => {
  var userHome = process.env.HOME || process.env.USERPROFILE;
  return path.resolve(userHome, './.AppData/z-proxy');
};

config.getDefaultCACertPath = () => {
  return path.resolve(config.getDefaultCABasePath(), config.caCertFileName);
};

config.getDefaultCACertPath = () => {
  return path.resolve(config.getDefaultCABasePath(), config.caKeyFileName);
};