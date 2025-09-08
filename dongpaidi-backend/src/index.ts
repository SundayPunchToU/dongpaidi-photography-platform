import 'module-alias/register';
import { startServer } from './app';

/**
 * 应用程序入口点
 */
startServer().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
