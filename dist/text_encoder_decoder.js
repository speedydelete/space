
if (!window.TextEncoder) {
    window.TextEncoder = function() {};
    TextEncoder.prototype.encode = function(str) {
        var out = [];
        for (var i = 0; i < str.length; i++) {
            var code = str.charCodeAt(i);
            if (code < 0x80) {
                out.push(code);
            } else if (code < 0x800) {
                out.push(0xc0 | (code >> 6));
                out.push(0x80 | (code & 0x3f));
            } else if (code < 0xd800 || code >= 0xe000) {
                out.push(0xe0 | (code >> 12));
                out.push(0x80 | ((code >> 6) & 0x3f));
                out.push(0x80 | (code & 0x3f));
            } else {
                i++;
                if (i >= str.length) {
                    throw new Error('Malformed string');
                }
                code = 0x10000 + (((code & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
                out.push(0xf0 | (code >> 18));
                out.push(0x80 | ((code >> 12) & 0x3f));
                out.push(0x80 | ((code >> 6) & 0x3f));
                out.push(0x80 | (code & 0x3f));
            }
        }
        return new Uint8Array(out);
    }
}

if (!window.TextDecoder) {
    window.TextDecoder = function() {};
    TextDecoder.prototype.decode = function(bytes) {
        var str = '';
        var i = 0;
        while (i < bytes.length) {
            var byte1 = bytes[i++];
            if (byte1 < 0x80) {
                str += String.fromCharCode(byte1);
            } else if (byte1 >= 0xc0 && byte1 < 0xe0) {
                var byte2 = bytes[i++];
                str += String.fromCharCode(((byte1 & 0x1f) << 6) | (byte2 & 0x3f));
            } else if (byte1 >= 0xe0 && byte1 < 0xf0) {
                var byte2 = bytes[i++];
                var byte3 = bytes[i++];
                str += String.fromCharCode(((byte1 & 0x0f) << 12) | ((byte2 & 0x3f) << 6) | (byte3 & 0x3f));
            } else if (byte1 >= 0xf0) {
                var byte2 = bytes[i++];
                var byte3 = bytes[i++];
                var byte4 = bytes[i++];
                var codepoint = (((byte1 & 0x07) << 18) | ((byte2 & 0x3f) << 12) | ((byte3 & 0x3f) << 6) | (byte4 & 0x3f)) - 0x10000;
                str += String.fromCharCode(0xd800 + (codepoint >> 10), 0xdc00 + (codepoint & 0x3ff));
            }
        }
        return str;
    };
}
