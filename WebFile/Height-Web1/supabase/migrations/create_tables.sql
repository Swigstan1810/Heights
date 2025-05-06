-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  kyc_completed BOOLEAN DEFAULT FALSE
);

-- Create KYC details table
CREATE TABLE kyc_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  pan_number TEXT NOT NULL,
  aadhaar_number TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  bank_account_number TEXT NOT NULL,
  bank_ifsc_code TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  income_bracket TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(pan_number),
  UNIQUE(aadhaar_number)
);

-- Create Row-Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_details ENABLE ROW LEVEL SECURITY;

-- Profiles policy: Users can read and update only their own profile
CREATE POLICY "Users can read own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- KYC details policy: Users can read and update only their own KYC details
CREATE POLICY "Users can read own KYC details" 
  ON kyc_details FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own KYC details" 
  ON kyc_details FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own KYC details" 
  ON kyc_details FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();