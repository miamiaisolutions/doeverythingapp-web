"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Zap, Shield, MessageSquare, Menu, X, ChevronRight, Play } from "lucide-react";
import { useState } from "react";
import NetworkBackground from "@/components/landing/NetworkBackground";
import Spotlight from "@/components/landing/Spotlight";
import Typewriter from "@/components/landing/Typewriter";
import HeroChat from "@/components/landing/HeroChat";
import MagneticButton from "@/components/landing/MagneticButton";
import TiltCard from "@/components/landing/TiltCard";
import LiveCode from "@/components/landing/LiveCode";
import BorderBeam from "@/components/landing/BorderBeam";
import ScrollReveal from "@/components/landing/ScrollReveal";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleGetStarted = () => {
    if (user) {
      router.push("/chat");
    } else {
      router.push("/login");
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden">

      {/* Global Spotlight Container */}
      <Spotlight className="min-h-screen">

        {/* Space Background Layer */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <NetworkBackground />
          <div className="absolute inset-0 bg-black/40" />

          {/* Ambient Glows */}
          <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-orange-600/10 rounded-full blur-[150px] animate-float-delayed mix-blend-screen" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-600/5 rounded-full blur-[150px] animate-float mix-blend-screen" />
        </div>

        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-20 items-center">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/20 cursor-pointer hover:scale-105 transition-transform duration-300">
                  DE
                </div>
                <span className="text-xl font-bold tracking-tight">
                  DoEverything
                </span>
              </div>

              {/* Desktop Links */}
              <div className="hidden md:flex items-center gap-8">
                <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Features</button>
                <button onClick={() => scrollToSection('how-it-works')} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">How it works</button>
                <button onClick={() => scrollToSection('pricing')} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Pricing</button>
              </div>

              {/* CTA */}
              <div className="hidden md:flex items-center gap-4">
                {loading ? (
                  <div className="w-24 h-10 bg-white/5 rounded-full animate-pulse"></div>
                ) : user ? (
                  <button
                    onClick={() => router.push("/chat")}
                    className="px-6 py-2.5 bg-white text-black rounded-full text-sm font-bold hover:bg-gray-200 transition-colors"
                  >
                    Dashboard
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => router.push("/login")}
                      className="text-sm font-medium text-white hover:text-orange-400 transition-colors"
                    >
                      Log In
                    </button>
                    <MagneticButton onClick={() => router.push("/login")} className="group px-6 py-2.5 bg-white text-black rounded-full text-sm font-bold hover:bg-orange-500 hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_20px_rgba(249,115,22,0.5)]">
                      Get Started
                    </MagneticButton>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 text-gray-400 hover:text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-black/95 border-t border-white/10 p-4 space-y-4 backdrop-blur-xl">
              <button onClick={() => scrollToSection('features')} className="block w-full text-left py-2 text-gray-400 hover:text-white">Features</button>
              <button onClick={() => scrollToSection('how-it-works')} className="block w-full text-left py-2 text-gray-400 hover:text-white">How it works</button>
              <button onClick={() => scrollToSection('pricing')} className="block w-full text-left py-2 text-gray-400 hover:text-white">Pricing</button>
              <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                <button onClick={() => router.push("/login")} className="w-full py-3 bg-white/5 rounded-lg text-white font-medium">Log In</button>
                <button onClick={() => router.push("/login")} className="w-full py-3 bg-orange-600 text-white rounded-lg font-bold">Get Started</button>
              </div>
            </div>
          )}
        </nav>

        {/* Hero Section */}
        <div className="relative pt-40 pb-20 md:pt-52 md:pb-32 px-4 overflow-hidden">
          <div className="max-w-7xl mx-auto text-center relative z-10">


            <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 text-white">
              Automate <br className="hidden md:block" />
              <Typewriter />
            </h1>

            <p className="max-w-2xl mx-auto text-xl md:text-2xl text-gray-400 mb-8 leading-relaxed">
              The first AI-native orchestration platform. <br />
              Connect your tools, chat with the agent, and <span className="text-white font-medium">ignite your productivity.</span>
            </p>

            <div className="mb-12">
              <HeroChat />
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <MagneticButton
                onClick={handleGetStarted}
                className="w-full sm:w-auto px-8 py-4 bg-orange-600 text-white rounded-full text-lg font-bold hover:bg-orange-500 transition-all flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(249,115,22,0.3)] hover:shadow-[0_0_60px_rgba(249,115,22,0.6)]"
              >
                Start Building Free <ArrowRight className="w-5 h-5" />
              </MagneticButton>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white border border-white/10 rounded-full text-lg font-medium hover:bg-white/10 transition-all backdrop-blur-sm"
              >
                How it works
              </button>
            </div>

          </div>
        </div>

        {/* Modern Features Grid (Bento) */}
        <div id="features" className="py-32 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal className="mb-20 text-center">
              <h2 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">
                Engineered for <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">Power</span>.
              </h2>
              <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                We didn't just build a chatbot. We built a secure, scalable orchestration engine that lives in your infrastructure.
              </p>
            </ScrollReveal>

            <ScrollReveal className="grid grid-cols-1 md:grid-cols-3 gap-6" delay={0.2}>
              {/* Large Card 1 */}
              <TiltCard className="md:col-span-2">
                <div className="h-full w-full bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 hover:border-orange-500/30 transition-colors group backdrop-blur-sm">
                  <div className="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center text-orange-400 mb-6 group-hover:scale-110 transition-transform duration-500">
                    <MessageSquare className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Natural Language Control</h3>
                  <p className="text-gray-400 text-lg">
                    Forget complex flowcharts or drag-and-drop nightmares. Just tell the AI what you want to happen.
                    It parses your intent, verifies safety, and executes the action.
                  </p>
                </div>
              </TiltCard>

              {/* Tall Card */}
              <TiltCard className="md:row-span-2">
                <div className="h-full w-full bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-8 md:p-12 hover:border-orange-500/30 transition-colors group backdrop-blur-sm relative overflow-hidden">
                  <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-400 mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Zap className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Instant Webhooks</h3>
                  <p className="text-gray-400 text-lg mb-8">
                    Connect any API with a simple cURL paste. We auto-generate the schema.
                  </p>
                  {/* Live Typing Effect */}
                  <div className="relative z-10">
                    <LiveCode />
                  </div>
                </div>
              </TiltCard>

              {/* Card 3 */}
              <TiltCard>
                <div className="h-full w-full bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-amber-500/30 transition-colors group backdrop-blur-sm">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Enterprise Grade</h3>
                  <p className="text-gray-400">
                    AES-256 encryption for all keys. Role-based access control. Audit logs for every single action.
                  </p>
                </div>
              </TiltCard>

              {/* Card 4 */}
              <TiltCard>
                <div className="h-full w-full bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-red-500/30 transition-colors group backdrop-blur-sm">
                  <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center text-red-400 mb-6 group-hover:scale-110 transition-transform duration-500">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Fast Execution</h3>
                  <p className="text-gray-400">
                    Built on Firebase Functions for <span className="text-white">millisecond latency</span>. No cold start delays for pro users.
                  </p>
                </div>
              </TiltCard>
            </ScrollReveal>
          </div>
        </div >


        {/* How It Works (Dark Mode) */}
        <div id="how-it-works" className="py-32 border-t border-white/5 bg-white/[0.01] relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ScrollReveal>
              <h2 className="text-3xl md:text-5xl font-bold mb-16">Zero Config to <span className="text-orange-500">Action</span></h2>
            </ScrollReveal>

            {/* Steps Connector Pulse */}
            <div className="relative">
              <ScrollReveal className="grid md:grid-cols-3 gap-8 text-left relative z-10" delay={0.2}>
                {[
                  { step: "01", title: "Connect", desc: "Paste your API Docs, cURL, or configure manually. AI learns the schema instantly." },
                  { step: "02", title: "Chat", desc: "Tell the agent what to do in plain English. No rigid commands." },
                  { step: "03", title: "Automate", desc: "Watch the agent execute the task and report back results." }
                ].map((item, i) => (
                  <TiltCard key={i}>
                    <div className="h-full group relative p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-md">
                      <div className="text-6xl font-black text-white/5 absolute top-4 right-6 select-none group-hover:text-white/10 transition-colors">{item.step}</div>
                      <h3 className="text-2xl font-bold text-white mb-4 relative z-10">{item.title}</h3>
                      <p className="text-gray-400 relative z-10 text-lg leading-relaxed">{item.desc}</p>
                    </div>
                  </TiltCard>
                ))}
              </ScrollReveal>
            </div>
          </div>
        </div >

        {/* Pricing */}
        <div id="pricing" className="py-32 border-t border-white/5 relative overflow-hidden z-10">
          {/* Glow effect */}
          <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[60%] h-[60%] bg-orange-600/10 blur-[150px] rounded-full pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <ScrollReveal className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
              <p className="text-gray-400 text-lg">Start for free. Upgrade when you scale.</p>
            </ScrollReveal>

            <ScrollReveal className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto" delay={0.2}>
              {/* Free */}
              <div className="relative bg-white/5 border border-white/10 rounded-3xl p-8 hover:transform hover:-translate-y-2 transition-transform duration-300 backdrop-blur-xl overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="text-gray-400 font-medium mb-4">Starter</div>
                <div className="text-4xl font-bold text-white mb-6">$0<span className="text-lg text-gray-500 font-normal">/mo</span></div>
                <ul className="space-y-4 mb-8 text-gray-300 text-sm">
                  <li className="flex gap-3"><Check className="w-5 h-5 text-gray-500" /> 2 Webhooks</li>
                  <li className="flex gap-3"><Check className="w-5 h-5 text-gray-500" /> 5 Conversations</li>
                  <li className="flex gap-3"><Check className="w-5 h-5 text-gray-500" /> 1 User</li>
                </ul>
                <button onClick={handleGetStarted} className="w-full py-3 rounded-xl border border-white/20 hover:bg-white hover:text-black transition-colors font-semibold relative z-10">Start Free</button>
              </div>

              {/* Pro - Featured */}
              <div className="relative bg-gray-900/40 border border-orange-500/30 rounded-3xl p-8 transform md:-translate-y-4 shadow-[0_0_50px_rgba(249,115,22,0.15)] backdrop-blur-xl group overflow-hidden">
                <BorderBeam />

                <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none"></div>

                <div className="text-orange-400 font-medium mb-4 flex justify-between relative z-10">
                  <span>Pro</span>
                  <span className="bg-orange-500/10 text-orange-400 text-xs px-2 py-1 rounded-full border border-orange-500/20 shadow-inner shadow-orange-500/20">Most Popular</span>
                </div>
                <div className="text-4xl font-bold text-white mb-6 relative z-10">$14<span className="text-lg text-gray-500 font-normal">/mo</span></div>
                <ul className="space-y-4 mb-8 text-white text-sm font-medium relative z-10">
                  <li className="flex gap-3"><Check className="w-5 h-5 text-orange-400 shadow-orange-500/50 drop-shadow-sm" /> 50 Webhooks</li>
                  <li className="flex gap-3"><Check className="w-5 h-5 text-orange-400 shadow-orange-500/50 drop-shadow-sm" /> Unlimited Chats</li>
                  <li className="flex gap-3"><Check className="w-5 h-5 text-orange-400 shadow-orange-500/50 drop-shadow-sm" /> 3 Team Members</li>
                  <li className="flex gap-3"><Check className="w-5 h-5 text-orange-400 shadow-orange-500/50 drop-shadow-sm" /> Priority Latency</li>
                </ul>
                <MagneticButton onClick={handleGetStarted} className="w-full py-3 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-500 transition-all shadow-lg shadow-orange-600/20 relative z-10">Get Started</MagneticButton>
              </div>

              {/* Premium */}
              <div className="relative bg-white/5 border border-white/10 rounded-3xl p-8 hover:transform hover:-translate-y-2 transition-transform duration-300 backdrop-blur-xl overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="text-gray-400 font-medium mb-4">Enterprise</div>
                <div className="text-4xl font-bold text-white mb-6">$29<span className="text-lg text-gray-500 font-normal">/mo</span></div>
                <ul className="space-y-4 mb-8 text-gray-300 text-sm">
                  <li className="flex gap-3"><Check className="w-5 h-5 text-blue-400" /> 200 Webhooks</li>
                  <li className="flex gap-3"><Check className="w-5 h-5 text-blue-400" /> 10 Team Members</li>
                  <li className="flex gap-3"><Check className="w-5 h-5 text-blue-400" /> 60s Timeout</li>
                  <li className="flex gap-3"><Check className="w-5 h-5 text-blue-400" /> SSO & Logs</li>
                </ul>
                <button onClick={handleGetStarted} className="w-full py-3 rounded-xl border border-white/20 hover:bg-white hover:text-black transition-colors font-semibold relative z-10">Contact Sales</button>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="py-32 bg-black border-t border-white/5 relative z-10">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">FAQ</h2>
            </ScrollReveal>

            <ScrollReveal className="space-y-4" delay={0.2}>
              {[
                { q: "Is it secure?", a: "Yes. AES-256 encryption for all keys. Your data is isolated in your own workspace." },
                { q: "Do I need my own API key?", a: "Yes. You bring your own OpenAI key for maximum privacy and cost control." },
                { q: "How do I add webhooks?", a: "Just paste your API documentation or a cURL command. Our 'Magic Paste' feature auto-generates the schema for you, or you can configure it manually." },
                { q: "Can I invite my team?", a: "Yes! Pro and Premium plans support team members with role-based permissions (Admin/Member)." },
                { q: "What happens if a webhook fails?", a: "The AI detects the error and can often self-correct the payload. If not, it reports the exact issue so you can fix it." },
                { q: "Can I cancel anytime?", a: "Absolutely. No contracts. You can export your data before you leave." }
              ].map((item, i) => (
                <div key={i} className="group bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors">
                  <h3 className="text-lg font-bold text-white mb-2 flex justify-between items-center">{item.q} <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" /></h3>
                  <p className="text-gray-400 text-sm">{item.a}</p>
                </div>
              ))}
            </ScrollReveal>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 py-12 bg-black text-center md:text-left relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white rounded flex items-center justify-center text-black text-xs font-bold">
                DE
              </div>
              <span className="font-bold text-white">DoEverything App</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-gray-500">
              <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-white transition-colors">Terms</a>
              <a href="mailto:support@doeverything.app" className="hover:text-white transition-colors">Contact</a>
            </div>
            <p className="text-gray-600 text-sm">
              © {new Date().getFullYear()} DoEverything Inc.
            </p>
          </div>
        </footer>

      </Spotlight>
    </div>
  );
}
