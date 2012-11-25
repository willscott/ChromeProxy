var state = localStorage['state'] || 0;
var saved_state = 0;

function getScope() {
  return (localStorage['incognito'] == 'checked') ?
      'incognito_persistent' : 'regular';
}

function splitProxy(string) {
  var parts = /(.*):\/\/(.*):(.*)/g.exec(string);
  return {
    scheme: cleanscheme(parts[1]),
    host: parts[2],
    port: parseInt(parts[3])
  };
}

function loadProxy(rules) {
  var proxy = localStorage['proxy'] || 'http://localhost:8080';
  if (proxy.indexOf(",") > -1) {
    var items = proxy.split(",");
    var keys = ['proxyForHttp', 'proxyForHttps', 'proxyForFtp', 'fallbackProxy'];
    for (var i = 0; i < keys.length; i++) {
      rules[keys[i]] = splitProxy(items[i]);
    }
  } else {
    rules['singleProxy'] = splitProxy(proxy);
  }
};

function cleanscheme(s) {
  s = s.toLowerCase();
  if (s == "socks 4") s = "socks4";
  if (s == "socks 5") s = "socks5";
  return s;
};

function migrate() {
  var toStr = function(box) {
    var scheme = localStorage[box + '-scheme'] || 'http';
    var host = localStorage[box + '-host'] || '127.0.0.1';
    var port = localStorage[box + '-port'] || '8080';
    return cleanscheme(scheme) + "://" + host + ":" + port;
  };
  if (localStorage['mode'] == 'custom') {
    var hp = toStr('hp');
    var hsp = toStr('hsp');
    var ftp = toStr('ftp');
    var fbp = toStr('fbp');
    var proxy = hp + ',' + hsp + ',' + ftp + ',' + fbp;
    localStorage['proxy'] = proxy;
    localStorage['proxies'] = JSON.stringify([proxy]);
  } else {
    var proxy = toStr('sp');
    localStorage['proxy'] = proxy;
    localStorage['proxies'] = JSON.stringify([proxy]);
  }
  delete localStorage['mode'];
};

function setup() {
  var proxy = "http://localhost:8080";
  localStorage['proxy'] = proxy;
  localStorage['proxies'] = JSON.stringify([proxy]);
};


function setProxy() {
  if (!localStorage['proxy'] && localStorage['mode'] == 'custom' ||
      localStorage['mode'] == 'single') {
    migrate();
  } else if(!localStorage['proxy']) {
    setup();
  }

  state = localStorage['state'] || "false";
  if (state != "false") {
    chrome.browserAction.setBadgeText({
      text: chrome.i18n.getMessage("browserActionOn")
    });
		chrome.browserAction.setBadgeBackgroundColor({color: [110, 210, 80, 180]});
    var proxysettings = {
      mode: 'fixed_servers',
      rules: {}
    };

    loadProxy(proxysettings.rules);

    chrome.proxy.settings.set({
      'value': proxysettings,
      'scope': getScope()
    }, function() {});
  } else {
		chrome.browserAction.setBadgeBackgroundColor({color: [130, 130, 130, 180]});
    chrome.browserAction.setBadgeText({
      text: chrome.i18n.getMessage("browserActionOff")
    });
    if (localStorage['off'] in ['system', 'auto_detect', 'direct']) {
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

function clearProxy() {
  chrome.proxy.settings.clear({'scope': 'regular'});
  chrome.proxy.settings.clear({'scope': 'incognito_persistent'});
  chrome.proxy.settings.clear({'scope': 'incognito_session_only'});
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

function proxyError(details) {
	chrome.browserAction.setBadgeBackgroundColor({color: [210, 110, 80, 180]});
}

chrome.browserAction.setIcon({path: "icon-19.png"});
chrome.browserAction.setBadgeBackgroundColor({color:[130, 130, 130, 180]});
chrome.browserAction.onClicked.addListener(flipState);
chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    if (request['cmd'] == 'start_save') {
      saved_state = state;
      state ? flipState() : setProxy();
    } else if (request['cmd'] == 'clear') {
      clearProxy();
    } else { //end save
      saved_state ? flipState() : setProxy();
    }
    sendResponse();
  });
chrome.proxy.onProxyError.addListener(proxyError);
setProxy();