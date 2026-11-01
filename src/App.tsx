import { AnimatePresence, motion } from 'framer-motion'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import Cash from './pages/Cash'
import Compliance from './pages/Compliance'
import Consultation from './pages/Consultation'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import OrderDetail from './pages/OrderDetail'
import Orders from './pages/Orders'
import PatientDetail from './pages/PatientDetail'
import Patients from './pages/Patients'
import PrintDoc from './pages/PrintDoc'
import Quote from './pages/Quote'
import Waiting from './pages/Waiting'

export default function App() {
  const location = useLocation()
  const isPrint = location.pathname.startsWith('/imprimir')

  if (isPrint) {
    return (
      <Routes>
        <Route path="/imprimir/:docId/:doc" element={<PrintDoc />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  return (
    <Layout>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <Routes location={location}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sala" element={<Waiting />} />
            <Route path="/pacientes" element={<Patients />} />
            <Route path="/pacientes/:id" element={<PatientDetail />} />
            <Route path="/consulta/:id" element={<Consultation />} />
            <Route path="/cotizacion/:id" element={<Quote />} />
            <Route path="/ordenes" element={<Orders />} />
            <Route path="/ordenes/:id" element={<OrderDetail />} />
            <Route path="/inventario" element={<Inventory />} />
            <Route path="/caja" element={<Cash />} />
            <Route path="/cumplimiento" element={<Compliance />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </Layout>
  )
}
