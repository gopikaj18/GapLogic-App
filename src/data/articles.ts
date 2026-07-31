export interface Article {
  id: string;
  title: string;
  category: 'Routine & Consistency' | 'Identity & Habits' | 'Self-Trust & Integrity' | 'Recovery & Resilience' | 'Focus & Deep Work';
  excerpt: string;
  body: string[];
  readTime: string;
  iconName: 'Activity' | 'BookOpen' | 'ShieldCheck' | 'Zap' | 'Timer' | 'Target';
}

export const ARTICLES: Article[] = [
  {
    id: 'identity-vs-goals',
    title: 'Why Identity-Based Habits Outlast Goal-Based Habits',
    category: 'Identity & Habits',
    excerpt: 'Goals define what you want to achieve, but identity defines who you want to become. Shift your focus to build permanent change.',
    readTime: '3 min read',
    iconName: 'BookOpen',
    body: [
      'Most people begin the process of changing their habits by focusing on what they want to achieve. This leads to goal-based habits: "I want to write a book," "I want to lose ten pounds," or "I want to build a startup." These goals focus on the outcomes. While useful for setting a direction, they fail to address the underlying beliefs that drive behavior.',
      'The alternative is to build identity-based habits. With this approach, we start by focusing on who we wish to become. Rather than telling yourself, "I am trying to write a book," you adopt the identity: "I am a writer." Rather than, "I want to go to the gym," you declare, "I am an athlete."',
      'When your behavior and your identity are aligned, you no longer have to force yourself to act. You are simply acting in accordance with who you believe you are. If you believe you are a writer, sitting down to write for twenty minutes is a natural manifestation of your self-concept.',
      'To build identity-based habits, start by defining the character traits of the person who could achieve your goals. If you want to build a startup, you need to become a consistent, focus-driven builder. Focus on proving this identity to yourself daily through small actions, and the goals will take care of themselves.'
    ]
  },
  {
    id: 'voting-future-self',
    title: 'The Psychology of "Voting" for Your Future Self',
    category: 'Identity & Habits',
    excerpt: 'Every tiny action you take is a vote for the type of person you wish to be. You don\'t need a landslide; you just need a majority.',
    readTime: '3 min read',
    iconName: 'Target',
    body: [
      'Habit change does not require a sudden, heroic transformation. It is the result of a slow accumulation of daily decisions. Every action you take is a vote for the type of person you wish to become.',
      'If you sit down to write one paragraph, you vote for the identity of a writer. If you set up your focus workspace and block notifications, you vote for the identity of a disciplined thinker. If you step outside for a run, you vote for the identity of an active person.',
      'No single vote will transform your beliefs overnight, but as the votes build up, so does the evidence of your new identity. This is why small actions matter. They do not just yield results; they change your self-perception.',
      'Crucially, you do not need a perfect record to succeed. A democratic election does not require a 100% landslide victory to choose a leader; it simply requires a majority. In the same way, you do not need to keep every single commitment perfectly. You just need to ensure that the majority of your daily actions align with your desired identity. If you make a mistake, don\'t panic—just win the next vote.'
    ]
  },
  {
    id: 'two-minute-rule',
    title: 'The Power of the 2-Minute Rule: Starting Micro',
    category: 'Routine & Consistency',
    excerpt: 'Commencing a habit should take less than two minutes. Lower the entry barrier to bypass start resistance.',
    readTime: '4 min read',
    iconName: 'Timer',
    body: [
      'The primary friction of any routine is not the performance of the task itself, but the transition into it. The human mind is highly resistant to starting. Procrastination is a transition problem, not an execution problem.',
      'To bypass this starting friction, use the 2-Minute Rule. This rule states that when you start a new habit, it should take less than two minutes to do. By scaling down your commitments, you make them incredibly easy to begin.',
      'For example: "Read a book every week" becomes "Read one page." "Do thirty minutes of yoga" becomes "Get out my yoga mat." "Code for two hours" becomes "Open my editor and write one function."',
      'The goal is to establish the gateway habit first. You cannot optimize a habit that does not exist. If you cannot master the basic art of showing up, you will never master the details of performance. Once you start—even if it is just reading one page—the momentum of action makes it much easier to continue. Optimize for starting, not finishing.'
    ]
  },
  {
    id: 'consistency-vs-intensity',
    title: 'Why Consistency Beats Intensity: The Compounding Curve',
    category: 'Routine & Consistency',
    excerpt: 'Small daily increments compound exponentially over time. Stop waiting for high-energy waves; build the low-friction floor.',
    readTime: '4 min read',
    iconName: 'Zap',
    body: [
      'Modern culture glorifies intensity. We praise the late-night grind, the heroic study marathons, and the extreme workouts. But intensity is an exhausting, unsustainable strategy. It relies on high motivation and emotional energy, both of which are highly volatile.',
      'Consistency, on the other hand, relies on system architecture. By committing to small, manageable daily actions, you tap into the exponential power of compounding. If you improve by just 1% each day, you will end up 37 times better by the end of the year.',
      'Conversely, if you let your consistency slip and deteriorate by 1% each day, you decline almost down to zero. The compounding curve operates in both directions.',
      'The self-trust built from keeping a small, daily commitment is far more robust than the temporary boost of a single massive effort. To achieve long-term success, focus on building a high floor of daily consistency that you can maintain even on your worst days, rather than chasing rare peaks of high intensity.'
    ]
  },
  {
    id: 'decoding-trust-bank',
    title: 'Decoding the Trust Bank: The Logic of Self-Trust Score',
    category: 'Self-Trust & Integrity',
    excerpt: 'Self-trust is a currency. Every kept promise is a deposit; every broken commitment is a draft. Learn how to manage your self-belief bank.',
    readTime: '5 min read',
    iconName: 'ShieldCheck',
    body: [
      'Self-trust is the foundational currency of personal agency. It is the measure of how much you believe your own words. When you tell yourself, "I will work on my project at 9:00 AM," does your brain take that statement seriously, or does it dismiss it as a suggestion?',
      'Every time you schedule an intention and execute it, you make a deposit into your Self-Trust Bank. You reinforce the belief that you are reliable and capable. Every time you snooze a task, skip a block, or ignore a commitment, you make a withdrawal.',
      'If your self-trust account is heavily overdrawn, you begin to experience chronic self-doubt. You stop setting goals because you already assume you won\'t follow through. This is the "broken trust" trap.',
      'The Self-Trust Score in this application is a mathematical reflection of this ledger. To rebuild an overdrawn self-trust account, you must stop making ambitious, high-friction promises. Instead, scale down. Make tiny, un-missable promises—like writing code for 5 minutes—and keep them ruthlessly. Accumulate deposits, rebuild credibility with yourself, and watch your score recover.'
    ]
  },
  {
    id: 'integrity-compacts',
    title: 'Integrity Compacts: Treat Schedules as Promises',
    category: 'Self-Trust & Integrity',
    excerpt: 'A calendar block is not a reminder; it is a sacred agreement with your future self. Shift your framing from obligation to honor.',
    readTime: '3 min read',
    iconName: 'BookOpen',
    body: [
      'Most people treat calendar events and scheduled blocks as mere reminders. If they feel like doing the task, they do it; if they feel tired, they dismiss or push the notification. This casual rescheduling chips away at your self-trust.',
      'To build high behavioral integrity, you must change your relationship with scheduled time. A focus block is not a suggestion—it is an Integrity Compact. It is a promise made by your past self (when you were clear-headed and goal-oriented) to your future self.',
      'If you scheduled a meeting with a mentor or a client, you would show up regardless of whether you "felt motivated." You would respect their time. Why do you respect other people\'s time more than your own?',
      'When you treat your scheduled blocks as sacred compacts, you elevate self-respect. Protecting your calendar blocks from distractions is the ultimate act of self-honor. If you must reschedule, do so with deliberation, not as an escape from temporary friction.'
    ]
  },
  {
    id: 'recovery-protocol',
    title: 'The Recovery Protocol: Why Missing One Day is Not Failure',
    category: 'Recovery & Resilience',
    excerpt: 'The first mistake is a slip. The second mistake is the start of a new habit. How the recovery protocol acts as a momentum shield.',
    readTime: '4 min read',
    iconName: 'Activity',
    body: [
      'Perfect streaks are a myth. No matter how disciplined you are, life will eventually disrupt your routine. You will get sick, emergencies will arise, or focus will slip. Slipping once is an accident. Missing twice in a row, however, is the initiation of a new, negative habit.',
      'This is where the Recovery Protocol comes in. The core philosophy is simple: never miss twice. If you miss a scheduled block, the system triggers the Recovery Step. This step forces you to either execute a tiny micro-action immediately or reschedule the task to a valid slot.',
      'By addressing the missed task immediately, you stop the slide before it gains momentum. You prevent "what-the-hell" syndrome—the psychological phenomenon where a single slip leads to complete abandonment of the routine.',
      'The Recovery Protocol is a shield for your consistency. It values adaptability over perfection, recognizing that resilience is not about never falling, but about how quickly you stand back up.'
    ]
  },
  {
    id: 'rebuilding-momentum',
    title: 'Rebuilding Momentum After a Broken Streak',
    category: 'Recovery & Resilience',
    excerpt: 'When a major broken streak damages your self-trust score, the path back is not intensity, but tiny, un-missable recovery actions.',
    readTime: '4 min read',
    iconName: 'Target',
    body: [
      'After a long period of inactivity or a series of broken commitments, your self-trust score will drop. You feel a sense of failure, and the distance to your previous peak performance feels overwhelming.',
      'The natural temptation is to attempt a massive reset. You plan a heroic 12-hour study day or a highly restrictive routine. This is a trap. When your self-trust is low, your capacity to handle starting friction is also low. Attempting a high-intensity reset almost always leads to another failure, deepening the cycle of self-doubt.',
      'The correct way to rebuild momentum is to scale down. Declare a "momentum recovery" phase. Reduce your daily commitments to the absolute minimum. Focus solely on keeping three tiny, un-missable promises in a row.',
      'Do not worry about volume or intensity yet. Focus entirely on re-establishing the neural link between your intentions and your actions. Once you rebuild the belief that you actually execute what you schedule, you can gradually scale the difficulty. Walk before you run.'
    ]
  },
  {
    id: 'environment-design',
    title: 'Environment Design: Shielding Your Deep Focus',
    category: 'Focus & Deep Work',
    excerpt: 'Willpower is finite, but structure is permanent. Redesign your digital and physical environment to eliminate friction triggers.',
    readTime: '4 min read',
    iconName: 'Zap',
    body: [
      'Many people attribute their lack of focus to a lack of willpower. They see highly productive people and assume they simply possess superhuman levels of self-control. But research shows that highly disciplined individuals actually spend less time resisting temptation.',
      'Instead of relying on willpower, they design their environment to eliminate distractions. Willpower is a finite resource that drains; structure is a permanent barrier that protects.',
      'If you want to read more, put a book on your pillow. If you want to code without distraction, put your phone in another room and use a blocker to disable social media. Make the cues for your good habits obvious, and the cues for your bad habits invisible.',
      'Your physical and digital workspaces are the canvases of your behavior. Redesign them so that focus is the path of least resistance. When distraction requires physical effort to access, your brain will naturally choose to do the work.'
    ]
  },
  {
    id: 'friction-gap',
    title: 'The Friction Gap: Reducing the Resistance to Begin',
    category: 'Focus & Deep Work',
    excerpt: 'The hardest part of any task is the transition. Understand the chemical friction of starting work and how to short-circuit it.',
    readTime: '3 min read',
    iconName: 'Timer',
    body: [
      'When you sit down to start a deep work block, you often experience a wave of anxiety, boredom, or restlessness. This discomfort is not a sign that you should quit; it is a normal neurochemical transition known as the Friction Gap.',
      'It takes about 10 minutes of focus for your brain to synthesize enough dopamine and noradrenaline to enter a state of flow. During this initial gap, the work feels hard, and your mind will search for any excuse to escape to a high-dopamine distraction.',
      'Knowing that this friction is temporary changes everything. When you feel the urge to check your phone in the first five minutes of coding, remind yourself: "This is just the friction gap. It will pass in five minutes."',
      'You can reduce starting friction by preparing your materials the night before. Open the files you need, write down the very next step, and clean your desk. By reducing the physical friction of starting, you make it much easier to cross the gap and enter deep focus.'
    ]
  }
];
