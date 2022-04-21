const express = require('express');
const app = express();

const port = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded());

const mongoose = require('mongoose');
const { userInfo } = require('os');
const { emitWarning } = require('process');

const db = mongoose.connection;
const url = "mongodb://127.0.0.1:27017/apod";

async function Initiate() {
    await mongoose.connect(url, { useUnifiedTopology: true, useNewUrlParser: true });
}

Initiate();

const Schema = mongoose.Schema;
const apodSchema = Schema({
    title: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true
    }
    }, {collection: 'images'})

const APOD = mongoose.model('APOD', apodSchema);

app.get("/", async function (req, res) {
    const images = {};
    for await(const image of APOD.find()) {
        images[image.title] = {url: image.url, rating: image.rating};
    }
    res.json(images);
});

app.get("/favorite", async function (req, res) {
    // GET "/favorite" should return our favorite image by highest rating
      APOD.find().sort({'rating': 'desc'}).exec((error, images) => {
      if (error) {
        console.log(error)
        res.send(500)
      } else {
        res.json({favorite: images[0]})
      }
    })
  });

  app.post("/add", async function (req, res) {
    // POST "/add" adds an APOD image to our database
    const { title, url, rating } = req.body;
    try {
        let image = await APOD.findOne({
            title,
        });
        if (image) {
            return res.status(400).json({
                msg: "Image Already Exists",
            });
        }

        image = new APOD({
            title,
            url,
            rating
        });

        await image.save();

        return res.json({
            msg: "Image Added"
        })
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Error in Saving");
    }
    // const nasaResponse = await fetch(`https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY`).json();
  });
  
  app.delete("/delete", async function (req, res) {
    // DELETE "/delete" deletes an image according to the title
    const { title } = req.body;
    const del = await APOD.deleteOne({ title: title });
    if (!del) {
        return res.status(400).json({
            msg: "Image does not exist"
        })
    }
    
    res.status(200).json({
        msg: "Image deleted"
    })
  });
  
  app.listen(port, () => {
    console.log(`Listening on port ${port}`)
  })