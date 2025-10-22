import ResetPasswordCreateForm from "../../components/auth/ResetPasswordCreateForm";
import PageMeta from "../../components/common/PageMeta";
import useTitle from "../../hooks/useTitle";
import AuthLayout from "./AuthPageLayout";

const ResetPasswordCreate = () => {
  useTitle("Restablecer Contraseña | Alter Pharma");

  return (
    <>
      <PageMeta
        title="Restablecer Contraseña | Alter Pharma"
        description="Esta es la página para restablecer la contraseña del Administrador de Alter Pharma"
      />
      <AuthLayout>
        <ResetPasswordCreateForm />
      </AuthLayout>
    </>
  );
};
export default ResetPasswordCreate;