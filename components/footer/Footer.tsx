'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { DorstLogo } from '@/components/brand/DorstLogo'
import { SocialLinks } from '@/components/social/SocialLinks'

const BEER_SLUGS = [
  { slug: 'lion-heart', name: 'Lion Heart' },
  { slug: 'hippy-shake', name: 'Hippy Shake' },
  { slug: 'alexis', name: 'Alexis' },
  { slug: 'alma', name: 'Alma' },
  { slug: 'pulpa-fiction', name: 'Pulpa Fiction' },
  { slug: 'full-breakfast-stout', name: 'Full Breakfast Stout' },
]

export function Footer() {
  const t = useTranslations('Footer')

  return (
    <footer className="site-footer">
      <div className="site-footer-grid">
        {/* Brand */}
        <div>
          <div style={{ marginBottom: 20 }}>
            <DorstLogo height={50} variant="inverted" />
          </div>
          <p className="site-footer-tagline">
            {t('tagline')}<br />
            {t('sub')}
          </p>
          <SocialLinks style={{ marginTop: 24 }} />
        </div>

        {/* Beers */}
        <div>
          <h4 className="site-footer-heading">{t('sectionBeers')}</h4>
          <ul className="site-footer-links">
            {BEER_SLUGS.map(({ slug, name }) => (
              <li key={slug}>
                <Link href={`/beers/${slug}`} className="site-footer-link">
                  {name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="site-footer-heading">{t('sectionCompany')}</h4>
          <ul className="site-footer-links">
            {[
              { href: '/about', label: t('about') },
              { href: '/locations', label: t('locations') },
              { href: '/partners', label: t('partners') },
            ].map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="site-footer-link">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="site-footer-heading">{t('sectionLegal')}</h4>
          <ul className="site-footer-links">
            {[
              { label: t('privacy'), href: '/privacy/' },
              { label: t('terms'), href: '#' },
              { label: t('cookies'), href: '/privacy/' },
            ].map(({ label, href }) => (
              <li key={label}>
                <Link href={href} className="site-footer-link">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>{t('copyright')}</span>
      </div>
    </footer>
  )
}
