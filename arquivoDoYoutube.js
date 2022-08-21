require("dotenv").config();
const AWS = require("aws-sdk");
const express = require("express");
const app = express();
const port = 3000;
const multer = require("multer");
const sharp = require("sharp");

const storage = multer.memoryStorage();
const upload = multer({ storage });

const s3 = new AWS.S3();

async function tratamento(req, res, next) {
  req.imagemTratada = [];

  for (let i = 0; i < req.files.length; i++) {
    let imgTratada = await sharp(req.files[i].buffer).resize(500).toBuffer();
    req.imagemTratada.push({
      originalname: req.files[i].originalname,
      mimetype: req.files[i].mimetype,
      buffer: imgTratada,
    });
  }
  next();
}

function enviarAWS(req, res, next) {
  for (let i = 0; i < req.imagemTratada.length; i++) {
    s3.upload(
      {
        Body: req.imagemTratada[i].buffer,
        Bucket: process.env.AWS_BUCKET,
        ACL: "public-read",
        ContentType: req.imagemTratada[i].mimetype,
        Key: req.imagemTratada[i].originalname,
      },
      (err, data) => {
        console.log(data);
        if (err) {
          return console.log(err);
        }
      }
    );
  }
  next();
}

app.post(
  "/upload",
  upload.array("file", 10),
  tratamento,
  enviarAWS,
  (req, res) => {
    res.send("ok");
  }
);

app.listen(port, () => {
  console.log("rodando porta 3000");
});
