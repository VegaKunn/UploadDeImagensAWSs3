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

async function theSharp(req, res, next) {
  /* */

  // console.log(req.file);

  req.imgResizeBig = [];
  req.imgResizeMini = [];

  for (let i = 0; i < req.files.length; i++) {
    let resizeWidthBig = await sharp(req.files[i].buffer)
      .resize(500)
      .toBuffer();

    req.imgResizeBig.push({
      originalname: req.files[i].originalname,
      mimetype: req.files[i].mimetype,
      buffer: resizeWidthBig,
    });

    let resizeWidthMini = await sharp(req.files[i].buffer)
      .resize(250)
      .toBuffer();
    req.imgResizeMini.push({
      originalname: req.files[i].originalname,
      mimetype: req.files[i].mimetype,
      buffer: resizeWidthMini,
    });
  }

  next();
}

const enviarAws = (req, res, next) => {
  // console.log(req.file.mimetype);
  /* */
  for (let i = 0; i < req.imgResizeBig.length; i++) {
    s3.upload(
      {
        Body: req.imgResizeBig[i].buffer,
        Bucket: process.env.AWS_BUCKET,
        ACL: "public-read",
        ContentType: req.imgResizeBig[i].mimetype,
        Key: `${req.params.usuarioID}/big` + req.imgResizeBig[i].originalname,
      },
      (err, data) => {
        req.dadosDB = data;
        if (err) {
          return console.log(err);
        }
      }
    );

    s3.upload(
      {
        Body: req.imgResizeMini[i].buffer,
        Bucket: process.env.AWS_BUCKET,
        ACL: "public-read",
        ContentType: req.imgResizeMini[i].mimetype,
        Key: `${req.params.usuarioID}/mini` + req.imgResizeMini[i].originalname,
      },
      (err, data) => {
        req.dadosDB = data;
        if (err) {
          return console.log(err);
        }
      }
    );
  }

  //  console.log(req.imgResize80);
  next();
};

app.post(
  "/envio/:usuarioID",
  upload.array("file", 10),
  theSharp,
  enviarAws,
  (req, res) => {
    // console.log(req.dadosDB);
    res.send("Hello World!");
  }
);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
