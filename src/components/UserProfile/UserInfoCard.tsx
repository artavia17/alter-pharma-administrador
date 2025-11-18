import { useEffect, useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { myAccount, updateMyAccount, getProfileImage } from "../../services/protected/my-account.services";
import { MyaccountErrorData, MyaccountSuccessData } from "../../types/services/protected/my-account.types";
import { getCookie, setCookieHelper } from "../../helper/cookieHelper";

export default function UserInfoCard() {
  const { isOpen, openModal, closeModal } = useModal();

  // User data
  const [photo, setPhoto] = useState<string>(getCookie('user_photo') || '');
  const [name, setName] = useState<string>(getCookie('user_name') || '');
  const [email, setEmail] = useState<string>(getCookie('user_email') || '');

  // Preview de la foto seleccionada
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Form fields
  const [formName, setFormName] = useState<string>('');
  const [formPassword, setFormPassword] = useState<string>('');
  const [formPasswordConfirm, setFormPasswordConfirm] = useState<string>('');

  // Loading and error states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<MyaccountErrorData>({});

  useEffect(() => {
    account();
  }, []);

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
        setEmail(user.email);
        setFormName(user.name);
      }
    } catch (error) {
      console.error("Error obteniendo usuario:", error);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const formData = new FormData();
      formData.append('name', formName);

      if (formPassword) {
        formData.append('password', formPassword);
        formData.append('password_confirmation', formPasswordConfirm);
      }

      if (photoFile) {
        formData.append('profile_image', photoFile);
      }

      const response = await updateMyAccount(formData);

      if (response.status === 200) {
        const user: MyaccountSuccessData = response.data as MyaccountSuccessData;

        // Actualizar el ciudad con los nuevos datos
        setName(user.name);
        setEmail(user.email);

        // Actualizar cookies
        setCookieHelper('user_name', user.name);
        setCookieHelper('user_email', user.email);
        if (user.profile_image) {
          setCookieHelper('user_photo', user.profile_image);
        }

        // Cargar la nueva imagen de perfil si existe
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

        // Limpiar el preview y archivo
        setPhotoPreview('');
        setPhotoFile(null);
        setFormPassword('');
        setFormPasswordConfirm('');

        // Emitir evento para notificar a otros componentes
        window.dispatchEvent(new CustomEvent('profileUpdated'));

        closeModal();
      } else if (response.status === 422) {
        // Manejar errores de validación
        const errorData = response.data as MyaccountErrorData;
        setErrors(errorData);
      }
    } catch (error: any) {
      console.error("Error actualizando usuario:", error);
      // Manejar errores de red o del servidor
      if (error?.response?.status === 422) {
        const errorData = error.response.data?.data as MyaccountErrorData;
        const errorMessage = error.response.data?.message;
        setErrors({
          ...errorData,
          message: errorMessage || 'Error de validación. Por favor revisa los campos.'
        });
      } else {
        setErrors({ message: 'Error al actualizar el perfil. Intenta de nuevo.' });
      }
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Información personal
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Nombre completo
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {name}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Correo electrónico
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {email}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openModal}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
        >
          <svg
            className="fill-current"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
              fill=""
            />
          </svg>
          Editar
        </button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Editar información personal
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Actualiza tus datos para mantener tu perfil al día.
            </p>
          </div>
          <form className="flex flex-col" onSubmit={handleSave}>
            <div className="custom-scrollbar border-t border-b border-gray-200 h-[450px] overflow-y-auto px-2 pb-4 pt-4">
              <div>
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Información Personal
                </h5>

                {errors.message && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                    {errors.message}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Nombre completo</Label>
                    <Input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name}</p>
                    )}
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Correo electrónico</Label>
                    <Input type="text" value={email} disabled/>
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Contraseña (Opcional)</Label>
                    <Input
                      type="password"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                    />
                    {errors.password && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password}</p>
                    )}
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Confirmar contraseña (Opcional)</Label>
                    <Input
                      type="password"
                      value={formPasswordConfirm}
                      onChange={(e) => setFormPasswordConfirm(e.target.value)}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Foto de perfil (Opcional)</Label>
                    <Input
                      type="file"
                      className="cursor-pointer"
                      accept="image/*"
                      onChange={handlePhotoChange}
                    />
                    {errors.profile_image && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.profile_image}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      La imagen no debe exceder 2MB
                    </p>
                  </div>
                  <div className="col-span-2 flex items-center justify-center">
                    <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
                      <img
                        src={`${photoPreview ? photoPreview : (photo ? photo : '/images/user/profile-photo.webp')}`}
                        alt="User"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" type="button" onClick={closeModal}>
                Cancelar
              </Button>
              <Button size="sm" type="submit" disabled={isLoading}>
                {isLoading ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
