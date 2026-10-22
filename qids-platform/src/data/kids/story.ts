// ─── Kids 4Q Practice — story content ────────────────────────────────────────
// Content is data, not code: adding a chapter means editing this file. Each
// scene has one prompt and two or three character decisions; every decision is
// tagged with the quotient it exercises and a 0–3 practice weight. A choice can
// unlock the chapter's optional bonus scene, which is how the arc stays
// personal without an exponential branch tree.
//
// Ages 8–14: short sentences, concrete images, no scores shown as a percentage.

import type { KidsChapter } from '../../core/kids/types';

export const CHAPTERS: KidsChapter[] = [
  {
    id: 'empathy',
    index: 1,
    title: 'The New Kid at the Gate',
    subtitle: 'Someone is standing alone with a torn map.',
    quotient: 'EQ',
    minutes: 10,
    node: 'Empathy',
    scenes: [
      {
        id: 'gate',
        narration:
          'It is the first cold morning of the term. A new kid called Noor stands at the gate holding a torn map, turning it the wrong way. Everyone else walks past because the bell is about to ring.',
        prompt: 'What do you do?',
        choices: [
          {
            id: 'share_map',
            text: 'Walk over and offer to share my map.',
            quotient: 'EQ',
            weight: 3,
            consequence:
              'Noor looks up, surprised. "You know where Room 9 is?" You do. You walk in together and nobody is late.',
            unlockBonus: true,
          },
          {
            id: 'ask_first',
            text: 'Ask Noor where they are trying to go before helping.',
            quotient: 'EQ',
            weight: 2,
            consequence:
              'Noor points at a smudged room number. You work out it together — and Noor laughs for the first time today.',
          },
          {
            id: 'wait',
            text: 'Wait and see if someone else helps.',
            quotient: 'IQ',
            weight: 1,
            consequence:
              'Someone else does help, eventually. Noor gets to class — but you notice they do not sit with anyone at lunch.',
          },
        ],
      },
      {
        id: 'lunch',
        narration:
          'At lunch Noor sits alone near the window, eating very slowly. You remember they said their old school was "very loud".',
        prompt: 'What feels right?',
        choices: [
          {
            id: 'sit_quiet',
            text: 'Sit nearby without asking questions.',
            quotient: 'EQ',
            weight: 3,
            consequence:
              'You sit one seat away and talk about nothing much. After a while Noor says, "This is quieter than my old school. I like it."',
          },
          {
            id: 'invite',
            text: 'Invite Noor to sit with my friends.',
            quotient: 'SQ',
            weight: 2,
            consequence:
              'Noor hesitates, then comes. Your friends make room. It is a lot of voices at once — Noor is quiet, but stays.',
          },
          {
            id: 'reassure',
            text: 'Tell Noor they will get used to it.',
            quotient: 'EQ',
            weight: 1,
            consequence:
              'Noor nods politely. It is the kind of thing people say when they want to help but are not sure how.',
          },
        ],
      },
      {
        id: 'drawing',
        narration:
          'In art, you see Noor\'s drawing: a city skyline drawn in pencil, every window lit. When the teacher walks past, Noor turns the page over.',
        prompt: 'What do you say?',
        choices: [
          {
            id: 'private_praise',
            text: 'Tell them quietly that the drawing is really good.',
            quotient: 'EQ',
            weight: 3,
            consequence:
              'Noor goes red and says "it is nothing". But at the end of the lesson the drawing is face up on the desk.',
          },
          {
            id: 'ask_show',
            text: 'Ask if they want to show the class.',
            quotient: 'SQ',
            weight: 2,
            consequence:
              'Noor thinks about it for a long moment. "Maybe next week." That is a yes, in Noor language.',
          },
          {
            id: 'show_anyway',
            text: 'Turn it back over and show everyone.',
            quotient: 'AQ',
            weight: 0,
            consequence:
              'The class says "whoa". Noor does not. They take the drawing back and do not draw again that lesson.',
          },
        ],
      },
    ],
    bonus: {
      id: 'map_bonus',
      narration:
        'After school Noor asks you to draw them a map of the whole building — the shortcuts, the quiet stairs, the best place to eat lunch.',
      prompt: 'What do you put on it?',
      choices: [
        {
          id: 'secret_places',
          text: 'The quiet stairs and the bench nobody uses.',
          quotient: 'EQ',
          weight: 3,
          consequence:
            'Noor folds the map into their pocket like it is worth something. "This is the good version," they say.',
        },
        {
          id: 'just_rooms',
          text: 'Just the rooms and the numbers.',
          quotient: 'IQ',
          weight: 2,
          consequence:
            'It is accurate and useful. Noor still keeps it, but asks where the quiet stairs are anyway.',
        },
      ],
    },
  },

  {
    id: 'logic',
    index: 2,
    title: 'The Pattern Forest',
    subtitle: 'The bridge only opens for the rule behind the stones.',
    quotient: 'IQ',
    minutes: 8,
    node: 'Logic',
    scenes: [
      {
        id: 'stones',
        narration:
          'The path splits in a forest where every stone has a number carved into it: 2, 4, 8, 16, and then a gap where the bridge should be.',
        prompt: 'Which stone comes next?',
        choices: [
          {
            id: 'double',
            text: '32 — each number doubles.',
            quotient: 'IQ',
            weight: 3,
            consequence:
              'You step on 32 and a plank slides out of the mist. The forest keeper watches from a branch, saying nothing.',
            unlockBonus: true,
          },
          {
            id: 'different_rule',
            text: 'Stop and check whether there is another rule first.',
            quotient: 'IQ',
            weight: 3,
            consequence:
              'You look closer. The stones are also spaced twice as far apart each time. Two rules agree — that is better evidence than one.',
          },
          {
            id: 'guess',
            text: '24 — it looks about right.',
            quotient: 'IQ',
            weight: 0,
            consequence:
              'The plank half-appears and then vanishes. Guessing feels fast until it costs you a step.',
          },
        ],
      },
      {
        id: 'keeper',
        narration:
          'The keeper drops down. "The bridge opens for the rule, not the number. Explain the rule and it stays open."',
        prompt: 'How do you answer?',
        choices: [
          {
            id: 'explain',
            text: '"Each stone is the one before it, doubled."',
            quotient: 'IQ',
            weight: 3,
            consequence:
              'The keeper nods slowly. "And if there were a stone before 2?" You say 1. The bridge stays open.',
          },
          {
            id: 'draw',
            text: 'Draw the pattern and test it on paper.',
            quotient: 'AQ',
            weight: 2,
            consequence:
              'You draw five stones, then five more. The rule holds. The keeper says, "Slower, but you did not need me to believe you."',
          },
          {
            id: 'restate',
            text: '"It just keeps going up."',
            quotient: 'IQ',
            weight: 1,
            consequence:
              'The keeper sighs. "So does rain. Tell me the rule, not the direction." The bridge stays open, but only just.',
          },
        ],
      },
      {
        id: 'bird',
        narration:
          'On the far side a bird hops along the rail, calling: 1, 1, 2, 3, 5, 8. Then it stops and looks at you.',
        prompt: 'What do you say the next call is?',
        choices: [
          {
            id: 'thirteen',
            text: '13 — each call is the two before it added.',
            quotient: 'IQ',
            weight: 3,
            consequence:
              'The bird repeats 13, delighted. It is a different rule from the stones, and you noticed.',
          },
          {
            id: 'sixteen',
            text: '16 — it goes up by the same amount.',
            quotient: 'IQ',
            weight: 1,
            consequence:
              'The bird tilts its head. 16 is not wrong for some patterns — but it is not this one.',
          },
          {
            id: 'check',
            text: 'Try the sums out loud before answering.',
            quotient: 'SQ',
            weight: 2,
            consequence:
              'One plus one is two. Two plus three is five. The bird joins in on five, and you get there together.',
          },
        ],
      },
    ],
    bonus: {
      id: 'keeper_riddle',
      narration:
        'The keeper leaves you a last riddle scratched into a stone: "I double, but I am not 2. I halve, but I am not half. What am I?"',
      prompt: 'Your answer?',
      choices: [
        {
          id: 'echo',
          text: 'A reflection — it doubles you and halves you.',
          quotient: 'IQ',
          weight: 3,
          consequence:
            'The keeper laughs for the first time. "That is not the answer I wrote. It is a better one."',
        },
        {
          id: 'unsure',
          text: 'Say I do not know yet, and come back to it.',
          quotient: 'AQ',
          weight: 2,
          consequence:
            'You write it on your hand. Not knowing, out loud, is its own kind of brave.',
        },
      ],
    },
  },

  {
    id: 'teamwork',
    index: 3,
    title: 'Bridge Builders',
    subtitle: 'Four people, one pile of planks, one river.',
    quotient: 'SQ',
    minutes: 12,
    node: 'Teamwork',
    scenes: [
      {
        id: 'planks',
        narration:
          'Your team has four people and one pile of planks. You are the youngest. Before anyone speaks, the tallest kid picks up as many planks as they can carry.',
        prompt: 'What do you do?',
        choices: [
          {
            id: 'plan_together',
            text: 'Suggest we decide the plan before anyone carries anything.',
            quotient: 'SQ',
            weight: 3,
            consequence:
              'The tall kid stops. "Fine. Where does it go?" Ten minutes later you have a plan everyone helped make — and everyone follows it.',
            unlockBonus: true,
          },
          {
            id: 'take_back',
            text: 'Quietly take half the planks back.',
            quotient: 'AQ',
            weight: 1,
            consequence:
              'You get your planks. The tall kid notices, and spends the next hour making sure you are not the one who decides anything.',
          },
          {
            id: 'tell_teacher',
            text: 'Tell the teacher someone is hogging the planks.',
            quotient: 'SQ',
            weight: 0,
            consequence:
              'The teacher sorts it out. The team is fair again — but nobody asked you what to build.',
          },
        ],
      },
      {
        id: 'cracked',
        narration:
          'Halfway across, a plank snaps. Someone says, "The little one picked those." You did pick those.',
        prompt: 'What do you say?',
        choices: [
          {
            id: 'own_it',
            text: '"I did pick them. I did not check them. Let us sort the good ones together."',
            quotient: 'AQ',
            weight: 3,
            consequence:
              'The team goes quiet, then starts sorting. The tallest kid checks the next stack without being asked.',
          },
          {
            id: 'silent',
            text: 'Say nothing and keep working.',
            quotient: 'SQ',
            weight: 0,
            consequence:
              'The bridge gets built. Nobody trusts the next stack you hand them, and you feel it all afternoon.',
          },
          {
            id: 'blame',
            text: '"I did not pick those — someone moved them."',
            quotient: 'SQ',
            weight: 0,
            consequence:
              'It is not true, and one person saw it. The team stops talking to each other and starts talking about each other.',
          },
        ],
      },
      {
        id: 'quit',
        narration:
          'The bridge sags in the middle. The kid holding the far end says, "This is stupid. I am done," and sits down in the mud.',
        prompt: 'What do you do?',
        choices: [
          {
            id: 'ask_need',
            text: 'Ask what would make it easier for them to keep going.',
            quotient: 'EQ',
            weight: 3,
            consequence:
              '"A second person on this end." You get one. The bridge comes up level, and the kid stays.',
          },
          {
            id: 'do_it',
            text: 'Take their end yourself and finish it.',
            quotient: 'AQ',
            weight: 2,
            consequence:
              'You finish it alone — barely. The bridge holds. The kid watches from the mud and does not come back.',
          },
          {
            id: 'promise',
            text: 'Promise them the first turn on the other side.',
            quotient: 'SQ',
            weight: 1,
            consequence:
              'They come back reluctantly. The bridge gets finished, but they keep asking when it is their turn.',
          },
        ],
      },
    ],
    bonus: {
      id: 'second_bridge',
      narration:
        'The bridge holds. The teacher says you can build a second one — but this time the team gets to choose who leads.',
      prompt: 'What do you say?',
      choices: [
        {
          id: 'nominate_quiet',
          text: 'Nominate the quietest person on the team.',
          quotient: 'SQ',
          weight: 3,
          consequence:
            'They look shocked, then take the plan and run it beautifully. Nobody argues, because you said it first.',
        },
        {
          id: 'lead_again',
          text: 'Offer to lead again, since it worked.',
          quotient: 'AQ',
          weight: 1,
          consequence:
            'It works. But the quietest person goes back to holding planks and saying nothing.',
        },
      ],
    },
  },

  {
    id: 'courage',
    index: 4,
    title: 'Storm Camp',
    subtitle: 'The torch dies. The trail does not.',
    quotient: 'AQ',
    minutes: 9,
    node: 'Courage',
    scenes: [
      {
        id: 'torch',
        narration:
          'On the night hike your torch clicks off and will not come back on. The group is already ahead, and the trail forks in the dark.',
        prompt: 'What do you do?',
        choices: [
          {
            id: 'call_out',
            text: 'Call out that my torch died and ask to walk with someone.',
            quotient: 'AQ',
            weight: 3,
            consequence:
              'A voice answers at once: "Over here, walk with me." Nobody laughs. Asking took less courage than the dark did.',
            unlockBonus: true,
          },
          {
            id: 'pretend',
            text: 'Pretend it is fine and follow the noise.',
            quotient: 'AQ',
            weight: 0,
            consequence:
              'You get there, mostly by luck, and spend the whole walk pretending. Your hands are still shaking at the top.',
          },
          {
            id: 'stop',
            text: 'Stop and wait where you are.',
            quotient: 'AQ',
            weight: 0,
            consequence:
              'Someone eventually comes back for you. Waiting feels safe until you realise nobody knew you had stopped.',
          },
        ],
      },
      {
        id: 'lead',
        narration:
          'At the top the leader says, "The last stretch is the dark one. I need someone to walk at the back so nobody is left behind."',
        prompt: 'What do you say?',
        choices: [
          {
            id: 'yes_partner',
            text: '"I will — if someone walks with me."',
            quotient: 'AQ',
            weight: 3,
            consequence:
              'That is exactly the answer the leader wanted. Being brave and being alone are not the same thing.',
          },
          {
            id: 'yes_fast',
            text: '"I will do it," and set off quickly.',
            quotient: 'AQ',
            weight: 1,
            consequence:
              'You are brave, and you are also the second person to get lost. The leader asks you to slow down.',
          },
          {
            id: 'no',
            text: '"Not tonight. I am too tired."',
            quotient: 'EQ',
            weight: 1,
            consequence:
              'Saying no honestly is allowed. Someone else steps up, and you sleep well instead of pretending.',
          },
        ],
      },
      {
        id: 'fire',
        narration:
          'Back at camp you are asked to light the fire. The first match dies. The second dies too, in front of everyone.',
        prompt: 'Third try?',
        choices: [
          {
            id: 'laugh_try',
            text: 'Laugh, ask for a third match, and try again.',
            quotient: 'AQ',
            weight: 3,
            consequence:
              'The third one catches. Somebody cheers. You learn that failing twice is just the price of the third try.',
          },
          {
            id: 'blame_wood',
            text: '"The wood is wet — it is not my fault."',
            quotient: 'AQ',
            weight: 0,
            consequence:
              'The wood is a bit wet. So is everyone else\'s. The fire gets lit by someone who does not need it to be nobody\'s fault.',
          },
          {
            id: 'hand_over',
            text: 'Hand the matches to someone else.',
            quotient: 'AQ',
            weight: 0,
            consequence:
              'They light it in one go. You feel smaller than you did with the dead match in your hand.',
          },
        ],
      },
    ],
    bonus: {
      id: 'lantern',
      narration:
        'After the fire, the leader offers you the spare lantern and a choice: walk back alone, or share the lantern with the slowest walker.',
      prompt: 'What do you choose?',
      choices: [
        {
          id: 'share',
          text: 'Share the lantern and walk at their pace.',
          quotient: 'SQ',
          weight: 3,
          consequence:
            'The walk takes twice as long and is twice as good. You are both laughing by the gate.',
        },
        {
          id: 'alone',
          text: 'Take it and walk quickly.',
          quotient: 'AQ',
          weight: 1,
          consequence:
            'You are back first, warm and dry. The slowest walker arrives in the dark, alone.',
        },
      ],
    },
  },

  {
    id: 'curiosity',
    index: 5,
    title: 'The Machine That Asks Questions',
    subtitle: 'It answers everything. It is not always right.',
    quotient: 'IQ',
    minutes: 11,
    node: 'Curiosity',
    scenes: [
      {
        id: 'sky',
        narration:
          'In the library there is a small machine that answers any question. You ask why the sky is blue. It gives an answer that sounds confident and that you cannot follow at all.',
        prompt: 'What do you do?',
        choices: [
          {
            id: 'how_know',
            text: 'Ask it, "How do you know that?"',
            quotient: 'IQ',
            weight: 3,
            consequence:
              'It explains which idea it used and where it stops. Half the answer is now clear, and you know which half is not.',
            unlockBonus: true,
          },
          {
            id: 'accept',
            text: 'Accept it and move on.',
            quotient: 'IQ',
            weight: 0,
            consequence:
              'You can repeat the sentence now. You still cannot explain it, and next week you will not remember it.',
          },
          {
            id: 'librarian',
            text: 'Ask the librarian too, and compare.',
            quotient: 'SQ',
            weight: 2,
            consequence:
              'The librarian gives a simpler answer with a book to check. Two sources is not being rude — it is being careful.',
          },
        ],
      },
      {
        id: 'always_right',
        narration:
          'The machine says, "I am always correct." A small light blinks as it says it.',
        prompt: 'What do you do?',
        choices: [
          {
            id: 'test_known',
            text: 'Test it with something I already know the answer to.',
            quotient: 'IQ',
            weight: 3,
            consequence:
              'You ask how many days are in September. It says 31. Now you know something important: confident and correct are different things.',
          },
          {
            id: 'believe',
            text: 'Believe it.',
            quotient: 'IQ',
            weight: 0,
            consequence:
              'The light keeps blinking. Later it tells you something wrong, and you only find out because a book disagrees.',
          },
          {
            id: 'limits',
            text: 'Ask it what it cannot do.',
            quotient: 'EQ',
            weight: 2,
            consequence:
              '"I do not know what I was not shown," it says. That sentence stays with you longer than the answer about the sky.',
          },
        ],
      },
      {
        id: 'homework',
        narration:
          'A friend asks the machine for the answers to tonight\'s maths homework and offers to send them to you.',
        prompt: 'What do you do?',
        choices: [
          {
            id: 'check_after',
            text: 'Suggest we try it first, then use the machine to check.',
            quotient: 'SQ',
            weight: 3,
            consequence:
              'Your friend grumbles, then finds three mistakes of their own. The machine helps most when it checks work you actually did.',
          },
          {
            id: 'copy',
            text: 'Take the answers and copy them.',
            quotient: 'IQ',
            weight: 0,
            consequence:
              'The homework takes four minutes. The test on Friday takes much longer, and the machine is not allowed in the room.',
          },
          {
            id: 'tell_teacher',
            text: 'Tell the teacher the machine can do homework.',
            quotient: 'SQ',
            weight: 1,
            consequence:
              'The teacher already knew. Now your friend knows you told, and the machine gets locked at break time.',
          },
        ],
      },
    ],
    bonus: {
      id: 'own_question',
      narration:
        'The machine asks you, "What should I be asked next?" It is the first time it has asked you anything.',
      prompt: 'What do you ask it?',
      choices: [
        {
          id: 'hard_question',
          text: 'Something nobody knows the answer to yet.',
          quotient: 'IQ',
          weight: 3,
          consequence:
            'It says, "I do not know." For once that is the best answer in the room — and now you have a real question to keep.',
        },
        {
          id: 'easy_question',
          text: 'Something it will definitely get right.',
          quotient: 'SQ',
          weight: 1,
          consequence:
            'It answers instantly and correctly. You feel clever for a moment, and then a little bored.',
        },
      ],
    },
  },

  {
    id: 'mastery',
    index: 6,
    title: 'The Lighthouse That Learned',
    subtitle: 'A machine offers to run the light. Who checks it?',
    quotient: 'AQ',
    minutes: 12,
    node: 'Mastery',
    scenes: [
      {
        id: 'offer',
        narration:
          'The lighthouse keeper is getting old. A machine arrives and offers to run the lamp: it will learn the weather and decide when the light should turn.',
        prompt: 'What do you ask first?',
        choices: [
          {
            id: 'what_data',
            text: '"What did you learn from, and what have you never seen?"',
            quotient: 'IQ',
            weight: 3,
            consequence:
              '"Thirty years of clear nights," it says, "and almost no fog." The keeper writes that down. It is the most useful sentence of the day.',
            unlockBonus: true,
          },
          {
            id: 'say_yes',
            text: 'Say yes — it will probably do a better job than we can.',
            quotient: 'AQ',
            weight: 0,
            consequence:
              'It runs the lamp well for two weeks. Nobody asks what happens on a night it has never seen before.',
          },
          {
            id: 'who_checks',
            text: '"When you are wrong, who is allowed to overrule you?"',
            quotient: 'SQ',
            weight: 2,
            consequence:
              'The machine pauses. "That is not in my instructions." The keeper says, "Then we are not finished deciding."',
          },
        ],
      },
      {
        id: 'fog',
        narration:
          'A fog comes in — thick, orange, nothing like the clear nights the machine learned from. It dims the light, because the sensor reads the fog as daylight.',
        prompt: 'What do you do?',
        choices: [
          {
            id: 'human_watch',
            text: 'Keep a person on watch with the machine, not instead of it.',
            quotient: 'SQ',
            weight: 3,
            consequence:
              'The keeper watches, the machine measures. The light stays bright all night, and three boats come in that would not have.',
          },
          {
            id: 'trust',
            text: 'Trust the machine — it has been right so far.',
            quotient: 'AQ',
            weight: 0,
            consequence:
              'A boat radios in at midnight, lost. The light was dim for four hours. The machine had no idea it was wrong.',
          },
          {
            id: 'turn_off',
            text: 'Turn the machine off and do it all by hand again.',
            quotient: 'AQ',
            weight: 1,
            consequence:
              'The light is bright. So is the keeper, up all night, and there is nobody left to learn from the machine\'s mistakes.',
          },
        ],
      },
      {
        id: 'logbook',
        narration:
          'In the morning the keeper asks whether the machine should write the logbook too. It has read every entry ever written.',
        prompt: 'What do you say?',
        choices: [
          {
            id: 'draft_sign',
            text: 'Let it write the first draft. A person reads and signs it.',
            quotient: 'SQ',
            weight: 3,
            consequence:
              'The writing is neat and a little cold. The keeper adds one line by hand: "Fog like I have not seen since 1998." It stays.',
          },
          {
            id: 'let_it_all',
            text: 'Let it do the whole thing.',
            quotient: 'IQ',
            weight: 0,
            consequence:
              'By spring the logbook is perfect and empty of anything a person noticed. Nobody can say when the fog started.',
          },
          {
            id: 'say_no',
            text: 'No. The logbook stays handwritten.',
            quotient: 'AQ',
            weight: 1,
            consequence:
              'The logbook keeps its weather and its worry. It also loses the machine\'s careful record of what the sensor missed.',
          },
        ],
      },
    ],
    bonus: {
      id: 'three_rules',
      narration:
        'The keeper gives you a blank card: "Every machine in this lighthouse needs three rules. You write them."',
      prompt: 'Which rule matters most?',
      choices: [
        {
          id: 'explain',
          text: 'It must always say what it is unsure about.',
          quotient: 'IQ',
          weight: 3,
          consequence:
            'Uncertainty is the one thing a confident machine hides best. The keeper pins your card above the lamp.',
        },
        {
          id: 'overrule',
          text: 'A person must always be able to switch it off.',
          quotient: 'SQ',
          weight: 3,
          consequence:
            'The keeper taps the switch. "This one I already had. Now it is written down, which is different."',
        },
        {
          id: 'data',
          text: 'It must be checked on nights it has never seen.',
          quotient: 'AQ',
          weight: 2,
          consequence:
            'You schedule the checks for the worst weather of the year. Nobody enjoys them. That is rather the point.',
        },
      ],
    },
  },
];

export const CHAPTER_BY_ID: Record<string, KidsChapter> = Object.fromEntries(
  CHAPTERS.map(c => [c.id, c]),
);

export function getChapter(id: string | undefined): KidsChapter | null {
  if (!id) return null;
  return CHAPTER_BY_ID[id] || null;
}

/** Chapters grouped by the quotient they predominantly practise. */
export function chaptersByQuotient(): Record<string, KidsChapter[]> {
  const out: Record<string, KidsChapter[]> = { IQ: [], EQ: [], SQ: [], AQ: [] };
  for (const c of CHAPTERS) out[c.quotient].push(c);
  return out;
}
