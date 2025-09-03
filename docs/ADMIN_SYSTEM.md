# HabitLoop Admin System

## Overview

The HabitLoop admin system provides super admin capabilities for monitoring and managing the application when hosted in production.

## Access

Navigate to `/admin` in your browser to access the admin panel.

## Admin Credentials

### Super Admin
- **Admin ID**: `super-admin`
- **Password**: `admin123!@#`

### System Admin
- **Admin ID**: `system-admin`
- **Password**: `system456!@#`

## Features

### 1. System Overview
- **Total Users**: Count of all registered users
- **Active Users**: Users active in the last 24 hours
- **System Uptime**: Server uptime in days, hours, minutes
- **Memory Usage**: Current memory consumption
- **Logs Status**: Enable/disable console logging globally

### 2. User Management
- View all users in the system
- See user details: name, email, level, XP, type (guest/verified)
- Monitor user activity and last login times

### 3. System Information
- **Node.js Version**: Current runtime version
- **Database Status**: Connection pool information
- **Memory Details**: RSS, heap usage, total heap
- **Platform**: Operating system information

### 4. ML System Status
- **Model Version**: Current ML model version
- **Accuracy**: Model prediction accuracy
- **Fallback Mode**: Status of fallback predictions
- **Last Training**: When the model was last trained

### 5. Emergency Controls
- **Emergency Shutdown**: Gracefully stop the server
- **Log Toggle**: Enable/disable console logs globally
- **System Refresh**: Refresh all system statistics

## Security Features

### JWT Authentication
- Admin tokens are separate from user tokens
- 24-hour expiration for admin sessions
- Secure token validation

### Access Control
- Only users with `admin` or `super_user` role can access
- Additional password authentication required
- All admin actions are logged

## API Endpoints

### Authentication
- `POST /api/admin/login` - Admin login

### System Management
- `GET /api/admin/status` - Get system status
- `POST /api/admin/logs/toggle` - Toggle global logs
- `GET /api/admin/users` - Get all users
- `POST /api/admin/emergency/shutdown` - Emergency shutdown
- `GET /api/admin/ml/status` - ML system status
- `POST /api/admin/ml/retrain` - Retrain ML models

## Usage Instructions

### 1. Access Admin Panel
1. Navigate to `http://your-domain.com/admin`
2. Enter admin credentials
3. Click "Login as Admin"

### 2. Monitor System
1. Check the **Overview** tab for system health
2. Monitor user activity in the **Users** tab
3. Review system information in the **System** tab

### 3. Manage Logs
1. Go to the **Overview** tab
2. Find the "Logs Status" card
3. Click "Disable" to turn off console logs
4. Click "Enable" to turn them back on

### 4. Emergency Shutdown
1. Click the "Emergency Shutdown" button
2. Confirm the action
3. Server will shutdown gracefully after 5 seconds

## Production Considerations

### Security
- Change default admin passwords in production
- Use environment variables for admin credentials
- Implement IP whitelisting for admin access
- Enable HTTPS for admin panel access

### Monitoring
- Set up alerts for system metrics
- Monitor admin access logs
- Track emergency shutdown events
- Monitor ML system performance

### Backup
- Regular database backups
- Configuration backups
- Log file rotation
- System state snapshots

## Troubleshooting

### Admin Access Issues
1. Verify user has admin role (`admin` or `super_user`)
2. Check admin credentials
3. Ensure JWT token is valid
4. Check server logs for authentication errors

### System Status Issues
1. Verify database connection
2. Check server uptime
3. Monitor memory usage
4. Review error logs

### ML System Issues
1. Check ML service status
2. Verify model files
3. Monitor prediction accuracy
4. Review training logs

## Development Notes

### Adding New Admin Features
1. Add methods to `storage.ts` interface
2. Implement methods in `DatabaseStorage` class
3. Add routes to `adminRoutes.ts`
4. Update admin panel UI in `Admin.tsx`
5. Update this documentation

### Testing Admin Features
1. Test with different user roles
2. Verify authentication works
3. Test emergency functions
4. Validate system statistics
5. Check error handling

## Future Enhancements

### Planned Features
- User ban/unban functionality
- System configuration management
- Real-time monitoring dashboard
- Automated backup management
- Performance analytics
- Security audit logs
- API rate limiting controls
- Database optimization tools
