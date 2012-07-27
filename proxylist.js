var proxyList = function(el) {
  this.element = el;
  this.proxies = [];
  this.init();
};
proxyList.prototype.init = function() {
  var that = this;
  this.element.addEventListener('focus', function() {
    that.element.setAttribute('hasElementFocus', true);
  }, false);
  this.element.addEventListener('blur', function(e) {
    that.element.removeAttribute('hasElementFocus');
    window.setTimeout(function() {
      for (var idx = 0; idx < that.proxies.length; idx++) {
        that.proxies[idx].blur();
      }
    }, 0);
  }, false);
};

proxyList.prototype.addComplex = function() {
  this.addByName("http://localhost:8080,http://localhost:8080,http://localhost:8080,http://localhost:8080");
};

proxyList.prototype.add = function() {
  this.addByName("http://localhost:8080");
};

proxyList.prototype.addByName = function(string) {
  var p = proxy.fromString(string);
  this.proxies.push(p);
  p.render(this.element);
  p.onRemove = function() {
    var idx = this.proxies.indexOf(p);
    this.proxies.splice(idx, 1);
  }.bind(this);
  p.onSelect = function() {
    for (var idx = 0; idx < this.proxies.length; idx++) {
      if (this.proxies[idx] != p) {
        this.proxies[idx].deselect();
      }
    }
  }.bind(this);
};

proxyList.prototype.select = function(string) {
  for (var i = 0; i < this.proxies.length; i++) {
    if (this.proxies[i].toString() == string) {
      this.proxies[i].element.setAttribute('selected', true);
      break;
    }
  }
};

proxyList.prototype.save = function() {
  var p = "";
  var ps = [];
  for (var i = 0; i < this.proxies.length; i++) {
    ps.push(this.proxies[i].toString());
    if (this.proxies[i].element.getAttribute('selected')) {
      p = this.proxies[i].toString();
    }
  }
  localStorage['proxies'] = JSON.stringify(ps);
  localStorage['proxy'] = p;
};

proxyList.getInstance = function(el) {
  var pl = new proxyList(el);
  if(localStorage['proxies'] != undefined) {
    var array = JSON.parse(localStorage['proxies']);
    for (var i = 0; i < array.length; i++) {
      pl.addByName(array[i]);
    }
    pl.select(localStorage['proxy']);
  }

  return pl;
};