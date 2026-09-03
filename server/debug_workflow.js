const mongoose = require('mongoose');
const env = require('./src/config/env');

mongoose.connect(env.MONGODB_URI).then(async () => {
  const Workflow = require('./src/models/Workflow');

  // Get the workflow
  const w = await Workflow.findOne({ name: 'YouTube Cat Video Fetcher' });
  console.log('Before:');
  w.nodes.forEach(n => console.log(' -', n.type, '|', JSON.stringify(n.data)));

  // Fix each node directly
  w.nodes = w.nodes.map(n => {
    if (n.type === 'slack_post' || n.type === 'post_to_slack') {
      n.type = 'slack';
      n.data = {
        ...n.data,
        action: 'postMessage',
        channel: n.data?.channel || '#general',
        message: n.data?.message || 'Top video about cats: {video_title} - {video_link}',
      };
    }
    if (n.type === 'youtube' && !n.data?.action) {
      n.data = { ...n.data, action: 'search', query: n.data?.query || 'cats', maxResults: 1 };
    }
    return n;
  });

  w.markModified('nodes');
  await w.save();

  console.log('\nAfter:');
  w.nodes.forEach(n => console.log(' -', n.type, '|', JSON.stringify(n.data)));
  console.log('\nDone! Workflow fixed.');
  mongoose.disconnect();
}).catch(e => console.error('DB error:', e.message));
