import Navbar from './components/navbar';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col font-body-md text-primary antialiased bg-[#F7F6F3]">
      <Navbar />

      <main className="flex-grow pt-[120px] pb-stack-lg px-margin-mobile md:px-margin-desktop flex justify-center min-h-screen">
        <article className="w-full max-w-[520px] mx-auto text-left flex flex-col gap-stack-lg">
          {/* Header Section */}
          <header className="flex flex-col gap-stack-sm">
            <p className="font-label-caps text-label-caps text-secondary tracking-widest uppercase mb-unit">ABOUT THIS PROJECT</p>
            <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary tracking-tight">
              Music found<br />
              by <span className="italic font-light">meaning</span>.
            </h1>
            <div className="w-[32px] h-[1px] bg-primary mt-stack-md"></div>
          </header>

          {/* Body Content */}
          <section className="flex flex-col gap-stack-md font-body-md text-body-md text-secondary" style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.8 }}>
            <p>
              Traditional search relies on perfect recall of exact phrasing. Lyricist was built to navigate the spaces between words, allowing users to discover music <strong className="font-medium text-primary font-[500]">imperfectly</strong>, <strong class="font-medium text-primary font-[500]">emotionally</strong>, and often completely <strong class="font-medium text-primary font-[500]">out of context</strong>.
            </p>
            <p>
              By combining Boolean logic, phrase matching, and spelling correction alongside TF-IDF term frequency relevance ranking, we treat song lyrics not as static strings, but as searchable, normalized poetry. The interface is designed to strip away the noise of modern streaming platforms, leaving only the ink and the paper.
            </p>
          </section>

          {/* Stats Table */}
          <section className="grid grid-cols-3 border-t border-b border-[#E2E1DC] divide-x divide-[#E2E1DC] mt-stack-md py-stack-md">
            <div className="flex flex-col items-center justify-center text-center px-unit">
              <span className="font-headline-md text-[32px] leading-none text-primary mb-unit">1M</span>
              <span className="font-label-caps text-[10px] text-secondary">SONGS INDEXED</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center px-unit">
              <span className="font-headline-md text-[32px] leading-none text-primary mb-unit">0.1s</span>
              <span className="font-label-caps text-[10px] text-secondary">AVG LATENCY</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center px-unit">
              <span className="font-headline-md text-[32px] leading-none text-primary mb-unit">97%</span>
              <span className="font-label-caps text-[10px] text-secondary">ACCURACY</span>
            </div>
          </section>

          {/* Tech Tags */}
          <section className="mt-stack-md">
            <div className="flex flex-wrap gap-stack-sm">
              <span className="px-3 py-1 border border-[#E2E1DC] rounded-sm font-label-caps text-label-caps text-secondary bg-surface-bright">Inverted indexing</span>
              <span className="px-3 py-1 border border-[#E2E1DC] rounded-sm font-label-caps text-label-caps text-secondary bg-surface-bright">TF-IDF relevance</span>
              <span className="px-3 py-1 border border-[#E2E1DC] rounded-sm font-label-caps text-label-caps text-secondary bg-surface-bright">Lexicon mapping</span>
              <span className="px-3 py-1 border border-[#E2E1DC] rounded-sm font-label-caps text-label-caps text-secondary bg-surface-bright">Python Flask backend</span>
              <span className="px-3 py-1 border border-[#E2E1DC] rounded-sm font-label-caps text-label-caps text-secondary bg-surface-bright">NLTK preprocessor</span>
            </div>
          </section>
        </article>
      </main>

      {/* Footer */}
      <footer className="w-full py-stack-md px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center max-w-container-max mx-auto border-t border-[#E2E1DC] bg-surface mt-auto">
        <span className="font-label-caps text-label-caps text-primary">Lyricist</span>
        <div className="flex gap-stack-md mt-stack-md md:mt-0">
          <a className="font-metadata text-metadata text-secondary hover:underline" href="#">Privacy</a>
          <a className="font-metadata text-metadata text-secondary hover:underline" href="#">Terms</a>
          <a className="font-metadata text-metadata text-secondary hover:underline" href="#">Archive</a>
        </div>
        <span className="font-metadata text-metadata text-secondary mt-stack-md md:mt-0">© 2024 Lyricist Editorial. All rights reserved.</span>
      </footer>
    </div>
  );
}