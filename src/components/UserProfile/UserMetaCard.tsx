import { useEffect, useState } from "react";
import { getCookie } from "../../helper/cookieHelper";
import { formatDate } from "../../helper/formatData";
import Alert from "../ui/alert/Alert";
import { myAccount, sendVerificationEmail, getProfileImage } from "../../services/protected/my-account.services";
import { MyaccountSuccessData } from "../../types/services/protected/my-account.types";
import { ThemeToggleButton } from "../common/ThemeToggleButton";

export default function UserMetaCard() {
  const [isSending, setIsSending] = useState(false);
  const [typeAlert, setTypeAlert] = useState<"success" | "error" | "warning" | "info" | "">();
  const [titleAlert, setTitleAlert] = useState<string>('');
  const [messageAlert, setMessageAlert] = useState<string>('');

  // User data
  const [photo, setPhoto] = useState<string>(getCookie('user_photo') || '');
  const [name, setName] = useState<string>(getCookie('user_name') || '');
  const [emailVerifiedAt, setEmailVerifiedAt] = useState<string>(getCookie('user_email_verified_at') || '');
  const [updatedAt, setUpdatedAt] = useState<string>(getCookie('user_updated_at') || '');

  useEffect(() => {
    account();

    // Escuchar eventos de actualización de perfil
    const handleProfileUpdate = () => {
      account();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [])

  const account = async () => {
    try {
        // Validar el token con el servidor
        const response = await myAccount();

        if (response.status === 200) {
          const user: MyaccountSuccessData = response.data as MyaccountSuccessData;

          // Cargar imagen de perfil si existe
          if (user.profile_image) {
            try {
              const imageUrl = await getProfileImage();
              setPhoto(imageUrl);
            } catch (error) {
              console.error("Error cargando imagen de perfil:", error);
              setPhoto('');
            }
          } else {
            setPhoto('');
          }

          setName(user.name);
          setEmailVerifiedAt(user.email_verified_at || '');
          setUpdatedAt(user.updated_at);
        }
      } catch (error) {
        console.error("Error obteniendo usuario:", error);
      }
  }

  const handleVerifyEmail = async () => {
    try {
      setIsSending(true);
      setTypeAlert("");
      
      const resp = await sendVerificationEmail();
      if(resp.status == 200){
        setTypeAlert('success');
        setTitleAlert('Correo electrónico enviado');
        setMessageAlert('Email de verificación enviado correctamente. Revisa tu bandeja de entrada.');
      }else{
        setTypeAlert('error');
        setTitleAlert('No se pudo enviar el correo de verificación');
        setMessageAlert(resp.message || 'Contacta al administrador del sistema.');
      }
    } catch (error: any) {
      console.error('Error al enviar email de verificación:', error);

      if(error.response.data.message){
        setTypeAlert('error');
        setTitleAlert('Error');
        setMessageAlert(error.response.data.message);
      }else{
        setTypeAlert('error');
        setTitleAlert('Error');
        setMessageAlert("No se pudo procesar la solicitud. Intenta nuevamente.");
      }
      
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      {
        typeAlert ? (
          <div className="mb-4">
            <Alert
              variant={typeAlert || 'error'}
              title={titleAlert || 'Error'}
              message={messageAlert || "Error al enviar el email de verificación."}
              showLink={false}
            />
          </div>
        ) : ''
      }
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
          <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
            <img src={`${photo ? photo : '/images/user/profile-photo.webp'}`} alt="User" />
          </div>
          <div className="order-3 xl:order-2">
            <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
              { name }
            </h4>
            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {
                  emailVerifiedAt ? (
                    <span className="text-green-500 font-medium">
                      Tu cuenta fue verificada el {formatDate(emailVerifiedAt)}
                    </span>

                  ) : (
                    <span className="text-red-500 font-medium">Usuario no verificado</span>
                  )
                }
              </p>
              <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ultima actualización: { formatDate(updatedAt) }
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggleButton />
          {
            !emailVerifiedAt && (
              <button
                onClick={handleVerifyEmail}
                disabled={isSending}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>

                {isSending ? 'Enviando...' : 'Verificar'}
              </button>
            )
          }
        </div>
      </div>
    </div>
  );
}
