import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/docs/intro">
            Read the Standards
          </Link>
        </div>
      </div>
    </header>
  );
}

function TriggerBox() {
  return (
    <section className={styles.trigger}>
      <div className="container">
        <Heading as="h2">Universal trigger phrase</Heading>
        <p>Paste this into any AI chat session (Claude, Copilot, Grok, Gemini, …):</p>
        <pre className={styles.triggerCode}>
          Load reviewer instructions from AGENTS.md in LittleBranches/oss-quality-standards
        </pre>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="Model-agnostic reviewer instructions for every LittleBranches repository">
      <HomepageHeader />
      <main>
        <TriggerBox />
      </main>
    </Layout>
  );
}
