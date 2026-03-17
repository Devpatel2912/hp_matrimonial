CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile varchar(15) UNIQUE,
  email varchar(100) UNIQUE,
  password_hash text NOT NULL,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  last_login timestamp,
  fcm_token text
);

CREATE TABLE IF NOT EXISTS otp_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile_or_email varchar(100) NOT NULL,
  otp_hash text NOT NULL,
  expires_at timestamp NOT NULL,
  is_used boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  profile_id varchar(20) UNIQUE NOT NULL,
  full_name varchar(100) NOT NULL DEFAULT '',
  gender varchar(10),
  date_of_birth date,
  height varchar(10),
  marital_status varchar(30),
  mother_tongue varchar(50),
  caste varchar(50),
  city varchar(100),
  state varchar(100),
  country varchar(50),
  about_me text,
  income_range varchar(50),
  profile_completeness int DEFAULT 0,
  photo_url text,
  photo_locked boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  is_premium boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS spiritual_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  karya_karta varchar(100),
  pradesh varchar(100),
  bhagvadi varchar(100)
);

CREATE TABLE IF NOT EXISTS education_career (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  highest_education varchar(100),
  institute varchar(150),
  occupation varchar(100),
  employer varchar(150),
  income_range varchar(50)
);

CREATE TABLE IF NOT EXISTS family_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  father_name varchar(100),
  father_occupation varchar(100),
  mother_name varchar(100),
  mother_occupation varchar(100),
  siblings text,
  family_type varchar(50),
  family_status varchar(50),
  is_locked boolean DEFAULT true,
  is_pending boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS partner_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  age_min int,
  age_max int,
  height_min varchar(10),
  height_max varchar(10),
  diet varchar(50),
  marital_status varchar(50),
  faith varchar(50),
  caste_preference varchar(100),
  state_preference varchar(100),
  education_preference varchar(100)
);

CREATE TABLE IF NOT EXISTS memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  activated_at timestamp,
  expires_at timestamp,
  days_remaining int DEFAULT 0,
  is_active boolean DEFAULT false,
  is_premium boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS shortlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now(),
  UNIQUE(user_id, target_profile_id)
);

CREATE TABLE IF NOT EXISTS connection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message text,
  status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

CREATE TABLE IF NOT EXISTS photo_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Note: Approval grants mutual access between requester and profile owner for both photos and family details.
  status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_reciprocal boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  UNIQUE(requester_id, profile_id)
);

CREATE TABLE IF NOT EXISTS profile_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  storage_key text NOT NULL UNIQUE,
  file_url text NOT NULL,
  visibility varchar(20) NOT NULL DEFAULT 'locked' CHECK (visibility IN ('public', 'locked')),
  is_primary boolean DEFAULT false,
  sort_order int DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  connection_request_id uuid REFERENCES connection_requests(id) ON DELETE SET NULL,
  last_message_at timestamp,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text,
  image_url text,
  message_type varchar(20) DEFAULT 'text',
  is_read boolean DEFAULT false,
  read_at timestamp,
  is_deleted boolean DEFAULT false,
  sent_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type varchar(50),
  title varchar(150),
  message text,
  target_id uuid,
  target_type varchar(50),
  is_read boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_caste ON profiles(caste);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_state ON profiles(state);
CREATE INDEX IF NOT EXISTS idx_profiles_dob ON profiles(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_created ON profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_otp_lookup ON otp_logs(mobile_or_email, is_used, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_photos_user ON profile_photos(user_id, created_at DESC);
