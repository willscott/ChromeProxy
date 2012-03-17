Chrome Proxy
===========

This extension provides a toggle for your chrome proxy settings.


It's useful if you need to work with an intercepting proxy, or if you want
to simulate taking your browser offline.


Since the proxy api for chrome extensions is still experimental, this extension
can't be added to the webstore yet.


Installation
===========

For user installation, the best way to install the extension is from the chrome
web store.  The web store will provide you with automatic updates, and won't require
enabling non-webstore extensions.

1. Navigate to chrome://flags. Turn on 'Experimental Extension APIs' (and restart chrome)
  Note: this step is no longer needed on beta and dev channels.

2. Navigate to chrome://extensions, and under the Development mode header, click 'Load unpacked extension...'.  Navigate and choose this folder.


Options
=======

The options page will let you configure the the value and scope for the toggle.
For development of offline applications, it is often useful to only have your incognito windows be
proxied, and it is also potentially useful to force the 'off' mode of the proxy to mean that
you want to make direct connections, even if your network or system uses a proxy by default.
