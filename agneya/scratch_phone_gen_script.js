const fs = require('fs');

const rawText = `Galaxy M17e 5G
Galaxy S26 Plus 5G
Galaxy S26 5G
Galaxy S26 Ultra 5G
Galaxy F70e 5G
Galaxy A17 5G
Galaxy A26 5G
Galaxy A56 5G
Galaxy A36 5G
Galaxy A16 5G
Galaxy A06
Galaxy A35 5G
Galaxy A55 5G
Galaxy A15 5G
Galaxy A25 5G
Galaxy A05
Galaxy A05s
Galaxy A34 5G
Galaxy A54 5G
Galaxy A14 4G
Galaxy A14 5G
Galaxy A04e
Galaxy A04s
Galaxy A04
Galaxy A73 5G
Galaxy A33 5G
Galaxy A23
Galaxy A53 5G
Galaxy A13
Galaxy A03
Galaxy A03 Core
Galaxy A03s
Galaxy A52s 5G
Galaxy A22 4G
Galaxy A22 5G
Galaxy A52 4G
Galaxy A72
Galaxy A71 4G
Galaxy A12
Galaxy A21
Galaxy A21s
Galaxy A31
Galaxy A51
Galaxy A70s
Galaxy A20s
Galaxy A30s
Galaxy A50s
Galaxy A10s
Galaxy A70
Galaxy A20
Galaxy A10
Galaxy A30
Galaxy A50
Galaxy F70e 5G
Galaxy F07
Galaxy F17 5G
Galaxy F36 5G
Galaxy F56 5G
Galaxy F06
Galaxy F16 5G
Galaxy F05
Galaxy F55 5G
Galaxy F15 5G
Galaxy F34 5G
Galaxy F54 5G
Galaxy F14 5G
Galaxy F04
Galaxy F13
Galaxy F23 5G
Galaxy F42 5G
Galaxy F22
Galaxy F12
Galaxy F02s
Galaxy F41
Galaxy J4 Plus
Galaxy J6
Galaxy J7 Pro
Galaxy M17e 5G
Galaxy M17 5G
Galaxy M07
Galaxy M36 5G
Galaxy M56 5G
Galaxy M06
Galaxy M16 5G
Galaxy M55s 5G
Galaxy M05
Galaxy M35 5G
Galaxy M15 5G
Galaxy M55 5G
Galaxy M34 5G
Galaxy M14 4G
Galaxy M14 5G
Galaxy M04
Galaxy M13 5G
Galaxy M13 4G
Galaxy M53 5G
Galaxy M33 5G
Galaxy M52 5G
Galaxy M32 5G
Galaxy M32 4G
Galaxy M10s
Galaxy M21 2021
Galaxy M32 4G Prime Edition
Galaxy M42 5G
Galaxy M12
Galaxy M02
Galaxy M02s
Galaxy M31 Prime Edition
Galaxy M51
Galaxy M31s
Galaxy M01 Core
Galaxy M01s
Galaxy M01
Galaxy M11
Galaxy M21
Galaxy M31
Galaxy M30s
Galaxy M40
Galaxy M20
Galaxy M30
Galaxy Note 20 Ultra
Galaxy Note 10 Lite
Galaxy Note 10 Plus
Galaxy Note 10
Galaxy Note 9
Galaxy Note 8
Galaxy S26 Plus 5G
Galaxy S26 5G
Galaxy S26 Ultra 5G
Galaxy S25 FE 5G
Galaxy S25 Edge 5G
Galaxy S25 Plus 5G
Galaxy S25 5G
Galaxy S25 Ultra 5G
Galaxy S24 Fe 5G
Galaxy S24 5G
Galaxy S24 Plus 5G
Galaxy S24 Ultra 5G
Galaxy S23 FE 5G
Galaxy S23 5G
Galaxy S23 Plus 5G
Galaxy S23 Ultra 5G
Galaxy S22 5G
Galaxy S22 Plus 5G
Galaxy S22 Ultra 5G
Galaxy S21 FE 5G
Galaxy S20 FE
Galaxy S20 FE 5G
Galaxy S21
Galaxy S21 Plus
Galaxy S21 Ultra
Galaxy S20 Plus
Galaxy S20
Galaxy S20 Ultra
Galaxy S10 Lite
Galaxy S10 Plus
Galaxy S10E
Galaxy S10
Galaxy S9
Galaxy S9 Plus`;

const uniquePhones = [...new Set(rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0))];

const result = uniquePhones.map(name => {
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return `  { id: "${id}", brand: "samsung", name: "${name}", shape: { width: 310, height: 640, rx: 35 }, camera: { type: 'rounded-rect', x: 20, y: 20, width: 45, height: 110, rx: 20 }, price: 399 },`;
}).join('\n');

fs.writeFileSync('e:/AGNEYAw/agneya/scratch_phone_gen.js', result);
console.log("Done");
