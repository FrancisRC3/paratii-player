/* eslint global-require: "off" */

import { assert } from 'chai';

const createVideo = () => {
  const video = {
    id: '12345',
    title: 'Rosencrants and Guildenstern are dead',
    price: 10,
    src: 'https://www.quirksmode.org/html5/videos/big_buck_bunny.mp4',
    stats: {
      likes: 150,
      dislikes: 10,
    },
  };
  const { Videos } = require('/imports/api/videos');
  const v = Videos.findOne({ _id: video.id });
  if (v) {
    Videos.remove({ _id: v._id });
  }
  Meteor.call('videos.create', video);
};

describe('player workflow', function () {
  beforeEach(function () {
    server.execute(createVideo);
  });

  it('play the video', function () {
    browser.url('http://localhost:3000/player/12345');
    browser.waitForExist('#video-player');
    browser.click('#play-pause-button');
    assert.isTrue(browser.getAttribute('#nav', 'class').includes('closed'));
    assert.isTrue(browser.getAttribute('.player-controls', 'class').includes('pause'));
    assert.isTrue(browser.getAttribute('.player-overlay', 'class').includes('pause'));
  });

  it('click on the progress bar', function () {
    browser.url('http://localhost:3000/player/12345');
    browser.waitForExist('#video-player');
    browser.waitForExist('#loaded-bar');
    browser.waitUntil(() => browser.getElementSize('#loaded-bar', 'width') > 30, 5000, 'video load timeout');
    browser.click('#loaded-bar');
    browser.pause(100);
    assert.notEqual(browser.getText('#current-time'), '00:00');
  });
});
