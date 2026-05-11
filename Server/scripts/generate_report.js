const fs = require('fs');
const data = require('./models_dump.json');

const defaultCamera = JSON.stringify({
  type: "rounded-rect",
  lenses: [],
  x: 20,
  y: 20,
  width: 45,
  height: 110,
  rx: 20
});

const defaultShape = JSON.stringify({
  width: 310,
  height: 640,
  rx: 35
});

let md = '# Report of Models with Default Layouts\n\n';
md += 'Many phone models in the database have been assigned a default camera layout or body shape. Below is the list grouped by brand:\n\n';

let totalCameraWrong = 0;
let totalShapeWrong = 0;

data.forEach(b => {
  const brandName = b.brandName || b.brand;
  const modelsWithDefaultCamera = b.models.filter(m => JSON.stringify(m.camera) === defaultCamera);
  const modelsWithDefaultShape = b.models.filter(m => JSON.stringify(m.shape) === defaultShape);
  
  if (modelsWithDefaultCamera.length > 0 || modelsWithDefaultShape.length > 0) {
    md += `## ${brandName}\n`;
    
    if (modelsWithDefaultCamera.length > 0) {
      md += `### Default Camera (${modelsWithDefaultCamera.length} models)\n`;
      md += modelsWithDefaultCamera.map(m => `- ${m.name}`).join('\n') + '\n\n';
      totalCameraWrong += modelsWithDefaultCamera.length;
    }
    
    if (modelsWithDefaultShape.length > 0) {
      md += `### Default Shape (${modelsWithDefaultShape.length} models)\n`;
      // Instead of listing all shape models, we can just say how many unless we want the full list
      md += modelsWithDefaultShape.map(m => `- ${m.name}`).join('\n') + '\n\n';
      totalShapeWrong += modelsWithDefaultShape.length;
    }
  }
});

md += `\n**Total models with default camera layout:** ${totalCameraWrong}\n`;
md += `**Total models with default shape:** ${totalShapeWrong}\n`;

fs.writeFileSync('wrong_models_report.md', md);
console.log('Report generated at wrong_models_report.md');
