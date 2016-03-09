#Import the necessary methods from tweepy library
from tweepy.streaming import StreamListener
from tweepy import OAuthHandler
from tweepy import Stream

from threading import Thread
import sys
import json
from time import sleep

keys = ['created_at', 'id', 'timestamp_ms', 'source', 'in_reply_to_status_id', 'text']
userKeys = ['id', 'time_zone', 'name', 'screen_name', 'followers_count', 'friends_count', 'listed_count', 'favourites_count', 'statuses_count', 'created_at', 'lang', 'profile_image_url']

def location(x):
    return {
        'sf': [-123.75,35.8,-120.75,38.8],
        'ny': [-74,40,-73,41],
    }[x]

consumer_key = "4mSPfcXaSASQiR1FIZ5ccc0tB"
consumer_secret = "U8VzCgpKjFwf0qUCik4s3VefQCjZY6g0g6mHOKw7CMeVTHw7xy"
access_token = "3236861032-tJTYWFajn9m5Us1kfvW0hAZawQEPhzLHdTZXB6z"
access_token_secret = "uUTkpeIHNC5JWfznu0BgkdwGABv55hXIBylTEB5iOm7iv"
totalTweets = []

class Unbuffered(object):
   def __init__(self, stream):
       self.stream = stream
   def write(self, data):
       self.stream.write(data)
       self.stream.flush()
   def __getattr__(self, attr):
       return getattr(self.stream, attr)

sys.stdout = Unbuffered(sys.stdout)

#This is a basic listener that just prints received tweets to stdout.
class StdOutListener(StreamListener):

    def on_data(self, data):
        global totalTweets

        jsonData = json.loads(data)
        dataStruct = {}
        userData = {}
        for key in keys:
            dataStruct[key] = jsonData[key]
        for userKey in userKeys:
            userData[userKey] = jsonData['user'][userKey]
        dataStruct['user'] = userData
        totalTweets.append(dataStruct)

        # try:
        #     print(str(dataStruct))
        # except:
        #     print(str(dataStruct['id']) + " has emoji")
        # print(data)
        return True

    def on_error(self, status):
        print(status)


def getTweets(trackString):
    #This handles Twitter authetification and the connection to Twitter Streaming API
    l = StdOutListener()
    auth = OAuthHandler(consumer_key, consumer_secret)
    auth.set_access_token(access_token, access_token_secret)
    stream = Stream(auth, l)

    #This line filter Twitter Streams to capture data by the keywords: 'python', 'javascript', 'ruby'
    stream.filter(track=[trackString])
    # stream.filter(locations=(-122.75,36.8,-121.75,37.8))
    # stream.filter(locations=(location(sys.argv[1].lower())))

t = Thread(target=getTweets, args=(sys.argv[1],))
t.start()

num = 1
while True:
    if len(totalTweets) >= num + 1:
        # startTime = int(totalTweets[0]['timestamp_ms'])
        # endTime = int(totalTweets[len(totalTweets)-1]['timestamp_ms'])
        # print(startTime)
        # print(endTime)
        # totalTime = (int(totalTweets[len(totalTweets)-1]['timestamp_ms']) - int(totalTweets[0]['timestamp_ms']))/1000
        # print(str(len(totalTweets)) + " tweets in " + str(totalTime) + " seconds.")
        try:
            print(totalTweets[num]['text'])
        except:
            print("Emoji")
        # print(len(totalTweets))
        num = len(totalTweets)
        # for index in range(0, len(totalTweets)-1):
        #     print(totalTweets[index]['user']['time_zone'])
