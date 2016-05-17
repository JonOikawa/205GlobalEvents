var d = new Date();
var startTime = d.getTime();

var socket = io();

var structures = [];
var searchTerms = [];

var countryNumbers = new Object();

var currentlySelectedStructure = "";

var positiveWords = [];
var negativeWords = [];

$.get('positive.txt', function(data) {
    posWords = data.split("\n");
    for (index in posWords) {
      positiveWords.push(posWords[index]);
    }
});

$.get('negative.txt', function(data) {
    negWords = data.split("\n");
    for (index in negWords) {
    negativeWords.push(negWords[index]);
    }
});

function initializeStructure(structure, searchTerm) {
  structure["searchTerm"] = searchTerm;
  structure["tweetIds"] = [];
  structure["instaIds"] = [];
  structure["oldestInsta"] = 0;
  structure["RT"] = 0;
  structure["totalTweetLength"] = 0;
  structure["totalInstaLength"] = 0;
  structure["totalTwitterFollowers"] = 0;
  structure["totalTwitterStatuses"] = 0;
  structure["totalInstaVideo"] = 0;
  structure["totalInstaPicture"] = 0;
  structure["tweetSentiment"] = new Object();
  structure["instaSentiment"] = new Object();
  structure["totalTwitterTags"] = 0;
  structure["totalInstaTags"] = 0;
  structure["startTime"] = new Date().getTime();

  initializeSentiment(structure["tweetSentiment"]);
  initializeSentiment(structure["instaSentiment"]);
}

function initializeSentiment(sentimentStructure) {
  sentimentStructure["positive"] = 0;
  sentimentStructure["neutral"] = 0;
  sentimentStructure["negative"] = 0;
}

function updateCountryColors(countryCode, number) {
  var country = $("path[countryId=" + countryCode  + "]");
  var currentColor = parseInt("0x" + country.attr("fill").substring(1))
  if (number == 1) {
    country.attr("fill", "#668400");
  } else {
    var red = (currentColor & 0xFF0000) >> 16;
    var green = (currentColor & 0x00FF00) >> 8;
    red += 10;
    green += 10;

    if (red > 255) {
      red = 255;
    }

    if (green > 255) {
      green = 255;
    }

    var newColor = (red << 16) + (green << 8) + 100;
    country.attr("fill", "#" + newColor.toString(16));
  }
}

$(window).keypress(function(e) {
  if (e.which == 13) {
    // If we press enter, our search bar is focused, and we not have 3 terms already
    if ($("#search").is(":focus") && searchTerms.length < 3) {
      // Add the new search term to the list
      var newSearchTerm = $("#search").val();
      searchTerms.push(newSearchTerm.toLowerCase())

      // Add the new structure
      var structure = new Object();
      initializeStructure(structure, newSearchTerm);
      structures.push(structure);

      // Start both the twitter and instagram APIs for that term
      $.get("/start/twitter/" + newSearchTerm, function(data) {
      });

      $.get("/start/instagram/" + newSearchTerm, function(data) {
      });

      // Change what we are viewing stats to be the most recent.
      currentlySelectedStructure = structures[searchTerms.length - 1];

      // Clear the search result and update our current terms
      $("#search").val('');
      $("#current-terms").text("Current search terms: " + searchTerms);

      // Add a new bar to the graph
      $("#graph").append('<div class="bar""></div><div class="percentage">0%</div><div class="search-term">' + newSearchTerm.toUpperCase() + '</div>');

      // Add the function to switch between terms
      $(".search-term").click(function() {
        var term = $(this).html().toLowerCase();
        var index = searchTerms.indexOf(term);
        currentlySelectedStructure = structures[index];
      });

      // Rough dynamic CSS for the bars to change sizes
      $(".bar:nth-child(even)").css("background-color", "#006BB6");
      $(".bar:nth-child(odd)").css("background-color", "#FDB927");
      if (searchTerms.length > 1) {
        var width = 100 / searchTerms.length;
        $(".bar").css("width", width + "%");
        $(".search-term").css("width", width + "%");
        $(".percentage").css("width", width + "%");

        if (searchTerms.length == 2) {
          $(".search-term:eq(1)").css("margin-left", "50%");

          $(".percentage:eq(1)").css("margin-left", "50%");
        } else if (searchTerms.length == 3) {
          $(".search-term:eq(1)").css("margin-left", "33%");
          $(".search-term:eq(2)").css("margin-left", "66%");

          $(".percentage:eq(1)").css("margin-left", "33%");
          $(".percentage:eq(2)").css("margin-left", "66%");
        } else if (searchTerms.length == 4) {
          $(".search-term:eq(1)").css("margin-left", "25%");
          $(".search-term:eq(2)").css("margin-left", "50%");
          $(".search-term:eq(3)").css("margin-left", "75%");

          $(".percentage:eq(1)").css("margin-left", "25%");
          $(".percentage:eq(2)").css("margin-left", "50%");
          $(".percentage:eq(3)").css("margin-left", "75%");
        }
      }
    }
  }
})

// Get the tone of the text strings we get
function getTone(message) {
  var words = message.split(" ");

  var newString = "";

  var pos = 0;
  var neg = 0;

  // Check if the words are in either of the lists
  for (wordIndex in words) {
    if ($.inArray(words[wordIndex], positiveWords) > -1) {
      pos += 1;
    } else if ($.inArray(words[wordIndex], negativeWords) > -1) {
      neg += 1;
    }
  }

  // If we have more positive than negative, it's positive and we return 1, etc.
  if (pos > neg) {
    return 1;
  } else if (neg > pos) {
    return -1;
  } else {
    return 0;
  }
}

// Call to Google Maps API to get the country code. If we don't get anything, return "N/A" to be handled. Used mostly for Instagram
function getCountry(latitude, longitude) {
  $.get("http://maps.googleapis.com/maps/api/geocode/json?latlng=" + latitude + "," + longitude + "&sensor=false", function(data) {
    if (data["status"] == "OK") {
      for (index in data["results"][0]["address_components"]) {
        if (data["results"][0]["address_components"][index]["types"].indexOf("country") >= 0) {
          addCountry(data["results"][0]["address_components"][index]["short_name"]);
          return;
        }
      }
    } else {
      return "N/A"
    }
  });
}

// Similar method to the one above, but is used specifically for Twitter
function addLocation(msg) {
  var countryCode = "";

  if (msg["coordinates"]) {
    countryCode = getCountry(msg["coordinates"]["coordinates"][0], msg["coordinates"]["coordinates"][1]);
  } else if (msg["place"]) {
    countryCode = msg["place"]["country_code"];
    addCountry(countryCode);
  }
}

// Once we have the country code, at it to our list
function addCountry(countryCode) {
  if (countryCode == "N/A") {
    return 0;
  }

  // Certain codes don't map to our maps codes
  if (countryCode == "HK") {
    countryCode = "CN";
  }

  if (countryCode == "GU") {
    countryCode = "US";
  }

  if (countryNumbers[countryCode]) {
    countryNumbers[countryCode] += 1;
  } else {
    countryNumbers[countryCode] = 1;
  }

  updateCountryColors(countryCode, countryNumbers[countryCode]);
}

// For both instagrams and tweets, we scan the broadcast on the socket for certain terms
socket.on('New insta', function(msg) {
  for (index in structures) {
    // Given a new insta, we check to see which search term it matches to.
    // Once we have the correct structure, we add in all sorts of data to it
    if (msg["st"] == structures[index]["searchTerm"]) {
      structures[index]["oldestInsta"] = msg["created_time"];
      structures[index]["totalInstaLength"] += msg["caption"]["text"].length;
      structures[index]["instaIds"].push(msg["id"]);
      structures[index]["totalInstaTags"] += msg["tags"].length;

      var tone = getTone(msg["caption"]["text"]);
      if (tone == 1) {
        structures[index]["instaSentiment"]["positive"] += 1;
      } else if (tone == -1) {
        structures[index]["instaSentiment"]["negative"] += 1;
      } else {
        structures[index]["instaSentiment"]["neutral"] += 1;
      }

      if (msg["type"] == "image") {
          structures[index]["totalInstaPicture"] += 1;
      } else {
        structures[index]["totalInstaVideo"] += 1;
      }

      if (msg["location"]) {
        getCountry(msg["location"]["latitude"], msg["location"]["longitude"]);
      }
    }
  }
});

// Similar to the Instagram .on function
socket.on('New tweet', function(msg){
  for (index in structures) {
    if (msg["st"] == structures[index]["searchTerm"]) {
      if (msg["text"].indexOf("RT") == 0) {
        structures[index]["RT"] += 1;
      }
      structures[index]["totalTwitterTags"] += msg["entities"]["hashtags"].length;
      structures[index]["totalTweetLength"] += msg["text"].length;
      structures[index]["tweetIds"].push(msg["id"]);
      structures[index]["totalTwitterFollowers"] += msg["user"]["followers_count"];
      structures[index]["totalTwitterStatuses"] += msg["user"]["statuses_count"];


      var tone = getTone(msg["text"]);
      if (tone == 1) {
        structures[index]["tweetSentiment"]["positive"] += 1;
      } else if (tone == -1) {
        structures[index]["tweetSentiment"]["negative"] += 1;
      } else {
        structures[index]["tweetSentiment"]["neutral"] += 1;
      }


      if (msg["coordinates"] || msg["place"]) {
        addLocation(msg);
      }
    }
  }
});

// Every 250 milliseconds we update all of the information
setInterval(function() {
  // If we don't have any structures yet, we don't do anything
  if (!currentlySelectedStructure) {
    return;
  }
  var totalTweets = currentlySelectedStructure["tweetIds"].length;
  var tweetsPerMinute = Math.round(60000*totalTweets/(new Date().getTime() - currentlySelectedStructure["startTime"]) * 100) / 100

  var totalRTs = currentlySelectedStructure["RT"];
  var RTpercentage = Math.round(totalRTs*100/totalTweets);

  var totalInstas = currentlySelectedStructure["instaIds"].length;
  var instasPerMinute = Math.round(60*totalInstas/(currentlySelectedStructure["startTime"]/1000 - currentlySelectedStructure["oldestInsta"]) * 100) / 100

  var posTweets = currentlySelectedStructure["tweetSentiment"]["positive"];
  var negTweets = currentlySelectedStructure["tweetSentiment"]["negative"];
  var neutTweets = currentlySelectedStructure["tweetSentiment"]["neutral"];

  var posInstas = currentlySelectedStructure["instaSentiment"]["positive"];
  var negInstas = currentlySelectedStructure["instaSentiment"]["negative"];
  var neutInstas = currentlySelectedStructure["instaSentiment"]["neutral"];


  $("#currentStructure").html(currentlySelectedStructure["searchTerm"].toUpperCase());
  $("#tweetsPerMinute").html(tweetsPerMinute);
  $("#rtPercentage").html("Tweets Per Minute (" + RTpercentage + "%)");
  $("#avgTwitterTags").html(Math.round(currentlySelectedStructure["totalTweetLength"]/totalTweets));
  $("#avgFollowers").html(Math.round(currentlySelectedStructure["totalTwitterFollowers"]/totalTweets));
  $("#avgStatuses").html(Math.round(currentlySelectedStructure["totalTwitterStatuses"]/totalTweets));
  $("#avgTweetLength").html(Math.round(currentlySelectedStructure["totalTwitterTags"]/totalTweets * 100) / 100);

  $("#instasPerMinute").html(instasPerMinute);
  $("#avgInstaTags").html( Math.round(currentlySelectedStructure["totalInstaLength"]/totalInstas));
  $("#imagePercentage").html(Math.round(100*currentlySelectedStructure["totalInstaPicture"]/totalInstas) + "%");
  $("#videoPercentage").html(Math.round(100*currentlySelectedStructure["totalInstaVideo"]/totalInstas) + "%");
  $("#avgInstaLength").html(Math.round(currentlySelectedStructure["totalInstaTags"]/totalInstas * 100) / 100);

  $("#tNeg").html(Math.round(100*negTweets/totalTweets));
  $("#tNeut").html(Math.round(100*neutTweets/totalTweets));
  $("#tPos").html(Math.round(100*posTweets/totalTweets));

  $("#iNeg").html(Math.round(100*negInstas/totalInstas));
  $("#iNeut").html(Math.round(100*neutInstas/totalInstas));
  $("#iPos").html(Math.round(100*posInstas/totalInstas));

  var tweetWeight = 0;
  var instaWeight = 0;

  for (index in structures) {
    tweetWeight += 1000*structures[index]["tweetIds"].length/(new Date().getTime() - structures[index]["startTime"]);
    instaWeight += structures[index]["instaIds"].length/1000/(structures[index]["startTime"] - structures[index]["oldestInsta"]);
  }

  for (index in structures) {
    var currentWeight = 1000*structures[index]["tweetIds"].length/(new Date().getTime() - structures[index]["startTime"]) + structures[index]["instaIds"].length/1000/(structures[index]["startTime"] - structures[index]["oldestInsta"]);
    var barHeight = Math.round(100*(currentWeight/(tweetWeight + instaWeight)));
    $(".bar:eq(" + index + ")").animate({
      'margin-top': 100-barHeight + 'vh',
      'height': barHeight + 'vh',
    }, 250);
    $(".percentage:eq(" + index + ")").animate({
      'margin-top': 95-barHeight + 'vh'
    }, 250);
    $(".percentage:eq(" + index + ")").html(barHeight + "%");
  }
}, 250);
