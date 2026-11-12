// macOS: eingehängte Vibewright-.dmg aus `hdiutil info` erkennen. Aufruf: node test/dmg.js
const assert = require('assert');
const { vibewrightDmgs } = require('../core');

const info = `framework       : 671
driver          : 10.15v671
================================================
image-path      : /Users/test/Downloads/Vibewright-0.3.1-mac-arm64.dmg
image-alias     : /Users/test/Downloads/Vibewright-0.3.1-mac-arm64.dmg
writeable       : FALSE
/dev/disk4\tGUID_partition_scheme\t
/dev/disk4s1\tApple_HFS\t/Volumes/Vibewright 0.3.1
================================================
image-path      : /Users/test/Downloads/Anderes.dmg
/dev/disk5s1\tApple_HFS\t/Volumes/Anderes
`;
assert.deepStrictEqual(vibewrightDmgs(info), [{ datei: '/Users/test/Downloads/Vibewright-0.3.1-mac-arm64.dmg', laufwerk: '/Volumes/Vibewright 0.3.1' }]);
assert.deepStrictEqual(vibewrightDmgs('framework : 1\n'), []);
console.log('dmg: ok');
