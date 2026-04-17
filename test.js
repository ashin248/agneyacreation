const http = require("http");
http
  .get("http://localhost:5000/api/public/products", (res) => {
    let data = "";
    res.on("data", (c) => (data += c));
    res.on("end", () => console.log("STATUS:", res.statusCode));
  })
  .on("error", (e) => console.log("ERROR:", e.message));
