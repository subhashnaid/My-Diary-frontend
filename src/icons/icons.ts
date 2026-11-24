// Shared by the Expo app and the web app. Names are Ionicons (ionicons.com, MIT).
// App:  <Ionicons name={ICONS.home} />   Web (react-icons/io5): map the same names, or use /svg/ui/*.svg
export const ICONS = {
  home: 'home-outline',
  diary: 'book-outline',
  add: 'add',
  calendar: 'calendar-outline',
  profile: 'person-outline',
  stats: 'stats-chart-outline',
  edit: 'create-outline',
  delete: 'trash-outline',
  search: 'search-outline',
  filter: 'options-outline',
  sort: 'swap-vertical',
  image: 'image-outline',
  tag: 'pricetag-outline',
  favourite: 'star-outline',
  share: 'share-outline',
  saved: 'checkmark',
  close: 'close',
  next: 'chevron-forward',
  back: 'chevron-back',
  streak: 'flame-outline',
  lock: 'lock-closed-outline',
  biometrics: 'finger-print-outline',
  privacy: 'shield-checkmark-outline',
  notifications: 'notifications-outline',
  darkTheme: 'moon-outline',
  lightTheme: 'sunny-outline',
  email: 'mail-outline',
  password: 'key-outline',
  show: 'eye-outline',
  hide: 'eye-off-outline',
  reminder: 'time-outline',
  logout: 'log-out-outline',
  achievement: 'trophy-outline',
  sparkle: 'sparkles-outline',
  leaf: 'leaf-outline',
} as const;

// Active tab = filled name inside a soft pill; idle tab = outline name.
export const TAB_ICONS = {
  home: ['home-outline', 'home'],
  diary: ['book-outline', 'book'],
  calendar: ['calendar-outline', 'calendar'],
  profile: ['person-outline', 'person'],
  stats: ['stats-chart-outline', 'stats-chart'],
} as const;

export const MOODS = {
  happy: { icon: 'happy-outline', color: '#E3A93A', emoji: '😊', label: 'Happy' },
  calm: { icon: 'flower-outline', color: '#8FA78A', emoji: '🌿', label: 'Calm' },
  grateful: { icon: 'heart-outline', color: '#D9798F', emoji: '💖', label: 'Grateful' },
  anxious: { icon: 'thunderstorm-outline', color: '#7C8DB5', emoji: '⛈️', label: 'Anxious' },
  sad: { icon: 'sad-outline', color: '#6C8EBF', emoji: '😢', label: 'Sad' },
} as const;

export const BRAND = {
  primary: '#8C7BB5',
  primaryDark: '#B3A3DB',
  splashBg: '#FAF6EF',
  splashBgDark: '#17161A',
  pill: '#E7E0F3',
  pillDark: '#2B233D',
} as const;

export type TabIconValue = typeof TAB_ICONS[keyof typeof TAB_ICONS][number];
export type IconName = keyof typeof ICONS | typeof ICONS[keyof typeof ICONS] | TabIconValue;
export type MoodKey = keyof typeof MOODS;
export type MoodStyle = 'icon' | 'emoji';
export const MOOD_STYLE: MoodStyle = 'icon';
