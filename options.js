function save() {
  document.getElementById('save').setAttribute('disabled', 'true');
  chrome.runtime.sendMessage({'cmd': 'start_save'}, real_save);
}

function real_save() {
  window.proxyList.save();

  var incognito = document.getElementById('incognito').checked ? 'checked' : 0;
  var off = document.getElementById('off').value;
  localStorage['incognito'] = incognito;
  localStorage['off'] = off;
  chrome.storage.local.set({incognito: incognito, off: off});

  chrome.runtime.sendMessage({
    'cmd': 'end_save'
  }, function(response) {
    document.getElementById('save').removeAttribute('disabled');
  });
}

function loadUsage() {
  chrome.runtime.sendMessage({'cmd': 'get_statistics'}, function (usage) {
    if (usage.countedTime !== 0) {
      document.getElementById("unknownUsage").style.width = "0%";
      document.getElementById("localUsage").style.width =
          ((100.0 * usage.localUsage) / usage.countedTime) + "%";
      document.getElementById("remoteUsage").style.width =
          ((100.0 * usage.remoteUsage) / usage.countedTime) + "%";
    }
    if (usage.optout) {
      document.getElementById('usageoptout').checked = true;
    }
  });
}

function updateUsage() {
  chrome.runtime.sendMessage({
    'cmd': 'set_statistics',
    'value': !document.getElementById('usageoptout').checked
  }, function(usage) {
    if (usage.countedTime != 0) {
      document.getElementById("unknownUsage").style.width = "0%";
      document.getElementById("localUsage").style.width =
          ((100.0 * usage.localUsage) / usage.countedTime) + "%";
      document.getElementById("remoteUsage").style.width =
          ((100.0 * usage.remoteUsage) / usage.countedTime) + "%";
    } else {
      document.getElementById("unknownUsage").style.width = "100%";
      document.getElementById("localUsage").style.width = "0%";
      document.getElementById("remoteUsage").style.width = "0%";
    }
  });
}

function clear() {
  document.getElementById('clear').setAttribute('disabled', 'true');
  chrome.runtime.sendMessage({'cmd': 'clear'}, real_clear);
}

function real_clear() {
  document.getElementById('clear').removeAttribute('disabled');
}

function cleanscheme(s) {
  s = s.toLowerCase();
  if (s === "socks 4") s = "socks4";
  if (s === "socks 5") s = "socks5";
  return s;
};

function setup() {
  var proxy = "http://localhost:8080";
  localStorage['proxy'] = proxy;
  localStorage['proxies'] = JSON.stringify([proxy]);
  chrome.storage.local.set({proxy: proxy, proxies: JSON.stringify([proxy])});
};

function migrateFromMV2() {
  chrome.storage.local.get('migrated', function(r) {
    if (r.migrated) return;
    var data = {};
    if (localStorage['proxy']) data.proxy = localStorage['proxy'];
    if (localStorage['proxies']) data.proxies = localStorage['proxies'];
    if (localStorage['incognito']) data.incognito = localStorage['incognito'];
    if (localStorage['off']) data.off = localStorage['off'];
    if (localStorage['state']) data.state = localStorage['state'];
    if (localStorage['stats']) data.stats = localStorage['stats'];
    if (localStorage['collectStats']) data.collectStats = localStorage['collectStats'];
    data.migrated = true;
    chrome.storage.local.set(data, function() {
      chrome.runtime.sendMessage({cmd: 'migrated'});
    });
  });
}

window.onload = function() {
  migrateFromMV2();
  if(!localStorage['proxy']) {
    setup();
  }
  loadUsage();
  
  var i18nOptions = {
    "optOffValues": [
      ["clear", "optOffValueClear"],
      ["direct", "optOffValueDirect"],
      ["system", "optOffValueSystem"],
      ["auto_detect", "optOffValueAuto"]
    ],
    "optDomModeValues": [
      ["include", "optDomModeValueInclude"],
      ["exclude", "optDomModeValueExclude"]
    ]
  };
  
  i18nTemplate.process(document, {
    getString: function(key) {
      return chrome.i18n.getMessage(key);
    },
    getValue: function(key) {
      var options = i18nOptions[key];
      var outOptions = [];
      options.forEach(function(option) {
        if (typeof option == 'string') {
          outOptions.push(chrome.i18n.getMessage(option));
        } else {
          outOptions.push([option[0], chrome.i18n.getMessage(option[1])]);
        }
      });
      return outOptions;
    }
  });

  window.proxyList = proxyList.getInstance(document.getElementById('proxy-list'));
  document.getElementById('addButton').addEventListener('click', function (e) {
    if (e.altKey) {
      window.proxyList.addComplex();
    } else {
      window.proxyList.add();
    }
  }, false);

  window.domainSettings = domainSettings.getInstance(document.getElementById('domainrules'));
  window.domainSettings.toggle(document.getElementById('domButton'));
  
  window.proxyList.onSelect = function (p) {
    window.proxyList.save();
    window.domainSettings.refresh(p);
  }
  
  window.domainSettings.onChange = function (p) {
    var proxy = window.proxyList.getValue();
    if (p && proxy) {
      proxy.update(p);
      window.proxyList.save();
    }
  }

  var initial = window.proxyList.getValue();
  var val = initial ? initial.toString() : '';
  window.domainSettings.refresh(val);

  document.getElementById('incognito').checked =
      (localStorage['incognito'] === 'checked');
  document.getElementById('off').value = localStorage['off'] || 'clear';
  document.getElementById('logo').src =
      chrome.runtime.getURL('icon-128.png');

  document.getElementById('domainrules').style.display = localStorage['domMode'] || 'none';
  document.getElementById('save').addEventListener('click', save, false);
  document.getElementById('clear').addEventListener('click', clear, false);
  document.getElementById('usageoptout').addEventListener('change', updateUsage, false);
};
