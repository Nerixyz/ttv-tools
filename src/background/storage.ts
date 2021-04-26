export async function getUsherData() {
    let {usherData} = await browser.storage.local.get('usherData');
    if(!usherData) {
        console.warn('No usherData pogo, replacing');
        usherData = {
        allow_source: "true",
        fast_bread: "true",
        player_backend: "mediaplayer",
        playlist_include_framerate: "true",
        reassignments_supported: "true",
        supported_codecs: "avc1",
        cdm: "wv",
        player_version: "1.3.0"
        }
    }

    return usherData;
}