# Prisma Deployment Strategy

## Current Setup (Development/Testing Phase)

Your current build command uses `prisma db push --accept-data-loss`, which is:
- ✅ **Good for**: Early development, testing, before real users
- ⚠️ **Risky for**: Production with real user data

## Migration to Production-Safe Approach

### Option 1: Switch to Prisma Migrate (Recommended for Production)

**When to switch:** Before you have real users and real donation data

#### Step 1: Create Initial Migration Locally
```bash
# Create migrations from current schema
bunx prisma migrate dev --name init

# This creates migration files in prisma/migrations/
```

#### Step 2: Update vercel.json
```json
{
  "buildCommand": "bunx prisma generate && bunx prisma migrate deploy && next build"
}
```

#### Step 3: How It Works
- `prisma migrate deploy` applies pending migrations
- Safe: won't drop data without explicit migration
- Trackable: migration history preserved
- Reversible: can rollback if needed

### Option 2: Safe db push (Current State - Development)

Keep current setup but be aware of risks:

```json
{
  "buildCommand": "bunx prisma generate && bunx prisma db push --accept-data-loss && next build"
}
```

**Safety Rules:**
1. ⚠️ Never remove fields once you have production data
2. ⚠️ Never rename fields (add new, migrate data, then remove old)
3. ⚠️ Test schema changes locally first
4. ✅ Adding new optional fields is always safe
5. ✅ Adding new tables is always safe

### Option 3: Manual Control (Safest for Critical Changes)

Remove automatic schema updates from build:

```json
{
  "buildCommand": "bunx prisma generate && next build"
}
```

Then manually run database updates:
```bash
# After deployment, manually run:
vercel env pull .env.production.local
bunx prisma db push  # or migrate deploy
```

## Schema Change Workflows

### Safe Changes (Can use db push):
- ✅ Adding new tables
- ✅ Adding optional fields (with `?` or default values)
- ✅ Adding indexes
- ✅ Changing field from required to optional

### Dangerous Changes (Need migrations):
- ⚠️ Removing fields/tables
- ⚠️ Renaming fields/tables
- ⚠️ Changing field types
- ⚠️ Making optional fields required
- ⚠️ Changing unique constraints

## Example: Safe Field Addition

```prisma
model Donation {
  // ... existing fields ...

  // Safe to add with db push:
  donorName     String?  // Optional field
  donorEmail    String?  // Optional field
  isAnonymous   Boolean @default(false)  // Has default
}
```

## Example: Dangerous Field Change

```prisma
// BEFORE:
model Athlete {
  name String
}

// AFTER - This will lose all name data!
model Athlete {
  fullName String  // Different field name
}

// SAFE APPROACH:
// 1. Add new field as optional
// 2. Migrate data
// 3. Remove old field
```

## Recommended Timeline

1. **Now - Testing Phase**: Keep `db push --accept-data-loss`
   - Fast iteration
   - Easy schema changes
   - No real data to lose

2. **Before Launch**: Switch to migrations
   ```bash
   # Create initial migration
   bunx prisma migrate dev --name initial_schema

   # Commit migrations folder
   git add prisma/migrations
   git commit -m "Add initial migration"
   ```

3. **After Launch**: Use migrations only
   - All schema changes through migrations
   - Test migrations locally first
   - Apply carefully in production

## Quick Decision Tree

```
Do you have real user data in production?
├─ No → Use db push (current setup)
└─ Yes → Do you need to change the schema?
    ├─ Just adding optional fields → db push is ok
    └─ Other changes → Use migrations

Are you renaming or removing fields?
├─ No → Proceed with caution
└─ Yes → STOP! Use migrations or data migration strategy
```

## Testing Schema Changes Locally

Before deploying schema changes:

```bash
# 1. Backup production data (if any)
bunx prisma db pull  # Pull production schema

# 2. Test the change locally
bunx prisma db push

# 3. Verify no data would be lost
bunx prisma db diff

# 4. If safe, deploy
git add prisma/schema.prisma
git commit -m "Update schema: [description]"
git push
```

## Emergency Rollback

If a schema change causes issues:

1. **With migrations**: Rollback to previous migration
2. **With db push**: Restore previous schema.prisma and push
3. **Data recovery**: Restore from database backup (set up backups!)

## Best Practices

1. **Always backup** before schema changes with data
2. **Test locally** with production-like data
3. **Add fields** instead of renaming
4. **Use optional fields** when adding to existing models
5. **Document** schema changes in commits
6. **Monitor** after deployment for issues