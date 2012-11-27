function save() {
  document.getElementById('save').setAttribute('disabled', 'true');
  chrome.extension.sendMessage({'cmd':'start_save'}, real_save);
}

function real_save() {
  window.proxyList.save();

  localStorage['incognito'] = document.getElementById('incognito').checked ?
    'checked' : 0;
  localStorage['off'] = document.getElementById('off').value;

  chrome.extension.sendMessage({
    'cmd':'end_save'
  }, function(response) {
    document.getElementById('save').removeAttribute('disabled');
  });
}

function clear() {
  document.getElementById('clear').setAttribute('disabled', 'true');
  chrome.extension.sendMessage({'cmd':'clear'}, real_clear);
}

function real_clear() {
  document.getElementById('clear').removeAttribute('disabled');
}

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

window.onload = function() {
  if (!localStorage['proxy'] && localStorage['mode'] == 'custom' ||
      localStorage['mode'] == 'single') {
    migrate();
  } else if(!localStorage['proxy']) {
    setup();
  }
  
  var i18nOptions = {
    "optOffValues": [
      ["clear", "optOffValueClear"],
      ["direct", "optOffValueDirect"],
      ["system", "optOffValueSystem"],
      ["auto_detect", "optOffValueAuto"]
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
  document.getElementById('addButton').addEventListener('click', function(e) {
    if (e.altKey) {
      window.proxyList.addComplex();
    } else {
      window.proxyList.add();
    }
  }, false);

  document.getElementById('incognito').checked =
     (localStorage['incognito'] == 'checked');
  document.getElementById('off').value = localStorage['off'] || 'clear';
  document.getElementById('logo').src =
      chrome.extension.getURL('icon-128.png');

  document.getElementById('save').addEventListener('click', save, false);
  document.getElementById('clear').addEventListener('click', clear, false);
};