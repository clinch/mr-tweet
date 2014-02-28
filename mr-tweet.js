
var config = require('./config.js');
var Twit = require('twit');
var prompt = require('prompt');

const MAX_USER_LOOKUPS = 100;	// As defined by the max numbers of users per request. https://dev.twitter.com/docs/api/1.1/get/users/lookup
const LIST_TOP_NUM = 10;

var twitter = new Twit(config.TWITTER_CREDS);

var allFollowers = new Array();
var orderedFollowers = new Array();

// Configure and start the command line prompt
prompt.message = '';
prompt.delimiter = '';
prompt.start();

prompt.get({name: 'screenname', required: true, description: 'Twitter username:'},
	function(err, result) {
		if (err != null) { console.log(err); return; }

		beginSearch(result.screenname);
	}
);

/**
 * Starts the search process on the username provided.
 */
function beginSearch(screenname) {
	console.log('calling twitter...');

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
				console.log("-- %d results", response.length );
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
	console.log("I pity da fool.");

	if (allFollowers != null)  {
		allFollowers.sort(function (a, b) {
			return b.followers_count - a.followers_count; 
		});
		
		//console.log("User %s has %d followers. The most!", allFollowers[0].screen_name, allFollowers[0].followers_count);

		findBiggestRetweeters();
	}
	
	exportTweeters();
}

/** 
 * At this point, our input allFollowers array is ordered by follower numbers. We
 * now go through that list to see which ones will be likely to retweet.
 */
function findBiggestRetweeters() {

	var currStatus;

	for (var i = 0; i < allFollowers.length; i++) {
		currStatus = allFollowers[i].status;
	
		if (currStatus != null && currStatus.retweeted_status != null) {
			orderedFollowers.push(allFollowers[i]);
		}
	
		if (orderedFollowers.length >= LIST_TOP_NUM) break;
	}
}

/**
 * Assuming that the array orderedFollowers has now been populated, we simply have to 
 * export it.
 */
function exportTweeters() {
	for (var i = 0; i < orderedFollowers.length; i++) {
		console.log ("@%s has %d followers and is a retweeter", orderedFollowers[i].screen_name, orderedFollowers[i].followers_count);
	}
}


