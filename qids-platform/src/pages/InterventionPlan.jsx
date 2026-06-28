import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Clock, Calendar, Target, Brain, Heart, Users, Zap } from 'lucide-react';

const PILLAR_ICONS = { Brain: <Brain size={20} />, Heart: <Heart size={20} />, Users: <Users size={20} />, Zap: <Zap size={20} /> };
import { PILLARS } from '../data/qidsData';

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
          'CBT: Thought > Action > Behaviour implementation',
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
    <div className="mb-2.5 bg-surface-container-low overflow-hidden rounded-xl" style={{ border: `1px solid ${color}20` }}>
      <button onClick={() => setOpen(!open)} className="w-full flex justify-between items-center px-4 py-3 bg-transparent border-none cursor-pointer text-on-surface">
        <div className="flex items-center gap-2.5 text-left">
          <div className="size-2 rounded-full shrink-0" style={{ background: color }} />
          <span className="text-[13px] font-semibold">{module.title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1">
            <Clock size={11} className="text-surface-variant" />
            <span className="text-technical-sm text-surface-variant">{module.frequency}</span>
          </div>
          {open ? <ChevronUp size={13} className="text-surface-variant" /> : <ChevronDown size={13} className="text-surface-variant" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-outline-variant">
          <div className="mt-3 px-3 py-2 mb-3 rounded-lg" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Target size={11} style={{ color }} />
              <span className="text-technical-sm font-semibold" style={{ color }}>Objective</span>
            </div>
            <p className="text-label-md text-on-surface-variant m-0 leading-normal">{module.objective}</p>
          </div>
          <div className="mb-3">
            <div className="text-technical-sm font-semibold text-surface-variant uppercase tracking-[0.5px] mb-2">Activities</div>
            {module.activities.map((act, i) => (
              <div key={i} className="flex gap-2 mb-1.5">
                <div className="size-[5px] rounded-full shrink-0 mt-[5px]" style={{ background: color }} />
                <span className="text-label-md text-on-surface-variant leading-normal">{act}</span>
              </div>
            ))}
          </div>
          <div className="px-3 py-2 border border-outline-variant rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <span className="text-technical-sm font-semibold text-surface-variant">Example: </span>
            <span className="text-label-md text-on-surface-variant italic">{module.example}</span>
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
    <div className="flex h-[calc(100vh-56px)] animate-fade">
      {/* Sidebar - hidden on mobile */}
      <div className="w-[220px] border-r border-outline-variant bg-surface-container p-5 overflow-y-auto shrink-0 hide-mobile">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={16} className="text-indigo-500" />
          <span className="text-[14px] font-bold">Intervention Plan</span>
        </div>
        <p className="text-label-md text-surface-variant leading-normal mb-4">
          Structured modules for each pillar and performance band.
        </p>
        <div className="divider" />
        <div className="text-technical-sm text-surface-variant uppercase tracking-[0.5px] mb-2.5">Pillar</div>
        {Object.entries(PILLARS).map(([id, p]) => (
          <button key={id} onClick={() => setActivePillar(id)} className="w-full flex items-center gap-2.5 px-3 py-[9px] rounded-lg mb-1 cursor-pointer text-left text-[13px]" style={{
            background: activePillar === id ? `${p.color}18` : 'transparent',
            border: `1px solid ${activePillar === id ? p.color + '50' : 'transparent'}`,
            color: activePillar === id ? p.color : undefined,
            fontWeight: activePillar === id ? 600 : 400,
            transition: 'all 0.15s',
          }}>
            <span className="text-[16px]">{PILLAR_ICONS[p.emoji] || null}</span>
            <div>
              <div className="text-label-md font-bold">{id}</div>
              <div className="text-technical-sm text-surface-variant font-normal">{p.label}</div>
            </div>
          </button>
        ))}
        <div className="divider" />
        <div className="text-technical-sm text-surface-variant uppercase tracking-[0.5px] mb-2.5">Band</div>
        {Object.entries(BANDS).map(([id, b]) => (
          <button key={id} onClick={() => setActiveBand(id)} className="w-full px-3 py-2 rounded-lg mb-1 cursor-pointer text-left text-label-md" style={{
            background: activeBand === id ? `${b.color}15` : 'transparent',
            border: `1px solid ${activeBand === id ? b.color + '40' : 'transparent'}`,
            color: activeBand === id ? b.color : undefined,
            fontWeight: activeBand === id ? 600 : 400,
            transition: 'all 0.15s',
          }}>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full shrink-0" style={{ background: b.color }} />
              {b.label}
            </div>
          </button>
        ))}
      </div>

      {/* Main */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Mobile selectors */}
        <div className="hide-desktop mb-4 flex gap-2">
          <select value={activePillar} onChange={e => setActivePillar(e.target.value)}
            className="flex-1 px-4 py-3 bg-surface-container-low border border-outline-variant text-on-surface font-technical-sm outline-none focus:border-primary"
            style={{ fontSize: 16 }}>
            {Object.entries(PILLARS).map(([id, p]) => (
              <option key={id} value={id}>{id} — {p.label}</option>
            ))}
          </select>
          <select value={activeBand} onChange={e => setActiveBand(e.target.value)}
            className="flex-1 px-4 py-3 bg-surface-container-low border border-outline-variant text-on-surface font-technical-sm outline-none focus:border-primary"
            style={{ fontSize: 16 }}>
            {Object.entries(BANDS).map(([id, b]) => (
              <option key={id} value={id}>{b.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div className="size-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${pillar.color}20`, border: `1px solid ${pillar.color}40` }}>
            {PILLAR_ICONS[pillar.emoji] || null}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[18px] font-extrabold m-0 font-headline-md truncate">{activePillar} — {pillar.label}</h2>
            <p className="text-label-md text-surface-variant m-0">Intervention modules for {band.label}</p>
          </div>
        </div>

        {/* Band info */}
        <div className="px-4 py-2.5 rounded-lg mb-5 flex items-center gap-2.5" style={{ background: `${band.color}10`, border: `1px solid ${band.color}30` }}>
          <div className="size-[10px] rounded-full shrink-0" style={{ background: band.color }} />
          <div className="min-w-0 flex-1">
            <span className="text-[13px] font-bold" style={{ color: band.color }}>{band.label}</span>
            <span className="text-label-md text-surface-variant ml-2">{band.desc}</span>
          </div>
          <div className="ml-auto px-2.5 py-[3px] rounded-full text-technical-sm font-semibold shrink-0" style={{ background: `${band.color}15`, border: `1px solid ${band.color}30`, color: band.color }}>
            {modules.length} Module{modules.length !== 1 ? 's' : ''}
          </div>
        </div>

        {modules.length === 0 ? (
          <div className="text-center p-10 text-surface-variant text-[13px]">
            No modules defined for this combination yet.
          </div>
        ) : (
          modules.map((mod, i) => <ModuleCard key={i} module={mod} color={pillar.color} />)
        )}

        {/* 6-month roadmap summary */}
        <div className="mt-6 p-4 md:p-5 rounded-xl" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={14} className="text-indigo-400" />
            <span className="text-[13px] font-bold text-indigo-400">6-Month Roadmap Overview</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              { month: 'Month 1–2', focus: 'Assessment & Orientation, Red Band Intensive' },
              { month: 'Month 2–3', focus: 'Yellow Band Strengthening, EQ & AQ Focus' },
              { month: 'Month 3–4', focus: 'SQ Collaboration, IQ Cognitive Building' },
              { month: 'Month 4–5', focus: 'Green Band Enrichment, Leadership Skills' },
              { month: 'Month 5–6', focus: 'Integration Sessions, Peer Mentoring' },
              { month: 'Month 6', focus: 'Post-Intervention Assessment & Review' },
            ].map(({ month, focus }) => (
              <div key={month} className="px-3 py-2.5 rounded-lg" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)' }}>
                <div className="text-technical-sm font-bold text-indigo-400 mb-1">{month}</div>
                <div className="text-technical-sm text-on-surface-variant leading-[1.4]">{focus}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
