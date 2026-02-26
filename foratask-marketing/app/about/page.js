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
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-secondary">
            Our Mission to{' '}
            <span className="gradient-text">Empower Teams</span>
          </h1>
          <p className="text-base lg:text-lg text-gray-500 max-w-3xl mx-auto">
            ForaTask was built with one goal: to help teams work smarter, not harder. We believe that great task management should be simple, powerful, and accessible to everyone.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12 text-secondary">What We Stand For</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: 'fa-solid fa-bullseye', title: 'Focus', desc: 'We help teams focus on what matters most', color: 'primary' },
              { icon: 'fa-solid fa-users', title: 'Collaboration', desc: 'Great work happens when teams work together', color: 'accent' },
              { icon: 'fa-solid fa-heart', title: 'Simplicity', desc: "Powerful doesn't have to mean complicated", color: 'primary' },
              { icon: 'fa-solid fa-bolt', title: 'Speed', desc: 'Fast tools lead to fast results', color: 'accent' },
            ].map((v, i) => (
              <div key={i} className="p-6 rounded-2xl bg-[#F8FAFC] border border-gray-100 text-center hover:shadow-lg hover:shadow-primary/5 transition-all">
                <div className={`w-12 h-12 rounded-xl ${v.color === 'primary' ? 'bg-primary-light' : 'bg-green-50'} flex items-center justify-center mx-auto mb-4`}>
                  <i className={`${v.icon} ${v.color === 'primary' ? 'text-primary' : 'text-accent'}`}></i>
                </div>
                <h3 className="font-semibold text-secondary mb-2">{v.title}</h3>
                <p className="text-gray-500 text-sm">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-secondary">Our Story</h2>
          <div className="space-y-4">
            <p className="text-gray-500 leading-relaxed">
              ForaTask started when our founders experienced firsthand the challenges of managing tasks across growing teams. Existing tools were either too simple or overwhelmingly complex.
            </p>
            <p className="text-gray-500 leading-relaxed">
              We set out to build something different - a task management platform that scales with your team, keeps things organized, and doesn't require a PhD to use.
            </p>
            <p className="text-gray-500 leading-relaxed">
              Today, ForaTask helps hundreds of teams across India manage their work more effectively. From startups to established businesses, we're proud to be part of their productivity journey.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-6 text-secondary">Join Our Journey</h2>
          <p className="text-gray-500 mb-8">
            Experience the ForaTask difference with a 90-day free trial.
          </p>
          <a href="/signup" className="inline-block px-8 py-3.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-all">
            Start Free Trial
          </a>
        </div>
      </section>
    </div>
  )
}
