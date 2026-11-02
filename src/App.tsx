import { AnimatePresence, motion } from 'framer-motion'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RequireRole } from './components/Guard'
import Agenda from './pages/Agenda'
import Cash from './pages/Cash'
import Compliance from './pages/Compliance'
import Consultation from './pages/Consultation'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import OrderDetail from './pages/OrderDetail'
import Orders from './pages/Orders'
import PatientDetail from './pages/PatientDetail'
import Patients from './pages/Patients'
import Postventa from './pages/Postventa'
import PrintDoc from './pages/PrintDoc'
import Purchases from './pages/Purchases'
import Quote from './pages/Quote'
import Reports from './pages/Reports'
import Waiting from './pages/Waiting'

const CLINIC = ['admin', 'tecnologo'] as const
const COMMERCIAL = ['admin', 'vendedora'] as const
const SHOP = ['admin', 'vendedora', 'montajista'] as const
const FRONT = ['admin', 'tecnologo', 'vendedora'] as const

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
            <Route
              path="/sala"
              element={
                <RequireRole roles={[...FRONT]}>
                  <Waiting />
                </RequireRole>
              }
            />
            <Route
              path="/agenda"
              element={
                <RequireRole roles={[...FRONT]}>
                  <Agenda />
                </RequireRole>
              }
            />
            <Route
              path="/pacientes"
              element={
                <RequireRole roles={[...FRONT]}>
                  <Patients />
                </RequireRole>
              }
            />
            <Route
              path="/pacientes/:id"
              element={
                <RequireRole roles={[...FRONT]}>
                  <PatientDetail />
                </RequireRole>
              }
            />
            <Route
              path="/consulta/:id"
              element={
                <RequireRole roles={[...CLINIC]}>
                  <Consultation />
                </RequireRole>
              }
            />
            <Route
              path="/cotizacion/:id"
              element={
                <RequireRole roles={[...COMMERCIAL]}>
                  <Quote />
                </RequireRole>
              }
            />
            <Route
              path="/ordenes"
              element={
                <RequireRole roles={[...SHOP]}>
                  <Orders />
                </RequireRole>
              }
            />
            <Route
              path="/ordenes/:id"
              element={
                <RequireRole roles={[...SHOP]}>
                  <OrderDetail />
                </RequireRole>
              }
            />
            <Route
              path="/inventario"
              element={
                <RequireRole roles={[...SHOP]}>
                  <Inventory />
                </RequireRole>
              }
            />
            <Route
              path="/caja"
              element={
                <RequireRole roles={[...COMMERCIAL]}>
                  <Cash />
                </RequireRole>
              }
            />
            <Route
              path="/compras"
              element={
                <RequireRole roles={['admin']}>
                  <Purchases />
                </RequireRole>
              }
            />
            <Route
              path="/reportes"
              element={
                <RequireRole roles={['admin']}>
                  <Reports />
                </RequireRole>
              }
            />
            <Route
              path="/postventa"
              element={
                <RequireRole roles={[...COMMERCIAL]}>
                  <Postventa />
                </RequireRole>
              }
            />
            <Route
              path="/cumplimiento"
              element={
                <RequireRole roles={['admin']}>
                  <Compliance />
                </RequireRole>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </Layout>
  )
}
