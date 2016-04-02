Installation
-----------
1. - `cd tweepy` cd into the tweepy directory
2. - `py setup.py install` install tweepy
3. - `pip install plotly` install plot.ly via pip
4. - `python -c "import plotly; plotly.tools.set_credentials_file(username='JonOikawa', api_key='5b2faeqo2i')"` credentials for using plot.ly


Potential Future Additions (Twitter)
---------------
These can all be combined to refine your search

**follow**  
A comma-separated list of user IDs, indicating the users whose Tweets should be delivered on the stream.
This will return:
- Tweets created by the user.
- Tweets which are retweeted by the user.
- Replies to any Tweet created by the user.
- Retweets of any Tweet created by the user.
- Manual replies, created without pressing a reply button (e.g. “@twitterapi I agree”).

The stream will not return:
- Tweets mentioning the user (e.g. “Hello @twitterapi!”).
- Manual Retweets created without pressing a Retweet button (e.g. “RT @twitterapi The API is great”).
- Tweets by protected users.

Example
`stream.filter(follow=USER_ID)` (Not tested yet, syntax may be wrong)

**track**  
A comma-separated list of phrases which will be used to determine what Tweets will be delivered on the stream. You can think of commas as logical ORs, while spaces are equivalent to logical ANDs

Example
`stream.filter(track['trump'])`

**locations**  
A comma-separated list of longitude,latitude pairs specifying a set of bounding boxes to filter Tweets by. Only geolocated Tweets falling within the requested bounding boxes will be included—unlike the Search API, the user’s location field is not used to filter tweets.

Example
`stream.filter(locations=-122.75,36.8,-121.75,37.8)` (Not tested yet, syntax may be wrong)

**Further details**  
More details can be found on Twitter's [site](https://dev.twitter.com/streaming/overview/request-parameters)


Running the Program
-------------------
Run it from command line with the following command:  
`py events.py TRACK_TERM_1 TRACK_TERM_2 ...`

This will start tracking the search term for all tweets from the start of the program in real-time, and all Instagrams starting from that time moving backward (currently working to see if we can get them in real-time as well, but still works as it will only go back in time a few minutes usually).

There currently is no limit to the number of TRACK_TERM's programmatically, but there are rate limits for both APIs.

Use CTRL+C to exit.

Return Values
-------------
Currently the program ends after having run the for loop for the args, but the data is still fully accessible to use for programming after that loop. All of the data for the tweets are stored in totalTweets, and all Instagram data in totalInstagrams. If we were to have our search terms be "trump sanders clinton", then we can access all Instagrams related to say trump via totalInstagrams[0], as that is the 0th term. Grabbing clinton's tweets would then be totalTweets[2].

Once we have done that, the value of totalTweets[index] or totalInstagrams[index] will return a MASSIVE list. If there were 1,500 Clinton tweets, then len(totalTweets[2]) will be 1500, addressible by anything between totalTweets[2][0] to totalTweets[2][1499].

Beyond that, since these are JSON objects, we can return, for example, a particular tweets text by: totalTweets[2][500]['text']

JSON Structures
---------------
Each individual tweet has a data structure that looks like this:
* 'created_at'
* 'id'
* 'timestamp_ms'
* 'source'
* 'in_reply_to_status_id'
* 'text'
* 'user'
  * 'id'
  * 'time_zone'
  * 'name'
  * 'screen_name'
  * 'followers_count'
  * 'friends_count'
  * 'listed_count'
  * 'favourites_count'
  * 'statuses_count'
  * 'created_at'
  * 'lang'
  * 'profile_image_url'

Each individual Instagram post has a data structure that looks like this:
* 'type'
* 'caption'
* 'link'
* 'created_time'
* 'id'
* 'location'
  * 'name'
  * 'id'
  * 'latitude'
  * 'longitude'
* 'user'
  * 'username'
  * 'full_name'
  * 'profile_picture'
  * 'id'
* 'tags'
* 'like_count'
* 'comment_count'

Current Issues
--------------
1. Attempting to print out emojis throws an error as there is no encoding for them the charmap of UTF-8.
2. Rate Limiting Errors for Twitter, and HTTP Error 429 - Too Many Requests for Instagram.
3. The plot.ly API automatically prints out some data when the graph is being created.
