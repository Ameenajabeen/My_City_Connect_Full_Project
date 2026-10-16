export default () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mycityconnect?schema=public',
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/mycityconnect',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-32-chars-minimum-length!',
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-32-chars-minimum-length!',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'ap-south-1',
    bucket: process.env.AWS_S3_BUCKET || 'mycityconnect-evidence',
    storageDriver: process.env.STORAGE_DRIVER || 'local', // 's3' or 'local'
  },
  ai: {
    serviceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
    autoSelectThreshold: parseFloat(process.env.AI_AUTO_SELECT_THRESHOLD || '0.70'),
    devSimulation: process.env.AI_DEV_SIMULATION === 'true',
    yoloModelPath: process.env.YOLO_MODEL_PATH || '',
  },
  fcm: {
    projectId: process.env.FCM_PROJECT_ID || '',
    clientEmail: process.env.FCM_CLIENT_EMAIL || '',
    privateKey: process.env.FCM_PRIVATE_KEY || '',
  },
  maps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
});
