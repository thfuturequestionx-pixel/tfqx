export default function Footer() {
  return(
    <footer className="border-t border-[var(--border)]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-[var(--muted)] sm:flex-row sm:px-6 lg:px-6">
        <span>© {new Date().getFullYear()} TFQX. All rights reserved.</span>
        <span>The Future Question Xplained</span>
      </div>
    </footer>
  );
}