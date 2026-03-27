/*
  # Initial MapMyLED Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - Unique user identifier
      - `email` (text, unique) - User email address
      - `created_at` (timestamptz) - Account creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
    
    - `led_products`
      - `id` (uuid, primary key) - Product identifier
      - `manufacturer` (text) - LED manufacturer name
      - `product_name` (text) - Product model name
      - `tile_width_px` (integer) - Tile width in pixels
      - `tile_height_px` (integer) - Tile height in pixels
      - `watts_per_tile` (numeric) - Power consumption per tile
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
      - `created_by` (uuid) - User who created the product (nullable for system products)
    
    - `pixel_map_projects`
      - `id` (uuid, primary key) - Project identifier
      - `user_id` (uuid, foreign key) - Owner of the project
      - `project_name` (text) - Project name
      - `project_data` (jsonb) - Complete project state (tiles, wiring, etc.)
      - `created_at` (timestamptz) - Project creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
    
    - `contact_messages`
      - `id` (uuid, primary key) - Message identifier
      - `name` (text) - Sender name
      - `email` (text) - Sender email
      - `message` (text) - Message content
      - `created_at` (timestamptz) - Message submission timestamp

  2. Security
    - Enable RLS on all tables
    - Users can read their own user record
    - Users can update their own user record
    - LED products are readable by all authenticated users
    - Users can create/read/update/delete their own LED products
    - Users can create/read/update/delete their own pixel map projects
    - Contact messages can only be inserted (no reads for privacy)
    - Admin users (future) can read all data

  3. Notes
    - All timestamps use timestamptz for timezone awareness
    - project_data stored as JSONB for flexibility
    - created_by in led_products is nullable to support system-wide products
*/

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create led_products table
CREATE TABLE IF NOT EXISTS led_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer text NOT NULL,
  product_name text NOT NULL,
  tile_width_px integer NOT NULL,
  tile_height_px integer NOT NULL,
  watts_per_tile numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL
);

-- Create pixel_map_projects table
CREATE TABLE IF NOT EXISTS pixel_map_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_name text NOT NULL DEFAULT 'Untitled Project',
  project_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE led_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pixel_map_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- LED products policies
CREATE POLICY "Anyone can read LED products"
  ON led_products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create LED products"
  ON led_products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own LED products"
  ON led_products FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own LED products"
  ON led_products FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Pixel map projects policies
CREATE POLICY "Users can read own projects"
  ON pixel_map_projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON pixel_map_projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON pixel_map_projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON pixel_map_projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Contact messages policies (insert only for privacy)
CREATE POLICY "Anyone can submit contact messages"
  ON contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_led_products_created_by ON led_products(created_by);
CREATE INDEX IF NOT EXISTS idx_pixel_map_projects_user_id ON pixel_map_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_pixel_map_projects_created_at ON pixel_map_projects(created_at DESC);