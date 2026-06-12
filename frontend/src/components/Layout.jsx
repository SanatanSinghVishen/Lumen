import { Outlet, Link } from "react-router-dom";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-[#111827] font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white z-50 border-custom border-b border-t-0 border-l-0 border-r-0">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-[#1A56DB]"></div>
            <Link to="/" className="font-medium text-sm tracking-[0.04em]">LUMEN</Link>
          </div>
          <div className="flex items-center space-x-6 text-sm text-[#6B7280]">
            <Link to="/" className="hover:text-[#111827] transition-colors">How it works</Link>
            <Link to="/" className="hover:text-[#111827] transition-colors">Architecture</Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#111827] transition-colors flex items-center">
              GitHub ↗
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col pt-14">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="w-full border-custom border-t border-b-0 border-l-0 border-r-0 py-4 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] sm:text-xs">
          <div className="text-[#6B7280]">
            Built by <span className="font-medium text-[#1A56DB]">Sanatan Singh</span> · IIIT Nagpur · B.Tech CSE 2027
          </div>
          <div className="flex items-center space-x-4 text-[#6B7280]">
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#111827] transition-colors">
              LinkedIn ↗
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#111827] transition-colors">
              GitHub ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
