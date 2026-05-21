const fs = require('fs');
const models = JSON.parse(fs.readFileSync('models_dump.json', 'utf8'));

console.log("Found", models.length, "brands.");
for (const b of models) {
    console.log(`\nBrand: ${b.brandName} (${b.brand}) - ${b.models.length} models`);
    if (b.models.length > 0) {
        console.log("Sample model shape & camera configuration:");
        const m = b.models[0];
        console.log(`  Name: ${m.name}`);
        console.log(`  Shape: ${JSON.stringify(m.shape)}`);
        console.log(`  Camera: ${JSON.stringify(m.camera)}`);
        
        // Let's also check if all models have identical shape and camera dimensions, which would indicate placeholders.
        const firstShape = JSON.stringify(m.shape);
        const firstCamera = JSON.stringify(m.camera);
        let allSame = true;
        for (let i = 1; i < b.models.length; i++) {
            if (JSON.stringify(b.models[i].shape) !== firstShape || JSON.stringify(b.models[i].camera) !== firstCamera) {
                allSame = false;
                break;
            }
        }
        console.log(`  Are all models in this brand configured identically? ${allSame}`);
    }
}
