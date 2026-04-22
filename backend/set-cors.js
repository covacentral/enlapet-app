// backend/set-cors.js
const { bucket } = require('./config/firebase');

async function configureCors() {
  try {
    console.log(`Configuring CORS for Google Cloud Storage bucket: ${bucket.name}`);
    
    await bucket.setCorsConfiguration([
      {
        origin: ['*'],
        method: ['GET', 'OPTIONS'],
        maxAgeSeconds: 3600,
        responseHeader: ['Content-Type', 'Authorization', 'Content-Length', 'User-Agent', 'x-goog-resumable'],
      },
    ]);
    
    console.log('✅ CORS configuration applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to configure CORS:', error.message);
    process.exit(1);
  }
}

configureCors();
