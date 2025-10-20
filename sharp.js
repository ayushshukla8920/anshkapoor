const sharp = require("sharp");
const fs = require('fs');
const path = require('path');
const photosDir = path.join(__dirname, "public/temp");
const thumbsDir = path.join(__dirname, "public/thumbs");

if (!fs.existsSync(thumbsDir)) fs.mkdirSync(thumbsDir);

fs.readdirSync(photosDir).forEach(file => {
  if (!/\.(jpg|jpeg|png|avi|webp)$/i.test(file)) return;
  const input = path.join(photosDir, file);
  const output = path.join(thumbsDir, file);
  if (!fs.existsSync(output)) {
    sharp(input).resize({ width: 200 }).toFile(output, (err) => {
      if (err) console.log("Error generating thumb:", file, err);
    });
  }
});

