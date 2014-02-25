var should = require("should");

// A basic test to make sure Node, Mocha and Should are all working.
describe('Array', function(){
  describe('#indexOf()', function(){
    it('should return -1 when the value is not present', function(){
	[1,2,3].indexOf(5).should.equal(-1);
	[1,2,3].indexOf(0).should.equal(-1);
    });
  });
});

describe('MrTweet', function() {
	describe('#listTopRetweeters', function() {
		should.have.property('ROOT_SCREEN_NAME');
	});
});
