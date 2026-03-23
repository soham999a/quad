import React, { useState } from 'react';
import { ClipboardList, ChevronDown, ChevronUp, BookOpen, Brain, Heart, Users, Zap } from 'lucide-react';

const PILLARS = {
  IQ: { label: 'Intelligence Quotient', color: '#6366f1', icon: Brain, emoji: '🧠' },
  EQ: { label: 'Emotional Quotient', color: '#f59e0b', icon: Heart, emoji: '❤️' },
  SQ: { label: 'Social Quotient', color: '#10b981', icon: Users, emoji: '🤝' },
  AQ: { label: 'Adversity Quotient', color: '#a855f7', icon: Zap, emoji: '⚡' },
};

const QUESTIONNAIRES = {
  IQ: {
    sections: [
      {
        title: 'Verbal IQ (25 marks)',
        subsections: [
          {
            title: 'Vocabulary (5 Marks)',
            instruction: 'Choose the correct definition for each word:',
            questions: [
              { q: 'Eloquent', options: ['Shy', 'Expressive and persuasive', 'Angry', 'Quiet'], answer: 1 },
              { q: 'Perplexed', options: ['Confused', 'Happy', 'Angry', 'Excited'], answer: 0 },
              { q: 'Meticulous', options: ['Careful and precise', 'Lazy', 'Unorganized', 'Quick'], answer: 0 },
              { q: 'Arbitrary', options: ['Random', 'Planned', 'Important', 'Necessary'], answer: 0 },
              { q: 'Resilient', options: ['Flexible and able to recover quickly', 'Fragile', 'Slow', 'Boring'], answer: 0 },
            ],
          },
          {
            title: 'Odd One Out (5 Marks)',
            instruction: 'Identify the word that is different from the others and explain why:',
            questions: [
              { q: 'Cow and Goat', type: 'open' },
              { q: 'Chair and Table', type: 'open' },
              { q: 'Pen and Pencil', type: 'open' },
              { q: 'Sun and Moon', type: 'open' },
              { q: 'Fruit and Vegetable', type: 'open' },
            ],
          },
          {
            title: 'General Knowledge (5 Marks)',
            questions: [
              { q: 'Who was the first Prime Minister of India?', type: 'open' },
              { q: 'What is the name of the famous flower market in Kolkata?', type: 'open' },
              { q: 'How many continents are there on Earth?', type: 'open' },
              { q: 'What is the birth date of Kolkata as a city? Which three villages were combined to form it?', type: 'open' },
              { q: 'What is the chemical symbol for water?', type: 'open' },
            ],
          },
          {
            title: 'Comprehension (5 Marks)',
            instruction: 'Answer based on the given statements:',
            questions: [
              { q: 'If all students in a class pass the exam, the class is successful. The class is successful. What can we conclude about the students?', type: 'open' },
              { q: 'Sarah likes apples more than oranges. She prefers sweet fruit. What kind of fruit does Sarah likely prefer?', type: 'open' },
              { q: 'If Radha finishes homework early, she will watch TV. Jane has time to watch TV. What can we infer about her homework?', type: 'open' },
              { q: 'All dogs are animals. Some animals are pets. Are all dogs pets?', type: 'open' },
              { q: 'The library is open from 9 AM to 5 PM. If it\'s 6 PM, is the library open?', type: 'open' },
            ],
          },
        ],
      },
      {
        title: 'Quantitative IQ (25 marks)',
        subsections: [
          {
            title: 'Working Memory — Arithmetic (5 Marks)',
            instruction: 'Solve the following problems:',
            questions: [
              { q: '15 + 28 = ?', type: 'open' },
              { q: '64 − 37 = ?', type: 'open' },
              { q: '8 × 7 = ?', type: 'open' },
              { q: '81 ÷ 9 = ?', type: 'open' },
              { q: '56 + 19 = ?', type: 'open' },
            ],
          },
          {
            title: 'Pattern Recognition (5 Marks)',
            instruction: 'Identify the next item in the sequence:',
            questions: [
              { q: 'Circle, Triangle, Circle, Triangle, ?', options: ['Square', 'Circle', 'Triangle', 'Star'], answer: 1 },
              { q: 'Red, Blue, Green, Red, Blue, ?', options: ['Red', 'Green', 'Blue', 'Yellow'], answer: 1 },
              { q: '1, 4, 9, 16, ?', options: ['20', '25', '24', '18'], answer: 1 },
              { q: 'A, C, E, G, ?', options: ['H', 'I', 'J', 'K'], answer: 1 },
              { q: '3, 6, 12, 24, ?', options: ['36', '48', '30', '42'], answer: 1 },
            ],
          },
        ],
      },
      {
        title: 'Psychometric Test (25 marks)',
        subsections: [
          {
            title: 'Numeric Reasoning (5 Marks)',
            questions: [
              { q: 'What is 25% of 80?', type: 'open' },
              { q: 'If a train travels 60 miles in 1 hour, how far will it travel in 3 hours?', type: 'open' },
              { q: 'Solve for x: 5x + 7 = 32', type: 'open' },
              { q: 'What is the next number in the series: 2, 6, 12, 20, ?', type: 'open' },
              { q: 'If you have 3 apples and give away 2, how many do you have left?', type: 'open' },
            ],
          },
          {
            title: 'Verbal Reasoning (5 Marks)',
            questions: [
              { q: 'Which word does not belong: Cat, Dog, Car, Rabbit?', options: ['Cat', 'Dog', 'Car', 'Rabbit'], answer: 2 },
              { q: 'If all roses are flowers, and some flowers fade quickly, do all roses fade quickly?', options: ['Yes', 'No', 'Maybe', 'Not enough info'], answer: 3 },
              { q: 'Which word is opposite in meaning to "Generous"?', options: ['Mean', 'Friendly', 'Brave', 'Honest'], answer: 0 },
            ],
          },
          {
            title: 'Logical Reasoning (5 Marks)',
            questions: [
              { q: 'All squares are rectangles. Some rectangles are circles. Are some squares circles?', type: 'open' },
              { q: 'If two pencils cost 30 cents, how much do five pencils cost?', type: 'open' },
              { q: 'If today is Wednesday, what day will it be in three days?', type: 'open' },
              { q: 'Which is true: "All birds can fly," "Some birds cannot fly," or "No birds can fly"?', options: ['All birds can fly', 'Some birds cannot fly', 'No birds can fly'], answer: 1 },
            ],
          },
        ],
      },
    ],
  },
  EQ: {
    sections: [
      {
        title: 'Emotional Intelligence Self-Assessment',
        subsections: [
          {
            title: 'Self-Awareness',
            instruction: 'Rate each statement: 1 = Does NOT apply at all, 3 = Applies about half the time, 5 = ALWAYS applies',
            questions: [
              { q: 'I can recognise what I am feeling in the moment.', type: 'scale' },
              { q: 'I understand how my emotions affect my behaviour.', type: 'scale' },
              { q: 'I see myself as others see me.', type: 'scale' },
              { q: 'I have a good sense of my own abilities and limitations.', type: 'scale' },
              { q: 'I can identify my habitual emotional responses to events.', type: 'scale' },
            ],
          },
          {
            title: 'Managing Emotions',
            instruction: 'Rate each statement: 1 = Does NOT apply at all, 5 = ALWAYS applies',
            questions: [
              { q: 'I stay focused and think clearly even when experiencing powerful emotions.', type: 'scale' },
              { q: 'I take responsibility for my actions rather than blaming others.', type: 'scale' },
              { q: 'I avoid hasty decisions I later regret.', type: 'scale' },
              { q: 'I can manage my emotional state effectively.', type: 'scale' },
              { q: 'I remain calm under pressure.', type: 'scale' },
            ],
          },
          {
            title: 'Motivating Oneself',
            instruction: 'Rate each statement: 1 = Does NOT apply at all, 5 = ALWAYS applies',
            questions: [
              { q: 'I use my emotions to move towards my goals.', type: 'scale' },
              { q: 'I take initiative even when things are difficult.', type: 'scale' },
              { q: 'I persevere in the face of obstacles and setbacks.', type: 'scale' },
              { q: 'I maintain a positive attitude when facing challenges.', type: 'scale' },
              { q: 'I am driven by a sense of purpose.', type: 'scale' },
            ],
          },
          {
            title: 'Empathy',
            instruction: 'Rate each statement: 1 = Does NOT apply at all, 5 = ALWAYS applies',
            questions: [
              { q: 'I can sense what others are feeling without them telling me.', type: 'scale' },
              { q: 'I understand and respond to what other people are feeling.', type: 'scale' },
              { q: 'I listen carefully to others before responding.', type: 'scale' },
              { q: 'I consider others\' perspectives before making decisions.', type: 'scale' },
              { q: 'I notice when someone is upset even if they don\'t say so.', type: 'scale' },
            ],
          },
          {
            title: 'Social Skills',
            instruction: 'Rate each statement: 1 = Does NOT apply at all, 5 = ALWAYS applies',
            questions: [
              { q: 'I can manage and influence emotions in others.', type: 'scale' },
              { q: 'I handle emotions in relationships effectively.', type: 'scale' },
              { q: 'I can inspire and motivate others.', type: 'scale' },
              { q: 'I work well in a team.', type: 'scale' },
              { q: 'I resolve conflicts constructively.', type: 'scale' },
            ],
          },
        ],
      },
    ],
  },
  SQ: {
    sections: [
      {
        title: 'Social Quotient Interview Questions',
        subsections: [
          {
            title: 'Friendship & Social Interaction',
            instruction: 'Answer the following questions openly and honestly:',
            questions: [
              { q: 'Tell us about your last fun experience with your best friend.', type: 'open', hint: 'Assesses how the child values friendship and social interaction.' },
              { q: 'If your friend is sad, what would you do?', type: 'open', hint: 'Assesses empathy and empathetic behaviour.' },
              { q: 'If you were new to a class, how would you make friends?', type: 'open', hint: 'Assesses social inclusion and relationship-building skills.' },
            ],
          },
          {
            title: 'Teamwork & Conflict Resolution',
            instruction: 'Answer the following questions openly and honestly:',
            questions: [
              { q: 'During a group project, if your friends give different opinions, how would you decide?', type: 'open', hint: 'Assesses teamwork and conflict management skills.' },
              { q: 'In your favourite game, if someone refuses to accept defeat, how would you handle the situation?', type: 'open', hint: 'Assesses fairness and rule-following behaviour.' },
            ],
          },
          {
            title: 'Cooperation & Social Responsibility',
            instruction: 'Answer the following questions openly and honestly:',
            questions: [
              { q: 'Have you ever taken help from someone or helped someone? Tell us about that experience.', type: 'open', hint: 'Assesses cooperation and social responsibility.' },
            ],
          },
        ],
      },
      {
        title: 'Situational Judgement Test (Grade 7–10)',
        subsections: [
          {
            title: 'Social Scenarios',
            instruction: 'Choose the best response for each situation:',
            questions: [
              {
                q: 'Your classmate is being bullied. You see it happening. What do you do?',
                options: ['Ignore it — it\'s not your problem', 'Join in with the bullying', 'Tell a teacher or trusted adult', 'Watch but do nothing'],
                answer: 2,
              },
              {
                q: 'Your team loses a competition. A teammate starts crying. You:',
                options: ['Tell them to stop being dramatic', 'Comfort them and say it\'s okay', 'Walk away', 'Blame them for the loss'],
                answer: 1,
              },
              {
                q: 'You disagree with a group decision. You:',
                options: ['Refuse to participate', 'Express your view calmly and accept the group\'s final decision', 'Force everyone to agree with you', 'Stay silent and feel resentful'],
                answer: 1,
              },
            ],
          },
        ],
      },
    ],
  },
  AQ: {
    sections: [
      {
        title: 'Adversity Quotient Assessment (CORE Framework)',
        subsections: [
          {
            title: 'Control (C) — Can you influence the situation?',
            instruction: 'Rate each: 1 = Not at all, 5 = Completely',
            questions: [
              { q: 'You spill your juice at lunch. Can you clean it up?', type: 'scale5' },
              { q: 'You forget your homework at home. Can you remember to bring it next time?', type: 'scale5' },
              { q: 'You have a hard time with a math problem. Can you ask for help?', type: 'scale5' },
              { q: 'Your friends are not playing nicely. Can you find a way to play together?', type: 'scale5' },
              { q: 'You can\'t find your favourite toy. Can you look in different places?', type: 'scale5' },
            ],
          },
          {
            title: 'Ownership (O) — Do you take responsibility?',
            instruction: 'Rate each: 1 = Not at all, 5 = Completely',
            questions: [
              { q: 'You forget to do a chore at home. Do you try to fix it yourself?', type: 'scale5' },
              { q: 'You get a low grade on a test. Do you think about how to do better next time?', type: 'scale5' },
              { q: 'You break something by accident. Do you try to help fix it?', type: 'scale5' },
              { q: 'You get into a fight with a friend. Do you try to make up with them?', type: 'scale5' },
              { q: 'You forget an important school event. Do you try to remember next time?', type: 'scale5' },
            ],
          },
          {
            title: 'Reach (R) — Does adversity spread to other areas?',
            instruction: 'Rate each: 1 = A lot (spreads widely), 5 = Not at all (stays contained)',
            questions: [
              { q: 'You lose a game at recess. Does it make you sad for a long time?', type: 'scale5r' },
              { q: 'You don\'t get chosen for a team. Does it make everything else feel bad?', type: 'scale5r' },
              { q: 'You have a bad day at school. Does it ruin your whole week?', type: 'scale5r' },
              { q: 'You argue with a friend. Does it make you feel bad about other friends too?', type: 'scale5r' },
              { q: 'You lose your favourite pencil. Does it make everything else seem bad?', type: 'scale5r' },
            ],
          },
          {
            title: 'Endurance (E) — How long does adversity last?',
            instruction: 'Rate each: 1 = A long time, 5 = A short time',
            questions: [
              { q: 'You can\'t go to a friend\'s birthday party. Do you feel sad for a long time?', type: 'scale5r' },
              { q: 'You don\'t do well on a project. Do you think you will always do badly?', type: 'scale5r' },
              { q: 'You get sick and miss school. Do you feel like you\'ll never get better?', type: 'scale5r' },
              { q: 'Your pet gets sick. Do you think they will never get better?', type: 'scale5r' },
              { q: 'You don\'t finish a fun activity. Do you feel like you\'ll never get to do it again?', type: 'scale5r' },
            ],
          },
        ],
      },
    ],
  },
};

function ScaleInput({ reversed }) {
  const [val, setVal] = useState(null);
  const labels = reversed
    ? ['A lot', '', '', '', 'Not at all']
    : ['Not at all', '', '', '', 'Always'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={() => setVal(n)} style={{
          width: 32, height: 32, borderRadius: '50%', border: `2px solid ${val === n ? '#6366f1' : 'var(--border-light)'}`,
          background: val === n ? '#6366f1' : 'transparent',
          color: val === n ? 'white' : 'var(--text-secondary)',
          fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
          flexShrink: 0,
        }}>{n}</button>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1, paddingLeft: 4 }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{labels[0]}</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{labels[4]}</span>
      </div>
    </div>
  );
}

function MCQInput({ options, answer }) {
  const [selected, setSelected] = useState(null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
      {options.map((opt, i) => {
        const isSelected = selected === i;
        const isCorrect = selected !== null && i === answer;
        const isWrong = isSelected && i !== answer;
        return (
          <button key={i} onClick={() => setSelected(i)} style={{
            padding: '7px 12px', borderRadius: 8, textAlign: 'left', cursor: 'pointer',
            fontSize: 12, border: `1px solid ${isCorrect ? '#10b981' : isWrong ? '#ef4444' : isSelected ? '#6366f1' : 'var(--border-light)'}`,
            background: isCorrect ? 'rgba(16,185,129,0.1)' : isWrong ? 'rgba(239,68,68,0.08)' : isSelected ? 'rgba(99,102,241,0.1)' : 'transparent',
            color: isCorrect ? '#10b981' : isWrong ? '#ef4444' : 'var(--text-secondary)',
            transition: 'all 0.15s',
          }}>
            <span style={{ fontWeight: 600, marginRight: 6 }}>{String.fromCharCode(65 + i)}.</span>{opt}
          </button>
        );
      })}
    </div>
  );
}

function OpenInput() {
  return (
    <textarea placeholder="Write your answer here..." style={{
      width: '100%', marginTop: 6, padding: '8px 10px', borderRadius: 8,
      background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)',
      color: 'var(--text-primary)', fontSize: 12, resize: 'vertical', minHeight: 60,
      fontFamily: 'Inter', lineHeight: 1.5, boxSizing: 'border-box',
    }} />
  );
}

function QuestionItem({ q, index }) {
  return (
    <div style={{ marginBottom: 14, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--border-light)' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>Q{index + 1}.</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>{q.q}</p>
          {q.hint && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, fontStyle: 'italic' }}>{q.hint}</p>}
          {q.type === 'scale' && <ScaleInput />}
          {q.type === 'scale5' && <ScaleInput />}
          {q.type === 'scale5r' && <ScaleInput reversed />}
          {q.type === 'open' && <OpenInput />}
          {q.options && !q.type && <MCQInput options={q.options} answer={q.answer} />}
          {q.options && q.type === 'open' && <OpenInput />}
        </div>
      </div>
    </div>
  );
}

function SubsectionBlock({ sub, qOffset }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginBottom: 12 }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 14px', background: 'var(--navy-4)', border: '1px solid var(--border-light)',
        borderRadius: open ? '10px 10px 0 0' : 10, cursor: 'pointer', color: 'var(--text-primary)',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{sub.title}</span>
        {open ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
      </button>
      {open && (
        <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-light)', borderTop: 'none', borderRadius: '0 0 10px 10px' }}>
          {sub.instruction && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, fontStyle: 'italic' }}>{sub.instruction}</p>}
          {sub.questions.map((q, i) => <QuestionItem key={i} q={q} index={qOffset + i} />)}
        </div>
      )}
    </div>
  );
}

function SectionBlock({ section, pillarColor }) {
  const [open, setOpen] = useState(true);
  let qCount = 0;
  return (
    <div style={{ marginBottom: 20 }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', background: `${pillarColor}12`, border: `1px solid ${pillarColor}30`,
        borderRadius: open ? '12px 12px 0 0' : 12, cursor: 'pointer', color: 'var(--text-primary)',
      }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{section.title}</span>
        {open ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
      </button>
      {open && (
        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: `1px solid ${pillarColor}20`, borderTop: 'none', borderRadius: '0 0 12px 12px' }}>
          {section.subsections.map((sub, i) => {
            const offset = qCount;
            qCount += sub.questions.length;
            return <SubsectionBlock key={i} sub={sub} qOffset={offset} />;
          })}
        </div>
      )}
    </div>
  );
}

export default function Questionnaires() {
  const [activePillar, setActivePillar] = useState('IQ');
  const pillar = PILLARS[activePillar];
  const data = QUESTIONNAIRES[activePillar];

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }} className="animate-fade">
      {/* Sidebar */}
      <div style={{ width: 220, borderRight: '1px solid var(--border-light)', background: 'var(--navy-2)', padding: 20, overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <ClipboardList size={16} color="#6366f1" />
          <span style={{ fontSize: 14, fontWeight: 700 }}>Questionnaires</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
          Structured assessment tools for each intelligence pillar.
        </p>
        <div className="divider" />
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Select Pillar</div>
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
        <div style={{ padding: 12, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#818cf8', marginBottom: 4 }}>Note</div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
            These are sample questionnaires for structured assessment. NGO-specific data is confidential and not included.
          </p>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${pillar.color}20`, border: `1px solid ${pillar.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            {pillar.emoji}
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, fontFamily: 'Space Grotesk' }}>{activePillar} — {pillar.label}</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Sample questionnaire for structured assessment</p>
          </div>
          <div style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: 20, background: `${pillar.color}15`, border: `1px solid ${pillar.color}30`, fontSize: 11, fontWeight: 600, color: pillar.color }}>
            {data.sections.reduce((acc, s) => acc + s.subsections.reduce((a, sub) => a + sub.questions.length, 0), 0)} Questions
          </div>
        </div>

        {data.sections.map((section, i) => (
          <SectionBlock key={i} section={section} pillarColor={pillar.color} />
        ))}
      </div>
    </div>
  );
}
