'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getStore = getStore;
exports.track = track;
exports.dontTrack = dontTrack;

var _configstore = require('configstore');

var _configstore2 = _interopRequireDefault(_configstore);

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var logger = console; // ### WHAT?
//
// We will track anonymous usage of how you use storybook.
// We don't want any personal information.
// We just need to collect following information
//
//  * How many time a user runs start-storybook a day
//
// We will send a ping to our server when you run storybook with above information.

// ### WHY?
//
// We are maintaining React Storybook and we want to improve it.
// We also working on storybooks.io which is storybook related service.
// In order to get a real picture about the storybook usage,
// we need to get some real usage stats, not the amount of NPM downloads.
// This is why we do this.

// ### CAN I STOP THIS?
//
// You(or your company) may have certain policies.
// If so, you can stop sending these metrics. Simply run:
//    start-storybook --dont-track

// ### HELP US?
//
// Maintaining a open source project is hard.
// It's even harder for a startup like us (Kadira)
// Help us to make storybook better by sending these few metrics.
// Based on these metrics, we could improve storybook and build a profitable
// service around it. With that, we could continue to maintain and
// improve Storybook.

function getStore() {
  var key = 'react-storybook-usage';
  var store = new _configstore2.default(key);
  return store;
}

function track() {
  var store = getStore();

  // Just a hash to aggregate metrics. Don't use any personal info.
  var userId = store.get('userId');
  if (!userId) {
    userId = _uuid2.default.v4();
    store.set('userId', userId);
  }

  if (store.get('dontTrack')) {
    // Here we'll try to send a one last ping saying you are asked to don't track.
    // We used this to identify the ratio of dontTrack.
    if (!store.get('notifiedDontTrack')) {
      // We don't wanna worry about the success or failure of this.
      _request2.default.post('https://ping.getstorybook.io/react-storybook-dont-track', {
        json: { userId: userId }
      }, function () {});
      store.set('notifiedDontTrack', true);
    }
    return;
  }

  // We need to clear this in case user decided to track again.
  store.set('notifiedDontTrack', null);

  var pkg = require('../../package.json');

  // We don't wanna worry about the success or failure of this.
  _request2.default.post('https://ping.getstorybook.io/react-storybook-usage', {
    json: {
      userId: userId,
      version: pkg.version
    }
  }, function () {});

  if (!store.get('startTrackingOn')) {
    store.set('startTrackingOn', Date.now());
  }

  var pingsSent = store.get('pingsSent') || 0;
  store.set('pingsSent', pingsSent + 1);

  if (pingsSent < 5) {
    logger.log(' We will collect some anonymous usage stats of how you use storybook.');
    logger.log(' See why?: https://getstorybook.io/tracking');
    logger.log();
  }
}

function dontTrack() {
  var state = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

  var store = getStore();
  store.set('dontTrack', Boolean(state));
}