# Database Migrations

## Overview
This directory contains SQL migrations for the Location Intelligence System.

## Migration Files

### `001_init_postgis_rls.sql`
Initial migration that:
- Enables PostGIS extension for spatial data support
- Enables Row Level Security (RLS) on all tables
- Creates public read policies for anonymous users
- Creates full access policies for authenticated users

## Running Migrations

### Step 1: Push Prisma Schema
First, push the Prisma schema to create the tables:
```bash
npx turbo run db:push
```

### Step 2: Apply Custom Migrations
After tables are created, run the custom SQL migrations in Supabase SQL Editor or via psql:
```bash
psql $DATABASE_URL -f packages/database/prisma/migrations/001_init_postgis_rls.sql
```

Or execute directly in Supabase Dashboard → SQL Editor.

## Notes
- Prisma doesn't natively support PostGIS extensions or RLS policies
- These migrations must be run manually after `prisma db push`
- The PostGIS extension must be enabled before using geometry types
