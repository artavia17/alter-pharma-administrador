import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";
import useTitle from "../../hooks/useTitle";

export default function SignIn() {
  useTitle("Iniciar Sesión");

  return (
    <>
      <PageMeta
        title="Iniciar Sesión | Alter Pharma"
        description="Esta es la página de inicio de sesión para el Administrador de Alter Pharma"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
