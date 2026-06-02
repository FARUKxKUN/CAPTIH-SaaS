import Link from "next/link";
import { Fragment } from "react";
import { COPY } from "@/lib/copy";

export function SiteFooter() {
  const creators = COPY.footer.creators;
  return (
    <footer className="relative z-10 border-t border-line/80">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-8 text-xs text-mute sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <p>
          {COPY.footer.builtBy}{" "}
          {creators.map((c, i) => (
            <Fragment key={c.name}>
              {c.href ? (
                <a
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-metis text-bone"
                >
                  {c.name}
                </a>
              ) : (
                <span className="text-bone">{c.name}</span>
              )}
              {i < creators.length - 1 && (
                <span className="text-mute"> + </span>
              )}
            </Fragment>
          ))}{" "}
          · {COPY.footer.poweredBy}{" "}
          <a
            href={COPY.footer.modelHref}
            target="_blank"
            rel="noopener noreferrer"
            className="link-metis text-bone"
          >
            {COPY.footer.modelName}
          </a>
        </p>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {COPY.footer.legal.map((l) => (
            <Link key={l.href} href={l.href} className="link-metis text-mute hover:text-bone">
              {l.label}
            </Link>
          ))}
          <span className="text-line">·</span>
          <span>{COPY.footer.rights}</span>
        </nav>
      </div>
    </footer>
  );
}
