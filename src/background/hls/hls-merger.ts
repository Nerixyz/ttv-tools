import { HlsPlaylist, MediaSegment } from "./hls-types";

/**
 * Note: this replaces segments in the target playlist
 * @param target The playlist to be merged into
 * @param reference The playlist which provides live segments
 * @returns The "new" playlist
 */
export function mergePlaylists(target: HlsPlaylist, reference: HlsPlaylist) {
    const findRef = (segment: MediaSegment) => {
        if (!segment.dateTime) return;
        return reference.segments.find(ref => ref.dateTime && ref.dateTime!.date >= segment.dateTime!.date);
    }

    for (const segment of target.segments) {
        if (segment.segmentInfo.title !== 'live') {
            const replacement = findRef(segment);
            if (replacement) {
                segment.uri = replacement.uri;
                segment.dateTime = replacement.dateTime;
            }
        }
    }

    return target;
}