# Code Examples for Garmin Integration

## 1. OAuth Authentication Flow

```javascript
// Initialize Garmin OAuth
const garminController = require('./garmin.controller');

// Step 1: Redirect user to Garmin authorization
app.get('/auth/garmin', garminController.login);

// Step 2: Handle callback from Garmin
app.get('/auth/garmin/callback', garminController.callback);

// Step 3: Use access token to fetch data
app.get('/api/garmin/health-data', authMiddleware, garminController.getHealthData);
```

## 2. Webhook Implementation

```javascript
// Real-time data synchronization
app.post('/api/garmin/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const webhookData = req.body;
  
  // Process health data updates
  webhookData.forEach(async (dataPoint) => {
    await processGarminHealthUpdate(dataPoint);
    await triggerAICoachingUpdate(dataPoint.userId);
  });
  
  res.status(200).json({ received: true });
});
```

## 3. Error Handling & Retry Logic

```javascript
const retryGarminRequest = async (requestFn, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      console.log(`Garmin API attempt ${attempt} failed: ${error.message}`);
      
      if (attempt === maxRetries) {
        throw new Error(`Garmin API failed after ${maxRetries} attempts`);
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
};
```

## 4. Data Privacy Implementation

```javascript
// GDPR-compliant data handling
const processUserHealthData = async (userId, healthData) => {
  // Encrypt sensitive health data
  const encryptedData = encrypt(healthData, process.env.ENCRYPTION_KEY);
  
  // Store with user consent timestamp
  await HealthData.create({
    userId: userId,
    data: encryptedData,
    consentTimestamp: new Date(),
    retentionUntil: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000) // 2 years
  });
  
  // Log data processing for audit trail
  await auditLog('health_data_processed', { userId, dataType: 'garmin_health' });
};
```

## 5. Real-time AI Coaching Integration

```javascript
// Trigger personalized coaching based on Garmin data
const updateAICoaching = async (userId, newHealthData) => {
  const userProfile = await User.findById(userId);
  const historicalData = await HealthData.find({ userId }).limit(30);
  
  // Analyze patterns and generate recommendations
  const insights = await aiCoachingService.generateInsights({
    currentData: newHealthData,
    historicalData: historicalData,
    userGoals: userProfile.goals
  });
  
  // Send real-time notifications if needed
  if (insights.urgency === 'high') {
    await notificationService.sendRealTimeAlert(userId, insights.message);
  }
};
```
