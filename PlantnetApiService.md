
## Plantnet API call

WARN - PlantNet API latest doc recommend POST + formData

Current BotEnSky implementation rely on legacy GET

Response Diff: POST response dont include image sample

POST Example for current project

````javascript
 // Fetch image data
 const resp = await superagent.get(imageUrl).responseType("arraybuffer");
 const buffer = Buffer.from(resp.body);


 // https://my.plantnet.org/doc/getting-started/introduction#identify-your-images
 let req = this.plantnetClient
     .post(`${PLANTNET_POST_API_URL}?api-key=${service.apiKey}`)
     .retry(1) // retry one time
     .field("organs", "flower")
     .field("organs", "leaf")
     .attach("images", Readable.from(buffer), { filename: "image1.jpg" })
     .attach("images", Readable.from(buffer), { filename: "image2.jpg" });
````
