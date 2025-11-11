// App.tsx (Corrected)

import { Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';
import Bookings from './pages/Bookings';
import Contact from './pages/Contact';
import About from './pages/About';
import CreateHotel from './pages/CreateHotel';
import CreateAdventure from './pages/CreateAdventure';
import CreateTripEvent from './pages/CreateTripEvent';
import EditListing from './pages/EditListing';
import EventDetail from './pages/EventDetail';
import HotelDetail from './pages/HotelDetail';
import AdventurePlaceDetail from './pages/AdventurePlaceDetail';
import Index from './pages/Index';
import MyContent from './pages/MyContent';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import Saved from './pages/Saved';
import CategoryDetail from './pages/CategoryDetail';
import ProfileEdit from './pages/ProfileEdit';

function App() {
    return (
        <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/saved" element={<Saved />} />
            <Route path="/mycontent" element={<MyContent />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/edit" element={<ProfileEdit />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route path="/category/:categoryId" element={<CategoryDetail />} />
            <Route path="/event/:eventId" element={<EventDetail />} />
            <Route path="/hotel/:hotelId" element={<HotelDetail />} />
            <Route path="/adventure/:adventureId" element={<AdventurePlaceDetail />} />
            <Route path="/edit-listing/:listingId" element={<EditListing />} />
            
            {/* 🛑 THESE ARE THE CRITICAL FIXES */}
            <Route path="/CreateHotel" element={<CreateHotel />} />
            <Route path="/CreateAdventure" element={<CreateAdventure />} />
            <Route path="/CreateTripEvent" element={<CreateTripEvent />} />

            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}
export default App;