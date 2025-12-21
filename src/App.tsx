import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import NotFound from "./pages/ProtectedPages/Examples/OtherPage/NotFound";
import UserProfiles from "./pages/ProtectedPages/Examples/MyAccount/UserProfile";
import Videos from "./pages/ProtectedPages/Examples/UiElements/Videos";
import Images from "./pages/ProtectedPages/Examples/UiElements/Images";
import Alerts from "./pages/ProtectedPages/Examples/UiElements/Alerts";
import Badges from "./pages/ProtectedPages/Examples/UiElements/Badges";
import Avatars from "./pages/ProtectedPages/Examples/UiElements/Avatars";
import Buttons from "./pages/ProtectedPages/Examples/UiElements/Buttons";
import LineChart from "./pages/ProtectedPages/Examples/Charts/LineChart";
import BarChart from "./pages/ProtectedPages/Examples/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/ProtectedPages/Examples/Tables/BasicTables";
import FormElements from "./pages/ProtectedPages/Examples/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/ProtectedPages/Examples/Dashboard/Home";
import Redemptions from "./pages/ProtectedPages/Examples/Dashboard/Redemptions";
import PatientProductRedemptions from "./pages/ProtectedPages/Examples/Dashboard/PatientProductRedemptions";
import ResetPassword from "./pages/AuthPages/ResetPassword";
import ResetPasswordCreate from "./pages/AuthPages/ResetPasswordCreate";
import ProtectedRoute from "./components/routes/ProtectedRoute";
import VerifyEmail from "./pages/ProtectedPages/Examples/MyAccount/VerifyEmail";
import ModulosPage from "./pages/ProtectedPages/Accesos/Modulos";
import UsuariosPage from "./pages/ProtectedPages/Accesos/Usuarios";
import FarmaceuticasPage from "./pages/ProtectedPages/Farmacias/Farmaceuticas";
import SucursalesPage from "./pages/ProtectedPages/Farmacias/Sucursales";
import PaisesPage from "./pages/ProtectedPages/Localizaciones/Paises";
import CiudadesPage from "./pages/ProtectedPages/Localizaciones/Ciudades";
import MunicipiosPage from "./pages/ProtectedPages/Localizaciones/Municipios";
import EspecialidadesPage from "./pages/ProtectedPages/Doctores/Especialidades";
import DoctoresPage from "./pages/ProtectedPages/Doctores/Doctores";
import ProductosPage from "./pages/ProtectedPages/Medicamentos/Productos";
import DosisPage from "./pages/ProtectedPages/Medicamentos/Dosis";
import GruposProductosPage from "./pages/ProtectedPages/Medicamentos/GruposProductos";
import PacientesPage from "./pages/ProtectedPages/Pacientes/Pacientes";
import TransaccionesPage from "./pages/ProtectedPages/Transacciones/Transacciones";
import SaltosFacturacionPage from "./pages/ProtectedPages/Transacciones/SaltosFacturacion";
import DistribuidoresPage from "./pages/ProtectedPages/Distribuidores/Distribuidores";
import BonosPage from "./pages/ProtectedPages/Bonos/Bonos";
import SolicitudesFarmaciasPage from "./pages/ProtectedPages/Farmacias/SolicitudesFarmacias";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Auth Layout - Rutas públicas */}
          <Route path="/auth/sign-in" element={<SignIn />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/reset-password" element={<ResetPasswordCreate />} />

          {/* Protected Routes - Rutas protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              {/* Dashboard */}
              <Route index path="/" element={<Home />} />
              <Route path="/reportes/canjes" element={<Redemptions />} />
              <Route path="/reportes/pacientes-productos" element={<PatientProductRedemptions />} />

              {/* Account */}
              <Route path="/account/me" element={<UserProfiles />} />
              <Route path="/account/verify-email" element={<VerifyEmail />} />

              {/* Usuarios */}
              <Route path="/modulos" element={<ModulosPage />} />
              <Route path="/modulos/usuarios" element={<UsuariosPage />} />

              {/* Localizaciones */}
              <Route path="/localizaciones/paises" element={<PaisesPage />} />
              <Route path="/localizaciones/ciudades" element={<CiudadesPage />} />
              <Route path="/localizaciones/municipios" element={<MunicipiosPage />} />

              {/* Doctores */}
              <Route path="/doctores" element={<DoctoresPage />} />
              <Route path="/doctores/especialidades" element={<EspecialidadesPage />} />

              {/* Farmacias */}
              <Route path="/farmaceuticas" element={<FarmaceuticasPage />} />
              <Route path="/farmaceuticas/sucursales" element={<SucursalesPage />} />
              <Route path="/farmaceuticas/solicitudes" element={<SolicitudesFarmaciasPage />} />

              {/* Medicamentos */}
              <Route path="/medicamentos/productos" element={<ProductosPage />} />
              <Route path="/medicamentos/grupos" element={<GruposProductosPage />} />
              <Route path="/medicamentos/presentacion" element={<DosisPage />} />

              {/* Pacientes */}
              <Route path="/pacientes" element={<PacientesPage />} />

              {/* Transacciones */}
              <Route path="/transacciones" element={<TransaccionesPage />} />
              <Route path="/transacciones/saltos-facturacion" element={<SaltosFacturacionPage />} />

              {/* Distribuidores */}
              <Route path="/distribuidores" element={<DistribuidoresPage />} />

              {/* Bonos */}
              <Route path="/bonos" element={<BonosPage />} />

              {/* ----------------------------------------------------------------------------- */}
              {/* ----------------------------------------------------------------------------- */}
              {/* ----------------------------------------------------------------------------- */}


              {/* Paginas de ejemplos (Eliminar despues) */}
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/blank" element={<Blank />} />

              {/* Forms */}
              <Route path="/form-elements" element={<FormElements />} />

              {/* Tables */}
              <Route path="/basic-tables" element={<BasicTables />} />

              {/* Ui Elements */}
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/avatars" element={<Avatars />} />
              <Route path="/badge" element={<Badges />} />
              <Route path="/buttons" element={<Buttons />} />
              <Route path="/images" element={<Images />} />
              <Route path="/videos" element={<Videos />} />

              {/* Charts */}
              <Route path="/line-chart" element={<LineChart />} />
              <Route path="/bar-chart" element={<BarChart />} />

              {/* ----------------------------------------------------------------------------- */}
              {/* ----------------------------------------------------------------------------- */}
              {/* ----------------------------------------------------------------------------- */}
            </Route>
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
