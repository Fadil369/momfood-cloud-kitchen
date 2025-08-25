# 🔒 Security Implementation Plan - MomFood Production Platform

## **Security Strategy Overview**

This document outlines the comprehensive security implementation strategy for the MomFood platform, ensuring enterprise-grade security, compliance with industry standards, and protection of sensitive customer and business data.

## **Security Architecture Framework**

```
┌─────────────────────────────────────────────────────────────────┐
│                         Edge Layer                              │
│  CDN Security │ DDoS Protection │ WAF │ Rate Limiting           │
└─────────────────────────────────────────────────────────────────┘
                                 │
┌─────────────────────────────────────────────────────────────────┐
│                    Application Layer                            │
│ Authentication │ Authorization │ Input Validation │ HTTPS       │
└─────────────────────────────────────────────────────────────────┘
                                 │
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer                              │
│   JWT Tokens   │  API Security  │  Encryption   │  Audit Logs  │
└─────────────────────────────────────────────────────────────────┘
                                 │
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer                                │
│ Database Encryption │ Backup Security │ Access Control         │
└─────────────────────────────────────────────────────────────────┘
```

## **1. Authentication & Authorization**

### **Multi-Factor Authentication (MFA)**

```typescript
// MFA Implementation
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { sendSMS } from '@/services/sms';

class MFAService {
  async setupTOTP(userId: string): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> {
    const secret = speakeasy.generateSecret({
      name: `MomFood (${userId})`,
      issuer: 'MomFood',
      length: 32
    });

    // Generate QR code for authenticator apps
    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    // Store encrypted secret in database
    await this.storeUserMFASecret(userId, secret.base32, backupCodes);

    return {
      secret: secret.base32,
      qrCode,
      backupCodes
    };
  }

  async verifyTOTP(userId: string, token: string): Promise<boolean> {
    const userSecret = await this.getUserMFASecret(userId);
    
    if (!userSecret) {
      throw new Error('MFA not setup for user');
    }

    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret: userSecret,
      encoding: 'base32',
      token,
      window: 2 // Allow for time drift
    });

    if (verified) {
      // Log successful MFA verification
      await this.logMFAEvent(userId, 'totp_success');
      return true;
    }

    // Check if it's a backup code
    const isBackupCode = await this.verifyBackupCode(userId, token);
    if (isBackupCode) {
      await this.logMFAEvent(userId, 'backup_code_used');
      return true;
    }

    await this.logMFAEvent(userId, 'totp_failed');
    return false;
  }

  async sendSMSCode(userId: string, phoneNumber: string): Promise<void> {
    const code = this.generateSMSCode();
    const expiryTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store code temporarily
    await this.storeSMSCode(userId, code, expiryTime);

    // Send SMS
    await sendSMS(phoneNumber, `Your MomFood verification code is: ${code}`);

    await this.logMFAEvent(userId, 'sms_sent');
  }

  async verifySMSCode(userId: string, code: string): Promise<boolean> {
    const storedCode = await this.getSMSCode(userId);
    
    if (!storedCode || storedCode.expiryTime < new Date()) {
      await this.logMFAEvent(userId, 'sms_expired');
      return false;
    }

    if (storedCode.code === code) {
      await this.deleteSMSCode(userId);
      await this.logMFAEvent(userId, 'sms_success');
      return true;
    }

    await this.logMFAEvent(userId, 'sms_failed');
    return false;
  }

  private generateBackupCodes(): string[] {
    return Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );
  }

  private generateSMSCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
```

### **Advanced JWT Implementation**

```typescript
// Enhanced JWT service with security features
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Redis } from 'ioredis';

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  permissions: string[];
  sessionId: string;
  deviceFingerprint?: string;
  ipAddress?: string;
}

class JWTService {
  private redis: Redis;
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  private accessTokenExpiry = '15m';
  private refreshTokenExpiry = '7d';

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET!;
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET!;
  }

  async generateTokenPair(user: any, deviceInfo?: any): Promise<{
    accessToken: string;
    refreshToken: string;
    sessionId: string;
  }> {
    const sessionId = crypto.randomUUID();
    const deviceFingerprint = this.generateDeviceFingerprint(deviceInfo);

    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: this.getUserPermissions(user.role),
      sessionId,
      deviceFingerprint,
      ipAddress: deviceInfo?.ipAddress
    };

    // Generate access token
    const accessToken = jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'momfood-api',
      audience: 'momfood-app',
      algorithm: 'HS256'
    });

    // Generate refresh token with only essential data
    const refreshToken = jwt.sign(
      { 
        sub: user.id, 
        sessionId,
        type: 'refresh'
      }, 
      this.refreshTokenSecret,
      {
        expiresIn: this.refreshTokenExpiry,
        issuer: 'momfood-api',
        audience: 'momfood-app',
        algorithm: 'HS256'
      }
    );

    // Store session data in Redis
    await this.storeSession(sessionId, {
      userId: user.id,
      deviceFingerprint,
      ipAddress: deviceInfo?.ipAddress,
      userAgent: deviceInfo?.userAgent,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    });

    return { accessToken, refreshToken, sessionId };
  }

  async verifyAccessToken(token: string, deviceInfo?: any): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(token, this.accessTokenSecret) as TokenPayload;

      // Verify session is still valid
      const session = await this.getSession(payload.sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Verify device fingerprint for additional security
      if (payload.deviceFingerprint && deviceInfo) {
        const currentFingerprint = this.generateDeviceFingerprint(deviceInfo);
        if (payload.deviceFingerprint !== currentFingerprint) {
          await this.logSecurityEvent(payload.sub, 'device_mismatch', {
            expectedFingerprint: payload.deviceFingerprint,
            actualFingerprint: currentFingerprint
          });
          throw new Error('Device fingerprint mismatch');
        }
      }

      // Update last activity
      await this.updateSessionActivity(payload.sessionId);

      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      }
      throw error;
    }
  }

  async refreshTokenPair(refreshToken: string, deviceInfo?: any): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      const payload = jwt.verify(refreshToken, this.refreshTokenSecret) as any;

      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Verify session exists and is valid
      const session = await this.getSession(payload.sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Get user data
      const user = await this.getUserById(payload.sub);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new token pair
      const newTokenPair = await this.generateTokenPair(user, deviceInfo);

      // Invalidate old session
      await this.invalidateSession(payload.sessionId);

      return {
        accessToken: newTokenPair.accessToken,
        refreshToken: newTokenPair.refreshToken
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      }
      throw error;
    }
  }

  async invalidateSession(sessionId: string): Promise<void> {
    await this.redis.del(`session:${sessionId}`);
    await this.logSecurityEvent('system', 'session_invalidated', { sessionId });
  }

  async invalidateAllUserSessions(userId: string): Promise<void> {
    const sessionKeys = await this.redis.keys(`session:*`);
    const sessions = await this.redis.mget(sessionKeys);

    const userSessionKeys = sessionKeys.filter((key, index) => {
      const session = sessions[index] ? JSON.parse(sessions[index]!) : null;
      return session && session.userId === userId;
    });

    if (userSessionKeys.length > 0) {
      await this.redis.del(...userSessionKeys);
    }

    await this.logSecurityEvent(userId, 'all_sessions_invalidated');
  }

  private generateDeviceFingerprint(deviceInfo?: any): string {
    if (!deviceInfo) return '';

    const components = [
      deviceInfo.userAgent || '',
      deviceInfo.language || '',
      deviceInfo.platform || '',
      deviceInfo.screenResolution || '',
      deviceInfo.timezone || ''
    ].join('|');

    return crypto.createHash('sha256').update(components).digest('hex');
  }

  private async storeSession(sessionId: string, sessionData: any): Promise<void> {
    await this.redis.setex(
      `session:${sessionId}`,
      7 * 24 * 60 * 60, // 7 days
      JSON.stringify(sessionData)
    );
  }

  private async getSession(sessionId: string): Promise<any> {
    const session = await this.redis.get(`session:${sessionId}`);
    return session ? JSON.parse(session) : null;
  }

  private async updateSessionActivity(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.lastActivity = new Date().toISOString();
      await this.storeSession(sessionId, session);
    }
  }
}
```

### **Role-Based Access Control (RBAC)**

```typescript
// Advanced RBAC implementation
interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

interface Role {
  name: string;
  permissions: Permission[];
  inherits?: string[];
}

class RBACService {
  private roles: Map<string, Role> = new Map();

  constructor() {
    this.initializeRoles();
  }

  private initializeRoles(): void {
    // Customer role
    this.roles.set('customer', {
      name: 'customer',
      permissions: [
        { resource: 'profile', action: 'read' },
        { resource: 'profile', action: 'update' },
        { resource: 'orders', action: 'create' },
        { resource: 'orders', action: 'read', conditions: { owner: true } },
        { resource: 'restaurants', action: 'read' },
        { resource: 'menu', action: 'read' },
        { resource: 'reviews', action: 'create', conditions: { orderCompleted: true } },
        { resource: 'addresses', action: 'create' },
        { resource: 'addresses', action: 'update', conditions: { owner: true } },
        { resource: 'payments', action: 'create' }
      ]
    });

    // Restaurant owner role
    this.roles.set('restaurant_owner', {
      name: 'restaurant_owner',
      permissions: [
        { resource: 'profile', action: 'read' },
        { resource: 'profile', action: 'update' },
        { resource: 'restaurant', action: 'create' },
        { resource: 'restaurant', action: 'read', conditions: { owner: true } },
        { resource: 'restaurant', action: 'update', conditions: { owner: true } },
        { resource: 'menu', action: 'create', conditions: { restaurantOwner: true } },
        { resource: 'menu', action: 'read', conditions: { restaurantOwner: true } },
        { resource: 'menu', action: 'update', conditions: { restaurantOwner: true } },
        { resource: 'menu', action: 'delete', conditions: { restaurantOwner: true } },
        { resource: 'orders', action: 'read', conditions: { restaurantOwner: true } },
        { resource: 'orders', action: 'update', conditions: { restaurantOwner: true } },
        { resource: 'analytics', action: 'read', conditions: { restaurantOwner: true } },
        { resource: 'payouts', action: 'read', conditions: { owner: true } }
      ]
    });

    // Driver role
    this.roles.set('driver', {
      name: 'driver',
      permissions: [
        { resource: 'profile', action: 'read' },
        { resource: 'profile', action: 'update' },
        { resource: 'orders', action: 'read', conditions: { assignedDriver: true } },
        { resource: 'orders', action: 'update', conditions: { assignedDriver: true } },
        { resource: 'location', action: 'update', conditions: { self: true } },
        { resource: 'earnings', action: 'read', conditions: { self: true } },
        { resource: 'delivery', action: 'create' },
        { resource: 'delivery', action: 'update', conditions: { assignedDriver: true } }
      ]
    });

    // Admin role
    this.roles.set('admin', {
      name: 'admin',
      permissions: [
        { resource: '*', action: '*' } // Admin has all permissions
      ]
    });
  }

  hasPermission(userRole: string, resource: string, action: string, context?: any): boolean {
    const role = this.roles.get(userRole);
    if (!role) return false;

    // Check if user has wildcard permission (admin)
    const wildcardPermission = role.permissions.find(p => 
      p.resource === '*' && p.action === '*'
    );
    if (wildcardPermission) return true;

    // Find matching permission
    const permission = role.permissions.find(p => 
      (p.resource === resource || p.resource === '*') &&
      (p.action === action || p.action === '*')
    );

    if (!permission) return false;

    // Check conditions if present
    if (permission.conditions && context) {
      return this.evaluateConditions(permission.conditions, context);
    }

    return true;
  }

  private evaluateConditions(conditions: Record<string, any>, context: any): boolean {
    for (const [key, value] of Object.entries(conditions)) {
      switch (key) {
        case 'owner':
          if (value && context.userId !== context.resourceOwnerId) {
            return false;
          }
          break;
        case 'restaurantOwner':
          if (value && context.userId !== context.restaurant?.ownerId) {
            return false;
          }
          break;
        case 'assignedDriver':
          if (value && context.userId !== context.order?.driverId) {
            return false;
          }
          break;
        case 'self':
          if (value && context.userId !== context.targetUserId) {
            return false;
          }
          break;
        case 'orderCompleted':
          if (value && context.order?.status !== 'delivered') {
            return false;
          }
          break;
        default:
          if (context[key] !== value) {
            return false;
          }
      }
    }
    return true;
  }
}

// Middleware for RBAC
export const requirePermission = (resource: string, action: string) => {
  return async (req: any, res: any, next: any) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        });
      }

      const rbac = new RBACService();
      const context = {
        userId: user.id,
        resourceOwnerId: req.params.userId || req.body.userId,
        restaurant: req.restaurant,
        order: req.order,
        targetUserId: req.params.id
      };

      const hasPermission = rbac.hasPermission(user.role, resource, action, context);

      if (!hasPermission) {
        await logSecurityEvent(user.id, 'unauthorized_access_attempt', {
          resource,
          action,
          endpoint: req.path,
          method: req.method
        });

        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Insufficient permissions' }
        });
      }

      next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Authorization check failed' }
      });
    }
  };
};
```

## **2. Data Encryption & Protection**

### **Data Encryption Service**

```typescript
// Comprehensive encryption service
import crypto from 'crypto';
import bcrypt from 'bcrypt';

class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private keyDerivationAlgorithm = 'pbkdf2';
  private keyLength = 32;
  private ivLength = 16;
  private saltLength = 32;
  private tagLength = 16;
  private iterations = 100000;

  // Field-level encryption for sensitive data
  async encryptSensitiveField(data: string, key?: string): Promise<string> {
    try {
      const encryptionKey = key || process.env.FIELD_ENCRYPTION_KEY!;
      const derivedKey = crypto.pbkdf2Sync(
        encryptionKey,
        crypto.randomBytes(this.saltLength),
        this.iterations,
        this.keyLength,
        'sha256'
      );

      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, derivedKey);
      cipher.setAAD(Buffer.from('momfood-field-encryption'));

      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      // Combine IV, tag, and encrypted data
      const result = {
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        encrypted: encrypted
      };

      return Buffer.from(JSON.stringify(result)).toString('base64');
    } catch (error) {
      throw new Error('Encryption failed');
    }
  }

  async decryptSensitiveField(encryptedData: string, key?: string): Promise<string> {
    try {
      const encryptionKey = key || process.env.FIELD_ENCRYPTION_KEY!;
      const data = JSON.parse(Buffer.from(encryptedData, 'base64').toString());

      const derivedKey = crypto.pbkdf2Sync(
        encryptionKey,
        Buffer.from(data.salt, 'hex'),
        this.iterations,
        this.keyLength,
        'sha256'
      );

      const decipher = crypto.createDecipher(this.algorithm, derivedKey);
      decipher.setAAD(Buffer.from('momfood-field-encryption'));
      decipher.setAuthTag(Buffer.from(data.tag, 'hex'));

      let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed');
    }
  }

  // Password hashing with bcrypt
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // PCI-compliant payment data encryption
  async encryptPaymentData(paymentData: any): Promise<string> {
    const key = process.env.PCI_ENCRYPTION_KEY!;
    
    // Use stronger encryption for payment data
    const salt = crypto.randomBytes(this.saltLength);
    const derivedKey = crypto.pbkdf2Sync(key, salt, this.iterations, this.keyLength, 'sha256');
    
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipher(this.algorithm, derivedKey);
    
    let encrypted = cipher.update(JSON.stringify(paymentData), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    const result = {
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      encrypted: encrypted
    };
    
    return Buffer.from(JSON.stringify(result)).toString('base64');
  }

  // Secure token generation
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // HMAC for data integrity
  generateHMAC(data: string, secret?: string): string {
    const key = secret || process.env.HMAC_SECRET!;
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  }

  verifyHMAC(data: string, signature: string, secret?: string): boolean {
    const key = secret || process.env.HMAC_SECRET!;
    const computedSignature = crypto.createHmac('sha256', key).update(data).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(computedSignature, 'hex'));
  }
}
```

### **Database Security Implementation**

```typescript
// Database security middleware and configuration
import { Pool } from 'pg';
import { EncryptionService } from './EncryptionService';

class SecureDatabaseService {
  private pool: Pool;
  private encryptionService: EncryptionService;

  constructor() {
    this.encryptionService = new EncryptionService();
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: {
        rejectUnauthorized: false,
        ca: process.env.DB_SSL_CA,
        cert: process.env.DB_SSL_CERT,
        key: process.env.DB_SSL_KEY
      },
      // Connection security
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      // Enable row-level security
      application_name: 'momfood-api'
    });
  }

  // Secure query execution with parameter binding
  async secureQuery(text: string, params: any[] = []): Promise<any> {
    const client = await this.pool.connect();
    try {
      // Log query for audit (without sensitive data)
      await this.logDatabaseAccess(text, params);

      // Execute query with parameterized inputs to prevent SQL injection
      const result = await client.query(text, params);
      return result;
    } catch (error) {
      // Log error for security monitoring
      await this.logDatabaseError(error, text);
      throw error;
    } finally {
      client.release();
    }
  }

  // Encrypted field storage
  async storeEncryptedUser(userData: any): Promise<string> {
    const {
      email,
      phone,
      password,
      firstName,
      lastName,
      role,
      nationalId,
      bankAccount,
      ...otherData
    } = userData;

    // Hash password
    const passwordHash = await this.encryptionService.hashPassword(password);

    // Encrypt sensitive fields
    const encryptedNationalId = nationalId ? 
      await this.encryptionService.encryptSensitiveField(nationalId) : null;
    const encryptedBankAccount = bankAccount ? 
      await this.encryptionService.encryptSensitiveField(JSON.stringify(bankAccount)) : null;

    const query = `
      INSERT INTO users (
        email, phone, password_hash, first_name, last_name, role,
        national_id_encrypted, bank_account_encrypted, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id
    `;

    const params = [
      email,
      phone,
      passwordHash,
      firstName,
      lastName,
      role,
      encryptedNationalId,
      encryptedBankAccount
    ];

    const result = await this.secureQuery(query, params);
    return result.rows[0].id;
  }

  // Row-level security implementation
  async enableRowLevelSecurity(): Promise<void> {
    const policies = [
      // Users can only see their own data
      `
        CREATE POLICY user_isolation ON users
        FOR ALL TO application_role
        USING (id = current_setting('app.current_user_id')::uuid)
      `,
      
      // Restaurant owners can only see their restaurant data
      `
        CREATE POLICY restaurant_owner_isolation ON restaurants
        FOR ALL TO application_role
        USING (owner_id = current_setting('app.current_user_id')::uuid)
      `,
      
      // Customers can only see their own orders
      `
        CREATE POLICY customer_order_isolation ON orders
        FOR SELECT TO application_role
        USING (customer_id = current_setting('app.current_user_id')::uuid)
      `,
      
      // Drivers can only see assigned orders
      `
        CREATE POLICY driver_order_isolation ON orders
        FOR ALL TO application_role
        USING (
          driver_id = current_setting('app.current_user_id')::uuid OR
          current_setting('app.current_user_role') = 'admin'
        )
      `
    ];

    for (const policy of policies) {
      try {
        await this.secureQuery(policy);
      } catch (error) {
        console.error('Failed to create policy:', error);
      }
    }
  }

  // Audit logging
  private async logDatabaseAccess(query: string, params: any[]): Promise<void> {
    // Remove sensitive data from logs
    const sanitizedParams = params.map(param => {
      if (typeof param === 'string' && param.length > 50) {
        return '[REDACTED]';
      }
      return param;
    });

    const logEntry = {
      timestamp: new Date().toISOString(),
      query: query.substring(0, 100), // Truncate long queries
      paramCount: params.length,
      user: process.env.DB_USER
    };

    // Store in audit log table
    await this.pool.query(
      'INSERT INTO audit_logs (action, details, created_at) VALUES ($1, $2, NOW())',
      ['database_access', JSON.stringify(logEntry)]
    );
  }

  private async logDatabaseError(error: any, query: string): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      error: error.message,
      query: query.substring(0, 100),
      stack: error.stack
    };

    try {
      await this.pool.query(
        'INSERT INTO security_logs (event_type, details, created_at) VALUES ($1, $2, NOW())',
        ['database_error', JSON.stringify(logEntry)]
      );
    } catch (logError) {
      console.error('Failed to log database error:', logError);
    }
  }
}
```

## **3. API Security Implementation**

### **Advanced Rate Limiting & DDoS Protection**

```typescript
// Sophisticated rate limiting implementation
import { Redis } from 'ioredis';
import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  skipIf?: (req: Request) => boolean;
  onLimitReached?: (req: Request, res: Response) => void;
}

class AdvancedRateLimiter {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
  }

  // Sliding window rate limiter
  createSlidingWindowLimiter(config: RateLimitConfig) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (config.skipIf && config.skipIf(req)) {
          return next();
        }

        const key = config.keyGenerator ? config.keyGenerator(req) : this.getDefaultKey(req);
        const now = Date.now();
        const window = config.windowMs;

        // Remove expired entries
        await this.redis.zremrangebyscore(key, 0, now - window);

        // Count current requests
        const currentRequests = await this.redis.zcard(key);

        if (currentRequests >= config.maxRequests) {
          // Get reset time
          const oldestRequest = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
          const resetTime = oldestRequest.length > 0 ? 
            parseInt(oldestRequest[1]) + window : now + window;

          // Add rate limit headers
          res.set({
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
            'Retry-After': Math.ceil((resetTime - now) / 1000).toString()
          });

          if (config.onLimitReached) {
            config.onLimitReached(req, res);
          }

          return res.status(429).json({
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests, please try again later'
            }
          });
        }

        // Add current request
        await this.redis.zadd(key, now, `${now}-${Math.random()}`);
        await this.redis.expire(key, Math.ceil(window / 1000));

        // Add rate limit headers
        res.set({
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': (config.maxRequests - currentRequests - 1).toString(),
          'X-RateLimit-Reset': Math.ceil((now + window) / 1000).toString()
        });

        next();
      } catch (error) {
        console.error('Rate limiting error:', error);
        // Fail open to not block legitimate requests
        next();
      }
    };
  }

  // Adaptive rate limiting based on user behavior
  createAdaptiveRateLimiter(baseConfig: RateLimitConfig) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const userKey = this.getUserKey(req);
      const suspiciousScore = await this.calculateSuspiciousScore(userKey);
      
      // Adjust rate limits based on suspicious behavior
      const adjustedConfig = { ...baseConfig };
      if (suspiciousScore > 0.7) {
        adjustedConfig.maxRequests = Math.floor(baseConfig.maxRequests * 0.3);
      } else if (suspiciousScore > 0.5) {
        adjustedConfig.maxRequests = Math.floor(baseConfig.maxRequests * 0.6);
      }

      const limiter = this.createSlidingWindowLimiter(adjustedConfig);
      return limiter(req, res, next);
    };
  }

  // DDoS protection with pattern detection
  createDDoSProtection() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const ip = this.getClientIP(req);
      const userAgent = req.get('User-Agent') || '';
      
      // Check for suspicious patterns
      const isBot = this.detectBot(userAgent);
      const hasValidHeaders = this.validateHeaders(req);
      const requestPattern = await this.analyzeRequestPattern(ip);

      if (isBot && !this.isAllowedBot(userAgent)) {
        await this.logSecurityEvent('bot_detected', { ip, userAgent });
        return res.status(403).json({
          success: false,
          error: { code: 'BOT_DETECTED', message: 'Automated requests not allowed' }
        });
      }

      if (!hasValidHeaders) {
        await this.logSecurityEvent('invalid_headers', { ip, headers: req.headers });
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_REQUEST', message: 'Invalid request headers' }
        });
      }

      if (requestPattern.isDDoS) {
        await this.logSecurityEvent('ddos_detected', { ip, pattern: requestPattern });
        await this.blockIP(ip, 3600); // Block for 1 hour
        return res.status(429).json({
          success: false,
          error: { code: 'DDOS_PROTECTION', message: 'Request blocked by DDoS protection' }
        });
      }

      next();
    };
  }

  private getDefaultKey(req: Request): string {
    const ip = this.getClientIP(req);
    const userId = req.user?.id || 'anonymous';
    return `rate_limit:${ip}:${userId}`;
  }

  private getUserKey(req: Request): string {
    return req.user?.id || this.getClientIP(req);
  }

  private getClientIP(req: Request): string {
    return req.get('CF-Connecting-IP') || 
           req.get('X-Forwarded-For')?.split(',')[0] || 
           req.ip || 
           req.connection.remoteAddress || 
           '';
  }

  private async calculateSuspiciousScore(userKey: string): Promise<number> {
    const factors = [
      await this.checkFailedLogins(userKey),
      await this.checkRapidRequests(userKey),
      await this.checkErrorRate(userKey),
      await this.checkGeolocationChanges(userKey)
    ];

    return factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
  }

  private detectBot(userAgent: string): boolean {
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /curl/i, /wget/i, /python/i, /ruby/i
    ];
    
    return botPatterns.some(pattern => pattern.test(userAgent));
  }

  private isAllowedBot(userAgent: string): boolean {
    const allowedBots = [
      /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i
    ];
    
    return allowedBots.some(pattern => pattern.test(userAgent));
  }

  private validateHeaders(req: Request): boolean {
    const requiredHeaders = ['user-agent', 'accept'];
    const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip'];
    
    // Check for required headers
    for (const header of requiredHeaders) {
      if (!req.get(header)) {
        return false;
      }
    }

    // Check for header manipulation
    const xForwardedFor = req.get('X-Forwarded-For');
    if (xForwardedFor && xForwardedFor.split(',').length > 5) {
      return false; // Too many proxy hops
    }

    return true;
  }

  private async analyzeRequestPattern(ip: string): Promise<{ isDDoS: boolean; score: number }> {
    const timeWindow = 60000; // 1 minute
    const now = Date.now();
    
    // Get request history
    const requests = await this.redis.zrangebyscore(
      `requests:${ip}`, 
      now - timeWindow, 
      now
    );

    // Calculate request rate
    const requestRate = requests.length / (timeWindow / 1000);
    
    // Check for burst patterns
    const burstThreshold = 50; // requests per second
    if (requestRate > burstThreshold) {
      return { isDDoS: true, score: 1.0 };
    }

    // Check for sustained high rate
    const sustainedThreshold = 20; // requests per second
    if (requestRate > sustainedThreshold) {
      return { isDDoS: true, score: 0.8 };
    }

    return { isDDoS: false, score: requestRate / sustainedThreshold };
  }

  private async blockIP(ip: string, duration: number): Promise<void> {
    await this.redis.setex(`blocked:${ip}`, duration, '1');
    await this.logSecurityEvent('ip_blocked', { ip, duration });
  }

  private async logSecurityEvent(eventType: string, details: any): Promise<void> {
    const event = {
      type: eventType,
      details,
      timestamp: new Date().toISOString(),
      severity: this.getEventSeverity(eventType)
    };

    await this.redis.lpush('security_events', JSON.stringify(event));
    await this.redis.ltrim('security_events', 0, 9999); // Keep last 10k events
  }

  private getEventSeverity(eventType: string): string {
    const severityMap: Record<string, string> = {
      'bot_detected': 'medium',
      'invalid_headers': 'low',
      'ddos_detected': 'high',
      'ip_blocked': 'high'
    };

    return severityMap[eventType] || 'low';
  }
}
```

### **Input Validation & Sanitization**

```typescript
// Comprehensive input validation and sanitization
import { body, param, query, validationResult } from 'express-validator';
import DOMPurify from 'isomorphic-dompurify';
import { Request, Response, NextFunction } from 'express';

class InputValidationService {
  // SQL injection prevention
  static sanitizeForSQL(input: string): string {
    if (typeof input !== 'string') return input;
    
    // Remove SQL injection patterns
    const sqlPatterns = [
      /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
      /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
      /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
      /((\%27)|(\'))union/i
    ];
    
    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        throw new Error('Potentially malicious input detected');
      }
    }
    
    return input;
  }

  // XSS prevention
  static sanitizeHTML(input: string): string {
    if (typeof input !== 'string') return input;
    
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u'],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });
  }

  // Path traversal prevention
  static sanitizePath(input: string): string {
    if (typeof input !== 'string') return input;
    
    // Remove path traversal patterns
    const pathPatterns = [
      /\.\.\//g,
      /\.\.\\/g,
      /%2e%2e%2f/gi,
      /%2e%2e%5c/gi
    ];
    
    let sanitized = input;
    for (const pattern of pathPatterns) {
      sanitized = sanitized.replace(pattern, '');
    }
    
    return sanitized;
  }

  // Command injection prevention
  static sanitizeCommand(input: string): string {
    if (typeof input !== 'string') return input;
    
    const commandPatterns = [
      /[;&|`${}()\[\]<>'"\\]/g,
      /\$\(/g,
      /`.*`/g
    ];
    
    for (const pattern of commandPatterns) {
      if (pattern.test(input)) {
        throw new Error('Command injection attempt detected');
      }
    }
    
    return input;
  }

  // Email validation with domain blacklist
  static validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return false;
    
    // Check against blacklisted domains
    const blacklistedDomains = [
      'tempmail.org', '10minutemail.com', 'guerrillamail.com',
      'mailinator.com', 'throwaway.email'
    ];
    
    const domain = email.split('@')[1].toLowerCase();
    return !blacklistedDomains.includes(domain);
  }

  // Phone number validation (Saudi Arabia format)
  static validateSaudiPhone(phone: string): boolean {
    const phoneRegex = /^(\+966|0)?[5-9][0-9]{8}$/;
    return phoneRegex.test(phone);
  }

  // Password strength validation
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    // Check against common passwords
    const commonPasswords = [
      'password', '123456', 'qwerty', 'abc123', 'password123',
      'admin', 'letmein', 'welcome', 'monkey', 'dragon'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Validation middleware factory
export const createValidationRules = (type: string) => {
  switch (type) {
    case 'register':
      return [
        body('email')
          .isEmail()
          .normalizeEmail()
          .custom((value) => {
            if (!InputValidationService.validateEmail(value)) {
              throw new Error('Invalid email domain');
            }
            return true;
          }),
        body('phone')
          .optional()
          .custom((value) => {
            if (value && !InputValidationService.validateSaudiPhone(value)) {
              throw new Error('Invalid Saudi phone number format');
            }
            return true;
          }),
        body('password')
          .custom((value) => {
            const validation = InputValidationService.validatePassword(value);
            if (!validation.isValid) {
              throw new Error(validation.errors.join(', '));
            }
            return true;
          }),
        body('firstName')
          .trim()
          .isLength({ min: 2, max: 50 })
          .matches(/^[a-zA-Z\u0600-\u06FF\s]+$/)
          .customSanitizer(InputValidationService.sanitizeHTML),
        body('lastName')
          .trim()
          .isLength({ min: 2, max: 50 })
          .matches(/^[a-zA-Z\u0600-\u06FF\s]+$/)
          .customSanitizer(InputValidationService.sanitizeHTML)
      ];

    case 'restaurant':
      return [
        body('name')
          .trim()
          .isLength({ min: 2, max: 200 })
          .customSanitizer(InputValidationService.sanitizeHTML),
        body('description')
          .optional()
          .isLength({ max: 1000 })
          .customSanitizer(InputValidationService.sanitizeHTML),
        body('phone')
          .custom((value) => {
            if (!InputValidationService.validateSaudiPhone(value)) {
              throw new Error('Invalid phone number format');
            }
            return true;
          }),
        body('address.street')
          .trim()
          .isLength({ min: 5, max: 200 })
          .customSanitizer(InputValidationService.sanitizePath),
        body('address.latitude')
          .isFloat({ min: -90, max: 90 }),
        body('address.longitude')
          .isFloat({ min: -180, max: 180 })
      ];

    case 'order':
      return [
        body('restaurantId')
          .isUUID()
          .customSanitizer(InputValidationService.sanitizeForSQL),
        body('items')
          .isArray({ min: 1 })
          .custom((items) => {
            for (const item of items) {
              if (!item.menuItemId || !item.quantity) {
                throw new Error('Invalid order item structure');
              }
              if (item.quantity < 1 || item.quantity > 50) {
                throw new Error('Invalid quantity');
              }
            }
            return true;
          }),
        body('deliveryAddress.street')
          .trim()
          .isLength({ min: 5, max: 200 })
          .customSanitizer(InputValidationService.sanitizePath),
        body('specialInstructions')
          .optional()
          .isLength({ max: 500 })
          .customSanitizer(InputValidationService.sanitizeHTML)
      ];

    default:
      return [];
  }
};

// Validation error handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: formattedErrors
      }
    });
  }

  next();
};
```

## **4. Security Monitoring & Incident Response**

### **Security Event Monitoring**

```typescript
// Security monitoring and alerting system
import { EventEmitter } from 'events';
import nodemailer from 'nodemailer';

interface SecurityEvent {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  userId?: string;
  ipAddress?: string;
  details: Record<string, any>;
  timestamp: Date;
}

class SecurityMonitoringService extends EventEmitter {
  private alertThresholds: Map<string, number> = new Map();
  private eventCounts: Map<string, number> = new Map();
  private emailTransporter: any;

  constructor() {
    super();
    this.initializeAlertThresholds();
    this.setupEmailTransporter();
    this.setupEventHandlers();
  }

  private initializeAlertThresholds(): void {
    this.alertThresholds.set('failed_login', 5);
    this.alertThresholds.set('unauthorized_access', 3);
    this.alertThresholds.set('ddos_detected', 1);
    this.alertThresholds.set('suspicious_payment', 1);
    this.alertThresholds.set('data_breach_attempt', 1);
  }

  private setupEmailTransporter(): void {
    this.emailTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  private setupEventHandlers(): void {
    this.on('security_event', this.handleSecurityEvent.bind(this));
    this.on('critical_alert', this.handleCriticalAlert.bind(this));
    this.on('threshold_exceeded', this.handleThresholdExceeded.bind(this));
  }

  async logSecurityEvent(eventData: Partial<SecurityEvent>): Promise<void> {
    const event: SecurityEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...eventData
    } as SecurityEvent;

    // Store in database
    await this.storeSecurityEvent(event);

    // Emit event for real-time processing
    this.emit('security_event', event);

    // Check for patterns and thresholds
    await this.analyzeEvent(event);
  }

  private async handleSecurityEvent(event: SecurityEvent): Promise<void> {
    console.log(`Security event: ${event.type} - ${event.severity}`);

    // Real-time response for critical events
    if (event.severity === 'critical') {
      await this.triggerImmediateResponse(event);
    }

    // Update security metrics
    await this.updateSecurityMetrics(event);

    // Check for correlation with other events
    await this.correlateEvents(event);
  }

  private async triggerImmediateResponse(event: SecurityEvent): Promise<void> {
    switch (event.type) {
      case 'ddos_detected':
        await this.activateDDoSProtection(event);
        break;
      
      case 'data_breach_attempt':
        await this.lockDownSystem(event);
        break;
      
      case 'suspicious_payment':
        await this.freezePaymentProcessing(event);
        break;
      
      case 'admin_account_compromise':
        await this.disableAdminAccess(event);
        break;
    }

    // Send immediate alert
    await this.sendCriticalAlert(event);
  }

  private async analyzeEvent(event: SecurityEvent): Promise<void> {
    const eventKey = `${event.type}:${event.ipAddress || 'unknown'}`;
    const currentCount = this.eventCounts.get(eventKey) || 0;
    const newCount = currentCount + 1;
    
    this.eventCounts.set(eventKey, newCount);

    // Check threshold
    const threshold = this.alertThresholds.get(event.type);
    if (threshold && newCount >= threshold) {
      this.emit('threshold_exceeded', { event, count: newCount, threshold });
    }

    // Pattern detection
    await this.detectPatterns(event);
  }

  private async detectPatterns(event: SecurityEvent): Promise<void> {
    const timeWindow = 5 * 60 * 1000; // 5 minutes
    const recentEvents = await this.getRecentEvents(event.type, timeWindow);

    // Detect coordinated attacks
    if (this.isCoordinatedAttack(recentEvents)) {
      await this.logSecurityEvent({
        type: 'coordinated_attack_detected',
        severity: 'critical',
        source: 'pattern_detection',
        details: {
          relatedEvents: recentEvents.map(e => e.id),
          pattern: 'coordinated_attack'
        }
      });
    }

    // Detect geographic anomalies
    if (this.isGeographicAnomaly(recentEvents)) {
      await this.logSecurityEvent({
        type: 'geographic_anomaly',
        severity: 'medium',
        source: 'pattern_detection',
        details: {
          relatedEvents: recentEvents.map(e => e.id),
          pattern: 'geographic_anomaly'
        }
      });
    }
  }

  private isCoordinatedAttack(events: SecurityEvent[]): boolean {
    if (events.length < 3) return false;

    // Check if events come from different IPs but similar patterns
    const uniqueIPs = new Set(events.map(e => e.ipAddress));
    const timeSpread = Math.max(...events.map(e => e.timestamp.getTime())) - 
                     Math.min(...events.map(e => e.timestamp.getTime()));

    return uniqueIPs.size >= 3 && timeSpread < 60000; // 1 minute
  }

  private isGeographicAnomaly(events: SecurityEvent[]): boolean {
    // This would integrate with geolocation service
    // For now, simple implementation
    const uniqueIPs = new Set(events.map(e => e.ipAddress));
    return uniqueIPs.size > 5 && events.length > 10;
  }

  private async sendCriticalAlert(event: SecurityEvent): Promise<void> {
    const alertMessage = this.formatAlertMessage(event);
    
    // Send email to security team
    await this.emailTransporter.sendMail({
      from: 'security@momfood.sa',
      to: process.env.SECURITY_TEAM_EMAIL,
      subject: `🚨 CRITICAL SECURITY ALERT: ${event.type}`,
      html: alertMessage
    });

    // Send to monitoring systems (Slack, PagerDuty, etc.)
    await this.sendToMonitoringSystems(event);
  }

  private formatAlertMessage(event: SecurityEvent): string {
    return `
      <h2>🚨 Critical Security Alert</h2>
      <p><strong>Event Type:</strong> ${event.type}</p>
      <p><strong>Severity:</strong> ${event.severity}</p>
      <p><strong>Time:</strong> ${event.timestamp.toISOString()}</p>
      <p><strong>Source:</strong> ${event.source}</p>
      <p><strong>IP Address:</strong> ${event.ipAddress || 'Unknown'}</p>
      <p><strong>User ID:</strong> ${event.userId || 'Anonymous'}</p>
      
      <h3>Details:</h3>
      <pre>${JSON.stringify(event.details, null, 2)}</pre>
      
      <h3>Recommended Actions:</h3>
      <ul>
        ${this.getRecommendedActions(event.type).map(action => `<li>${action}</li>`).join('')}
      </ul>
    `;
  }

  private getRecommendedActions(eventType: string): string[] {
    const actions: Record<string, string[]> = {
      'ddos_detected': [
        'Verify DDoS protection is active',
        'Check server resources',
        'Consider IP blocking',
        'Monitor traffic patterns'
      ],
      'data_breach_attempt': [
        'Immediately review access logs',
        'Check data integrity',
        'Verify encryption is working',
        'Consider system lockdown'
      ],
      'suspicious_payment': [
        'Review payment transaction',
        'Check for fraud indicators',
        'Verify user identity',
        'Consider payment hold'
      ]
    };

    return actions[eventType] || ['Review security logs', 'Monitor for related events'];
  }

  private async storeSecurityEvent(event: SecurityEvent): Promise<void> {
    // Store in database for audit trail
    const query = `
      INSERT INTO security_events (
        id, type, severity, source, user_id, ip_address, 
        details, timestamp, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `;

    const params = [
      event.id,
      event.type,
      event.severity,
      event.source,
      event.userId,
      event.ipAddress,
      JSON.stringify(event.details),
      event.timestamp
    ];

    // This would use your secure database service
    // await this.secureDatabaseService.secureQuery(query, params);
  }
}
```

This comprehensive security implementation provides enterprise-grade protection for the MomFood platform, ensuring data privacy, preventing attacks, and maintaining compliance with industry standards.