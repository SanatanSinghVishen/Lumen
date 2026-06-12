import { Outlet, Link } from "react-router-dom";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#000000] text-[#EDEDED] font-sans selection:bg-[#0070F3] selection:text-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-[#000000]/80 backdrop-blur-md z-50 border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-2.5 h-2.5 rounded-full bg-[#0070F3] shadow-[0_0_10px_rgba(0,112,243,0.8)] group-hover:shadow-[0_0_15px_rgba(0,112,243,1)] transition-shadow"></div>
            <Link to="/" className="font-semibold text-sm tracking-wider text-[#EDEDED]">LUMEN</Link>
          </div>
          <div className="flex items-center space-x-6 text-sm text-[#888888]">
            <Link to="/how-it-works" className="hover:text-white transition-colors relative group">
              How it works
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#0070F3] transition-all group-hover:w-full"></span>
            </Link>
            <Link to="/architecture" className="hover:text-white transition-colors relative group">
              Architecture
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#0070F3] transition-all group-hover:w-full"></span>
            </Link>
            <a href="https://github.com/SanatanSinghVishen/Lumen" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center group">
              GitHub <span className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-1 transition-all text-[#0070F3]">↗</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col pt-14">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#222] py-5 px-6 mt-auto bg-[#000000]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-[11px] sm:text-xs text-[#888888]">
          <div className="mb-4 sm:mb-0">
            Built by <span className="font-medium text-[#EDEDED]">Sanatan Singh</span> · IIIT Nagpur · B.Tech CSE 2027
          </div>
          <div className="flex items-center space-x-5">
            <a href="https://www.linkedin.com/in/sanatan-singh-55b3502a3/" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-all">
              LinkedIn
            </a>
            <a href="https://github.com/SanatanSinghVishen/Lumen" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-all">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
