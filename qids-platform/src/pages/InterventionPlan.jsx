import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Clock, Calendar, Target, Brain, Heart, Users, Zap } from 'lucide-react';

const PILLARS = {
  IQ: { label: 'Intelligence Quotient', color: '#6366f1', emoji: '🧠' },
  EQ: { label: 'Emotional Quotient', color: '#f59e0b', emoji: '❤️' },
  SQ: { label: 'Social Quotient', color: '#10b981', emoji: '🤝' },
  AQ: { label: 'Adversity Quotient', color: '#a855f7', emoji: '⚡' },
};

const BANDS = {
  RED: { label: 'Red Band', color: '#ef4444', desc: 'Foundational support — critical intervention needed' },
  YELLOW: { label: 'Yellow Band', color: '#f59e0b', desc: 'Strengthening skills — moderate support required' },
  GREEN: { label: 'Green Band', color: '#10b981', desc: 'Advanced development — enrichment focus' },
};

const PLAN = {
  IQ: {
    RED: [
      {
        title: 'Module 1: Foundational Literacy Development',
        objective: 'Build foundational academic skills with targeted support.',
        frequency: 'Daily (30–40 minutes)',
        activities: [
          'Picture-based flashcards for vocabulary (emotions, professions, fruits, vehicles)',
          'Phonics exercises (e.g., -s, -sh sounds)',
          'Storytelling for comprehension — students read simple sentences and match with images',
          'Basic English & Bengali self-introduction practice',
          'Reading passages with Q&A sessions',
        ],
        example: 'Students read simple sentences and match them with images, followed by a Q&A.',
      },
      {
        title: 'Module 2: Numeracy Skills Building',
        objective: 'Develop basic number recognition and arithmetic.',
        frequency: 'Daily (30 minutes)',
        activities: [
          'Flashcards for number recognition',
          'Simple counting games',
          'Basic addition and subtraction using hands-on activities',
          'Number-recognition exercises',
        ],
        example: 'Practice recognizing numbers and basic addition/subtraction using hands-on activities.',
      },
      {
        title: 'Module 3: Individualized Study Support',
        objective: 'Provide focused attention on each student\'s weak areas.',
        frequency: 'Weekly (1 session per student)',
        activities: [
          'One-on-one sessions with teachers',
          'Customized worksheets for challenging concepts',
          'Supervised practice of weak areas',
        ],
        example: 'Customized worksheets or supervised practice of challenging concepts.',
      },
    ],
    YELLOW: [
      {
        title: 'Module 1: Focused Reading and Comprehension',
        objective: 'Strengthen foundational academic skills and improve comprehension.',
        frequency: 'Three days a week (40 minutes/session)',
        activities: [
          'Targeted reading exercises to improve vocabulary',
          'Short passage reading followed by Q&A',
          'Storytelling sessions',
          'Spoken English through public speaking activities',
        ],
        example: 'Students read short passages, followed by Q&A to enhance understanding and retention.',
      },
      {
        title: 'Module 2: Foundational Skills Practice',
        objective: 'Reinforce math and language skills through interactive methods.',
        frequency: 'Twice a week (30 minutes/session)',
        activities: [
          'Basic math drills',
          'Interactive storytelling',
          'Literacy exercises',
          'Group storytelling to build language skills',
        ],
        example: 'Solve simple arithmetic problems, followed by group storytelling.',
      },
      {
        title: 'Module 3: Picture Storybooks and Phonics',
        objective: 'Use picture books for comprehension and phonics for reading basics.',
        frequency: 'Twice a week (30 minutes/session)',
        activities: [
          'Picture book reading for comprehension',
          'Phonics exercises for reading basics',
          '"Identify the Story\'s Moral" game to encourage critical thinking',
          'Moral stories: The Elephant and the Ants, The Ants and the Grasshopper',
        ],
        example: 'Play "Identify the Story\'s Moral" game to encourage critical thinking.',
      },
    ],
    GREEN: [
      {
        title: 'Module 1: Advanced Critical Thinking',
        objective: 'Challenge high-performing students with complex reasoning tasks.',
        frequency: 'Twice a week (45 minutes/session)',
        activities: [
          'Debate and argumentation exercises',
          'Complex problem-solving challenges',
          'Research-based mini-projects',
          'Peer teaching sessions',
        ],
        example: 'Students lead mini-debates on age-appropriate topics to develop reasoning skills.',
      },
    ],
  },
  EQ: {
    RED: [
      {
        title: 'Module 1: One-on-One Counselling',
        objective: 'Develop emotional awareness, regulation, and self-esteem.',
        frequency: 'Weekly (20–30 minutes)',
        activities: [
          'Individual sessions with psychologists using storytelling and visuals',
          'Rapport building — discussing student details, family, likes, hobbies, dreams',
          'Thorough discussion on good/bad memories, fears, coping strategies',
          'Situation and problem solving (hypothetical and current scenarios)',
          'CBT: Thought → Action → Behaviour implementation',
        ],
        example: 'Discuss fears through puppet-based storytelling to build trust and emotional vocabulary.',
      },
      {
        title: 'Module 2: Emotion Recognition Therapy',
        objective: 'Help students identify and express feelings.',
        frequency: 'Twice a week (30 minutes/session)',
        activities: [
          'Emotion cards (happy, sad, angry) to identify and express feelings',
          'Group exercises matching scenarios to emotions',
          'Spin, Relate or Recall — share a memory related to a particular emotion',
          'Views on coping strategies',
        ],
        example: 'Group exercises where students match scenarios to emotions and practice responses.',
      },
      {
        title: 'Module 3: Art Therapy',
        objective: 'Express emotions non-verbally through creative tasks.',
        frequency: 'Weekly (1 hour)',
        activities: [
          '"Draw Your Day" — express daily emotions through drawing',
          '"My Safe Place" — draw a place that feels safe and comfortable',
          'Discuss drawings in a group setting',
          'Draw most and least favourite things in the world',
        ],
        example: 'Encourage students to draw their emotions and discuss the drawings in a group setting.',
      },
      {
        title: 'Module 4: Stress Management Techniques',
        objective: 'Teach basic stress regulation and mindfulness.',
        frequency: 'Bi-weekly (15 minutes/session)',
        activities: [
          'Balloon breathing — visualize stress leaving the body',
          'Deep breathing sessions',
          'Breathe before express technique',
          'Visualization and relaxation exercises',
        ],
        example: 'Teach "balloon breathing" to visualize stress leaving the body.',
      },
    ],
    YELLOW: [
      {
        title: 'Module 1: Emotional Regulation and Self-Esteem Building',
        objective: 'Enhance emotional regulation, self-esteem, and stress management.',
        frequency: 'Weekly (40 minutes)',
        activities: [
          'Role-playing scenarios to practice expressing feelings',
          'Discuss reasons and thought processes behind emotions',
          'Everyday and hypothetical scenarios with CBT practice',
          'Empathy vs sympathy — difference and practice',
        ],
        example: 'Role-play situations where students practice expressing feelings such as anger or happiness.',
      },
      {
        title: 'Module 2: Stress Management and Confidence Boosting',
        objective: 'Build confidence through breathing and positive affirmations.',
        frequency: 'Bi-weekly (20 minutes/session)',
        activities: [
          'Deep belly breathing exercises',
          'Guided breathing and relaxation',
          'Positive affirmations practice (e.g., "I am capable")',
          'Affirmation worksheets',
        ],
        example: 'Teach "deep belly breathing," followed by affirmations like "I am capable."',
      },
      {
        title: 'Module 3: Art-Based Emotional Expression',
        objective: 'Foster positivity and emotional expression through art.',
        frequency: 'Weekly (1 hour)',
        activities: [
          'Best memory drawing',
          'Draw something that instantly makes you happy',
          'The unsent postcard activity',
          'Art journaling — draw emotions, write name, when and why',
        ],
        example: 'Students draw or color their favourite moments, fostering positivity and expression.',
      },
    ],
    GREEN: [
      {
        title: 'Module 1: Advanced Emotional Leadership',
        objective: 'Develop emotional leadership and peer support skills.',
        frequency: 'Weekly (45 minutes)',
        activities: [
          'Peer mentoring and emotional support circles',
          'Advanced CBT and mindfulness practices',
          'Leadership through emotional intelligence workshops',
          'Conflict mediation role-plays',
        ],
        example: 'Students lead peer support circles and practice conflict mediation.',
      },
    ],
  },
  SQ: {
    RED: [
      {
        title: 'Module 1: Basic Social Skills Development',
        objective: 'Build foundational social interaction and communication skills.',
        frequency: 'Twice a week (30 minutes/session)',
        activities: [
          'Structured play activities to encourage peer interaction',
          'Turn-taking games and cooperative activities',
          'Basic greeting and conversation practice',
          'Sharing and helping exercises',
        ],
        example: 'Structured play where students practice taking turns and cooperating.',
      },
      {
        title: 'Module 2: Empathy Building',
        objective: 'Develop empathy and understanding of others\' feelings.',
        frequency: 'Weekly (30 minutes)',
        activities: [
          'Emotion recognition through facial expressions',
          'Story-based empathy exercises',
          'Role-play: "How would you feel if...?" scenarios',
          'Group discussions on kindness and helping others',
        ],
        example: 'Students role-play scenarios to understand how others feel in different situations.',
      },
    ],
    YELLOW: [
      {
        title: 'Module 1: Teamwork and Collaboration',
        objective: 'Strengthen teamwork, communication, and conflict resolution.',
        frequency: 'Twice a week (40 minutes/session)',
        activities: [
          'Group projects requiring collaboration',
          'Conflict resolution role-plays',
          'Active listening exercises',
          'Peer feedback sessions',
        ],
        example: 'Group projects where students must negotiate roles and responsibilities.',
      },
      {
        title: 'Module 2: Communication Skills',
        objective: 'Improve verbal and non-verbal communication.',
        frequency: 'Weekly (40 minutes)',
        activities: [
          'Public speaking mini-sessions',
          'Debate and discussion activities',
          'Non-verbal communication games',
          'Storytelling and presentation practice',
        ],
        example: 'Students present a short story to the group and receive peer feedback.',
      },
    ],
    GREEN: [
      {
        title: 'Module 1: Social Leadership',
        objective: 'Develop leadership and community engagement skills.',
        frequency: 'Weekly (45 minutes)',
        activities: [
          'Community service planning activities',
          'Leadership role-play scenarios',
          'Peer mentoring programs',
          'Social awareness and advocacy projects',
        ],
        example: 'Students plan and present a small community initiative.',
      },
    ],
  },
  AQ: {
    RED: [
      {
        title: 'Module 1: Resilience Foundations',
        objective: 'Build basic resilience and coping skills.',
        frequency: 'Twice a week (30 minutes/session)',
        activities: [
          'Stories about overcoming challenges (age-appropriate)',
          'Identifying personal strengths activity',
          '"What can I control?" worksheets',
          'Simple problem-solving exercises',
        ],
        example: 'Students identify one challenge they faced and one thing they did to overcome it.',
      },
      {
        title: 'Module 2: Emotional Coping Strategies',
        objective: 'Teach basic strategies for managing adversity.',
        frequency: 'Weekly (30 minutes)',
        activities: [
          'Breathing and calming techniques',
          '"Help-seeking" practice — who can I ask for help?',
          'Positive self-talk exercises',
          'Reframing negative thoughts activity',
        ],
        example: 'Students practice asking for help in role-play scenarios.',
      },
    ],
    YELLOW: [
      {
        title: 'Module 1: Adaptability Training',
        objective: 'Build flexibility and adaptability in challenging situations.',
        frequency: 'Twice a week (40 minutes/session)',
        activities: [
          'Scenario-based problem solving with changing conditions',
          '"Plan B" thinking exercises',
          'Growth mindset workshops',
          'Reflection journals on past challenges and lessons learned',
        ],
        example: 'Students work through a scenario where the original plan fails and must adapt.',
      },
      {
        title: 'Module 2: Persistence Coaching',
        objective: 'Develop persistence and long-term goal orientation.',
        frequency: 'Weekly (40 minutes)',
        activities: [
          'Goal-setting and tracking activities',
          'Stories of perseverance (local and global role models)',
          '"Never give up" challenge activities',
          'Peer accountability partnerships',
        ],
        example: 'Students set a small weekly goal and report back on their progress.',
      },
    ],
    GREEN: [
      {
        title: 'Module 1: Advanced Resilience and Leadership',
        objective: 'Develop advanced resilience and inspire others.',
        frequency: 'Weekly (45 minutes)',
        activities: [
          'Mentoring younger students on resilience',
          'Complex adversity scenario planning',
          'Personal resilience portfolio development',
          'Community resilience projects',
        ],
        example: 'Students mentor younger peers and share their own resilience stories.',
      },
    ],
  },
};

function ModuleCard({ module, color }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 10, background: 'var(--navy-4)', border: `1px solid ${color}20`, borderRadius: 12, overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{module.title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={11} color="var(--text-muted)" />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{module.frequency}</span>
          </div>
          {open ? <ChevronUp size={13} color="var(--text-muted)" /> : <ChevronDown size={13} color="var(--text-muted)" />}
        </div>
      </button>
      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border-light)' }}>
          <div style={{ marginTop: 12, padding: '8px 12px', background: `${color}08`, border: `1px solid ${color}20`, borderRadius: 8, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Target size={11} color={color} />
              <span style={{ fontSize: 11, fontWeight: 600, color }}>Objective</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{module.objective}</p>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Activities</div>
            {module.activities.map((act, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 5 }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{act}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', borderRadius: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Example: </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>{module.example}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InterventionPlan() {
  const [activePillar, setActivePillar] = useState('IQ');
  const [activeBand, setActiveBand] = useState('RED');
  const pillar = PILLARS[activePillar];
  const band = BANDS[activeBand];
  const modules = PLAN[activePillar]?.[activeBand] || [];

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }} className="animate-fade">
      {/* Sidebar */}
      <div style={{ width: 220, borderRight: '1px solid var(--border-light)', background: 'var(--navy-2)', padding: 20, overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <BookOpen size={16} color="#6366f1" />
          <span style={{ fontSize: 14, fontWeight: 700 }}>Intervention Plan</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
          Structured modules for each pillar and performance band.
        </p>
        <div className="divider" />
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Pillar</div>
        {Object.entries(PILLARS).map(([id, p]) => (
          <button key={id} onClick={() => setActivePillar(id)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 9, marginBottom: 4, cursor: 'pointer',
            background: activePillar === id ? `${p.color}18` : 'transparent',
            border: `1px solid ${activePillar === id ? p.color + '50' : 'transparent'}`,
            color: activePillar === id ? p.color : 'var(--text-secondary)',
            fontSize: 13, fontWeight: activePillar === id ? 600 : 400, textAlign: 'left',
            transition: 'all 0.15s',
          }}>
            <span style={{ fontSize: 16 }}>{p.emoji}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{id}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}>{p.label}</div>
            </div>
          </button>
        ))}
        <div className="divider" />
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Band</div>
        {Object.entries(BANDS).map(([id, b]) => (
          <button key={id} onClick={() => setActiveBand(id)} style={{
            width: '100%', padding: '8px 12px', borderRadius: 9, marginBottom: 4, cursor: 'pointer',
            background: activeBand === id ? `${b.color}15` : 'transparent',
            border: `1px solid ${activeBand === id ? b.color + '40' : 'transparent'}`,
            color: activeBand === id ? b.color : 'var(--text-secondary)',
            fontSize: 12, fontWeight: activeBand === id ? 600 : 400, textAlign: 'left',
            transition: 'all 0.15s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
              {b.label}
            </div>
          </button>
        ))}
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${pillar.color}20`, border: `1px solid ${pillar.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            {pillar.emoji}
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, fontFamily: 'Space Grotesk' }}>{activePillar} — {pillar.label}</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Intervention modules for {band.label}</p>
          </div>
        </div>

        {/* Band info */}
        <div style={{ padding: '10px 16px', background: `${band.color}10`, border: `1px solid ${band.color}30`, borderRadius: 10, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: band.color, flexShrink: 0 }} />
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: band.color }}>{band.label}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>{band.desc}</span>
          </div>
          <div style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 20, background: `${band.color}15`, border: `1px solid ${band.color}30`, fontSize: 11, fontWeight: 600, color: band.color }}>
            {modules.length} Module{modules.length !== 1 ? 's' : ''}
          </div>
        </div>

        {modules.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
            No modules defined for this combination yet.
          </div>
        ) : (
          modules.map((mod, i) => <ModuleCard key={i} module={mod} color={pillar.color} />)
        )}

        {/* 6-month roadmap summary */}
        <div style={{ marginTop: 24, padding: 20, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Calendar size={14} color="#818cf8" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#818cf8' }}>6-Month Roadmap Overview</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { month: 'Month 1–2', focus: 'Assessment & Orientation, Red Band Intensive' },
              { month: 'Month 2–3', focus: 'Yellow Band Strengthening, EQ & AQ Focus' },
              { month: 'Month 3–4', focus: 'SQ Collaboration, IQ Cognitive Building' },
              { month: 'Month 4–5', focus: 'Green Band Enrichment, Leadership Skills' },
              { month: 'Month 5–6', focus: 'Integration Sessions, Peer Mentoring' },
              { month: 'Month 6', focus: 'Post-Intervention Assessment & Review' },
            ].map(({ month, focus }) => (
              <div key={month} style={{ padding: '10px 12px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', marginBottom: 4 }}>{month}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{focus}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
