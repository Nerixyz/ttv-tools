import { createM3U8Url, StreamTabs } from "./ad.replacement";
import { PlayerType } from "./gql.requests";
import { mergePlaylists } from "./hls/hls-merger";
import { parseMediaPlaylist } from "./hls/hls-parser";
import { writePlaylist } from "./hls/hls-writer";
import { getUsherData } from "./storage";

const playlistUrls = new Map<number, string>();

export async function mergePlayer(tabId: number, raw: string): Promise<string> {
    const stream = StreamTabs.get(tabId);
    if (!stream) {
        console.warn(`No stream in tab ${tabId}`);
        return raw;
    }

    if (!playlistUrls.has(tabId)) {
        // get playlist
        const m3u8Url = await createM3U8Url({ stream, usher: await getUsherData() }, PlayerType.PictureByPicture);

        const streamM3u8 = await fetch(m3u8Url).then(x => x.text());
        const [url] = streamM3u8.match(/^https:\/\/.+\.m3u8$/m) ?? [];

        if (!url) {
            console.warn('could not get stream url');
            return raw;
        }

        playlistUrls.set(tabId, url);
    }

    const refRaw = await fetch(playlistUrls.get(tabId)!).then(x => x.text());

    try {
        const rawP = parseMediaPlaylist(raw);
        // const refRawP = parseMediaPlaylist(refRaw);
        // const merged = mergePlaylists(rawP, refRawP);
        if (rawP.segments.find(x => x.dateTime && x.dateTime.date > new Date())?.segmentInfo?.title !== 'live') {
            return refRaw;
        } else {
            return raw;
        }
    } catch (e) {
        console.error(e);
        return raw;
    }
}
