import Link from 'next/link'
import { CheckCircle, ArrowRight } from 'lucide-react'

const features = [
  {
    icon: 'fa-solid fa-clipboard-list',
    title: 'Task Management',
    description: 'Create, assign, and track tasks with priorities, deadlines, and multi-location support.'
  },
  {
    icon: 'fa-solid fa-comment-dots',
    title: 'Team Chat',
    description: 'Real-time direct and group messaging with file sharing. Keep conversations in context.'
  },
  {
    icon: 'fa-solid fa-location-dot',
    title: 'Attendance Tracking',
    description: 'Geotagged attendance with configurable geofencing. Know who is where, when.'
  },
  {
    icon: 'fa-solid fa-chart-line',
    title: 'Analytics Dashboard',
    description: 'Track productivity with detailed reports, employee performance insights, and trends.'
  },
  {
    icon: 'fa-solid fa-shield-halved',
    title: 'Multi-tenant Security',
    description: 'Enterprise-grade security with complete data isolation between companies.'
  },
  {
    icon: 'fa-solid fa-indian-rupee-sign',
    title: 'Salary & Leave',
    description: 'Admin-defined salary structures and leave policies with automatic calculations.'
  }
]

const testimonials = [
  {
    quote: "ForaTask transformed how our team manages projects. The recurring task feature saves us hours every week.",
    author: "Priya Sharma",
    role: "Project Manager",
    company: "TechStart India"
  },
  {
    quote: "The best task management tool we've used. Simple, powerful, and affordable.",
    author: "Rahul Verma",
    role: "CTO",
    company: "InnovateTech"
  },
  {
    quote: "Our productivity increased by 40% after switching to ForaTask. Highly recommended!",
    author: "Anita Patel",
    role: "Operations Head",
    company: "GrowthCo"
  }
]

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-light border border-primary/10 mb-8">
              <i className="fa-solid fa-star text-primary text-xs"></i>
              <span className="text-sm text-primary font-medium">90 Days Free Trial - No Credit Card Required</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-secondary">
              Smart Task Management for{' '}
              <span className="gradient-text">Growing Teams</span>
            </h1>
            
            <p className="text-base lg:text-lg text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              Streamline your team's workflow with ForaTask. Create, assign, and track tasks effortlessly. 
              Built for teams who want to get more done.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-3.5 bg-primary rounded-xl font-semibold text-white hover:bg-primary-dark transition-all flex items-center justify-center gap-2 text-sm"
              >
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/features"
                className="w-full sm:w-auto px-8 py-3.5 bg-white border border-gray-200 rounded-xl font-semibold text-secondary hover:bg-gray-50 transition-all flex items-center justify-center text-sm"
              >
                View Features
              </Link>
            </div>

            {/* Social Proof */}
            <div className="mt-16 flex flex-col items-center">
              <div className="flex -space-x-3 mb-4">
                {['#1360C6', '#16b571', '#f59e0b', '#ef4444', '#8b5cf6'].map((color, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center font-semibold text-white text-sm"
                    style={{ backgroundColor: color }}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <p className="text-gray-500 text-sm">
                <span className="text-secondary font-semibold">500+</span> teams already using ForaTask
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-secondary">
              Everything You Need to{' '}
              <span className="gradient-text">Succeed</span>
            </h2>
            <p className="text-base lg:text-lg text-gray-500 max-w-2xl mx-auto">
              Powerful features designed to help your team collaborate effectively and achieve more.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-[#F8FAFC] border border-gray-100 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-white transition-colors">
                  <i className={`${feature.icon} text-primary group-hover:text-white transition-colors`}></i>
                </div>
                <h3 className="text-base font-semibold text-secondary mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* New Feature Highlights */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-secondary">
              More Than Just{' '}
              <span className="gradient-text">Task Management</span>
            </h2>
            <p className="text-base lg:text-lg text-gray-500 max-w-2xl mx-auto">
              ForaTask goes beyond tasks with integrated communication, attendance, and workforce tools.
            </p>
          </div>

          {/* Chat Feature */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-light text-primary text-xs font-semibold mb-4">
                <i className="fa-solid fa-comment-dots"></i> TEAM CHAT
              </div>
              <h3 className="text-2xl font-bold text-secondary mb-4">Real-time Messaging</h3>
              <p className="text-gray-500 mb-6 leading-relaxed">
                Communicate instantly with direct messages and group channels. Share files, discuss tasks,
                and keep your team aligned without switching between apps.
              </p>
              <ul className="space-y-3">
                {['Direct & group messaging', 'File sharing & attachments', 'Task-linked discussions', 'Real-time notifications'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold shrink-0">R</div>
                  <div className="bg-primary-light rounded-xl rounded-tl-none px-4 py-2.5">
                    <p className="text-sm text-secondary">Hey team, the client deliverable is ready for review!</p>
                    <span className="text-[10px] text-gray-400 mt-1 block">10:32 AM</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 flex-row-reverse">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-xs font-semibold shrink-0">S</div>
                  <div className="bg-gray-50 rounded-xl rounded-tr-none px-4 py-2.5">
                    <p className="text-sm text-secondary">Great! I'll review it right away.</p>
                    <span className="text-[10px] text-gray-400 mt-1 block">10:34 AM</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">T</div>
                  <div className="bg-primary-light rounded-xl rounded-tl-none px-4 py-2.5">
                    <p className="text-sm text-secondary">I've attached the updated specs.</p>
                    <div className="mt-2 flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-100">
                      <i className="fa-solid fa-file-pdf text-red-500 text-xs"></i>
                      <span className="text-xs text-gray-500">specs_v2.pdf</span>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 block">10:36 AM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Feature */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 md:order-1 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-secondary text-sm">Today's Attendance</h4>
                <span className="text-xs text-gray-400">Feb 2026</span>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Employee 1', time: '9:02 AM', status: 'On Time', color: 'green' },
                  { name: 'Employee 2', time: '9:15 AM', status: 'On Time', color: 'green' },
                  { name: 'Employee 3', time: '9:45 AM', status: 'Late', color: 'amber' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-primary text-xs font-semibold">{item.name[0]}</div>
                      <div>
                        <p className="text-sm font-medium text-secondary">{item.name}</p>
                        <p className="text-xs text-gray-400">Checked in at {item.time}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full bg-${item.color}-50 text-${item.color}-600`}>{item.status}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-primary-light rounded-lg flex items-center gap-3">
                <i className="fa-solid fa-location-crosshairs text-primary"></i>
                <div>
                  <p className="text-xs font-medium text-secondary">Geofence Active</p>
                  <p className="text-[10px] text-gray-400">300m radius - Office HQ</p>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-green-600 text-xs font-semibold mb-4">
                <i className="fa-solid fa-location-dot"></i> ATTENDANCE
              </div>
              <h3 className="text-2xl font-bold text-secondary mb-4">Smart Attendance Tracking</h3>
              <p className="text-gray-500 mb-6 leading-relaxed">
                Track employee attendance with GPS-based geofencing. Set location boundaries, 
                view check-in/check-out times, and generate attendance reports automatically.
              </p>
              <ul className="space-y-3">
                {['GPS-based geofencing (300m radius)', 'Check-in/check-out timestamps', 'Late arrival tracking', 'Admin-configurable settings'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Analytics Feature */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 text-xs font-semibold mb-4">
                <i className="fa-solid fa-chart-line"></i> ANALYTICS
              </div>
              <h3 className="text-2xl font-bold text-secondary mb-4">Employee Performance Analytics</h3>
              <p className="text-gray-500 mb-6 leading-relaxed">
                Get deep insights into your team's performance. Track task completion rates, 
                identify trends, and make data-driven decisions to improve productivity.
              </p>
              <ul className="space-y-3">
                {['Task completion metrics', 'Individual performance scores', 'Monthly trend analysis', 'Exportable reports'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h4 className="font-semibold text-secondary text-sm mb-4">Performance Overview</h4>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-primary-light rounded-lg text-center">
                  <p className="text-2xl font-bold text-primary">87%</p>
                  <p className="text-xs text-gray-500">Completion Rate</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">24</p>
                  <p className="text-xs text-gray-500">Tasks Done</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-amber-600">3</p>
                  <p className="text-xs text-gray-500">In Progress</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-600">1</p>
                  <p className="text-xs text-gray-500">Overdue</p>
                </div>
              </div>
              {/* Mini chart */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-end gap-1 h-20 justify-between px-2">
                  {[40, 65, 55, 80, 70, 90, 85, 95, 75, 88, 92, 87].map((h, i) => (
                    <div key={i} className="flex-1 max-w-[20px] bg-primary/20 rounded-t" style={{ height: `${h}%` }}>
                      <div className="w-full bg-primary rounded-t" style={{ height: `${h * 0.7}%` }}></div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 px-1">
                  <span className="text-[9px] text-gray-400">Jan</span>
                  <span className="text-[9px] text-gray-400">Jun</span>
                  <span className="text-[9px] text-gray-400">Dec</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-secondary">
              Simple, Transparent{' '}
              <span className="gradient-text">Pricing</span>
            </h2>
            <p className="text-base lg:text-lg text-gray-500 max-w-2xl mx-auto">
              Start free, scale as you grow. Pay only for what you need.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="p-8 rounded-2xl bg-[#F8FAFC] border border-primary/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-white text-xs px-4 py-1.5 rounded-bl-xl font-medium">
                Most Popular
              </div>
              
              <h3 className="text-xl font-bold text-secondary mb-2">Team Plan</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-bold text-secondary">&#8377;249</span>
                <span className="text-gray-400">/month</span>
              </div>
              
              <p className="text-gray-500 text-sm mb-6">
                Includes 5 team members. Additional users at &#8377;50/user/month.
              </p>
              
              <ul className="space-y-3 mb-8">
                {[
                  '90 Days Free Trial',
                  'Unlimited Tasks & Recurring Tasks',
                  'Team Chat & File Sharing',
                  'Attendance with Geofencing',
                  'Analytics & Reports',
                  'Salary & Leave Management'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span className="text-sm text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
              
              <Link
                href="/signup"
                className="block w-full py-3.5 text-center bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-all"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
          
          <p className="text-center text-gray-400 mt-6 text-sm">
            <Link href="/pricing" className="text-primary hover:underline font-medium">
              View detailed pricing &rarr;
            </Link>
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-secondary">
              Loved by{' '}
              <span className="gradient-text">Teams</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="p-6 rounded-2xl bg-white border border-gray-100 hover:shadow-lg hover:shadow-primary/5 transition-all">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(s => (
                    <i key={s} className="fa-solid fa-star text-amber-400 text-xs"></i>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">&ldquo;{testimonial.quote}&rdquo;</p>
                <div>
                  <p className="font-semibold text-secondary text-sm">{testimonial.author}</p>
                  <p className="text-gray-400 text-xs">
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-secondary">
            Ready to Transform Your{' '}
            <span className="gradient-text">Workflow?</span>
          </h2>
          <p className="text-base lg:text-lg text-gray-500 mb-10">
            Join hundreds of teams already using ForaTask. Start your 90-day free trial today.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-all"
          >
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
