import { CheckCircle } from 'lucide-react'

export const metadata = {
  title: 'Features - ForaTask',
  description: 'Explore ForaTask features: task management, team chat, attendance tracking, recurring tasks, analytics, salary & leave management.',
}

const features = [
  {
    icon: 'fa-solid fa-clipboard-list',
    title: 'Task Management',
    description: 'Create, assign, and organize tasks with priorities, due dates, and detailed descriptions. Support for multi-location tasks and remote task flags.',
    highlights: ['Priority levels', 'Due date tracking', 'Multi-location tasks', 'Remote task flag']
  },
  {
    icon: 'fa-solid fa-users',
    title: 'Team Collaboration',
    description: 'Work together seamlessly. Assign tasks to team members, add observers, and enable viewer approval flows.',
    highlights: ['Task assignment', 'Observer mode', 'Viewer approval flow', 'Role-based access']
  },
  {
    icon: 'fa-solid fa-arrows-rotate',
    title: 'Recurring Tasks',
    description: 'Automate repetitive work with recurring tasks. Set daily, weekly, monthly, or quarterly schedules with full completion history.',
    highlights: ['Daily recurrence', 'Weekly schedules', 'Monthly tasks', 'Completion history']
  },
  {
    icon: 'fa-solid fa-comment-dots',
    title: 'Team Chat',
    description: 'Real-time direct and group messaging built right into the platform. Share files, discuss tasks, and keep communication in one place.',
    highlights: ['Direct messaging', 'Group channels', 'File sharing', 'Real-time updates']
  },
  {
    icon: 'fa-solid fa-location-dot',
    title: 'Attendance Tracking',
    description: 'GPS-based attendance with configurable geofencing. Track check-ins, check-outs, and generate attendance reports automatically.',
    highlights: ['GPS geofencing', 'Check-in/out logs', 'Late tracking', 'Admin settings']
  },
  {
    icon: 'fa-solid fa-chart-line',
    title: 'Analytics Dashboard',
    description: 'Track productivity with detailed reports. View task completion rates, employee performance scores, and monthly trends.',
    highlights: ['Completion rates', 'Performance scores', 'Trend analysis', 'Export reports']
  },
  {
    icon: 'fa-solid fa-shield-halved',
    title: 'Enterprise Security',
    description: 'Multi-tenant architecture with complete data isolation. Your data is safe and separate from other companies.',
    highlights: ['Data isolation', 'Secure access', 'Role permissions', 'Subscription control']
  },
  {
    icon: 'fa-solid fa-indian-rupee-sign',
    title: 'Salary & Leave Management',
    description: 'Define salary structures, manage leave policies, and automate salary calculations. Everything HR needs in one place.',
    highlights: ['Salary structures', 'Leave policies', 'Auto calculation', 'Leave requests']
  }
]

export default function Features() {
  return (
    <div className="pt-24">
      {/* Hero */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-secondary">
            Powerful Features for{' '}
            <span className="gradient-text">Productive Teams</span>
          </h1>
          <p className="text-base lg:text-lg text-gray-500 max-w-3xl mx-auto">
            Everything you need to manage tasks, communicate with your team, track attendance, and analyze performance - all in one beautiful platform.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="p-6 rounded-2xl bg-white border border-gray-100 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all group">
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-colors">
                    <i className={`${feature.icon} text-primary group-hover:text-white transition-colors`}></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-secondary mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-500 mb-4 leading-relaxed">{feature.description}</p>
                    <ul className="grid grid-cols-2 gap-2">
                      {feature.highlights.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-gray-400">
                          <CheckCircle className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-secondary">
            Ready to Get Started?
          </h2>
          <p className="text-gray-500 mb-8 text-sm">
            Try ForaTask free for 90 days. No credit card required.
          </p>
          <a
            href="/signup"
            className="inline-block px-8 py-3.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-all"
          >
            Start Free Trial
          </a>
        </div>
      </section>
    </div>
  )
}
