Chrome Proxy
===========

This is a quick extension to toggle your chrome proxy settings from the toolbar.

It's useful if you need to work with an intercepting proxy, or if you want
to simulate taking your browser offline.


Since the proxy api for chrome extensions is still experimental, this extension
can't be added to the webstore yet.


Installation
===========

1. Navigate to chrome://flags. Turn on 'Experimental Extension APIs' (and restart chrome)
  Note: this step is no longer needed on beta and dev channels.

2. Navigate to chrome://extensions, and under the Development mode header, click 'Load unpacked extension...'.  Navigate and choose this folder.


Options
=======

The options page will let you configure the the value and scope for the toggle.
For development of offline applications, it is often useful to only have your incognito windows be
proxied, and it is also potentially useful to force the 'off' mode of the proxy to mean that
you want to make direct connections, even if your network or system uses a proxy by default.
