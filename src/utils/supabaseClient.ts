import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hsbagpjhlxzabpiitqjw.supabase.co'
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzYmFncGpobHh6YWJwaWl0cWp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTI0MjMwOTEsImV4cCI6MTk2Nzk5OTA5MX0.O-QNy1tbJ7AvZMRhBf8i7_UDNUDhBMQ_yKJEEeS5p84'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
