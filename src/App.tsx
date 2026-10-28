import { useState } from 'react'
import { AuthProvider, useAuth } from './lib/auth-context'
import SiteBackground from './components/SiteBackground'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import CountdownRelease from './components/CountdownRelease'
import AnnouncementsSection from './components/AnnouncementsSection'
import RoadmapSection from './components/RoadmapSection'
import ChangelogSection from './components/ChangelogSection'
import ArchiveIdentitySection from './components/ArchiveIdentitySection'
import ReviewsSection from './components/ReviewsSection'
import SupportersSection from './components/SupportersSection'
import AdminSettingsPanel from './components/AdminSettingsPanel'
import Footer from './components/Footer'
import AuthModal from './components/AuthModal'
import ProfileModal from './components/ProfileModal'

function Shell() {
  const [authOpen, setAuthOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { user } = useAuth()

  return (
    <>
      <SiteBackground />
      <div className="relative min-h-screen">
        <Navbar onAuthClick={() => setAuthOpen(true)} onProfileClick={() => setProfileOpen(true)} />
        <Hero />
        <CountdownRelease />
        <AnnouncementsSection />
        <RoadmapSection />
        <ChangelogSection />
        <ArchiveIdentitySection />
        <ReviewsSection />
        <SupportersSection />
        <AdminSettingsPanel />
        <Footer />
      </div>
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      {profileOpen && user && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  )
}
