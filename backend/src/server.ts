import app from './app';
import { config } from './config';

const start = async () => {
  try {
    app.listen(config.port, '0.0.0.0', () => {
      console.log(`\n🎬 Studio CRM Backend running on http://localhost:${config.port}`);
      console.log(`📡 API available at http://localhost:${config.port}/api`);
      console.log(`🔧 Environment: ${config.nodeEnv}\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
