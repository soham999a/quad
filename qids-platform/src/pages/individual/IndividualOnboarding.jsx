import usePageTitle from '../../lib/usePageTitle';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, GraduationCap, Briefcase, Brain, ChevronRight } from 'lucide-react';

const AGE_GROUPS = [
  { id: '11-18', label: '11-18', desc: 'School / College Student', icon: GraduationCap },
  { id: '19-32', label: '19-32', desc: 'Young Professional', icon: Briefcase },
];

const PURPOSES = [
  { id: 'career', label: 'Career Clarity', desc: 'Discover which roles and paths match your cognitive profile.', icon: Briefcase },
  { id: 'growth', label: 'Personal Growth', desc: 'Understand your strengths and areas for development.', icon: Brain },
  { id: 'academic', label: 'Academic Guidance', desc: 'Identify learning styles and academic potential.', icon: GraduationCap },
  { id: 'general', label: 'General Exploration', desc: 'Get a complete intelligence blueprint with no specific goal.', icon: Sparkles },
];

export default function IndividualOnboarding() {
  usePageTitle('Individual onboarding');
  const navigate = useNavigate();
  const [ageGroup, setAgeGroup] = useState('');
  const [purpose, setPurpose] = useState('');
  const canProceed = ageGroup && purpose;

  const handleBegin = () => {
    if (!canProceed) return;
    navigate(`/app/assessment?mode=individual&ageGroup=${ageGroup}&purpose=${purpose}`);
  };

  return (
    <div className="page-pad max-w-[960px] mx-auto animate-fade pb-24 md:pb-16">
      <section className="mb-12 md:mb-16 text-center fade-up">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles size={14} className="text-primary" />
          <span className="kicker">My Assessment</span>
        </div>
        <h1 className="text-headline-md md:text-headline-lg font-headline-md text-on-background page-headline">
          Your Intelligence Blueprint
        </h1>
        <p className="text-body-md text-surface-variant max-w-xl mx-auto mt-4 leading-relaxed">
          A personalized assessment across four dimensions of intelligence.
          Answer honestly — there are no right or wrong answers.
        </p>
        <div className="gradient-rule mt-8 max-w-xs mx-auto" />
      </section>

      <section className="mb-12 fade-up" style={{ animationDelay: '60ms' }}>
        <div className="flex items-center justify-between mb-4">
          <span className="kicker">Your Age Group</span>
          <span className="text-technical-sm font-technical-sm text-surface-variant">Required</span>
        </div>
        <div className="gradient-rule mb-6" />
        <div className="grid md:grid-cols-2 gap-4">
          {AGE_GROUPS.map((ag, i) => {
            const selected = ageGroup === ag.id;
            const Icon = ag.icon;
            return (
              <button key={ag.id}
                onClick={() => setAgeGroup(ag.id)}
                style={{ animationDelay: `${120 + i * 60}ms` }}
                className={`relative text-left p-5 md:p-6 card card-hover fade-up cursor-pointer transition-all duration-200 ${selected ? 'card-gold' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`text-label-md font-label-md tracking-widest ${selected ? 'text-primary' : 'text-on-background'}`}>{ag.label}</div>
                  {selected && (
                    <span className="chip" style={{ background: 'var(--gold-soft)', color: 'var(--color-primary)', borderColor: 'var(--gold-line-strong)' }}>
                      <ChevronRight size={12} /> Selected
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${selected ? 'bg-primary/15' : 'bg-surface-container-high'}`}>
                    <Icon size={18} className={selected ? 'text-primary' : 'text-surface-variant'} />
                  </span>
                  <div className="text-body-md text-on-surface-variant">{ag.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mb-12 fade-up" style={{ animationDelay: '180ms' }}>
        <div className="flex items-center justify-between mb-4">
          <span className="kicker">What brings you here?</span>
          <span className="text-technical-sm font-technical-sm text-surface-variant">Required</span>
        </div>
        <div className="gradient-rule mb-6" />
        <div className="grid md:grid-cols-2 gap-4">
          {PURPOSES.map((p, i) => {
            const selected = purpose === p.id;
            const Icon = p.icon;
            return (
              <button key={p.id}
                onClick={() => setPurpose(p.id)}
                style={{ animationDelay: `${240 + i * 60}ms` }}
                className={`relative text-left p-5 md:p-6 card card-hover fade-up cursor-pointer transition-all duration-200 ${selected ? 'card-gold' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`text-label-md font-label-md tracking-widest ${selected ? 'text-primary' : 'text-on-background'}`}>{p.label}</div>
                  {selected && (
                    <span className="chip" style={{ background: 'var(--gold-soft)', color: 'var(--color-primary)', borderColor: 'var(--gold-line-strong)' }}>
                      <ChevronRight size={12} /> Selected
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${selected ? 'bg-primary/15' : 'bg-surface-container-high'}`}>
                    <Icon size={18} className={selected ? 'text-primary' : 'text-surface-variant'} />
                  </span>
                  <div className="text-body-md text-on-surface-variant leading-relaxed">{p.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="fade-up text-center" style={{ animationDelay: '420ms' }}>
        <button onClick={handleBegin} disabled={!canProceed}
          className={`btn-primary glow w-full md:w-auto ${!canProceed ? 'opacity-40 cursor-not-allowed' : ''}`}>
          BEGIN ASSESSMENT <ArrowRight size={14} />
        </button>
        <p className="text-technical-sm font-technical-sm text-outline mt-4">
          {canProceed
            ? 'Takes approximately 60-75 minutes. You can save progress at any time.'
            : 'Select your age group and purpose to continue.'}
        </p>
      </section>
    </div>
  );
}
