
/**
 * Use this config sample to configure Mr Tweet.
 * Insert your own twitter username and Twitter API credentials.
 */

var config = {};

// The root Twitter screen name that we'll search on
config.ROOT_SCREEN_NAME = 'TwitterUsername';

// Twitter API credentials.
// You'll have to create a new Twitter Application from your Twitter account
// and put the creds here. https://apps.twitter.com/
config.TWITTER_CREDS = {
	consumer_key: '...',
	consumer_secret: '...',
	access_token: '...',
	access_token_secret: '...'
}

module.exports = config;