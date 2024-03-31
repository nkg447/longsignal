const http = require("http");
const url = require("url");

let connections = Object.create(null);

function upsertResponseObject(id, res) {
  const connection = connections[id];
  if (connection !== undefined) {
    connection.res = res;
  }
}

function pushMessage(id, message) {
  connections[id].res.end(message);
}

function handleMessage(messageStr, res) {
  const data = JSON.parse(messageStr);
  const type = data.type;

  upsertResponseObject(data.fromId, res);

  if (type === "join") {
    const connection = { id: data.fromId };
    connections[data.fromId] = connection;
    const connectionTo = connections[data.toId];

    if (connectionTo !== undefined) {
      //Other user is already connected, send a resp
      connectionTo.peerId = data.fromId;
      connection.peerId = data.toId;
      res.end(messageStr);
    } else {
      res.end("joined");
    }
  }
  if (type === "offer") {
    console.log("Forwarding offer to: " + data.toId);
    //send the offer to the other user
    var connectionTo = connections[data.toId];
    if (connectionTo != null) {
      pushMessage(data.toId, messageStr);
    }
  }
  if (type === "answer") {
    //forward answer to the other user
    console.log("Forwarding answer to: " + data.toId);
    //send the offer to the other user
    var connectionTo = connections[data.toId];
    if (connectionTo != null) {
      pushMessage(data.toId, messageStr);
    }
  }
  if (type === "candidate") {
    //forward candidate to the other user
    console.log("Forwarding ICE candidate to: " + data.toId);
    //send the offer to the other user
    var connectionTo = connections[data.toId];
    if (connectionTo != null) {
      pushMessage(data.toId, messageStr);
    }
  }
}

function accept(req, res) {
  let urlParsed = url.parse(req.url, true);

  // new client wants messages
  if (urlParsed.pathname == "/poll") {
    let message = "";
    req
      .on("data", function (chunk) {
        message += chunk;
      })
      .on("end", function () {
        try {
          handleMessage(message, res);
        } catch (err) {
          res.end(err.message);
        }
      });
    return;
  }
}

// -----------------------------------

http.createServer(accept).listen(8080);
console.log("Server running on port 8080");
