var Twitter = require('twitter');
var express = require('express');
var exphbs = require('express3-handlebars');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

var tweets = [];
var terms = [];

app.use(express.static(__dirname));
app.engine('handlebars',
  exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

var keyNumber = 0;
PORT_NUMBER = 3000;

var client = new Twitter({
  consumer_key: "4mSPfcXaSASQiR1FIZ5ccc0tB",
  consumer_secret: "U8VzCgpKjFwf0qUCik4s3VefQCjZY6g0g6mHOKw7CMeVTHw7xy",
  access_token_key: "3236861032-tJTYWFajn9m5Us1kfvW0hAZawQEPhzLHdTZXB6z",
  access_token_secret: "uUTkpeIHNC5JWfznu0BgkdwGABv55hXIBylTEB5iOm7iv",
});

var client2 = new Twitter({
  consumer_key: "YS0KGexQmvlJhGqHUfrNey7ks",
  consumer_secret: "VXVFCGQrzc8syovgscnU8U6C7mYU0886HTz2JGSSlJnI8l57Ru",
  access_token_key: "707646836094345216-n6u7xEFTTPkJdIkzI7vrBfLRSAIpEh9",
  access_token_secret: "6kJsB9ToFcwfWuvY0r01xYyLvQHI3gg1B6AKLhUDVSkIY",
});

function startTwitter(trackTerm) {
  if (keyNumber == 0) {
    keyNumber = 1;
    console.log("Client 1: " + trackTerm);

    client.stream('statuses/filter', {track: trackTerm},  function(stream){
      stream.on('data', function(tweet) {
        tweet["st"] = trackTerm;
        try {
          io.emit("New tweet", tweet);
        }
        catch(err) {
          console.log("error");
        }
      });

      stream.on('error', function(error) {
        console.log(error);
      });
    });
  } else {
    keyNumber = 0;
    console.log("Client 2: " + trackTerm);
    client2.stream('statuses/filter', {track: trackTerm},  function(stream){
      stream.on('data', function(tweet) {
        tweet["st"] = trackTerm;
        try {
          io.emit("New tweet", tweet);
        }
        catch(err) {
          console.log("error");
        }
      });

      stream.on('error', function(error) {
        console.log(trackTerm);
        console.log(error);
      });
    });
  }


}

io.on('connection', function(socket){
  console.log('A user connected');
});


app.get('/', function(req, res) {
  res.render("index", {
    title: "205 Global Events",
    // scriptSrc: '/app/scripts/' + path + "/" + path + '.js',
    // styles: path + "/" + path
  });

});

app.get('/start/twitter/:search', function(req, res) {
  startTwitter(req.params.search);
})

app.get('/start/instagram/:search', function(req, res) {
  startInstagram(req.params.search);
})

var request = require("request")

function startInstagram(searchTag) {
  var url = "https://api.instagram.com/v1/tags/" + searchTag + "/media/recent?access_token=145161542.1fb234f.afe13baad0e2403ea0a650b7aeacfe6b";
  var minId = "";

  setInterval(function() {
    request({
        url: url,
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
          for (index in body["data"]) {
            body["data"][index]["st"] = searchTag;
            io.emit("New insta", body["data"][index])
          }
        }
        url = body["pagination"]["next_url"];
    });
  }, 1000);
}

http.listen(PORT_NUMBER, "127.0.0.1", function () {
  console.log('Example app listening on port ' + PORT_NUMBER);

  // startInstagram("sanders");
  // startInstagram("trump");
  // startInstagram("clinton");
});
