import { createClient } from '@supabase/supabase-js'
import { isDev } from './'

const supabaseUrl = isDev() ? 'http://localhost:8000' : 'https://hsbagpjhlxzabpiitqjw.supabase.co'
// const supabaseUrl = isDev()
//   ? 'https://tnfdauoowyrpxqodomqn.supabase.co'
//   : 'https://hsbagpjhlxzabpiitqjw.supabase.co'

const supabaseAnonKey = isDev()
  ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuZmRhdW9vd3lycHhxb2RvbXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTQ1MzEzOTUsImV4cCI6MTk3MDEwNzM5NX0.XYkcWry-Eqm0-Hvq-arndEGhQn_yJvGF85-NNf9Sbvk'
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzYmFncGpobHh6YWJwaWl0cWp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTI0MjMwOTEsImV4cCI6MTk2Nzk5OTA5MX0.O-QNy1tbJ7AvZMRhBf8i7_UDNUDhBMQ_yKJEEeS5p84'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export { supabaseUrl, supabaseAnonKey, supabase }
