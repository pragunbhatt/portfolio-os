// Everything personal lives here. Edit this file to update the portfolio.

export const profile = {
  name: 'Pragun Bhatt',
  firstName: 'Pragun',
  initials: 'PB',
  role: 'Computer science undergrad',
  school: 'VIT-AP University',
  location: 'Amaravati, Andhra Pradesh',
  email: 'pragununofficial@gmail.com',
  github: 'https://github.com/pragunbhatt',
  githubHandle: 'pragunbhatt',
  linkedin: 'https://www.linkedin.com/in/pragun-bhatt-746459366/',
  linkedinHandle: 'pragun-bhatt',
  bio: [
    "I'm a second-year B.Tech Computer Science student at VIT-AP University, currently in my third semester.",
    'I like building things I can see and touch: interfaces, small tools, and hardware-meets-software experiments. This site is one of them, a desktop you can poke around in instead of a page you scroll past.',
  ],
  now: [
    'Third semester of B.Tech CSE',
    'Holding a 9.35 CGPA',
    'Looking for internships and projects to learn from',
  ],
};

export const academics = {
  degree: 'B.Tech, Computer Science and Engineering',
  school: 'VIT-AP University',
  place: 'Amaravati, Andhra Pradesh',
  start: 2025,
  end: 2029,
  cgpa: 9.35,
  cgpaScale: 10,
  currentSemester: 3,
  totalSemesters: 8,
  // Add finished semesters here, e.g. { sem: 1, gpa: 9.4 }
  semesters: [] as { sem: number; gpa: number }[],
  // Placeholder schooling rows. Replace with your own or leave the array empty to hide them.
  schooling: [
    { title: 'Class XII', school: 'Your school name', detail: 'Board and score', year: '2025', placeholder: true },
    { title: 'Class X', school: 'Your school name', detail: 'Board and score', year: '2023', placeholder: true },
  ],
};

export type Project = {
  id: string;
  name: string;
  summary: string;
  description: string;
  stack: string[];
  year: string;
  status: 'Shipped' | 'In progress' | 'Prototype';
  hue: number;
  repo?: string;
  live?: string;
  placeholder?: boolean;
};

export const projects: Project[] = [
  {
    id: 'portfolio-os',
    name: 'Portfolio OS',
    summary: 'This site: a desktop you log in to.',
    description:
      'A portfolio built as a working desktop. A Three.js desk scene leads into a window manager with dragging, resizing, stacking and a genie-style minimize, all written from scratch in React.',
    stack: ['React', 'TypeScript', 'Three.js', 'GSAP'],
    year: '2026',
    status: 'Shipped',
    hue: 212,
    repo: 'https://github.com/pragunbhatt',
  },
  {
    id: 'sample-mobile',
    name: 'Sample mobile app',
    summary: 'Replace with a real project.',
    description:
      'Placeholder. Describe the problem, what you built, and what you learned. Two or three sentences is plenty.',
    stack: ['Flutter', 'Dart'],
    year: '2026',
    status: 'In progress',
    hue: 158,
    placeholder: true,
  },
  {
    id: 'sample-web',
    name: 'Sample web project',
    summary: 'Replace with a real project.',
    description:
      'Placeholder. Link the repo and a live demo if there is one, so visitors can open it in the Browser app.',
    stack: ['JavaScript', 'Node.js'],
    year: '2025',
    status: 'Prototype',
    hue: 28,
    placeholder: true,
  },
  {
    id: 'sample-ml',
    name: 'Sample ML notebook',
    summary: 'Replace with a real project.',
    description: 'Placeholder. A small data or ML project works well here.',
    stack: ['Python', 'NumPy'],
    year: '2025',
    status: 'Prototype',
    hue: 280,
    placeholder: true,
  },
];

export type Skill = { name: string; usedFor: string; since: string };
export type SkillGroup = { id: string; label: string; skills: Skill[] };

// Placeholder skills. Replace with your own.
export const skillGroups: SkillGroup[] = [
  {
    id: 'languages',
    label: 'Languages',
    skills: [
      { name: 'Python', usedFor: 'Scripts and coursework', since: '2023' },
      { name: 'C', usedFor: 'Programming fundamentals', since: '2025' },
      { name: 'Java', usedFor: 'Object-oriented programming', since: '2025' },
      { name: 'TypeScript', usedFor: 'Web interfaces', since: '2026' },
    ],
  },
  {
    id: 'web',
    label: 'Web',
    skills: [
      { name: 'React', usedFor: 'Interfaces like this one', since: '2026' },
      { name: 'HTML and CSS', usedFor: 'Layout and styling', since: '2024' },
      { name: 'Three.js', usedFor: '3D scenes in the browser', since: '2026' },
    ],
  },
  {
    id: 'mobile',
    label: 'Mobile',
    skills: [{ name: 'Flutter', usedFor: 'Cross-platform apps', since: '2026' }],
  },
  {
    id: 'tools',
    label: 'Tools',
    skills: [
      { name: 'Git and GitHub', usedFor: 'Version control', since: '2025' },
      { name: 'VS Code', usedFor: 'Daily editor', since: '2024' },
      { name: 'Figma', usedFor: 'Sketching interfaces', since: '2025' },
    ],
  },
  {
    id: 'learning',
    label: 'Learning now',
    skills: [
      { name: 'Data structures', usedFor: 'Third semester coursework', since: '2026' },
      { name: 'Embedded systems', usedFor: 'Side projects', since: '2026' },
    ],
  },
];

export type Bookmark = { title: string; url: string; hue: number; glyph: string };

// Sites that allow being shown inside another page.
export const bookmarks: Bookmark[] = [
  { title: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Special:Random', hue: 0, glyph: 'W' },
  {
    title: 'VIT-AP on a map',
    url: 'https://www.openstreetmap.org/export/embed.html?bbox=80.48%2C16.47%2C80.53%2C16.51&layer=mapnik&marker=16.4963%2C80.5007',
    hue: 140,
    glyph: 'M',
  },
  { title: 'Example', url: 'https://example.com', hue: 220, glyph: 'E' },
  { title: 'GitHub', url: 'https://github.com/pragunbhatt', hue: 260, glyph: 'G' },
  { title: 'LinkedIn', url: 'https://www.linkedin.com/in/pragun-bhatt-746459366/', hue: 205, glyph: 'in' },
];
