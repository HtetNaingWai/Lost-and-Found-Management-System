import heroImage from '../assets/landing_hero.jpg'

export const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_FILE_SIZE = 2 * 1024 * 1024

export const howItWorksSteps = [
  {
    title: '1. Create an Account',
    description:
      'Register as a resident and log in securely to access the platform.',
    icon: 'personAdd',
  },
  {
    title: '2. Submit Item Details',
    description:
      'Logged-in users can report lost or found items with clear descriptions and images.',
    icon: 'document',
  },
  {
    title: '3. Admin Approval',
    description:
      'Submissions are reviewed by community admins before becoming visible to ensure security.',
    icon: 'shield',
  },
]

export const platformFeatures = [
  ['Secure Login', 'Protected access for verified residents.', 'lock'],
  ['Admin Approval', 'Moderated listings maintain quality and trust.', 'shield'],
  ['Lost Item Reporting', 'Easily alert the community about missing items.', 'search'],
  ['Found Item Reporting', "Log items you've discovered to help neighbors.", 'inventory'],
  ['Claim Request System', 'Structured process to claim ownership securely.', 'clipboard'],
  ['Community Recovery', 'Fostering a helpful and connected township.', 'group'],
]

export const initialRegisterValues = {
  fullName: '',
  email: '',
  phone: '',
  nrcNumber: '',
  password: '',
  confirmPassword: '',
}

export const dashboardMenuItems = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { key: 'community', label: 'Community', icon: 'community' },
  { key: 'lost-items', label: 'Lost Items', icon: 'search' },
  { key: 'found-items', label: 'Found Items', icon: 'inventory' },
  { key: 'report-items', label: 'Report Items', icon: 'plusSquare' },
  { key: 'messages', label: 'Messages', icon: 'chat' },
  { key: 'contact', label: 'Contact Us', icon: 'mail' },
]

export const adminDashboardMenuItems = [
  { key: 'dashboard', label: 'Admin Dashboard', icon: 'grid' },
  { key: 'users', label: 'Users', icon: 'group' },
  { key: 'items', label: 'Items', icon: 'inventory' },
  { key: 'contact-messages', label: 'Contact Messages', icon: 'mail' },
]

export const profileDropdownItems = [
  { key: 'profile', label: 'My Profile', icon: 'userCircle' },
  { key: 'my-items', label: 'My Items', icon: 'inventory' },
  { key: 'my-claims', label: 'My Claims', icon: 'clipboard' },
  { key: 'logout', label: 'Logout', icon: 'logout' },
]

export const adminProfileDropdownItems = [
  { key: 'profile', label: 'Admin Profile', icon: 'userCircle' },
  { key: 'users', label: 'Manage Users', icon: 'group' },
  { key: 'items', label: 'Manage Items', icon: 'inventory' },
  { key: 'contact-messages', label: 'Contact Messages', icon: 'mail' },
  { key: 'logout', label: 'Logout', icon: 'logout' },
]

export const statCards = [
  {
    label: 'My Reported Items',
    value: 12,
    description: 'Total lost and found reports you created.',
    icon: 'archive',
  },
  {
    label: 'Pending Items',
    value: 4,
    description: 'Waiting for admin approval.',
    icon: 'clock',
  },
  {
    label: 'Approved Items',
    value: 6,
    description: 'Currently visible to the community.',
    icon: 'shield',
  },
  {
    label: 'My Claim Requests',
    value: 3,
    description: 'Claims you submitted for found items.',
    icon: 'clipboard',
  },
  {
    label: 'Messages',
    value: 5,
    description: 'Unread conversations from the community.',
    icon: 'chat',
  },
  {
    label: 'Returned Items',
    value: 2,
    description: 'Items successfully returned to owners.',
    icon: 'checkCircle',
  },
]

export const activityItems = [
  {
    title: 'Lost item submitted',
    detail: 'You reported a black wallet near Township Market.',
    time: '2 hours ago',
    icon: 'search',
  },
  {
    title: 'Found item submitted',
    detail: 'You submitted a found phone report for review.',
    time: 'Yesterday',
    icon: 'inventory',
  },
  {
    title: 'Claim request sent',
    detail: 'A claim request was sent for a set of house keys.',
    time: '2 days ago',
    icon: 'clipboard',
  },
  {
    title: 'Admin approved item',
    detail: 'Your backpack listing is now visible to the community.',
    time: '3 days ago',
    icon: 'shield',
  },
  {
    title: 'Message received',
    detail: 'A resident sent a follow-up about your recent found item.',
    time: '4 days ago',
    icon: 'chat',
  },
]

export const recentItems = [
  {
    title: 'Black Wallet',
    type: 'Lost',
    status: 'Pending',
    location: 'Township Market',
    date: 'July 5, 2026',
    image: heroImage,
  },
  {
    title: 'Silver Phone',
    type: 'Found',
    status: 'Approved',
    location: 'Community Park',
    date: 'July 3, 2026',
    image: heroImage,
  },
  {
    title: 'Blue Backpack',
    type: 'Lost',
    status: 'Returned',
    location: 'Bus Stop 4',
    date: 'June 30, 2026',
    image: heroImage,
  },
]

export const messagesPreviewItems = [
  {
    sender: 'Community Admin',
    message: 'Your found item report was reviewed and approved.',
    time: '9:12 AM',
    unread: true,
  },
  {
    sender: 'Aye Chan',
    message: 'I think I saw your wallet near the tea shop yesterday.',
    time: 'Yesterday',
    unread: true,
  },
  {
    sender: 'Ko Min',
    message: 'Thank you for reporting the phone. I have submitted a claim.',
    time: '2 days ago',
    unread: false,
  },
]

export { heroImage }
