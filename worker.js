#!/usr/bin/env node
var http = require("http");
var amqp = require("amqplib/callback_api");

var urlparams = {
  host: process.env.PUSH_NOTIFICATION_SERVICE_HOST,
  port: process.env.PUSH_NOTIFICATION_SERVICE_PORT,
  path: process.env.PUSH_NOTIFICATION_SERVICE_PATH,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
};

function SendRequest(datatosend) {
  function OnResponse(response) {
    var data = "";

    response.on("data", function (chunk) {
      data += chunk; //Append each chunk of data received to this variable.
    });
    response.on("end", function () {
      console.log(data); //Display the server's response, if any.
    });
  }

  var request = http.request(urlparams, OnResponse); //Create a request object.

  request.write(datatosend); //Send off the request.
  request.end(); //End the request.
}

amqp.connect("amqp://rabbitmq:5672", function (error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function (error1, channel) {
    if (error1) {
      throw error1;
    }
    var exchange = "topic_logs";

    channel.assertExchange(exchange, "topic", {
      durable: false,
    });

    channel.assertQueue(
      "",
      {
        exclusive: true,
      },
      function (error2, q) {
        if (error2) {
          throw error2;
        }
        console.log(
          `[*] Waiting for logs under "${process.env.TOPIC_KEY}" key. `
        );
        const key = process.env.TOPIC_KEY;
        channel.bindQueue(q.queue, exchange, key);

        channel.consume(
          q.queue,
          function (msg) {
            const data = JSON.parse(msg.content);

            const message = {
              title: "Nueva comision",
              body: "Has registrado una nueva comision de venta",
              email: data.email,
              source: "test",
            };

            SendRequest(JSON.stringify(message));
          },
          {
            noAck: true,
          }
        );
      }
    );
  });
});
