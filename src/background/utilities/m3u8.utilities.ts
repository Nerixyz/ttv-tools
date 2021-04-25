/**
 * Parses a whole m3u8 file into an object.
 * @param content A whole m3u8 file.
 * @returns All 'EXT-X-DATERANGE' tags put into an object (key = CLASS)
 */
export function parseM3u8<T extends Record<string, Record<string, any>>>(content: string): T {
    const data = [];
    const lines = content.split('\n').filter(Boolean);
    let line;
    while((line = lines.pop())) {
        line = line.substring(1);
        const colIdx = line.indexOf(':');
        if(colIdx === -1) {
            continue;
        }
        const key = line.substring(0, colIdx);
        const value = line.substring(colIdx + 1);
        if(key === 'EXT-X-DATERANGE') {
            data.push(parseAttributes(value));
        }
    }
    return Object.fromEntries(data.map(x => [x.CLASS, x]));
}

/**
 * 
 * @param str The attribute string essentially: `'CLASS="twitch-stitched-ad",DURATION=15.187,...'`
 * @returns The object-version: `{ CLASS: 'twitch-stitched-ad', DURATION: 15.187 }`
 */
export function parseAttributes<T extends Record<string, any> = Record<string, any>>(str: string): T {
    return Object.fromEntries(
      str
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
