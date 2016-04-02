# Import the necessary methods from tweepy library
from tweepy.streaming import StreamListener
from tweepy import OAuthHandler
from tweepy import Stream

# Import other necessary libraries
from threading import Thread
import sys
import json
import time
import urllib.request

# Import libraries for plotting on graphs
import plotly.plotly as py
import plotly.graph_objs as go

# Twitter API access keys. There are two sets so that we can access twice as many without getting Rate Limiting Errors
consumer_key = ["4mSPfcXaSASQiR1FIZ5ccc0tB", "YS0KGexQmvlJhGqHUfrNey7ks"]
consumer_secret = ["U8VzCgpKjFwf0qUCik4s3VefQCjZY6g0g6mHOKw7CMeVTHw7xy", "VXVFCGQrzc8syovgscnU8U6C7mYU0886HTz2JGSSlJnI8l57Ru"]
access_token = ["3236861032-tJTYWFajn9m5Us1kfvW0hAZawQEPhzLHdTZXB6z", "707646836094345216-n6u7xEFTTPkJdIkzI7vrBfLRSAIpEh9"]
access_token_secret = ["uUTkpeIHNC5JWfznu0BgkdwGABv55hXIBylTEB5iOm7iv", "6kJsB9ToFcwfWuvY0r01xYyLvQHI3gg1B6AKLhUDVSkIY"]

# Search keys for the return objects for Twitter and Instagram (i..) APIs
keys = ['created_at', 'id', 'timestamp_ms', 'source', 'in_reply_to_status_id', 'text']
userKeys = ['id', 'time_zone', 'name', 'screen_name', 'followers_count', 'friends_count', 'listed_count', 'favourites_count', 'statuses_count', 'created_at', 'lang', 'profile_image_url']
iDataKeys = ['type', 'caption', 'link', 'created_time', 'id']
iLocationKeys = ['name', 'id', 'latitude', 'longitude']
iUserKeys = ['username', 'full_name', 'profile_picture', 'id']

# Structure for holding our objects
totalTweets = []
totalInstagrams = []
threads = []
stdOuts = []

# This is how long we will run our program for in seconds
RUN_TIME = 60

# Interval to tell user that time has passed
INTERVAL_DURATION = 5

# Catch the StdOut for the Stream, and redirect the data so that we can mine it
class StdOutListener(StreamListener):

    # When we receive data
    def on_data(self, data):
        # Get our global list of our tweets and the startTime
        global totalTweets
        global startTime

        # Dictionaries for mining and re-storing the data we find.
        dataStruct = {}
        userData = {}

        # Run this thread until our RUN_TIME has been reached
        if startTime + RUN_TIME < time.time():
            sys.exit(0)

        # Very hacky solution for determining which std out listener is for which search term
        # If this listener is not in our list of listeners, then we create a new list,
        # append it to the global totalTweets list, and add the listener to the list of listeners.
        # Basically, check to see if this is the first time running this listener. If it is,
        # then add it so we can check to see if it comes up again
        if self not in stdOuts:
            tweets = []
            stdOuts.append(self)
            totalTweets.append(tweets)

        # Get the JSON data from our listener
        jsonData = json.loads(data)

        # Iterate through the keys to create our object, and append it to our global list
        try:
            for key in keys:
                dataStruct[key] = jsonData[key]
            for userKey in userKeys:
                userData[userKey] = jsonData['user'][userKey]
            dataStruct['user'] = userData
            totalTweets[stdOuts.index(self)].append(dataStruct) # stdOuts.index(self) means we get the number of this listener, which will correspond to the search term
        except KeyError:
            pass # created_at not present for some reason

    # If the listener encounters an error of some sort
    def on_error(self, status):
        if status == 420:
            print("Rate Limiting Error")
        else:
            print(status)


# Function for getting the tweets (in conjunction with StdOutListener)
def getTweets(trackString, index):
    # This is simply to choose between API keys. Even numbered search terms
    # get keys at [0], odds get keys at [1]
    index = index%2

    # This handles Twitter authetication and the connection to Twitter Streaming API
    l = StdOutListener()
    auth = OAuthHandler(consumer_key[index], consumer_secret[index])
    auth.set_access_token(access_token[index], access_token_secret[index])
    stream = Stream(auth, l)

    # This line filters Twitter Streams to capture data by the keywords: 'python', 'javascript', 'ruby'
    stream.filter(track=[trackString])

# Function for getting the instas
def getInstaPosts(searchTag):
    # Use our global variables so we can access them later/they are uniform everywhere
    global totalInstagrams
    global startTime

    # List for collecting instas for a particular tag
    instagrams = []

    # Add that list to the global one
    totalInstagrams.append(instagrams)

    # This will be our first URL that we will hit for getting our instagram data, adding in the search term
    next_url = "https://api.instagram.com/v1/tags/" + searchTag + "/media/recent?access_token=145161542.1fb234f.afe13baad0e2403ea0a650b7aeacfe6b"

    # Run this until our RUN_TIME has been reached
    while startTime + RUN_TIME > time.time():
        # Get the data and retrieve the next URL. This will point us to older posts
        # fitting the same tags, as opposed to twitter which gives us current ones.
        # May encounter HTTP Error 429, which is too many requests
        jsonData = json.loads(urllib.request.urlopen(next_url).read().decode('utf-8'))
        next_url = jsonData['pagination']['next_url']

        # For each insta we get, create necessary structures, and fill them out with the appropriate data
        for index in range(0, len(jsonData)):
            instaData = {}
            location = {}
            tags = []
            comments = {}
            userData = {}

            for key in iDataKeys:
                instaData[key] = jsonData['data'][index][key]
            if jsonData['data'][index]['location']:
                for key in iLocationKeys:
                    location[key] = jsonData['data'][index]['location'][key]
                instaData['location'] = location
            for tag in (jsonData['data'][index]['tags']):
                tags.append(tag)
            instaData['tags'] = tags
            instaData['like_count'] = jsonData['data'][index]['likes']['count']
            instaData['comment_count'] = jsonData['data'][index]['comments']['count']
            for user in jsonData['data'][index]['comments']['data']:
                comments[user['from']['username']] = user['text']
            instaData['comments'] = comments
            for key in iUserKeys:
                userData[key] = jsonData['data'][index]['user'][key]
            instaData['user'] = userData
            instaData['media_url'] = jsonData['data'][index][instaData['type'] + "s"]['standard_resolution']['url']

            instagrams.append(instaData)

startTime = time.time()
nextInterval = INTERVAL_DURATION

# Delete the first sys.argv, which is the file name (events.py). Simply
# makes it easier to iterate.
del(sys.argv[0])

# For each term, create new twitter and instagram threads to get the appropriate data
for term in sys.argv:
    newInstaThread = Thread(target=getInstaPosts, args=(term,))
    newTwitterThread = Thread(target=getTweets, args=(term,sys.argv.index(term)))
    newInstaThread.daemon = True
    newTwitterThread.daemon = True
    newInstaThread.start()
    newTwitterThread.start()

    threads.append(newInstaThread)
    threads.append(newTwitterThread)

# Iterate until all threads have ended (all have run for RUN_TIME)
while len(threads) > 0:
    if startTime + nextInterval < time.time():
        print("Process has been running for " + str(nextInterval) + " of " + str(RUN_TIME) + " seconds...")
        nextInterval += INTERVAL_DURATION
    for thread in threads:
        if not thread.isAlive():
            del(threads[threads.index(thread)])

# Store data for our graphs
tweetsPerMinute = []
instagramsPerMinute = []

# For each term, iterate through their respective lists and print out some stats
for arg in sys.argv:
    index = sys.argv.index(arg)

    tweetCount = len(totalTweets[index])
    instaCount = len(totalInstagrams[index])
    newestPostTime = int(totalInstagrams[index][0]['created_time'])
    oldestPostTime = int(totalInstagrams[index][len(totalInstagrams[index]) - 1]['created_time'])

    tweetsPerMinute.append(tweetCount*60/RUN_TIME)
    instagramsPerMinute.append(instaCount*60/((newestPostTime - oldestPostTime)/1000))

# Create data structures for our graphing library
twitter = go.Bar(
    x=sys.argv,
    y=tweetsPerMinute,
    name='Twitter'
)

instagram = go.Bar(
    x=sys.argv,
    y=instagramsPerMinute,
    name='Instagram'
)

data = [twitter, instagram]
layout = go.Layout(
    barmode='stack',
    title='Social Media Mentions',
    yaxis= dict(
        title='Mentions (per minute)',
    ),
)

# Create graphs to visualize our data
fig = go.Figure(data=data, layout=layout)
plot_url = py.plot(fig, filename='stacked-bar')
