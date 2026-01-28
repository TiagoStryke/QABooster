const fs = require('fs');
const { createCanvas } = require('canvas');

const size = 1024;
const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');

// Background gradiente azul
const gradient = ctx.createLinearGradient(0, 0, 0, size);
gradient.addColorStop(0, '#3b82f6');
gradient.addColorStop(1, '#1e40af');
ctx.fillStyle = gradient;

// Desenha fundo com cantos arredondados
const radius = 180;
ctx.beginPath();
ctx.moveTo(radius, 0);
ctx.lineTo(size - radius, 0);
ctx.arcTo(size, 0, size, radius, radius);
ctx.lineTo(size, size - radius);
ctx.arcTo(size, size, size - radius, size, radius);
ctx.lineTo(radius, size);
ctx.arcTo(0, size, 0, size - radius, radius);
ctx.lineTo(0, radius);
ctx.arcTo(0, 0, radius, 0, radius);
ctx.closePath();
ctx.fill();

// Clipboard body
ctx.fillStyle = '#e2e8f0';
ctx.strokeStyle = '#94a3b8';
ctx.lineWidth = 8;
const roundRect = (x, y, w, h, r) => {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + w - r, y);
	ctx.arcTo(x + w, y, x + w, y + r, r);
	ctx.lineTo(x + w, y + h - r);
	ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
	ctx.lineTo(x + r, y + h);
	ctx.arcTo(x, y + h, x, y + h - r, r);
	ctx.lineTo(x, y + r);
	ctx.arcTo(x, y, x + r, y, r);
	ctx.closePath();
};
roundRect(256, 192, 512, 640, 40);
ctx.fill();
ctx.stroke();

// Clipboard clip (topo)
ctx.fillStyle = '#64748b';
roundRect(394, 128, 236, 48, 24);
ctx.fill();

// Checkmark sombra
ctx.strokeStyle = '#16a34a';
ctx.lineWidth = 80;
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
ctx.globalAlpha = 0.4;
ctx.beginPath();
ctx.moveTo(345, 505);
ctx.lineTo(445, 625);
ctx.lineTo(705, 345);
ctx.stroke();

// Checkmark principal
ctx.globalAlpha = 1;
ctx.strokeStyle = '#22c55e';
ctx.beginPath();
ctx.moveTo(340, 500);
ctx.lineTo(440, 620);
ctx.lineTo(700, 340);
ctx.stroke();

// Salva
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('icon.png', buffer);
console.log('✅ Ícone 1024x1024 criado com sucesso!');
