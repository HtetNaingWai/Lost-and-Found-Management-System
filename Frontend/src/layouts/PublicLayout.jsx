import { Outlet } from 'react-router-dom'
import Footer from '../components/Footer'
import GuestNav from '../components/GuestNav'

function PublicLayout({ onOpenModal, children }) {
  return (
    <div className="landing-page info-page">
      <GuestNav onOpenModal={onOpenModal} />
      {children ?? <Outlet />}
      <Footer />
    </div>
  )
}

export default PublicLayout
