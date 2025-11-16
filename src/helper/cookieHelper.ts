const setCookieHelper = (name: string, text: string) => {
  const cookieName = `${name}`;
  const cookieValue = text;
  const expirationDate = new Date();
  expirationDate.setTime(expirationDate.getTime() + (3 * 24 * 60 * 60 * 1000));  // 3 días en milisegundos

  document.cookie = `${cookieName}=${cookieValue}; path=/; expires=${expirationDate.toUTCString()}; Secure; SameSite=Strict`;
}

const getCookie = (search: string) => {
  const name = `${search}=`;
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArr = decodedCookie.split(';');

  for (let i = 0; i < cookieArr.length; i++) {
    let c = cookieArr[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return null; // Si no se encuentra el token
}

const clearCookies = () => {
  const cookies = document.cookie.split(";");

  cookies.forEach(cookie => {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; Secure; SameSite=Strict`;
  });
};

export {
  setCookieHelper,
  getCookie,
  getCookie as getCookieHelper,
  clearCookies
}
