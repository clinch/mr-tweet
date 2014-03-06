
var config = require('./config.js');
var Twit = require('twit');
var prompt = require('prompt');

const MAX_USER_LOOKUPS = 100;	// As defined by the max numbers of users per request. https://dev.twitter.com/docs/api/1.1/get/users/lookup
const EXAMINE_TOP_NUM = 30;
const LIST_TOP_NUM = 10;

var twitter = new Twit(config.TWITTER_CREDS);

var allFollowers = new Array();
var calculatedFollowers = new Array();

// Configure and start the command line prompt
prompt.message = '';
prompt.delimiter = '';
prompt.start();

prompt.get({name: 'screenname', required: true, description: 'Twitter username: @'},
	function(err, result) {
		if (err != null) { console.log(err); return; }

		beginSearch(result.screenname);
	}
);

/**
 * Starts the search process on the username provided.
 */
function beginSearch(screenname) {
	console.log('Beginning follower analysis...');

	twitter.get('followers/ids', { screen_name: screenname }, function(error, response) {
		if (error != null) {
			console.log('ERROR: %s', error);
		} else {
			if (response == null || response.ids == null) {
				console.log('ERROR: Improper response object');
			} else {
				console.log('This user has %d followers.', response.ids.length); 
				lookupUserFollowers(response.ids);
			}
		}
	});
}

/**
 * Given a giant array of user_id's, look up individual user info for each one.
 */
function lookupUserFollowers(followingUsers) {
	var callCounter = 0;

	for (i = 0; i < followingUsers.length; i += MAX_USER_LOOKUPS) {
		callCounter ++;

		twitter.get('users/lookup', { user_id: followingUsers.slice(i, i + MAX_USER_LOOKUPS).join(',') }, function(error, response) {
			if (error != null) {
				console.log('ERROR: %s', error);
			} else {
				// console.log("-- %d results", response.length );
				for (i = 0; i < response.length; i++) {
					//console.log('@%s has %d followers.', response[i].screen_name, response[i].followers_count);
					allFollowers.push(response[i]);
				}

				if (--callCounter == 0) {
					processFollowers();
				}
			}
		});
	}
}

/**
 * After retrieving all followers, we now parse the list to identify the key players.
 */
function processFollowers() {
	if (allFollowers != null)  {
		allFollowers.sort(function (a, b) {
			return b.followers_count - a.followers_count; 
		});
		
		findBiggestRetweeters();
	}
	
}

/** 
 * At this point, our input allFollowers array is ordered by follower numbers. We
 * now go through that list to see which ones will be likely to retweet.
 */
function findBiggestRetweeters() {
	var finishedWhen = allFollowers.length < EXAMINE_TOP_NUM ? allFollowers.length : EXAMINE_TOP_NUM;

	for (var i = 0; i < finishedWhen; i ++) {
		twitter.get('statuses/user_timeline', { user_id: allFollowers[i].id, include_rts: true }, function(error, response) {
			if (error != null) {
				console.log('ERROR: %s', error);
			} else {
				parseUserTimeline(response);

				// If our list of calculatedFollowers is longer than the finished length, we're done
				if (calculatedFollowers.length >= finishedWhen) {
					// We're at the end of the list.
					exportTweeters();
				}
			}

		});
	}

}

/** 
 * This function is called to parse through the retrieved timeline and take note
 * of how likely the user is to retween a tweet from you.
 */
function parseUserTimeline(timelineObj) {
	var timelineUser;

	if (timelineObj != null && timelineObj.length >= 1 && timelineObj[0].user != null) {
		// Retrieves the user id from the first tweet in the list, so we can match it to array.
		timelineUser = getUserObj(timelineObj[0].user.id);
	}
	if (timelineUser == null) {
		console.log('ERROR: Problem identifying user. Does Twitter return the originating user for retweets?');
		return;
	}

	timelineUser.retweetCount = 0;
	for (var i = 0; i < timelineObj.length; i++) {
		if (timelineObj[i].retweeted_status != null) {
			// The existing of "retweeted_status" is enough to know that this was a retweet.
			timelineUser.retweetCount++;
		}
	}

	timelineUser.retweetPercent = timelineUser.retweetCount / timelineObj.length;

	calculatedFollowers.push(timelineUser);

}

/**
 * Gets a reference to the user object in the list of allFollowers
 * @param  int userId The user_id we're looking for
 */
function getUserObj(userId) {
	// allFollowers is ordered at this point, so this should be pretty quick
	for (var i = 0; i < allFollowers.length; i++) {
		if (allFollowers[i].id == userId) {
			return allFollowers[i];
		}
	}

	console.log("nope");
	// Uh-oh. Didn't find this user.
	return null;
}

/**
 * Assuming that the array calculatedFollowers has now been populated, we simply have to 
 * export it.
 */
function exportTweeters() {

	var screennameList = '';

	if (calculatedFollowers != null)  {

		calculatedFollowers.sort(function (a, b) {
			return b.retweetPercent - a.retweetPercent; 
		});

		for (var i = 0; i < calculatedFollowers.length; i++) {
			console.log ("@%s has %d followers and retweets %d% of the time", 
				calculatedFollowers[i].screen_name, calculatedFollowers[i].followers_count, calculatedFollowers[i].retweetPercent * 100);

			screennameList += ' @' + calculatedFollowers[i].screen_name;

			if (i >= LIST_TOP_NUM - 1) break;
		}		

		console.log('\nTweet these people' + screennameList);

	}	

}


