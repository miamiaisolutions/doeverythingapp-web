# Migration Guide: Workspace Model

## ⚠️ IMPORTANT - READ BEFORE RUNNING

This migration script converts your existing data to the new workspace-based permissions model. **This is a one-way migration** that modifies your Firestore database.

## Prerequisites

1. **Backup your Firestore database** before running this script
2. Ensure you have Firebase Admin SDK credentials configured
3. Install dependencies: `npm install`
4. Install tsx: `npm install -D tsx`

## What This Migration Does

### 1. Creates Workspaces
- Creates one workspace per existing user
- Workspace name: "{User's Name}'s Workspace"
- Copies subscription info from user to workspace
- Sets tier limits based on subscription

###2. Creates Workspace Members
- Adds each user as "owner" of their workspace
- Sets status to "active"
- Records join date from user creation date

### 3. Migrates Webhooks
- Adds `workspaceId` field (user's workspace)
- Adds `createdBy` field (set to userId)  
- Keeps original `userId` field for safety

### 4. Migrates Conversations
- Adds `workspaceId` field
- Keeps original `userId` field

### 5. Migrates Webhook Executions
- Adds `workspaceId` field for analytics
- Keeps original `userId` field

### 6. Updates Users
- Sets `currentWorkspaceId` if not already set

## Running the Migration

### Step 1: Set up Firebase Admin credentials

```bash
# Option A: Use application default credentials
gcloud auth application-default login

# Option B: Use service account key
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"
```

### Step 2: Run the migration script

```bash
cd web
npx tsx scripts/migrate-to-workspaces.ts
```

### Step 3: Monitor the output

The script will:
- Show progress for each user
- Display real-time statistics
- Report any errors encountered
- Print a final summary

## Expected Output

```
🚀 Starting migration to workspace model...

📋 Step 1: Fetching all users...
   Found 10 users

👤 Processing user: user@example.com
   ✓ Created workspace: workspace_abc123
   ✓ Migrated 5 webhooks
   ✓ Migrated 3 conversations
   ✓ Migrated 12 webhook executions
   ✓ Updated user's currentWorkspaceId
   ✅ User migration complete

...

============================================================
📊 MIGRATION SUMMARY
============================================================
✅ Users processed:        10
✅ Workspaces created:     10
✅ Members created:        10
✅ Webhooks migrated:      47
✅ Conversations migrated: 28
✅ Executions migrated:    156

🎉 Migration completed successfully with no errors!
============================================================
```

## Rollback Instructions

If you need to rollback:

1. **Restore from Firestore backup** (recommended)
2. OR manually revert changes:
   - Delete workspace and workspace_members collections
   - Remove workspaceId and createdBy fields from webhooks
   - Remove workspaceId fields from conversations and executions
   - Remove currentWorkspaceId from users

## Testing After Migration

1. **Verify Firestore Data:**
   - Check that workspaces collection exists
   - Check workspace_members has entries for all users
   - Spot-check webhooks have workspaceId and createdBy
   - Spot-check conversations have workspaceId

2. **Test the Application:**
   - Log in as a test user
   - Verify Settings → Team shows the user as Owner
   - Test inviting a team member
   - Verify webhooks are visible
   - Verify conversations work

3. **Check Security Rules:**
   - Ensure Firebase security rules are deployed
   - Test that users can only access their workspace data

## Troubleshooting

### Error: "Permission denied"
- Ensure Firebase Admin credentials are properly configured
- Check that service account has Firestore permissions

### Error: "User already has workspace"
- Script is idempotent - it skips users who already have workspaces
- Safe to re-run after fixing issues

### Some users not migrated
- Check the error summary at the end
- Review error messages for specific users
- Fix issues and re-run (script will skip already-migrated users)

## Post-Migration Cleanup (Optional)

After confirming migration success, you can optionally:

1. Remove old `userId` field from webhooks:
   ```typescript
   // Add this to the migration script or run separately
   batch.update(webhookDoc.ref, {
       userId: admin.firestore.FieldValue.delete(),
   });
   ```

2. Remove subscription fields from users collection (now in workspaces):
   ```typescript
   batch.update(userDoc.ref, {
       subscriptionTier: admin.firestore.FieldValue.delete(),
       subscriptionStatus: admin.firestore.FieldValue.delete(),
       planId: admin.firestore.FieldValue.delete(),
   });
   ```

**Note:** Don't do this cleanup immediately - wait a few days to ensure everything works correctly first!

## Support

If you encounter issues:
1. Check the error messages in the script output
2. Verify your Firestore data structure
3. Ensure Firebase Admin SDK is properly authenticated
4. Check that dependencies are installed
