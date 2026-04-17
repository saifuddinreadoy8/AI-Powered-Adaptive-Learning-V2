import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase URL or Key in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const seedData = [
  {
    topic_name: 'Computer Science',
    icon: '💻',
    subtopics: ['Data Structures', 'Algorithms', 'Operating Systems', 'Computer Networks', 'Database Management']
  },
  {
    topic_name: 'Mathematics',
    icon: '🔢',
    subtopics: ['Calculus', 'Linear Algebra', 'Probability & Statistics', 'Discrete Math', 'Number Theory']
  },
  {
    topic_name: 'Physics',
    icon: '⚛️',
    subtopics: ['Classical Mechanics', 'Electromagnetism', 'Thermodynamics', 'Quantum Physics', 'Optics']
  },
  {
    topic_name: 'Chemistry',
    icon: '🧪',
    subtopics: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Analytical Chemistry', 'Biochemistry']
  },
  {
    topic_name: 'Biology',
    icon: '🧬',
    subtopics: ['Cell Biology', 'Genetics', 'Evolution', 'Ecology', 'Human Anatomy']
  }
]

async function seed() {
  console.log('🚀 Starting Supabase Seeding...')

  for (const item of seedData) {
    console.log(`\n📦 Seeding Topic: ${item.topic_name}`)
    
    // 1. Insert/Upsert Topic
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .upsert({ topic_name: item.topic_name, icon: item.icon }, { onConflict: 'topic_name' })
      .select()
      .single()

    if (topicError) {
      console.error(`❌ Error seeding topic ${item.topic_name}:`, topicError.message)
      continue
    }

    console.log(`✅ Topic Created: ${topic.topic_name} (ID: ${topic.id})`)

    // 2. Insert Subtopics
    const subtopicInserts = item.subtopics.map(name => ({
      topic_id: topic.id,
      subtopic_name: name
    }))

    const { error: subError } = await supabase
      .from('subtopics')
      .upsert(subtopicInserts, { onConflict: 'topic_id,subtopic_name' })

    if (subError) {
      console.error(`❌ Error seeding subtopics for ${item.topic_name}:`, subError.message)
    } else {
      console.log(`✅ ${item.subtopics.length} subtopics seeded.`)
    }
  }

  console.log('\n✨ Seeding Complete!')
}

seed()
