# Database Migration Guide

## Prerequisites
Ensure your Supabase credentials are set in the root `.env` file.

## Step 1: Push Prisma Schema to Supabase

Run from the **root** directory:

```bash
# Set environment variables (PowerShell)
$env:DATABASE_URL = (Get-Content .env | Select-String "DATABASE_URL").ToString().Split('=')[1].Trim('"')
$env:DIRECT_URL = (Get-Content .env | Select-String "DIRECT_URL").ToString().Split('=')[1].Trim('"')

# Push schema to database
cd packages/database
npx prisma db push
cd ../..
```

Or simply run:
```bash
# From root directory
npx prisma db push --schema=packages/database/prisma/schema.prisma
```

## Step 2: Apply PostGIS and RLS Migration

After the schema is pushed, you need to manually run the SQL migration in Supabase:

### Option A: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `packages/database/prisma/migrations/001_init_postgis_rls.sql`
4. Paste and execute in the SQL Editor

### Option B: Using psql
```bash
psql $DATABASE_URL -f packages/database/prisma/migrations/001_init_postgis_rls.sql
```

## What the Migration Does

1. **Enables PostGIS Extension**: Required for spatial geometry types
2. **Enables Row Level Security (RLS)**: On both `Location` and `Landmark` tables
3. **Creates Public Read Policy**: Allows anonymous users to SELECT data
4. **Creates Authenticated Full Access Policy**: Allows authenticated users full CRUD operations

## Verification

After running migrations, verify in Supabase Dashboard:
- **Database → Extensions**: PostGIS should be enabled
- **Authentication → Policies**: Both tables should have RLS policies listed
