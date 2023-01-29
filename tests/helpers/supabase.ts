import { Client } from 'pg'

const supabaseConn = {
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  password: 'your-super-secret-and-long-postgres-password',
}

const apikey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuZmRhdW9vd3lycHhxb2RvbXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTQ1MzEzOTUsImV4cCI6MTk3MDEwNzM5NX0.XYkcWry-Eqm0-Hvq-arndEGhQn_yJvGF85-NNf9Sbvk'

export async function supabaseLoginUser(email: string) {
  const data = await fetch('http://localhost:8000/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password: '123456',
    }),
    headers: {
      apikey,
      'Content-Type': 'application/json',
    },
  }).then((r) => r.json())
  const { refresh_token } = data
  return refresh_token
}

export async function supabaseRegisterUser(email: string) {
  const data = await fetch('http://localhost:8000/auth/v1/signup', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password: '123456',
    }),
    headers: {
      apikey,
      'Content-Type': 'application/json',
    },
  }).then((r) => r.json())
  return data
}

export async function supabaseDeleteUser(user_id: string) {
  const client = new Client(supabaseConn)
  await client.connect()
  await client.query(`delete from customers where id = '${user_id}'`)
  await client.query(`delete from entries_tags where user_id = '${user_id}'`)
  await client.query(`delete from journals where user_id = '${user_id}'`)
  await client.query(`delete from journals_catalog where user_id = '${user_id}'`)
  await client.query(`delete from subscriptions where user_id = '${user_id}'`)
  await client.query(`delete from tags where user_id = '${user_id}'`)
  await client.query(`delete from users where id = '${user_id}'`)
  await client.query(`delete from auth.users where id = '${user_id}'`)
  await client.query(`drop table entries_tags_${user_id.replaceAll('-', '_')}`)
  await client.query(`drop table journals_${user_id.replaceAll('-', '_')} cascade`)
  await client.end()
}

export async function supabaseGetEntry(user_id: string, day: string) {
  const client = new Client(supabaseConn)
  await client.connect()
  const entry = await client.query(
    `select * from journals where user_id = '${user_id}' and day = '${day}'`
  )
  await client.end()
  return entry.rows[0]
}

export async function supabaseCopyEntryToDayBefore(user_id: string, day: string) {
  const client = new Client(supabaseConn)
  await client.connect()
  await client.query(
    `insert into journals (user_id, day, created_at, modified_at, content, iv, revision) select user_id, day - interval '1' day, created_at, modified_at, content, iv, revision from journals where user_id ='${user_id}' and day = '${day}'`
  )
  await client.end()
}

export async function supabaseCopyEntryContent(user_id: string, dayFrom: string, dayTo: string) {
  const client = new Client(supabaseConn)
  await client.connect()
  const entryFrom = await client.query(
    `select * from journals where user_id = '${user_id}' and day = '${dayFrom}'`
  )
  await client.query(
    `UPDATE journals SET content = subquery.content, iv = subquery.iv, revision = revision + 1 FROM (SELECT content, iv FROM journals WHERE user_id = '${user_id}' and day = '${dayFrom}') AS subquery WHERE user_id = '${user_id}' and day = '${dayTo}'`
  )

  await client.end()
}

export async function supabaseDeleteEntry(user_id: string, day: string) {
  const client = new Client(supabaseConn)
  await client.connect()
  await client.query(`delete from journals where user_id ='${user_id}' and day = '${day}'`)
  await client.end()
}
