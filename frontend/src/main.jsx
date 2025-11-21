import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom';

// Core contexts
import { AuthProvider } from './contexts/AuthContext.jsx';

// Combined contexts (reduces nesting from 8 to 5)
import { InventoryProvider } from './contexts/InventoryContext.jsx';  // Station + Battery
import { ServiceProvider } from './contexts/ServiceContext.jsx';      // Package + Subscription
import { BookingProvider } from './contexts/BookingContext.jsx';      // Reservation + SwapRequest

// Standalone contexts
import { VehicleProvider } from './contexts/VehicleContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <InventoryProvider>
          <ServiceProvider>
            <BookingProvider>
              <VehicleProvider>
                <App />
              </VehicleProvider>
            </BookingProvider>
          </ServiceProvider>
        </InventoryProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
