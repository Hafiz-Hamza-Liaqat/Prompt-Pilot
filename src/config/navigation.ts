export const publicNavigation = [
  { label: 'Workflow', href: '/#workflow' },
  { label: 'Capabilities', href: '/#capabilities' },
  { label: 'Scope', href: '/#scope' },
  { label: 'Providers', href: '/providers' },
] as const;

export type PublicNavigationItem = (typeof publicNavigation)[number];
