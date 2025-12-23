/**
 * Data Migration Script: Convert to Workspace Model
 * 
 * This script migrates existing user data to the new workspace-based permissions model.
 * 
 * IMPORTANT: Run this ONCE and only after backing up your Firestore database.
 * 
 * What this script does:
 * 1. Creates a default workspace for each existing user
 * 2. Creates workspace_member entries (role: owner) for each user
 * 3. Migrates webhooks: userId → workspaceId + createdBy
 * 4. Migrates conversations: adds workspaceId
 * 5. Migrates webhook_executions: adds workspaceId
 * 6. Updates user records with currentWorkspaceId
 * 
 * Usage:
 *   npx tsx scripts/migrate-to-workspaces.ts
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Service account for Firebase Admin
// Service account for Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');

// Initialize Firebase Admin with service account
if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount as any)
    });
}

const adminDb = getFirestore();

// Tier limits configuration
const TIER_LIMITS = {
    free: { maxMembers: 1, maxWebhooks: 2, timeoutSeconds: 5 },
    pro: { maxMembers: 3, maxWebhooks: 50, timeoutSeconds: 15 },
    premium: { maxMembers: 10, maxWebhooks: 200, timeoutSeconds: 60 },
};

interface MigrationStats {
    usersProcessed: number;
    workspacesCreated: number;
    membersCreated: number;
    webhooksMigrated: number;
    conversationsMigrated: number;
    executionsMigrated: number;
    errors: string[];
}

const stats: MigrationStats = {
    usersProcessed: 0,
    workspacesCreated: 0,
    membersCreated: 0,
    webhooksMigrated: 0,
    conversationsMigrated: 0,
    executionsMigrated: 0,
    errors: [],
};

async function migrateToWorkspaces() {
    console.log('🚀 Starting migration to workspace model...\n');

    try {
        // Step 1: Get all users
        console.log('📋 Step 1: Fetching all users...');
        const usersSnapshot = await adminDb.collection('users').get();
        console.log(`   Found ${usersSnapshot.size} users\n`);

        // Process each user
        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const userData = userDoc.data();

            console.log(`👤 Processing user: ${userData.email || userId}`);

            try {
                // Check if user already has a workspace
                const existingMemberships = await adminDb
                    .collection('workspace_members')
                    .where('userId', '==', userId)
                    .where('role', '==', 'owner')
                    .where('status', '==', 'active')
                    .limit(1)
                    .get();

                let workspaceId: string;

                if (!existingMemberships.empty) {
                    // User already has a workspace
                    workspaceId = existingMemberships.docs[0].data().workspaceId;
                    console.log(`   ✓ User already has workspace: ${workspaceId}`);
                } else {
                    // Create new workspace for this user
                    workspaceId = await createWorkspaceForUser(userId, userData);
                    console.log(`   ✓ Created workspace: ${workspaceId}`);
                }

                // Migrate user's webhooks
                await migrateUserWebhooks(userId, workspaceId);

                // Migrate user's conversations
                await migrateUserConversations(userId, workspaceId);

                // Migrate webhook executions
                await migrateUserWebhookExecutions(userId, workspaceId);

                // Update user's currentWorkspaceId if not set
                if (!userData.currentWorkspaceId) {
                    await adminDb.doc(`users/${userId}`).update({
                        currentWorkspaceId: workspaceId,
                    });
                    console.log(`   ✓ Updated user's currentWorkspaceId`);
                }

                stats.usersProcessed++;
                console.log(`   ✅ User migration complete\n`);
            } catch (error: any) {
                const errorMsg = `Error processing user ${userId}: ${error.message}`;
                console.error(`   ❌ ${errorMsg}`);
                stats.errors.push(errorMsg);
            }
        }

        // Print summary
        printMigrationSummary();
    } catch (error: any) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

async function createWorkspaceForUser(
    userId: string,
    userData: any
): Promise<string> {
    const batch = adminDb.batch();

    // Create workspace
    const workspaceRef = adminDb.collection('workspaces').doc();
    const workspaceId = workspaceRef.id;

    // Determine subscription tier (default to free if not set)
    const tier = (userData.subscriptionTier || 'free') as 'free' | 'pro' | 'premium';

    const workspace: any = {
        id: workspaceId,
        name: `${userData.name || userData.email || 'My'}'s Workspace`,
        ownerId: userId,
        subscriptionTier: tier,
        maxMembers: TIER_LIMITS[tier].maxMembers,
        createdAt: userData.createdAt || Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    // Only add optional fields if they exist
    if (userData.stripeCustomerId) {
        workspace.stripeCustomerId = userData.stripeCustomerId;
    }
    if (userData.subscriptionStatus) {
        workspace.subscriptionStatus = userData.subscriptionStatus;
    }
    if (userData.planId) {
        workspace.planId = userData.planId;
    }

    batch.set(workspaceRef, workspace);

    // Create workspace member (owner)
    const memberId = `${workspaceId}_${userId}`;
    const memberRef = adminDb.doc(`workspace_members/${memberId}`);

    const member = {
        id: memberId,
        workspaceId,
        userId,
        role: 'owner',
        invitedBy: userId,
        invitedAt: userData.createdAt || Timestamp.now(),
        joinedAt: userData.createdAt || Timestamp.now(),
        status: 'active',
    };

    batch.set(memberRef, member);

    await batch.commit();

    stats.workspacesCreated++;
    stats.membersCreated++;

    return workspaceId;
}

async function migrateUserWebhooks(userId: string, workspaceId: string) {
    const webhooksSnapshot = await adminDb
        .collection('webhooks')
        .where('userId', '==', userId)
        .get();

    if (webhooksSnapshot.empty) {
        console.log(`   ℹ️  No webhooks to migrate`);
        return;
    }

    const batch = adminDb.batch();
    let count = 0;

    for (const webhookDoc of webhooksSnapshot.docs) {
        const webhookData = webhookDoc.data();

        // Skip if already migrated
        if (webhookData.workspaceId) {
            continue;
        }

        // Update webhook with workspace context
        batch.update(webhookDoc.ref, {
            workspaceId,
            createdBy: userId, // Original owner becomes creator
            // Remove old userId field after confirmation
            // We'll keep it for now for safety
        });

        count++;
    }

    if (count > 0) {
        await batch.commit();
        stats.webhooksMigrated += count;
        console.log(`   ✓ Migrated ${count} webhooks`);
    }
}

async function migrateUserConversations(userId: string, workspaceId: string) {
    const conversationsSnapshot = await adminDb
        .collection('conversations')
        .where('userId', '==', userId)
        .get();

    if (conversationsSnapshot.empty) {
        console.log(`   ℹ️  No conversations to migrate`);
        return;
    }

    const batch = adminDb.batch();
    let count = 0;

    for (const conversationDoc of conversationsSnapshot.docs) {
        const conversationData = conversationDoc.data();

        // Skip if already migrated
        if (conversationData.workspaceId) {
            continue;
        }

        // Update conversation with workspace context
        batch.update(conversationDoc.ref, {
            workspaceId,
        });

        count++;
    }

    if (count > 0) {
        await batch.commit();
        stats.conversationsMigrated += count;
        console.log(`   ✓ Migrated ${count} conversations`);
    }
}

async function migrateUserWebhookExecutions(userId: string, workspaceId: string) {
    const executionsSnapshot = await adminDb
        .collection('webhook_executions')
        .where('userId', '==', userId)
        .get();

    if (executionsSnapshot.empty) {
        console.log(`   ℹ️  No webhook executions to migrate`);
        return;
    }

    const batch = adminDb.batch();
    let count = 0;

    for (const executionDoc of executionsSnapshot.docs) {
        const executionData = executionDoc.data();

        // Skip if already migrated
        if (executionData.workspaceId) {
            continue;
        }

        // Update execution with workspace context
        batch.update(executionDoc.ref, {
            workspaceId,
        });

        count++;

        // Firestore batch limit is 500 operations
        if (count % 500 === 0) {
            await batch.commit();
            console.log(`   ✓ Migrated ${count} executions (batch commit)...`);
        }
    }

    if (count > 0) {
        await batch.commit();
        stats.executionsMigrated += count;
        console.log(`   ✓ Migrated ${count} webhook executions`);
    }
}

function printMigrationSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Users processed:        ${stats.usersProcessed}`);
    console.log(`✅ Workspaces created:     ${stats.workspacesCreated}`);
    console.log(`✅ Members created:        ${stats.membersCreated}`);
    console.log(`✅ Webhooks migrated:      ${stats.webhooksMigrated}`);
    console.log(`✅ Conversations migrated: ${stats.conversationsMigrated}`);
    console.log(`✅ Executions migrated:    ${stats.executionsMigrated}`);

    if (stats.errors.length > 0) {
        console.log(`\n❌ Errors encountered: ${stats.errors.length}`);
        stats.errors.forEach((error, index) => {
            console.log(`   ${index + 1}. ${error}`);
        });
    } else {
        console.log('\n🎉 Migration completed successfully with no errors!');
    }

    console.log('='.repeat(60) + '\n');
}

// Run migration
migrateToWorkspaces()
    .then(() => {
        console.log('✅ Migration script completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Migration script failed:', error);
        process.exit(1);
    });
