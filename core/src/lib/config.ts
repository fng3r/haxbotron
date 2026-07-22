/**
 * Centralized configuration for the core application
 */

/**
 * Get database connection configuration
 */
export function getDbConfig() {
  return {
    host: process.env.SERVER_CONN_DB_HOST || '127.0.0.1',
    port: parseInt(process.env.SERVER_CONN_DB_PORT || '12100'),
    version: process.env.SERVER_CONN_DB_VERSION || 'v1',
  };
}

/**
 * Get database connection address URL
 */
export function getDbConnectionUrl(): string {
  const config = getDbConfig();
  return `http://${config.host}:${config.port}/api/${config.version}/`;
}

/**
 * Get server configuration
 */
export function getServerConfig() {
  return {
    port: parseInt(process.env.SERVER_PORT || '12001'),
    level: process.env.SERVER_LEVEL || 'common',
  };
}

/**
 * Get API keys
 */
export function getApiKeys(): string[] {
  return process.env.ALLOWED_API_KEYS?.split(',').map(k => k.trim()).filter(Boolean) || [];
}

/**
 * Get JWT secret
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

/**
 * Get client host for CORS
 */
export function getClientHost(): string {
  return process.env.CLIENT_HOST || '*';
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in test environment
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}
