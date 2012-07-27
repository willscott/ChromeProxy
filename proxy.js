var proxy = function() {};
proxy.prototype.render = function(container) {
  this.container = container;
  this.element = document.createElement('div');
  this.element.setAttribute('role', 'listitem');
  this.element.className = "deletable-item";
  
  var content = document.createElement('div');
  content.style.paddingLeft = "32px";
  
  var viewMode = document.createElement('div');
  viewMode.innerText = this.toString();
  viewMode.setAttribute('displaymode', 'static');
  viewMode.className = "title";
  content.appendChild(viewMode);

  var editMode = document.createElement('div');
  editMode.setAttribute('displaymode', 'edit');
  editMode.className = "editor";
  content.appendChild(editMode);

  this.schemeEditor = document.createElement('select');
  this.schemeEditor.add(new Option('HTTP'));
  this.schemeEditor.add(new Option('HTTPS'));
  this.schemeEditor.add(new Option('SOCKS 4'));
  this.schemeEditor.add(new Option('SOCKS 5'));
  this.schemeEditor.value = this.scheme;
  editMode.appendChild(this.schemeEditor);
  editMode.appendChild(document.createTextNode("://"));
  this.hostEditor = document.createElement('input');
  this.hostEditor.setAttribute("placeholder", "host");
  this.hostEditor.setAttribute("required", true);
  this.hostEditor.value = this.host;
  editMode.appendChild(this.hostEditor);
  editMode.appendChild(document.createTextNode(":"));
  this.portEditor = document.createElement('input');
  this.portEditor.setAttribute("pattern", "\\d{1,5}");
  this.portEditor.setAttribute("placeholder", "port");
  this.portEditor.setAttribute("size", 5);
  this.portEditor.value = this.port;
  editMode.appendChild(this.portEditor);
  this.element.appendChild(content);

  var removeButton = document.createElement('button');
  removeButton.setAttribute('tabindex', '-1');
  removeButton.className = "row-delete-button custom-appearance";
  this.element.appendChild(removeButton);
  
  var that = this;
  removeButton.addEventListener('click', function() {
    that.unrender();
  }, false);
  viewMode.addEventListener('click', function() {
    if(that.element.getAttribute('selected') == null) {
      that.onSelect();
      that.element.setAttribute('selected', true);
    } else {
      that.element.setAttribute('editing', true);
    }
  }, false);
  editMode.addEventListener('click', function() {
    that.element.removeAttribute('editing');
  }, false);
  
  var editors = [this.schemeEditor, this.hostEditor, this.portEditor];
  for (var idx in editors) {
    editors[idx].addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, false);
    editors[idx].addEventListener('change', function() {
      that.scheme = that.schemeEditor.value.toLowerCase();
      that.host = that.hostEditor.value;
      that.port = that.portEditor.value;
      if (!that.port) {
        if (that.scheme == "http") that.port = 80;
        else if (that.scheme == "https") that.port = 443;
        else if (that.scheme == "socks4") that.port = 1080;
        else if (that.scheme == "socks5") that.port = 1080;
      }
      that.element.getElementsByClassName('title')[0].innerText =
          that.toString();
    }, false);
    editors[idx].addEventListener('focus', function() {
      that.editFocus = true;
    },false);
    editors[idx].addEventListener('blur', function() {
      that.editFocus = false;
      if (!that.container.getAttribute('hasElementFocus')) {
        that.blur();
      }
    },false);
  }
  
  this.container.appendChild(this.element);
};

proxy.prototype.unrender = function() {
  if (this.container && this.element) {
    this.container.removeChild(this.element);
    this.onRemove();
  }
};

proxy.prototype.onRemove = function() {};
proxy.prototype.onSelect = function() {};

proxy.prototype.blur = function() {
  if (!this.editFocus) {
    this.element.removeAttribute('editing');
  }
};

proxy.prototype.deselect = function() {
    this.element.removeAttribute('selected');
    this.element.removeAttribute('editing');
};

proxy.prototype.toString = function() {
  return this.scheme + "://" + this.host + ":" + this.port;
};

proxy.fromString = function(string) {
  var parts = /(.*):\/\/(.*):(.*)/g.exec(string);
  var p = new proxy();
  p.scheme = parts[1];
  p.host = parts[2];
  p.port = parts[3];
  return p;
};