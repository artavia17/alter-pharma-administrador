import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import PageMeta from "../../../../components/common/PageMeta";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import { verifyEmail } from "../../../../services/protected/my-account.services";
import useTitle from "../../../../hooks/useTitle";
import Button from "../../../../components/ui/button/Button";

type VerificationStatus = "loading" | "success" | "error" | "invalid";

const VerifyEmail = () => {
    useTitle("Verificar correo electrónico | Alter Pharma");

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<VerificationStatus>("loading");
    const [errorMessage, setErrorMessage] = useState<string>("");

    const token = searchParams.get("token");
    const email = searchParams.get("email");

    useEffect(() => {
        verifyEmailAddress();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const verifyEmailAddress = async () => {
        // Validar que tenemos token y email
        if (!token || !email) {
            setStatus("invalid");
            setErrorMessage(
                "El enlace de verificación es inválido. Por favor solicita un nuevo correo de verificación."
            );
            return;
        }

        try {
            const response = await verifyEmail(email, token);

            if (response.status === 200) {
                navigate("/account/me");
            } else {
                setStatus("error");
                setErrorMessage(
                    response.message ||
                    "No se pudo verificar el correo electrónico. Por favor intenta nuevamente."
                );
            }
        } catch (error: any) {
            console.error("Error al verificar email:", error);

            setStatus("error");

            if (error.response?.data?.message) {
                setErrorMessage(error.response.data.message);
            } else if (error.response?.status === 400) {
                setErrorMessage(
                    "El enlace de verificación ha expirado o ya fue utilizado. Por favor solicita un nuevo correo de verificación."
                );
            } else if (error.response?.status === 404) {
                setErrorMessage(
                    "No se encontró la cuenta asociada a este correo electrónico."
                );
            } else {
                setErrorMessage(
                    "Ocurrió un error al verificar tu correo electrónico. Por favor intenta nuevamente más tarde."
                );
            }
        }
    };

    // Estado de carga
    if (status === "loading") {
        return (
            <>
                <PageMeta
                    title="Verificando correo electrónico | Alter Pharma"
                    description="Verificación de correo electrónico en proceso"
                />
                <PageBreadcrumb pageTitle="Verificar correo electrónico" />
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 border-4 rounded-full animate-spin border-brand-500 border-t-transparent"></div>
                        <h2 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">
                            Verificando tu correo electrónico
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Por favor espera mientras verificamos tu cuenta...
                        </p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <PageMeta
                title="Error al verificar el correo electrónico | Alter Pharma"
                description="No se pudo verificar el correo electrónico"
            />
            <PageBreadcrumb pageTitle="Verificar correo electrónico" />
            <div className="min-h-[60vh] p-5 flex flex-col items-center justify-center  text-center border rounded-2xl border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="w-full max-w-md">
                    <div className="">
                        <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full bg-error-100 dark:bg-error-900/20">
                            <svg
                                className="w-10 h-10 text-error-600 dark:text-error-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </div>

                        <h2 className="mb-3 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            Error al verificar el correo electrónico
                        </h2>

                        <div className="p-4 mb-6 border rounded-lg bg-error-50 border-error-200 dark:bg-error-900/20 dark:border-error-800">
                            <p className="text-sm text-error-700 dark:text-error-400">
                                {errorMessage}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Button
                                onClick={() => navigate("/account/me")}
                                className="w-full"
                                size="sm"
                            >
                                Ir a mi perfil
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default VerifyEmail;
