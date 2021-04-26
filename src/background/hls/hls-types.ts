import { ExtInfTag, ExtXDaterange, ExtXProgramDateTime, SegmentTag } from "./hls-segments-tags";

export interface HlsPlaylist {
    version: number;
    dateranges: ExtXDaterange[];
    tags: string[];
    segments: MediaSegment[];
    twitchPrefech: string[];
}

export interface MediaSegment {
    uri: string;
    attributes: SegmentTag<any>[] | null;
    segmentInfo: ExtInfTag;
    dateTime: ExtXProgramDateTime | null;
}
