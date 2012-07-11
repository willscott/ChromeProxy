function save() {
  document.getElementById('save').disabled='true';
  chrome.extension.sendRequest({'cmd':'start_save'}, real_save);
}

function real_save() {
  localStorage['incognito'] = document.getElementById('incognito').checked ?
    'checked' : 0;
  localStorage['off'] = document.getElementById('off').value;
  if (document.getElementById('srule').style.display == 'none') {
    localStorage['mode'] = 'custom';
  } else {
    localStorage['mode'] = 'single';
  }
  var fields = ['sp','hp', 'hsp', 'ftp', 'fbp'];
  for (k in fields) {
    var div = document.getElementById(fields[k]);
    var scheme = div.getElementsByTagName('select')[0].value;
    localStorage[fields[k] + '-scheme'] = scheme;

    var tb = div.getElementsByTagName('input');
    localStorage[fields[k] + '-host'] = tb[0].value;
    localStorage[fields[k] + '-port'] = tb[1].value;
  }
  chrome.extension.sendRequest({'cmd':'end_save'}, function(response) {
    document.getElementById('save').disabled='';
  });
}

function clear() {
  document.getElementById('clear').disabled='true';
  chrome.extension.sendRequest({'cmd':'clear'}, real_clear);
}

function real_clear() {
  document.getElementById('clear').disabled='';
}

function serv(el) {
  var rtype = el.id;
  var padder = document.createElement('span');
  var scheme = document.createElement('select');
  scheme.add(new Option('HTTP'));
  scheme.add(new Option('HTTPS'));
  scheme.add(new Option('SOCKS 4'));
  scheme.add(new Option('SOCKS 5'));
  padder.appendChild(scheme);
  scheme.value = localStorage[rtype + '-scheme'] || 'HTTP';

  var host = document.createElement('input');
  host.type = "text";
  host.value = localStorage[rtype + '-host'] || '127.0.0.1';
  padder.appendChild(host);

  var port = document.createElement('input');
  port.type = "text";
  port.size=6;
  port.value = localStorage[rtype + '-port'] || '8080';
  padder.appendChild(port);
  el.appendChild(padder);
}

function ab () {
  document.getElementById('srule').style.display='none';
  document.getElementById('mrule').style.display='block';
}

function ba () {
  document.getElementById('srule').style.display='block';
  document.getElementById('mrule').style.display='none';
}

window.onload = function() {
  document.getElementById('incognito').checked =
     (localStorage['incognito'] == 'checked');
  document.getElementById('off').value = localStorage['off'] || 'clear';
  document.getElementById('logo').src =
      chrome.extension.getURL('icon-128.png');
  document.getElementById('srulem').onclick=ab;
  serv(document.getElementById('sp'));
  document.getElementById('mrules').onclick=ba;
  serv(document.getElementById('hp'));
  serv(document.getElementById('hsp'));
  serv(document.getElementById('ftp'));
  serv(document.getElementById('fbp'));
  if (localStorage['mode'] == 'custom') {
    ab();
  }
  document.getElementById('save').addEventListener('click', save, false);
  document.getElementById('clear').addEventListener('click', clear, false);
}