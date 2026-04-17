const fs = require('fs');
const path = require('path');

const glbPath = path.join(__dirname, '../public/models/TrophyModel/trophy_model.glb');

if (!fs.existsSync(glbPath)) {
    console.error('GLB not found at', glbPath);
    process.exit(1);
}

const buffer = fs.readFileSync(glbPath);

// GLB Header: magic (4), version (4), length (4)
// Chunk Header: chunkLength (4), chunkType (4)
const jsonChunkLength = buffer.readUInt32LE(12);
const jsonChunkType = buffer.readUInt32LE(16);

if (jsonChunkType !== 0x4E4F534A) {
    console.error('First chunk is not JSON');
    process.exit(1);
}

const jsonBuffer = buffer.slice(20, 20 + jsonChunkLength);
const json = JSON.parse(jsonBuffer.toString());

console.log('--- GLTF JSON MESHES ---');
if (json.meshes) {
    json.meshes.forEach((mesh, i) => {
        console.log(`Mesh ${i}: ${mesh.name}`);
        if (mesh.primitives) {
            mesh.primitives.forEach((prim, j) => {
                // If the mesh has no name, we look at the node names
            });
        }
    });
}

console.log('--- GLTF JSON NODES ---');
if (json.nodes) {
    json.nodes.forEach((node, i) => {
        console.log(`Node ${i}: ${node.name} (Mesh: ${node.mesh !== undefined ? node.mesh : 'None'})`);
    });
}
