import { createClient } from '@supabase/supabase-js'
import { isDev } from './'

const supabaseEnv = {
  local: {
    supabaseUrl: 'https://supabase.journal.local:8443',
    supabaseAnonKey:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuZmRhdW9vd3lycHhxb2RvbXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTQ1MzEzOTUsImV4cCI6MTk3MDEwNzM5NX0.XYkcWry-Eqm0-Hvq-arndEGhQn_yJvGF85-NNf9Sbvk',
  },
  stg: {
    supabaseUrl: 'https://tnfdauoowyrpxqodomqn.supabase.co',
    supabaseAnonKey:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuZmRhdW9vd3lycHhxb2RvbXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTQ1MzEzOTUsImV4cCI6MTk3MDEwNzM5NX0.XYkcWry-Eqm0-Hvq-arndEGhQn_yJvGF85-NNf9Sbvk',
  },
  prod: {
    supabaseUrl: 'https://hsbagpjhlxzabpiitqjw.supabase.co',
    supabaseAnonKey:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzYmFncGpobHh6YWJwaWl0cWp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTI0MjMwOTEsImV4cCI6MTk2Nzk5OTA5MX0.O-QNy1tbJ7AvZMRhBf8i7_UDNUDhBMQ_yKJEEeS5p84',
  },
}

const { supabaseUrl } = supabaseEnv[isDev() ? 'local' : 'prod']
const { supabaseAnonKey } = supabaseEnv[isDev() ? 'local' : 'prod']

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export { supabaseUrl, supabaseAnonKey, supabase }
