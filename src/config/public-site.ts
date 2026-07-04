import { z } from 'zod';

const httpsUrlSchema = z
  .string()
  .url()
  .refine((value) => value.startsWith('https://'), 'External URLs must use HTTPS.');

export type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type FooterNavigationGroup = {
  title: string;
  links: readonly FooterLink[];
};

/**
 * Official Prompt Pilot X profile URL.
 * Set this to the verified HTTPS profile URL before publishing the social footer link.
 * When null, the footer omits the X link rather than guessing a username.
 */
export const OFFICIAL_X_PROFILE_URL: string | null = null;

export const publicSiteConfig = {
  productName: 'Prompt Pilot',
  planningLayerLabel: 'Planning layer',
  publicDescription:
    'Plan AI video production, assess complexity, and compare provider capabilities without generating media.',
  footerNavigation: {
    platform: [
      { label: 'Workflow', href: '/#workflow' },
      { label: 'Capabilities', href: '/#capabilities' },
      { label: 'Scope', href: '/#scope' },
      { label: 'Providers', href: '/providers' },
    ],
    company: [
      { label: 'About Us', href: '/about' },
      { label: 'News Feed', href: '/news' },
    ],
    help: [{ label: 'Support / Help', href: '/support' }],
  },
} as const;

export function getValidatedXProfileUrl(): string | null {
  if (!OFFICIAL_X_PROFILE_URL) {
    return null;
  }

  return httpsUrlSchema.parse(OFFICIAL_X_PROFILE_URL);
}

export function getFooterNavigationGroups(): FooterNavigationGroup[] {
  const groups: FooterNavigationGroup[] = [
    { title: 'Platform', links: publicSiteConfig.footerNavigation.platform },
    { title: 'Company', links: publicSiteConfig.footerNavigation.company },
    { title: 'Help', links: publicSiteConfig.footerNavigation.help },
  ];

  const xUrl = getValidatedXProfileUrl();

  if (xUrl) {
    groups.push({
      title: 'Social',
      links: [
        {
          label: 'Prompt Pilot on X',
          href: xUrl,
          external: true,
        },
      ],
    });
  }

  return groups;
}
