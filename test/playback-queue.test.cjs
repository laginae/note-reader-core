const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createPlaybackQueueState,
  getCurrentPlaybackItem,
  reducePlaybackQueueState,
} = require('../src/playback-queue');

test('creates a ready queue and advances without mutating earlier state', () => {
  const initial = createPlaybackQueueState(['first', 'second']);
  const playing = reducePlaybackQueueState(initial, { type: 'play' });
  const advanced = reducePlaybackQueueState(playing, { type: 'next' });

  assert.equal(initial.status, 'ready');
  assert.equal(initial.currentIndex, 0);
  assert.equal(advanced.status, 'playing');
  assert.equal(advanced.currentIndex, 1);
  assert.equal(getCurrentPlaybackItem(advanced).text, 'second');
});

test('appends progressively produced chunks to an empty queue', () => {
  const initial = createPlaybackQueueState();
  const appended = reducePlaybackQueueState(initial, {
    type: 'append',
    items: [{ metadata: { pageNumber: 2 }, text: 'page two' }],
  });

  assert.equal(appended.status, 'ready');
  assert.equal(appended.currentIndex, 0);
  assert.deepEqual(getCurrentPlaybackItem(appended).metadata, { pageNumber: 2 });
});

test('preserves pause state while changing chunks', () => {
  let state = createPlaybackQueueState(['one', 'two']);
  state = reducePlaybackQueueState(state, { type: 'play' });
  state = reducePlaybackQueueState(state, { type: 'pause' });
  state = reducePlaybackQueueState(state, { type: 'next' });

  assert.equal(state.status, 'paused');
  assert.equal(state.currentIndex, 1);
});

test('reports completion and supports a merge-free retry reset', () => {
  let state = createPlaybackQueueState(['one']);
  state = reducePlaybackQueueState(state, { type: 'play' });
  state = reducePlaybackQueueState(state, { type: 'next' });
  assert.equal(state.status, 'complete');

  state = reducePlaybackQueueState(state, { type: 'stop' });
  assert.equal(state.status, 'ready');
  assert.equal(state.currentIndex, 0);
});
