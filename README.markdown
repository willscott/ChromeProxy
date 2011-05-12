Chrome Proxy
===========

This is a quick extension to toggle your chrome proxy settings from the toolbar.

It's useful if you need to work with an intercepting proxy, or if you want
to simulate taking your browser offline.


Since the proxy api for chrome extensions is still experimental, this extension
can't be added to the webstore yet.


Installation
===========

1. Make sure you're on the Development Channel of Chrome.

2. Navigate to chrome://flags. Turn on 'Experimental Extension APIs' (and restart chrome)

3. Navigate to chrome://extensions, and under the Development mode header, click 'Load unpacked extension...'.  Navigate and choose this folder.


Options
=======

There is a very bare-bones options page distributed with the extension.
On this page you can configure the proxy rule that is toggled on and off,
or choose whether the proxy toggle should modify settings for the entire
browser, or just for incognito mode.
