import { parseAttributeList } from "./hls-parser";
import { writeAttributes } from "./hls-writer";

export abstract class SegmentTag<Attr = undefined> {
    abstract readonly TAGNAME: string;

    protected readonly attributes: Attr;

    constructor(rawAttributes: string) {
        this.attributes = this.parseAttributes(rawAttributes);
    }

    parseAttributes(raw: string): Attr {
        // the implementation has to override it
        return undefined as any as Attr;
    }

    get attributeString(): string | null {
        return null;
    }

    [Symbol.toStringTag]() {
        const attr = this.attributeString;
        return `#${this.TAGNAME}${attr ? ':' + attr : ''}`;
    }
}

export class ExtInfTag extends SegmentTag<[number, string?]> {
    TAGNAME = 'EXTINF';

    get duration() {
        return this.attributes[0];
    }

    get title() {
        return this.attributes[1];
    }

    get attributeString() {
        return `${this.duration.toFixed(3)}${this.title ? ',' + this.title : ''}`;
    }

    parseAttributes(raw: string): [number, string?] {
        const firstIdx = raw.indexOf(',');
        const duration = Number(raw.substring(0, firstIdx));
        const title = raw.substring(firstIdx + 1);

        return [duration, title || undefined];
    }
}

export class ExtXDiscontinuity extends SegmentTag {
    TAGNAME = 'EXT-X-DISCONTINUITY';
}

export class ExtXProgramDateTime extends SegmentTag<Date> {
    TAGNAME = 'EXT-X-PROGRAM-DATE-TIME';

    get attributeString() {
        return this.attributes.toISOString();
    }

    get date() {
        return this.attributes;
    }

    parseAttributes(raw: string) {
        return new Date(raw);
    }
}
export type ExtXDaterangeAttributes = {
    ID: string;
    CLASS?: string;
    'START-DATE': string;
    'END-DATE'?: string;
    // DURATION?: number; -- not on twitch
    // 'PLANNED-DURATION'?: number;
    'END-ON-NEXT'?: 'YES'

    [x: string]: any
}
export class ExtXDaterange extends SegmentTag<ExtXDaterangeAttributes> {
    TAGNAME = 'EXT-X-DATERANGE';

    get id() {
        return this.attributes.ID;
    }

    get class() {
        return this.attributes.CLASS;
    }

    get start() {
        return new Date(this.attributes["START-DATE"]);
    }

    get end() {
        return this.attributes["END-DATE"] ? new Date(this.attributes["END-DATE"]) : undefined;
    }

    get endOnNext() {
        return !!this.attributes["END-ON-NEXT"];
    }

    get attributeString() {
        return writeAttributes(this.attributes);
    }

    parseAttributes(raw: string) {
        return parseAttributeList<ExtXDaterangeAttributes>(raw);
    }
}