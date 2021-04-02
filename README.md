# ttv-tools

This Firefox extension bundles common functionalities enhancing the Twitch experience. It only works with Firefox (due to Safari and Chrome not supporting [`browser.webRequest.filterResponseData`](https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/filterResponseData)).
These functions include:

* Ad skipping (skip ads and reload the player)
* Minimal latency (automatically reload or speed up the stream if you're too far behind)
* Reload on error (if the player errors, reload it)

# Installing

This extension _isn't_ on `addons.mozilla.org`, you'll need to download it yourself.
Downloads can be found on the [releases-page](https://github.com/Nerixyz/ttv-tools/releases).

# TODO

* Settings-Panel on the player
* Add tests for ad-skipping/-matching
* Provide better feedback
* Possibly parse playlist

# Set-Up

You may build the extension for yourself.
* Install the dependencies: `npm i`
* Build the extension: `npm run build`

* Sign the extension: `npm run sign` (`WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET` have to be set. More information can be found [here](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#web-ext-sign))
