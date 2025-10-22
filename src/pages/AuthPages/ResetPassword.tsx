import ResetPasswordForm from "../../components/auth/ResetPasswordForm";
import PageMeta from "../../components/common/PageMeta";
import useTitle from "../../hooks/useTitle";
import AuthLayout from "./AuthPageLayout";

const ResetPassword = () => {
  useTitle("Restablecer Contraseña | Alter Pharma");

  return (
    <>
      <PageMeta
        title="Restablecer Contraseña | Alter Pharma"
        description="Esta es la página para restablecer la contraseña del Administrador de Alter Pharma"
      />
      <AuthLayout>
        <ResetPasswordForm />
      </AuthLayout>
    </>
  );
};
export default ResetPassword;