import { useEffect } from "react";

const useTitle = (title: string) => {
  useEffect(() => {
    const appName = import.meta.env.VITE_APP_NAME;
    document.title = `${title} | ${appName}`;
  }, [title]);
};

export default useTitle;
