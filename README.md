# ttv-tools

This Firefox extension bundles common function when watching twitch. It only works with Firefox.
These functions include:

* Ad skipping (skip ads and reload the player)
* Minimal latency (automatically reload or speed up the stream if you're too far behind)
* Reload on error (if the player errors, reload it)

# Installing

Downloads can be found on the [releases-page](https://github.com/Nerixyz/ttv-tools/releases).

# Set-Up

You'll need to build the extension for yourself.
* Install the dependencies: `npm i`
* Build the extension: `npm run build`

* Sign the extension: `npm run sign` (`WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET` have to be set. More information can be found [here](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#web-ext-sign))
