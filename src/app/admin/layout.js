export const metadata = {
  title: 'Admin Dashboard - Hotel Booking Manager',
  description: 'Administrative tools for the Hotel Booking Manager',
}

export default function AdminLayout({ children }) {
  return (
    <div className="">
      {children}
    </div>
  );
}
