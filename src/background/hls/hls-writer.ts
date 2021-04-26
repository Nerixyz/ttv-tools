import { SegmentTag } from "./hls-segments-tags";
import { HlsPlaylist, MediaSegment } from "./hls-types";

export function writePlaylist(playlist: HlsPlaylist): string {
    const lines: string[] = [];

    const pushTag = (tag: SegmentTag<any> | null | undefined) => {
        if (!tag) return;
        const attributes = tag.attributeString;
        lines.push(`#${tag.TAGNAME}${attributes ? ':' + attributes : ''}`);
    }

    lines.push('#EXTM3U');
    lines.push(`#EXT-X-VERSION:${playlist.version}`);
    lines.push(...playlist.tags);

    let nextDaterange = 0;
    const peekDaterange = () => playlist.dateranges[nextDaterange];
    const consumeDaterange = () => playlist.dateranges[nextDaterange++];
    const checkAddDateranges = (segment: MediaSegment) => {
        while (peekDaterange()?.start <= (segment.dateTime?.date ?? new Date() /* then always define before */)) {
            pushTag(consumeDaterange());
        }
    };

    for (const segment of playlist.segments) {
        checkAddDateranges(segment);

        if (segment.attributes) {
            for (const attribute of segment.attributes) {
                pushTag(attribute);
            }
        }
        
        pushTag(segment.dateTime);
        pushTag(segment.segmentInfo);
        lines.push(segment.uri);
    }

    lines.push(...playlist.twitchPrefech);

    return lines.join('\n');
}

export function writeAttributes(attr: Record<string, any>) {
    return Object
        .entries(attr)
        .map(([k, v]) =>
            [k,
                typeof v === "number"
                    ? v.toString()
                    : v === 'YES'
                        ? v
                        : `"${v}"`
            ].join('='))
        .join(',');
}