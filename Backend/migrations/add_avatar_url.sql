-- Migration: add avatar_url column to users table
-- Run this against your argo_ocean database if the column does not exist yet

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(512);

UPDATE users SET avatar_url = 'https://cdn-icons-png.flaticon.com/512/616/616408.png'
WHERE avatar_url IS NULL;
