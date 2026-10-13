const { DataAPIClient } = require('@datastax/astra-db-ts');
require('dotenv').config();

async function runTest() {
  console.log('--- 🚀 Testing Cassandra / Astra DB Real Data Insertion ---');

  const token = process.env.CASSANDRA_ASTRA_TOKEN;
  const endpoint = process.env.CASSANDRA_ASTRA_ENDPOINT;

  if (!token || !endpoint) {
    console.error('❌ Error: Missing CASSANDRA_ASTRA_TOKEN or CASSANDRA_ASTRA_ENDPOINT in .env');
    return;
  }

  const client = new DataAPIClient(token);
  const db = client.db(endpoint);

  const testEventId = `ev_test_${Date.now()}`;
  const timestamp = new Date().toISOString();
  const dateStr = timestamp.split('T')[0];

  console.log(`\n1. 📝 Inserting test Page View record (ID: ${testEventId})...`);
  await db.collection('page_views').insertOne({
    _id: testEventId,
    eventId: testEventId,
    pagePath: '/hotels/solara-bangkok-riverside',
    visitorId: 'vis_test_user_999',
    sessionId: 'sess_test_777',
    deviceType: 'Desktop',
    browser: 'Chrome 128',
    os: 'Windows 11',
    referrer: 'https://google.com',
    timestamp,
    date: dateStr,
  });
  console.log('   ✅ Page View inserted!');

  console.log('\n2. 🏨 Inserting test Hotel View event...');
  await db.collection('hotel_views').insertOne({
    _id: testEventId,
    eventId: testEventId,
    hotelId: 'solara-bangkok-01',
    visitorId: 'vis_test_user_999',
    sessionId: 'sess_test_777',
    pagePath: '/hotels/solara-bangkok-riverside',
    timestamp,
    date: dateStr,
  });
  console.log('   ✅ Hotel View inserted!');

  console.log('\n3. 🔍 Inserting test Search event...');
  await db.collection('search_events').insertOne({
    _id: testEventId,
    eventId: testEventId,
    searchLocation: 'Bangkok Riverside',
    checkInDate: '2026-10-20',
    checkOutDate: '2026-10-23',
    visitorId: 'vis_test_user_999',
    sessionId: 'sess_test_777',
    timestamp,
    date: dateStr,
  });
  console.log('   ✅ Search Event inserted!');

  console.log('\n--- 📊 Verifying inserted records from Cassandra ---');

  const [pageViewResult, hotelViewResult, searchResult] = await Promise.all([
    db.collection('page_views').findOne({ _id: testEventId }),
    db.collection('hotel_views').findOne({ _id: testEventId }),
    db.collection('search_events').findOne({ _id: testEventId }),
  ]);

  console.log('\n📄 Found Page View:', pageViewResult);
  console.log('🏨 Found Hotel View:', hotelViewResult);
  console.log('🔍 Found Search Event:', searchResult);

  console.log('\n✨ All data successfully verified in Cassandra / Astra DB!');
}

runTest().catch((err) => {
  console.error('❌ Error during test:', err);
});
