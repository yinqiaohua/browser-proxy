function shExpMatch(url, pattern) {
    var pCharCode;
    var isAggressive = false;
    var pIndex;
    var urlIndex = 0;
    var lastIndex;
    var patternLength = pattern.length;
    var urlLength = url.length;
    for (pIndex = 0; pIndex < patternLength; pIndex += 1) {
        pCharCode = pattern.charCodeAt(pIndex); // use charCodeAt for performance, see http://jsperf.com/charat-charcodeat-brackets
        if (pCharCode === 63) { // use if instead of switch for performance, see http://jsperf.com/switch-if
            if (isAggressive) {
                urlIndex += 1;
            }
            isAggressive = false;
            urlIndex += 1;
        }
        else if (pCharCode === 42) {
            if (pIndex === patternLength - 1) {
                return urlIndex <= urlLength;
            }
            else {
                isAggressive = true;
            }
        }
        else {
            if (isAggressive) {
                lastIndex = urlIndex;
                urlIndex = url.indexOf(String.fromCharCode(pCharCode), lastIndex + 1);
                if (urlIndex < 0) {
                    if (url.charCodeAt(lastIndex) !== pCharCode) {
                        return false;
                    }
                    urlIndex = lastIndex;
                }
                isAggressive = false;
            }
            else {
                if (urlIndex >= urlLength || url.charCodeAt(urlIndex) !== pCharCode) {
                    return false;
                }
            }
            urlIndex += 1;
        }
    }
    return urlIndex === urlLength;
}

function dnsResolve(host){
    return host
}



/**
 * Module dependencies.
 */

var dns = require('dns');
var Netmask;

// Generated by CoffeeScript 1.10.0
(function() {
  var ip2long, long2ip;

  long2ip = function(long) {
    var a, b, c, d;
    a = (long & (0xff << 24)) >>> 24;
    b = (long & (0xff << 16)) >>> 16;
    c = (long & (0xff << 8)) >>> 8;
    d = long & 0xff;
    return [a, b, c, d].join('.');
  };

  ip2long = function(ip) {
    var b, byte, i, j, len;
    b = (ip + '').split('.');
    if (b.length === 0 || b.length > 4) {
      throw new Error('Invalid IP');
    }
    for (i = j = 0, len = b.length; j < len; i = ++j) {
      byte = b[i];
      if (isNaN(parseInt(byte, 10))) {
        throw new Error("Invalid byte: " + byte);
      }
      if (byte < 0 || byte > 255) {
        throw new Error("Invalid byte: " + byte);
      }
    }
    return ((b[0] || 0) << 24 | (b[1] || 0) << 16 | (b[2] || 0) << 8 | (b[3] || 0)) >>> 0;
  };

  Netmask = (function() {
    function Netmask(net, mask) {
      var error, error1, error2, i, j, ref;
      if (typeof net !== 'string') {
        throw new Error("Missing `net' parameter");
      }
      if (!mask) {
        ref = net.split('/', 2), net = ref[0], mask = ref[1];
      }
      if (!mask) {
        switch (net.split('.').length) {
          case 1:
            mask = 8;
            break;
          case 2:
            mask = 16;
            break;
          case 3:
            mask = 24;
            break;
          case 4:
            mask = 32;
            break;
          default:
            throw new Error("Invalid net address: " + net);
        }
      }
      if (typeof mask === 'string' && mask.indexOf('.') > -1) {
        try {
          this.maskLong = ip2long(mask);
        } catch (error1) {
          error = error1;
          throw new Error("Invalid mask: " + mask);
        }
        for (i = j = 32; j >= 0; i = --j) {
          if (this.maskLong === (0xffffffff << (32 - i)) >>> 0) {
            this.bitmask = i;
            break;
          }
        }
      } else if (mask) {
        this.bitmask = parseInt(mask, 10);
        this.maskLong = 0;
        if (this.bitmask > 0) {
          this.maskLong = (0xffffffff << (32 - this.bitmask)) >>> 0;
        }
      } else {
        throw new Error("Invalid mask: empty");
      }
      try {
        this.netLong = (ip2long(net) & this.maskLong) >>> 0;
      } catch (error2) {
        error = error2;
        throw new Error("Invalid net address: " + net);
      }
      if (!(this.bitmask <= 32)) {
        throw new Error("Invalid mask for ip4: " + mask);
      }
      this.size = Math.pow(2, 32 - this.bitmask);
      this.base = long2ip(this.netLong);
      this.mask = long2ip(this.maskLong);
      this.hostmask = long2ip(~this.maskLong);
      this.first = this.bitmask <= 30 ? long2ip(this.netLong + 1) : this.base;
      this.last = this.bitmask <= 30 ? long2ip(this.netLong + this.size - 2) : long2ip(this.netLong + this.size - 1);
      this.broadcast = this.bitmask <= 30 ? long2ip(this.netLong + this.size - 1) : void 0;
    }

    Netmask.prototype.contains = function(ip) {
      if (typeof ip === 'string' && (ip.indexOf('/') > 0 || ip.split('.').length !== 4)) {
        ip = new Netmask(ip);
      }
      if (ip instanceof Netmask) {
        return this.contains(ip.base) && this.contains(ip.broadcast || ip.last);
      } else {
        return (ip2long(ip) & this.maskLong) >>> 0 === (this.netLong & this.maskLong) >>> 0;
      }
    };

    Netmask.prototype.next = function(count) {
      if (count == null) {
        count = 1;
      }
      return new Netmask(long2ip(this.netLong + (this.size * count)), this.mask);
    };

    Netmask.prototype.forEach = function(fn) {
      var index, j, k, len, long, range, ref, ref1, results, results1;
      range = (function() {
        results = [];
        for (var j = ref = ip2long(this.first), ref1 = ip2long(this.last); ref <= ref1 ? j <= ref1 : j >= ref1; ref <= ref1 ? j++ : j--){ results.push(j); }
        return results;
      }).apply(this);
      results1 = [];
      for (index = k = 0, len = range.length; k < len; index = ++k) {
        long = range[index];
        results1.push(fn(long2ip(long), long, index));
      }
      return results1;
    };

    Netmask.prototype.toString = function() {
      return this.base + "/" + this.bitmask;
    };

    return Netmask;

  })();

  exports.ip2long = ip2long;

  exports.long2ip = long2ip;

  exports.Netmask = Netmask;

}).call(this);


/**
 * Module exports.
 */

module.exports = isInNet;

isInNet.async = true;

/**
 * True iff the IP address of the host matches the specified IP address pattern.
 *
 * Pattern and mask specification is done the same way as for SOCKS configuration.
 *
 * Examples:
 *
 * ``` js
 * isInNet(host, "198.95.249.79", "255.255.255.255")
 *   // is true iff the IP address of host matches exactly 198.95.249.79.
 *
 * isInNet(host, "198.95.0.0", "255.255.0.0")
 *   // is true iff the IP address of the host matches 198.95.*.*.
 * ```
 *
 * @param {String} host a DNS hostname, or IP address. If a hostname is passed,
 *   it will be resoved into an IP address by this function.
 * @param {String} pattern an IP address pattern in the dot-separated format mask.
 * @param {String} mask for the IP address pattern informing which parts of the
 *   IP address should be matched against. 0 means ignore, 255 means match.
 * @return {Boolean}
 */

function isInNet (host, pattern, mask, fn) {
  fn = fn || function(){}
  var family = 4;
  dns.lookup(host, family, function (err, ip) {
    if (err) return fn(err);
    if (!ip) ip = '127.0.0.1';
    var netmask = new Netmask(pattern, mask);
    fn(null, netmask.contains(ip));
  });
}