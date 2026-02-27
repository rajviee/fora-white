import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-base">F</span>
              </div>
              <span className="text-xl font-bold text-secondary">ForaTask</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Smart task management for teams. Streamline workflows and boost productivity.
            </p>
            <div className="flex gap-4 mt-4">
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <i className="fa-brands fa-x-twitter"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <i className="fa-brands fa-linkedin-in"></i>
              </a>
              <a href="mailto:hello@foratask.com" className="text-gray-400 hover:text-primary transition-colors">
                <i className="fa-solid fa-envelope"></i>
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-secondary mb-4 text-sm">Product</h3>
            <ul className="space-y-3">
              <li><Link href="/features" className="text-gray-400 hover:text-primary transition-colors text-sm">Features</Link></li>
              <li><Link href="/pricing" className="text-gray-400 hover:text-primary transition-colors text-sm">Pricing</Link></li>
              <li><Link href="/signup" className="text-gray-400 hover:text-primary transition-colors text-sm">Free Trial</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-secondary mb-4 text-sm">Company</h3>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-gray-400 hover:text-primary transition-colors text-sm">About</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-primary transition-colors text-sm">Contact</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-secondary mb-4 text-sm">Legal</h3>
            <ul className="space-y-3">
              <li><Link href="/privacy" className="text-gray-400 hover:text-primary transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-gray-400 hover:text-primary transition-colors text-sm">Terms of Service</Link></li>
              <li><Link href="/refund" className="text-gray-400 hover:text-primary transition-colors text-sm">Refund Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} ForaTask. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm">
            Built for productive teams
          </p>
        </div>
      </div>
    </footer>
  )
}
