# ttv-tools

This Firefox extension bundles common function when watching twitch. It only works with Firefox.
These functions include:

* Ad replacement (you can build this extension and replace ads with a custom video)
* Ad skipping (skip ads and reload the player)
* Minimal latency (automatically reload or speed up the stream if you're too far behind)
* Reload on error (if the player errors, reload it)

# Set-Up

You'll need to build the extension for yourself.
* Install the dependencies: `npm i`
* (optional) Get the video: `powershell download-video.ps1 <video-url>`
* Build the extension: `npm run build`

* Sign the extension: `npm run sign` (`WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET` have to be set. More information can be found [here](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#web-ext-sign))
