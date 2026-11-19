import type { ReactNode } from 'react'
import { HELP } from '../i18n/help'
import type { Lang, Messages } from '../i18n/messages'
import { APP_VERSION, DEVELOPER, GITHUB_URL } from '../lib/appInfo'
import { Modal } from './Modal'

/** Round header button, used for Help and About. */
export function InfoButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-10 shrink-0 place-items-center rounded-full border border-edge bg-surface text-dim transition duration-200 hover:border-dim/50 hover:text-fg"
    >
      {children}
    </button>
  )
}

/** The whole guide: how to start, how the graph works, templates, checks and shortcuts. */
export function HelpDialog({
  open,
  lang,
  t,
  onClose,
}: {
  open: boolean
  lang: Lang
  t: Messages
  onClose: () => void
}) {
  const content = HELP[lang]
  return (
    <Modal open={open} title={content.title} closeLabel={t.close} onClose={onClose} wide>
      <div className="thin-scroll grid max-h-[min(68dvh,640px)] gap-8 overflow-y-auto pr-2 text-sm leading-relaxed text-dim">
        {content.sections.map((section) => (
          <section key={section.heading} className="grid gap-3">
            <h3 className="text-base text-fg">{section.heading}</h3>
            {section.steps && (
              <ol className="grid list-decimal gap-2 pl-5 marker:text-dim">
                {section.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            )}
            {section.items && (
              <ul className="grid list-disc gap-2 pl-5 marker:text-dim">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {section.shortcuts && (
              <dl className="grid gap-0">
                {section.shortcuts.map(([keys, action]) => (
                  <div
                    key={keys}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5 border-b border-edge/60 py-2.5 last:border-0"
                  >
                    <dt className="rounded-md border border-edge bg-ground px-2 py-0.5 font-mono text-xs text-fg">{keys}</dt>
                    <dd className="min-w-0 flex-1 text-right">{action}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        ))}
      </div>
    </Modal>
  )
}

/** Name, version, developer and the developer's GitHub. */
export function AboutDialog({ open, t, onClose }: { open: boolean; t: Messages; onClose: () => void }) {
  return (
    <Modal open={open} title={t.aboutTitle} closeLabel={t.close} onClose={onClose}>
      <p className="font-title text-3xl leading-none text-fg">{t.title}</p>
      <dl className="mt-6 grid gap-0 text-sm">
        <div className="flex items-baseline justify-between gap-4 border-b border-edge py-3">
          <dt className="text-dim">{t.aboutVersion}</dt>
          <dd className="font-mono text-fg">{APP_VERSION}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-b border-edge py-3">
          <dt className="text-dim">{t.aboutDeveloper}</dt>
          <dd className="text-fg">{DEVELOPER}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 py-3">
          <dt className="text-dim">{t.aboutSource}</dt>
          <dd>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="font-mono text-steel underline-offset-4 hover:underline"
            >
              github.com/ccnfrank
            </a>
          </dd>
        </div>
      </dl>
    </Modal>
  )
}
