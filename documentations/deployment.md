# Deployment Guide

## Overview
This guide covers deploying the AzoozGAT Platform to various hosting platforms.

## Prerequisites
- Firebase project with Firestore and Authentication enabled
- Environment variables configured
- Application built and tested locally

## Vercel Deployment (Recommended)

### 1. Prepare for Deployment
```bash
# Build the application locally to test
npm run build

# Test the production build
npm start
```

### 2. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Link to existing project or create new
# - Set up environment variables
# - Deploy
```

### 3. Environment Variables in Vercel
Add these environment variables in your Vercel dashboard:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_ADMIN_EMAIL=admin@example.com
NEXT_PUBLIC_ADMIN_PASSWORD=admin_password
```

### 4. Custom Domain (Optional)
1. Go to your Vercel project dashboard
2. Navigate to Settings > Domains
3. Add your custom domain
4. Configure DNS records as instructed

## Netlify Deployment

### 1. Build Settings
Create a `netlify.toml` file in the project root:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 2. Deploy
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables in Netlify dashboard

## Firebase Hosting

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### 2. Initialize Firebase Hosting
```bash
firebase init hosting

# Select your Firebase project
# Set public directory to: out
# Configure as single-page app: Yes
# Set up automatic builds: Optional
```

### 3. Configure Next.js for Static Export
Update `next.config.ts`:

```typescript
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

export default nextConfig
```

### 4. Build and Deploy
```bash
# Build for static export
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

## Docker Deployment

### 1. Create Dockerfile
```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### 2. Build and Run
```bash
# Build Docker image
docker build -t azoozgat-platform .

# Run container
docker run -p 3000:3000 --env-file .env.local azoozgat-platform
```

## Environment Variables Security

### Production Environment Variables
- Never commit `.env.local` to version control
- Use platform-specific environment variable management
- Rotate sensitive keys regularly
- Use different Firebase projects for development and production

### Firebase Security Rules
Update your Firestore security rules for production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admins can access all user data
    match /users/{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Quiz access rules
    match /quizzes/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Reports access rules
    match /reports/{document=**} {
      allow read, write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Logs - admin only
    match /logs/{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## Post-Deployment Checklist

- [ ] All environment variables are set correctly
- [ ] Firebase security rules are configured
- [ ] SSL certificate is active
- [ ] Custom domain is configured (if applicable)
- [ ] Admin account is created and accessible
- [ ] All features are working correctly
- [ ] Performance monitoring is enabled
- [ ] Error tracking is configured
- [ ] Backup strategy is in place

## Monitoring and Maintenance

### Performance Monitoring
- Use Vercel Analytics (for Vercel deployments)
- Configure Firebase Performance Monitoring
- Set up Google Analytics (optional)

### Error Tracking
- Configure Sentry or similar error tracking
- Monitor Firebase logs
- Set up alerts for critical errors

### Backup Strategy
- Firebase automatically backs up Firestore data
- Consider exporting critical data regularly
- Version control all code changes

## Troubleshooting

### Common Issues
1. **Build failures:** Check Node.js version compatibility
2. **Environment variables:** Ensure all required variables are set
3. **Firebase connection:** Verify Firebase configuration
4. **CORS issues:** Check Firebase hosting configuration
5. **Authentication problems:** Verify Firebase Auth setup

### Debug Commands
```bash
# Check build locally
npm run build && npm start

# Verify environment variables
echo $NEXT_PUBLIC_FIREBASE_API_KEY

# Test Firebase connection
firebase projects:list
```

## Support
For deployment issues:
1. Check the platform-specific documentation
2. Review Firebase console for errors
3. Check application logs
4. Contact the development team
