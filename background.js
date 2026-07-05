let S = {};

async function loadState() {
  S = await chrome.storage.local.get(null);
}

function getState() {
  return S['state'] || "false";
}

function getScope() {
  return (S['incognito'] === 'checked') ?
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
  var proxy = S['proxy'] || 'http://localhost:8080';
  var domain = "";
  if (proxy.indexOf(";") > -1) {
    var domIdx = proxy.indexOf(";");
    domain = proxy.substr(domIdx + 1);
    proxy = proxy.substr(0, domIdx);
  }
  if (proxy.indexOf(",") > -1) {
    var items = proxy.split(",");
    var keys = ['proxyForHttp', 'proxyForHttps', 'proxyForFtp', 'fallbackProxy'];
    for (var i = 0; i < keys.length; i++) {
      rules[keys[i]] = splitProxy(items[i]);
    }
  } else {
    rules['singleProxy'] = splitProxy(proxy);
  }

  if (domain && domain[0] == "+") {
    var pxy = "DIRECT";
    if (rules['singleProxy']['scheme'] === "socks4" ||
        rules['singleProxy']['scheme'] === "socks5") {
      pxy = "SOCKS " + rules['singleProxy']['host'] + ":" + rules['singleProxy']['port'];
    } else if (rules['singleProxy']['scheme']) {
      pxy = "PROXY " + rules['singleProxy']['host'] + ":" + rules['singleProxy']['port'];
    }
    var domains = JSON.stringify(domain.substr(1));
    rules['PacScript'] = {
      'data':
        "var domains = " + domains + ";\n" +
        "function FindProxyForURL(url, host) {\n" +
        "  var rules = domains.split('\\n');\n" +
        "  for (var i = 0; i < rules.length; i++) {\n" +
        "    if (shExpMatch(host, rules[i])) {\n" +
        "      return '" + pxy + "';\n" +
        "    }\n" +
        "  }\n" +
        "  return 'DIRECT';\n" +
        "}\n"
    };
  } else if (domain && domain[0] == "-"){
    rules['bypassList'] = domain.substr(1).split("\n");
  }
}

function cleanscheme(s) {
  s = s.toLowerCase();
  if (s === "socks 4") s = "socks4";
  if (s === "socks 5") s = "socks5";
  return s;
};

async function setup() {
  var proxy = "http://localhost:8080";
  S['proxy'] = proxy;
  S['proxies'] = JSON.stringify([proxy]);
  await chrome.storage.local.set({proxy: proxy, proxies: S['proxies']});
};

async function setProxy() {
  if(!S['proxy']) {
    await setup();
  }

  var state = getState();
  if (state != "false") {
    chrome.action.setBadgeText({
      text: chrome.i18n.getMessage("browserActionOn")
    });
    chrome.action.setBadgeBackgroundColor({color: [110, 210, 80, 180]});

    var proxysettings = {
      mode: 'fixed_servers',
      rules: {}
    };

    loadProxy(proxysettings.rules);

    if (proxysettings.rules.PacScript) {
      proxysettings = {
        mode: 'pac_script',
        pacScript: proxysettings.rules.PacScript
      };
    }

    console.log(proxysettings);
    chrome.proxy.settings.set({
      'value': proxysettings,
      'scope': getScope()
    }, function() {});
  } else {
    chrome.action.setBadgeBackgroundColor({color: [130, 130, 130, 180]});
    chrome.action.setBadgeText({
      text: chrome.i18n.getMessage("browserActionOff")
    });
    if (S['off'] in ['system', 'auto_detect', 'direct']) {
      var proxysettings = {mode: S['off']};
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

async function clickListener() {
  await loadState();
  var state = getState();
  if (state == "false") {
    if (!S['proxy']) {
      chrome.tabs.create({url: "options.html"});
      return;
    }
    state = "true";
  } else {
    state = "false";
  }
  S['state'] = state;
  await chrome.storage.local.set({state: state});
  await setProxy();
}

async function requestListener(request, sender, sendResponse) {
  if (request['cmd'] === 'migrated') {
    await loadState();
    await setProxy();
    sendResponse();
    return true;
  }
  await loadState();
  if (request['cmd'] === 'start_save') {
    var state = getState();
    S['savedState'] = state;
    await chrome.storage.local.set({savedState: state});
    if (state === "true") {
      await clickListener();
    } else {
      await setProxy();
    }
    sendResponse();
  } else if (request['cmd'] === 'clear') {
    clearProxy();
    sendResponse();
  } else if (request['cmd'] === 'get_statistics') {
    updateStatistics('stats');
    var stats = JSON.parse(S['stats'] || '{}');
    sendResponse(stats);
  } else if (request['cmd'] === 'set_statistics') {
    S['collectStats'] = request['value'];
    await chrome.storage.local.set({collectStats: request['value']});
    updateStatistics('stats');
    var stats = JSON.parse(S['stats'] || '{}');
    sendResponse(stats);
  } else {
    if (S['savedState'] === "true") {
      await clickListener();
    } else {
      await setProxy();
    }
    sendResponse();
  }
  return true;
}

function errorListener(details) {
  console.log(details);
  if (getState() == "true") {
    chrome.action.setBadgeBackgroundColor({color: [210, 110, 80, 180]});
  }
  updateStatistics("error");
}

function changeListener(details) {
  if (details.value.mode == "fixed_servers" || details.value.mode == "pac_script" ) {
    if (details.value.mode == "fixed_servers") {
      for (var rule in details.value.rules) {
        if (details.value.rules[rule].host && (
            details.value.rules[rule].host.toLowerCase() == "localhost" ||
            details.value.rules[rule].host == "127.0.0.1")) {
          updateStatistics("local");
          return;
        }
      }
    }
    updateStatistics("remote");
  } else {
    updateStatistics("off");
  }
}

function updateStatistics(why) {
  var stats;
  try {
    stats = JSON.parse(S['stats']);
  } catch(e) {
    stats = {
      last: new Date().valueOf(),
      lastCheck: new Date().valueOf(),
      lastState: false,
      countedTime: 0,
      localUsage: 0,
      remoteUsage: 0,
      errors: 0,
      flips: 0
    };
  }
  if (S['collectStats'] == "false") {
    stats = {countedTime: 0, optout: true};
    S['stats'] = JSON.stringify(stats);
    chrome.storage.local.set({stats: JSON.stringify(stats)});
    return;
  } else if (stats.optout) {
    stats = {
      last: new Date().valueOf(),
      lastCheck: new Date().valueOf(),
      lastState: false,
      countedTime: 0,
      localUsage: 0,
      remoteUsage: 0,
      errors: 0,
      flips: 0
    };
  }
  var now = new Date();
  if (stats.lastState == 'local') {
    stats.localUsage += (now - stats.last);
  } else if (stats.lastState == 'remote') {
    stats.remoteUsage += (now - stats.last);
  }
  stats.countedTime += (now - stats.last);
  stats.last = now.valueOf();
  if (why == 'local' || why == 'remote' || why == 'off') {
    stats.lastState = why;
    stats.flips += 1;
  } else if (why == 'error') {
    stats.errors += 1;
  }
  var lc = stats.lastCheck || new Date().valueOf();
  stats.lastCheck = lc;
  if (!stats.lastState && !(why == 'error') &&
      (lc + 1000 * 60 * 60 * 24) < new Date().valueOf()) {
    stats.lastCheck = new Date().valueOf();
  }
  S['stats'] = JSON.stringify(stats);
  chrome.storage.local.set({stats: JSON.stringify(stats)});
}

async function installListener(details)
{
  await loadState();
  chrome.action.setIcon({path: "icon-19.png"});
  chrome.action.setBadgeBackgroundColor({color:[130, 130, 130, 180]});
  if (details.reason === 'update') {
    if (S['state'] === "true") {
      await setProxy();
    }
    return;
  }
  if (S['state'] == undefined) {
    chrome.action.setBadgeBackgroundColor({color: [210, 110, 80, 180]});
    chrome.action.setBadgeText({
      text: "!"
    });
    chrome.action.onClicked.removeListener(clickListener);
    chrome.action.onClicked.addListener(firstClickListener);
  }
  await setProxy();
}

function firstClickListener() {
  chrome.tabs.create({url: "options.html"});
  chrome.action.onClicked.removeListener(firstClickListener);
  chrome.action.onClicked.addListener(clickListener);
  setProxy();
}

async function startupListener() {
  await loadState();
  chrome.action.setIcon({path: "icon-19.png"});
  chrome.action.setBadgeBackgroundColor({color:[130, 130, 130, 180]});
  await setProxy();
}

loadState().then(() => {
  chrome.action.onClicked.addListener(clickListener);
  chrome.runtime.onMessage.addListener(requestListener);
  chrome.proxy.onProxyError.addListener(errorListener);
  chrome.proxy.settings.onChange.addListener(changeListener);
  chrome.runtime.onStartup.addListener(startupListener);
  chrome.runtime.onInstalled.addListener(installListener);
});
