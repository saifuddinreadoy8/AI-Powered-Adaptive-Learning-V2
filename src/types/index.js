/**
 * @typedef {'student' | 'teacher' | 'admin'} UserRole
 */

/**
 * @typedef {'Easy' | 'Medium' | 'Hard'} DifficultyLevel
 */

/**
 * @typedef {'self_practice' | 'classroom'} QuizType
 */

/**
 * @typedef {Object} Profile
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {UserRole} role
 * @property {string|null} avatar_url
 * @property {string} created_at
 */

/**
 * @typedef {Object} Topic
 * @property {string} id
 * @property {string} topic_name
 * @property {string} icon
 * @property {Subtopic[]} subtopics
 */

/**
 * @typedef {Object} Subtopic
 * @property {string} id
 * @property {string} topic_id
 * @property {string} subtopic_name
 */

/**
 * @typedef {Object} ClassInfo
 * @property {string} id
 * @property {string} class_name
 * @property {string} description
 * @property {string} teacher_id
 * @property {string} class_code
 * @property {string} class_password
 * @property {boolean} is_active
 */

/**
 * @typedef {Object} Quiz
 * @property {string} id
 * @property {string} title
 * @property {QuizType} quiz_type
 * @property {string|null} class_id
 * @property {string} topic
 * @property {string} subtopic
 * @property {DifficultyLevel} difficulty
 * @property {string} creator_id
 * @property {number} timer_minutes
 * @property {boolean} is_published
 */

/**
 * @typedef {Object} Question
 * @property {string} question
 * @property {string[]} options
 * @property {string} answer
 * @property {string} explanation
 * @property {string} subtopic
 */

/**
 * @typedef {Object} QuizAttempt
 * @property {string} id
 * @property {string|null} quiz_id
 * @property {string} student_id
 * @property {number} score
 * @property {number} total
 * @property {number} percentage
 * @property {number} time_taken
 * @property {boolean} auto_submit
 * @property {Object} answers
 * @property {Question[]} questions
 * @property {Array} strong_areas
 * @property {Array} weak_areas
 * @property {string} topic
 * @property {string} subtopic
 * @property {string} difficulty
 * @property {string} quiz_type
 * @property {string} submitted_at
 */

/**
 * @typedef {Object} Roadmap
 * @property {string} id
 * @property {string} user_id
 * @property {string} title
 * @property {string} summary
 * @property {string} focus_message
 * @property {Array} phases
 * @property {Object} daily_plan
 * @property {string} motivational_tip
 * @property {string} subject
 * @property {string} field
 * @property {number} score
 */

export {}
