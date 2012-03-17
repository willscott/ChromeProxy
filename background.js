var state = localStorage['state'] || 0;
var saved_state = 0;

function getScope() {
  return (localStorage['incognito'] == 'checked') ?
      'incognito_persistent' : 'regular';
}

function getProxy(k) {
  var sval = localStorage[k + '-scheme'] || 'HTTP';
  sval = sval == 'HTTP' ? 'http' :
      sval == 'HTTPS' ? 'https' :
      sval == 'SOCKS 5' ? 'socks5' :
      'socks4';
  return {
    scheme: sval,
    host: localStorage[k + '-host'] || '127.0.0.1',
    port: parseInt(localStorage[k + '-port'] || '8080')
  };
}

function setProxy() {
  state = localStorage['state'] || "false";
  if (state != "false") {
    chrome.browserAction.setBadgeText({
      text: "on"
    });
    var proxysettings = {
      mode: 'fixed_servers',
      rules: {}
    };
    if (localStorage['mode'] == 'custom') {
      var fields = {
        'hp': 'proxyForHttp',
        'hsp': 'proxyForHttps',
        'ftp': 'proxyForFtp',
        'fbp': 'fallbackProxy'
      };
      for (var key in fields) {
        proxysettings.rules[fields[key]] = getProxy(key);
      }
    } else {
      proxysettings.rules['singleProxy'] = getProxy('sp');
    }
    chrome.proxy.settings.set({
      'value': proxysettings,
      'scope': getScope()
    }, function() {});
  } else {
    chrome.browserAction.setBadgeText({
      text: "off"
    });
    if (localStorage['off'] in ['system','auto_detect','direct']) {
      var proxysettings = {mode: localStorage['off']};
      chrome.proxy.settings.set({
        'value': proxysettings,
        'scope': getScope()
      }, function() {});
    } else {
      chrome.proxy.settings.clear({'scope': getScope()});
    }
  }
}

function flipState() {
  state = localStorage['state'] || "false";
  if (state == "false") {
    state = "true";
  } else {
    state = "false";
  }
  localStorage['state'] = state;
  setProxy();
}

chrome.browserAction.setIcon({path:"icon-19.png"});
chrome.browserAction.setBadgeBackgroundColor({color:[110,140,180,180]});
chrome.browserAction.onClicked.addListener(flipState);
chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    if (request['cmd'] == 'start_save') {
      saved_state = state;
      state ? flipState() : setProxy();
    } else {
      saved_state ? flipState() : setProxy();
    }
    sendResponse();
  });
setProxy();