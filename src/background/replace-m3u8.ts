import { firstDateRange, firstDateRangeIdx } from './m3u8-utils';
import { DateRangeClass } from '../types';

export class ReplaceM3U8Task {

    constructor(protected segments: string[] = []) {}

    replaceWithVideo(target: string): string {
        if(!this.segments.length) return target;

        const seq = Number(target.match(/#EXT-X-MEDIA-SEQUENCE:(\d+)/)?.[1] ?? '0');

        const info = intoSegmentInfo(target);
        const ad = info.segments.find(x => x.type === 'ad');
        if(!ad) return info.build();

        // remove all segments (one line starting with 'https://')
        ad.segment = ad.segment.split(/\nhttps:\/\/[^\n]+/).reduce(
            (acc, part, idx) => part.includes('#EXTINF') ?  `${acc}\n${part}\n${this.segments[(idx + seq) % this.segments.length]}` :  `${acc}\n${part}`, '');

        return info.build();
    }
}

function intoSegmentInfo(target: string) {
    const header = target.substring(0, firstDateRangeIdx(target) -1);
    const body = target.substring(firstDateRangeIdx(target));
    const [firstSegment, ...segments] = body.split('#EXT-X-DISCONTINUITY\n');
    if(!firstSegment.includes('#EXTINF')) segments[0] = `${firstSegment}\n#EXT-X-DISCONTINUITY\n${segments[0]}`;
    else segments.unshift(firstSegment);

    const processedSegments: Array<{type: 'ad' | 'source', segment: string}> = segments.map(segment => {
        if([DateRangeClass.StitchedAd || DateRangeClass.AdQuartile].includes(firstDateRange(segment)))
            return {
                type: 'ad',
                segment
            };
        else return {
            type: 'source',
            segment,
        };
    });

    return {
        header,
        segments: processedSegments,
        build(): string {
            return `${this.header}\n${this.segments.map(s => s.segment).join('#EXT-X-DISCONTINUITY\n')}`;
        },
    };
}

export async function getSegmentsFromFile(filePath: string, asExtension = true) {
    try {
        const content = await fetch(filePath).then(x => x.text());
        const lines = content.split('#EXTINF').splice(1).map(x => x.split('\n')[1]).filter(Boolean);
        return asExtension ? lines.map(line => browser.runtime.getURL(`videos/${ line }`)) : lines;
    } catch {
        // return no segments
        return [];
    }
}
