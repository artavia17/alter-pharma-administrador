import { useState } from "react";
import { getCookie } from "../../helper/cookieHelper";
import { formatDate } from "../../helper/formatData";

export default function UserMetaCard() {
  const [isSending, setIsSending] = useState(false);

  const handleVerifyEmail = async () => {
    try {
      setIsSending(true);
      // Simulación de llamada al endpoint de verificación
      console.log("Enviando email de verificación...");

      // Aquí iría la llamada real al endpoint, por ejemplo:
      // const response = await fetch('/api/send-verification-email', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${getCookie('token')}`
      //   },
      //   body: JSON.stringify({
      //     email: getCookie('user_email')
      //   })
      // });

      // if (response.ok) {
      //   alert('Email de verificación enviado correctamente');
      // } else {
      //   alert('Error al enviar el email de verificación');
      // }

      // Simulación de respuesta exitosa
      setTimeout(() => {
        alert('Email de verificación enviado correctamente');
        setIsSending(false);
      }, 500);
    } catch (error) {
      console.error('Error al enviar email de verificación:', error);
      alert('Error al enviar el email de verificación');
      setIsSending(false);
    }
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
          <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
            <img src={`${getCookie('user_photo') ? getCookie('user_photo') : '/images/user/profile-photo.webp'}`} alt="User" />
          </div>
          <div className="order-3 xl:order-2">
            <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
              { getCookie('user_name') }
            </h4>
            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {
                  getCookie('user_email_verified_at') ? (
                    <span className="text-green-500 font-medium">
                      Tu cuenta fue verificada el {formatDate(getCookie('user_email_verified_at') || '')}
                    </span>

                  ) : (
                    <span className="text-red-500 font-medium">Usuario no verificado</span>
                  )
                }
              </p>
              <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ultima actualización: { formatDate(getCookie('user_updated_at') || '') }
              </p>
            </div>
          </div>
        </div>
        {
          !getCookie('user_email_verified_at') && (
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
  );
}
