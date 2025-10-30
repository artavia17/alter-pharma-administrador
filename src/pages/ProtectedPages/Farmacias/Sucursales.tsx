import { useEffect, useState, useMemo } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import Label from "../../../components/form/Label";
import Select from "../../../components/form/Select";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { getPharmaciesByCountry, getSubPharmacies } from "../../../services/protected/sub-pharmacies.services";
import { getCountries } from "../../../services/protected/countries.services";
import { SubPharmacyData } from "../../../types/services/protected/sub-pharmacies.types";
import { CountryData } from "../../../types/services/protected/countries.types";
import { formatDate } from "../../../helper/formatData";

interface PharmacyOption {
  id: number;
  commercial_name: string;
  country_id: number;
}

export default function SucursalesPage() {
  const [subPharmacies, setSubPharmacies] = useState<SubPharmacyData[]>([]);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [pharmacies, setPharmacies] = useState<PharmacyOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filtros
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [pharmacyFilter, setPharmacyFilter] = useState<string>("");

  useEffect(() => {
    loadCountries();
  }, []);

  useEffect(() => {
    if (countryFilter) {
      loadPharmaciesByCountry(parseInt(countryFilter));
    } else {
      setPharmacies([]);
      setPharmacyFilter("");
      setSubPharmacies([]);
    }
  }, [countryFilter]);

  useEffect(() => {
    if (pharmacyFilter) {
      loadSubPharmacies(parseInt(pharmacyFilter));
    } else {
      setSubPharmacies([]);
    }
  }, [pharmacyFilter]);

  const loadCountries = async () => {
    try {
      const response = await getCountries();
      if (response.status === 200 && Array.isArray(response.data)) {
        setCountries(response.data);
      }
    } catch (error) {
      console.error("Error cargando países:", error);
    }
  };

  const loadPharmaciesByCountry = async (countryId: number) => {
    setIsLoading(true);
    try {
      const response = await getPharmaciesByCountry(countryId);
      if (response.status === 200 && Array.isArray(response.data)) {
        setPharmacies(response.data.map(p => ({
          id: p.id,
          commercial_name: p.commercial_name,
          country_id: p.country_id
        })));
      }
    } catch (error) {
      console.error("Error cargando farmacias:", error);
      setPharmacies([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubPharmacies = async (pharmacyId: number) => {
    setIsLoading(true);
    try {
      const response = await getSubPharmacies(pharmacyId);
      if (response.status === 200 && Array.isArray(response.data)) {
        setSubPharmacies(response.data);
      }
    } catch (error) {
      console.error("Error cargando sucursales:", error);
      setSubPharmacies([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Opciones para select de países
  const countryFilterOptions = useMemo(() => {
    return countries
      .filter(country => country.status)
      .map(country => ({
        value: country.id.toString(),
        label: country.name
      }));
  }, [countries]);

  // Opciones para select de farmacias
  const pharmacyFilterOptions = useMemo(() => {
    return pharmacies.map(pharmacy => ({
      value: pharmacy.id.toString(),
      label: pharmacy.commercial_name
    }));
  }, [pharmacies]);

  const hasActiveFilters = countryFilter && pharmacyFilter;

  return (
    <>
      <PageMeta
        title="Sucursales - Farmacias | Alter Pharma"
        description="Visualización de sucursales por farmacia"
      />
      <PageBreadcrumb pageTitle="Sucursales" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              Sucursales de Farmacias
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Visualiza las sucursales registradas por farmacia
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.05] p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label className="mb-2">País *</Label>
              <Select
                options={countryFilterOptions}
                placeholder="Selecciona un país"
                onChange={(value) => setCountryFilter(value)}
                value={countryFilter}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label className="mb-2">Farmacia *</Label>
              <Select
                options={pharmacyFilterOptions}
                placeholder="Selecciona una farmacia"
                onChange={(value) => setPharmacyFilter(value)}
                value={pharmacyFilter}
                disabled={!countryFilter || pharmacies.length === 0}
              />
            </div>
            {hasActiveFilters && (
              <div className="flex items-center gap-2 self-end pb-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {subPharmacies.length} sucursal{subPharmacies.length !== 1 ? 'es' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">ID</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Sucursal</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Farmacia Matriz</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Dirección</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Contacto</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Administrador</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Estado</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Creado</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {subPharmacies.map((subPharmacy) => (
                  <TableRow key={subPharmacy.id}>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{subPharmacy.id}</TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">{subPharmacy.commercial_name}</span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <div>
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">{subPharmacy.pharmacy.commercial_name}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">{subPharmacy.pharmacy.legal_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                      {subPharmacy.physical_address}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <div>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">{subPharmacy.email}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">{subPharmacy.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                      {subPharmacy.administrator_name}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        subPharmacy.status
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {subPharmacy.status ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                      {formatDate(subPharmacy.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {!hasActiveFilters && (
              <div className="px-5 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white/90">Selecciona filtros</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Selecciona un país y una farmacia para ver sus sucursales.
                </p>
              </div>
            )}

            {hasActiveFilters && subPharmacies.length === 0 && !isLoading && (
              <div className="px-5 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white/90">No hay sucursales</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Esta farmacia no tiene sucursales registradas.
                </p>
              </div>
            )}

            {isLoading && (
              <div className="px-5 py-12 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                  <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Cargando...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
