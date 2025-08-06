export function keepAlive() {
  const deployUrl = process.env.DEPLOY_URL;
  if (deployUrl) {
    console.log(`🔄 Keep-alive enabled for: ${deployUrl}`);
    
    // Ping every 10 minutes to keep Heroku dyno awake
    // Heroku free dynos sleep after 30 minutes of inactivity
    const intervalMs = 25 * 60 * 1000; // 25 minutes
    
    setInterval(() => {
      console.log('🔄 Pinging server to keep alive...');
      fetch(deployUrl)
        .then((response) => {
          if (response.ok) {
            console.log('✅ Keep-alive ping successful');
          } else {
            console.warn(`⚠️ Keep-alive ping returned status: ${response.status}`);
          }
        })
        .catch((err) => {
          console.error('❌ Failed to keep-alive:', err.message);
        });
    }, intervalMs);
  } else {
    console.log('ℹ️ Keep-alive disabled: DEPLOY_URL not set');
  }
}