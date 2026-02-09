import { Target, Users, Heart, Zap } from 'lucide-react'

export const metadata = {
  title: 'About Us - ForaTask',
  description: 'Learn about ForaTask - our mission to help teams work smarter with intuitive task management.',
}

export default function About() {
  return (
    <div className="pt-24">
      {/* Hero */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Our Mission to{' '}
            <span className="gradient-text">Empower Teams</span>
          </h1>
          <p className="text-xl text-dark-300 max-w-3xl mx-auto">
            ForaTask was built with one goal: to help teams work smarter, not harder. We believe that great task management should be simple, powerful, and accessible to everyone.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-4 bg-dark-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What We Stand For</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl glass text-center">
              <div className="w-14 h-14 rounded-xl bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                <Target className="w-7 h-7 text-primary-400" />
              </div>
              <h3 className="font-semibold mb-2">Focus</h3>
              <p className="text-dark-300 text-sm">We help teams focus on what matters most</p>
            </div>
            <div className="p-6 rounded-2xl glass text-center">
              <div className="w-14 h-14 rounded-xl bg-accent-500/20 flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-accent-400" />
              </div>
              <h3 className="font-semibold mb-2">Collaboration</h3>
              <p className="text-dark-300 text-sm">Great work happens when teams work together</p>
            </div>
            <div className="p-6 rounded-2xl glass text-center">
              <div className="w-14 h-14 rounded-xl bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-7 h-7 text-primary-400" />
              </div>
              <h3 className="font-semibold mb-2">Simplicity</h3>
              <p className="text-dark-300 text-sm">Powerful doesn't have to mean complicated</p>
            </div>
            <div className="p-6 rounded-2xl glass text-center">
              <div className="w-14 h-14 rounded-xl bg-accent-500/20 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-7 h-7 text-accent-400" />
              </div>
              <h3 className="font-semibold mb-2">Speed</h3>
              <p className="text-dark-300 text-sm">Fast tools lead to fast results</p>
            </div>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Our Story</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-dark-300 mb-4">
              ForaTask started when our founders experienced firsthand the challenges of managing tasks across growing teams. Existing tools were either too simple or overwhelmingly complex.
            </p>
            <p className="text-dark-300 mb-4">
              We set out to build something different - a task management platform that scales with your team, keeps things organized, and doesn't require a PhD to use.
            </p>
            <p className="text-dark-300 mb-4">
              Today, ForaTask helps hundreds of teams across India manage their work more effectively. From startups to established businesses, we're proud to be part of their productivity journey.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-dark-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Join Our Journey</h2>
          <p className="text-dark-300 mb-8">
            Experience the ForaTask difference with a 90-day free trial.
          </p>
          <a
            href="/signup"
            className="inline-block px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl font-semibold text-lg hover:from-primary-500 hover:to-primary-400 transition-all shadow-xl shadow-primary-500/25"
          >
            Start Free Trial
          </a>
        </div>
      </section>
    </div>
  )
}
