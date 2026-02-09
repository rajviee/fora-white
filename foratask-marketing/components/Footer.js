import Link from 'next/link'
import { CheckSquare, Twitter, Linkedin, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-dark-950 border-t border-white/5 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">ForaTask</span>
            </Link>
            <p className="text-dark-400 text-sm">
              Smart task management for teams. Streamline workflows and boost productivity.
            </p>
            <div className="flex gap-4 mt-4">
              <a href="#" className="text-dark-400 hover:text-primary-400 transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-dark-400 hover:text-primary-400 transition-colors">
                <Linkedin size={20} />
              </a>
              <a href="mailto:hello@foratask.com" className="text-dark-400 hover:text-primary-400 transition-colors">
                <Mail size={20} />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              <li><Link href="/features" className="text-dark-400 hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="text-dark-400 hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/signup" className="text-dark-400 hover:text-white transition-colors">Free Trial</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-dark-400 hover:text-white transition-colors">About</Link></li>
              <li><Link href="/contact" className="text-dark-400 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><Link href="/privacy" className="text-dark-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-dark-400 hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/refund" className="text-dark-400 hover:text-white transition-colors">Refund Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-dark-400 text-sm">
            © {new Date().getFullYear()} ForaTask. All rights reserved.
          </p>
          <p className="text-dark-400 text-sm">
            Made with ❤️ for productive teams
          </p>
        </div>
      </div>
    </footer>
  )
}
