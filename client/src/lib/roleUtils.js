const ROLE_COLORS = {
  ADMIN: 'bg-red-500/20 text-red-500',
  USER: 'bg-blue-500/20 text-blue-500',
  'IT OFFICER': 'bg-blue-500/20 text-blue-500',
  ASSISTANT: 'bg-purple-500/20 text-purple-500',
};

const ROLE_BADGE_COLORS = {
  ADMIN: 'bg-red-500/10 border-red-500/30 text-red-500',
  USER: 'bg-blue-500/10 border-blue-500/30 text-blue-500',
  'IT OFFICER': 'bg-blue-500/10 border-blue-500/30 text-blue-500',
  ASSISTANT: 'bg-purple-500/10 border-purple-500/30 text-purple-500',
};

const ROLE_TOPBAR_COLORS = {
  ADMIN: 'bg-red-50 dark:bg-red-800',
  USER: 'bg-blue-50 dark:bg-blue-800',
  'IT OFFICER': 'bg-blue-50 dark:bg-blue-800',
  ASSISTANT: 'bg-purple-50 dark:bg-purple-800',
};

const ROLE_AVATAR_COLORS = {
  ADMIN: 'bg-red-400/20 text-red-400',
  USER: 'bg-sky-400/20 text-sky-400',
  'IT OFFICER': 'bg-blue-500/20 text-blue-500',
  ASSISTANT: 'bg-purple-500/20 text-purple-500',
};

const CUSTOM_ROLE_PALETTE = [
  'bg-emerald-500/20 text-emerald-500',
  'bg-orange-500/20 text-orange-500',
  'bg-cyan-500/20 text-cyan-500',
  'bg-violet-500/20 text-violet-500',
  'bg-pink-500/20 text-pink-500',
  'bg-amber-500/20 text-amber-500',
];

const CUSTOM_BADGE_PALETTE = [
  'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
  'bg-orange-500/10 border-orange-500/30 text-orange-500',
  'bg-cyan-500/10 border-cyan-500/30 text-cyan-500',
  'bg-violet-500/10 border-violet-500/30 text-violet-500',
  'bg-pink-500/10 border-pink-500/30 text-pink-500',
  'bg-amber-500/10 border-amber-500/30 text-amber-500',
];

const CUSTOM_TOPBAR_PALETTE = [
  'bg-emerald-50 dark:bg-emerald-800',
  'bg-orange-50 dark:bg-orange-800',
  'bg-cyan-50 dark:bg-cyan-800',
  'bg-violet-50 dark:bg-violet-800',
  'bg-pink-50 dark:bg-pink-800',
  'bg-amber-50 dark:bg-amber-800',
];

const CUSTOM_AVATAR_PALETTE = [
  'bg-emerald-400/20 text-emerald-400',
  'bg-orange-400/20 text-orange-400',
  'bg-cyan-400/20 text-cyan-400',
  'bg-violet-400/20 text-violet-400',
  'bg-pink-400/20 text-pink-400',
  'bg-amber-400/20 text-amber-400',
];

const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash);
};

const getFromPalette = (role, palette, knownColors) => {
  const key = (role || '').toUpperCase();
  if (knownColors[key]) return knownColors[key];
  return palette[hashString(role) % palette.length];
};

export const getRoleColor = (role) => getFromPalette(role, CUSTOM_ROLE_PALETTE, ROLE_COLORS);
export const getRoleBadgeColor = (role) => getFromPalette(role, CUSTOM_BADGE_PALETTE, ROLE_BADGE_COLORS);
export const getRoleTopbarColor = (role) => getFromPalette(role, CUSTOM_TOPBAR_PALETTE, ROLE_TOPBAR_COLORS);
export const getRoleAvatarColor = (role) => getFromPalette(role, CUSTOM_AVATAR_PALETTE, ROLE_AVATAR_COLORS);

export const getRoleDisplayName = (role) => {
  if (!role) return 'Unknown';
  const r = role.toUpperCase();
  if (r === 'IT_OFFICER') return 'IT Officer';
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
};
