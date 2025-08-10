# Environment Variables Setup Guide

## Complete .env Configuration

Copy this configuration to your `.env` file and update the placeholder values:

```env
# Replit Authentication (Required for production)
REPL_ID="your-repl-id-here"
REPLIT_DOMAINS="localhost:5000,your-replit-domain.replit.dev"
SESSION_SECRET="8264137f77fb18b2ea4f39c52b1664f6544a13decab87caf4b5453a29f30fc24"
ISSUER_URL="https://replit.com/oidc"

# Database (Required)
DATABASE_URL="postgresql://username:password@localhost:5432/habit_tracker_dev"

# Optional: AI Services
OPENAI_API_KEY="sk-your-openai-api-key"
ANTHROPIC_API_KEY="sk-ant-your-anthropic-api-key"

# Optional: Gmail Integration
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"

# Application Settings
NODE_ENV="development"
PORT="5000"
```

## How to Find Your REPL_ID

### Method 1: Replit Dashboard
1. Go to your Replit dashboard at https://replit.com
2. Open your habit tracker project
3. Click on the project settings (gear icon)
4. Look for "Repl ID" or check the project information section

### Method 2: From URL
1. Open your Replit project
2. Look at the browser URL
3. Format: `https://replit.com/@username/project-name`
4. The REPL_ID is typically the project identifier after the username

### Method 3: Environment Variables
1. In your Replit project, open the Shell
2. Run: `echo $REPL_ID`
3. This will display your current Repl ID

## How to Find Your REPLIT_DOMAINS

### For Local Development
Always include: `localhost:5000`

### For Replit Production
1. Open your Replit project
2. Click the "Run" button to start your application
3. Note the domain that appears (e.g., `abc123-def456.replit.dev`)
4. Use format: `localhost:5000,your-actual-domain.replit.dev`

### Example Configurations

#### Local Development Only
```env
REPL_ID="local-dev"
REPLIT_DOMAINS="localhost:5000"
```

#### Production Replit
```env
REPL_ID="your-actual-repl-id"
REPLIT_DOMAINS="localhost:5000,abc123-def456.replit.dev"
```

## SESSION_SECRET Validation

The provided session secret is:
- **Length**: 64 characters (exceeds 32-character minimum)
- **Format**: Hexadecimal string
- **Security**: Cryptographically secure random generation
- **Strength**: 256-bit entropy

### Generate New Session Secret (if needed)
```bash
# Using OpenSSL
openssl rand -hex 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using Python
python -c "import secrets; print(secrets.token_hex(32))"
```

## ISSUER_URL Configuration

Use the default Replit OIDC endpoint:
```env
ISSUER_URL="https://replit.com/oidc"
```

**Do not change this value** unless:
- Using a custom identity provider
- Running in a different environment
- Specifically instructed by Replit documentation

## Environment Priority

The application checks for environment variables in this order:
1. `.env.local` (highest priority - local development)
2. `.env` (standard configuration)
3. System environment variables
4. Default values (where applicable)

## Quick Setup Commands

```bash
# 1. Copy example configuration
cp .env.example .env

# 2. Generate secure session secret
echo "SESSION_SECRET=\"$(openssl rand -hex 32)\"" >> .env

# 3. Edit with your values
nano .env  # or use your preferred editor

# 4. Verify configuration
grep -E "REPL_ID|REPLIT_DOMAINS|SESSION_SECRET" .env
```

## Testing Your Configuration

After setting up your environment variables:

```bash
# 1. Start the application
npm run dev

# 2. Check authentication endpoint
curl http://localhost:5000/api/auth/user

# 3. Verify session functionality
# Should see demo user for local development
```

## Security Best Practices

1. **Never commit** `.env` files to version control
2. **Use different** SESSION_SECRET values for different environments
3. **Rotate secrets** periodically in production
4. **Restrict access** to environment variable files
5. **Use HTTPS** in production environments

## Common Issues and Solutions

### Invalid REPL_ID
- Error: Authentication fails
- Solution: Verify REPL_ID matches your actual Replit project

### Incorrect REPLIT_DOMAINS
- Error: OAuth redirect failures
- Solution: Ensure domains match exactly (no trailing slashes)

### Weak SESSION_SECRET
- Error: Session security warnings
- Solution: Use minimum 32 characters, preferably 64

### Missing Environment Variables
- Error: Application startup failures
- Solution: Check all required variables are set

This configuration provides secure authentication for both local development and Replit production deployment.