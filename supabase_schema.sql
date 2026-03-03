-- Schema for CaterPro
-- We use a document-store pattern (id + jsonb) for maximum flexibility 
-- and seamless migration from localStorage.

-- Drop tables if they exist
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS procurement;
DROP TABLE IF EXISTS workers;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS recipes;
DROP TABLE IF EXISTS mom;
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS inventory_movements;

-- Create tables
CREATE TABLE events (id text primary key, data jsonb not null);
CREATE TABLE inventory (id text primary key, data jsonb not null);
CREATE TABLE procurement (id text primary key, data jsonb not null);
CREATE TABLE workers (id text primary key, data jsonb not null);
CREATE TABLE attendance (id text primary key, data jsonb not null);
CREATE TABLE recipes (id text primary key, data jsonb not null);
CREATE TABLE mom (id text primary key, data jsonb not null);
CREATE TABLE feedback (id text primary key, data jsonb not null);
CREATE TABLE inventory_movements (id text primary key, data jsonb not null);

-- Disable Row Level Security (RLS) for public access during development
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE procurement DISABLE ROW LEVEL SECURITY;
ALTER TABLE workers DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE mom DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements DISABLE ROW LEVEL SECURITY;
