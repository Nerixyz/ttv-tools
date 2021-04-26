import { ExtInfTag, ExtXDaterange, ExtXDiscontinuity, ExtXProgramDateTime, SegmentTag } from "./hls-segments-tags";
import { HlsPlaylist } from "./hls-types";

/**
 * Note: This isn't a full hls parser. It only parses media playlists.
 * 
 * @param raw The playlist file
 */
export function parseMediaPlaylist(raw: string): HlsPlaylist {
    const lines = raw
        .split('\n')
        // ignore empty lines and comments
        .filter(line => line && line.match(/^#EXT|[^#]/));

    const isExtM3u = lines.shift() === '#EXTM3U';
    if (!isExtM3u) throw new Error('Invalid playlist');

    const playlist: HlsPlaylist = {
        version: 1,
        dateranges: [],
        tags: [],
        segments: [],
        twitchPrefech: [],
    };

    let segmentAttributes: Array<SegmentTag<any>> | null = null;
    let segmentInfo: ExtInfTag | null = null;
    let segmentDateTime: ExtXProgramDateTime | null = null;

    const pushSegmentAttr = (attr: SegmentTag<any>) => (segmentAttributes ??= []).push(attr);
    const flushAttr = () => {
        const attr = segmentAttributes;
        segmentAttributes = null;
        return attr;
    };

    for (const next of lines) {
        if (!next) continue;

        if (next?.startsWith('#')) {
            const match = next.match(/^#(?<tag>[\w-]+):?(?<attributes>.*)$/)?.groups;
            if (!match) {
                console.warn(`Invalid tag: ${next}`);
                continue;
            }
            const { tag, attributes } = match;

            switch (tag) {
                case 'EXT-X-VERSION': {
                    playlist.version = Number(attributes);
                    continue;
                }
                case 'EXTINF': {
                    segmentInfo = new ExtInfTag(attributes);
                    continue;
                }
                case 'EXT-X-PROGRAM-DATE-TIME': {
                    segmentDateTime = new ExtXProgramDateTime(attributes);
                    continue;
                }
                case 'EXT-X-DATERANGE': {
                    playlist.dateranges.push(new ExtXDaterange(attributes));
                    continue;
                }
                case 'EXT-X-DISCONTINUITY': {
                    pushSegmentAttr(new ExtXDiscontinuity(attributes));
                    continue;
                }
                case 'EXT-X-TWITCH-PREFETCH': {
                    playlist.twitchPrefech.push(next);
                    continue;
                }
                default: {
                    playlist.tags.push(next);
                    continue;
                }
            }
        } else {
            // a URI

            if (!segmentInfo) throw new Error('invalid playlist');

            const attr = flushAttr();
            playlist.segments.push({ uri: next, attributes: attr ?? [], segmentInfo, dateTime: segmentDateTime });
        }
    }

    return playlist;
}

/**
 * 
 * @param raw The attribute string - essentially: `'CLASS="twitch-stitched-ad",DURATION=15.187,...'`
 * @returns The object-version: `{ CLASS: 'twitch-stitched-ad', DURATION: 15.187 }`
 */
export function parseAttributeList<T extends Record<string, any> = Record<string, any>>(raw: string): T {
    return Object.fromEntries(
        raw
          .split(/(?:^|,)([^=]*=(?:"[^"]*"|[^,]*))/)
          .filter(Boolean)
          .map(x => {
              const idx = x.indexOf('=');
              const key = x.substring(0, idx);
              const value = x.substring(idx + 1);
              const num = Number(value);
              return [key, Number.isNaN(num) ? value.startsWith('"') ? JSON.parse(value) : value : num]
          })) as T;
}