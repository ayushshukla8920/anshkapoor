const express = require("express");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const app = express();
const PORT = 3000;
const USERNAME = "anshu";
const PASSWORD = "3000";
const JWT_SECRET = "super-secret-key";
const TOKEN_EXPIRY = "1h";
app.use(bodyParser.json());
app.use(express.static("views"));
// Serve static files
app.use("/photos", express.static(path.join(__dirname, "public/photos")));
app.use("/videos", express.static(path.join(__dirname, "public/videos")));
app.use("/thumbs", express.static(path.join(__dirname, "public/thumbs")));

app.get("/api/media", authRequired, (req, res) => {
  const photosDir = path.join(__dirname, "public/photos");
  const videosDir = path.join(__dirname, "public/videos");
  const media = [];
  fs.readdir(photosDir, (err, photoFiles) => {
    if (!err) {
      photoFiles.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
        .forEach(f => media.push({ type: "image", filename: f }));
    }
    fs.readdir(videosDir, (err2, videoFiles) => {
      if (!err2) {
        videoFiles.filter(f => /\.(mp4|webm|mov|avi)$/i.test(f))
          .forEach(f => media.push({ type: "video", filename: f }));
      }
      res.json(media);
    });
  });
});

function authRequired(req, res, next) {
  let token = null;
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }
  if (!token && req.query.token) {
    token = req.query.token;
  }
  if (!token && req.query.auth) {
    token = req.query.auth;
  }
  if (!token) {
    return res.status(401).json({ error: "No token" });
  }
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = decoded;
    next();
  });
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views/index.html"));
});
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (username === USERNAME && password === PASSWORD) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    return res.json({ token });
  }
  return res.status(401).json({ error: "Invalid credentials" });
});
app.get("/api/download/:filename", authRequired, (req, res) => {
  const filePath = path.join(__dirname, "public/photos", req.params.filename);
  res.download(filePath);
});
app.get("/api/download-all", authRequired, (req, res) => {
  const zipFileName = "photos.zip";
  res.attachment(zipFileName);
  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.pipe(res);
  archive.directory(path.join(__dirname, "public/photos"), false);
  archive.finalize();
});
app.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);
