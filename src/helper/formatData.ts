function formatDate(fechaStr: string) {
    const meses = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];
    
    const [year, month, day] = fechaStr.split("-");
    return `${parseInt(day)} de ${meses[parseInt(month) - 1]} del ${year}`;
}

function formatHour(horaStr: string): string {
    const [hora, minutos] = horaStr.split(":"); // 'hora' puede cambiar, pero 'minutos' no
    let newHora = parseInt(hora);

    const periodo = newHora >= 12 ? "PM" : "AM";
    newHora = newHora % 12 || 12;

    return `${newHora}:${minutos} ${periodo}`;
}


const formatCurrentDate = () => {
    const now = new Date();

    // Extraer el año, mes, día, horas y minutos
    const year = now.getFullYear().toString().slice(-2); // Solo los dos últimos dígitos del año
    const month = now.getMonth() + 1; // Los meses comienzan en 0
    const day = now.getDate();
    let hours = now.getHours();
    let minutes: any = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    // Convertir a formato de 12 horas
    hours = hours % 12;
    hours = hours ? hours : 12; // El 0 de las 12AM se convierte en 12
    minutes = minutes < 10 ? '0' + minutes : minutes; // Asegurar que los minutos tengan dos dígitos

    // Construir el formato de la fecha
    return {
        fecha: `${day}/${month}/${year}`,
        hora: `${hours}:${minutes} ${ampm}`
    };
};

const formatCurrentDateV3 = () => {
    const now = new Date();

    // Extraer el año, mes, día, horas y minutos
    const year = now.getFullYear().toString().slice(-2); // Solo los dos últimos dígitos del año
    const month = now.getMonth() + 1; // Los meses comienzan en 0
    const day = now.getDate();
    let hours: any = now.getHours();
    let minutes: any = now.getMinutes();

    // Convertir a formato de 12 horas
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;

    // Construir el formato de la fecha
    return {
        fecha: `${year}-${month}-${day}`,
        hora: `${hours}:${minutes}:00`
    };
};

const formatDateV2 = (fechaISO: string) => {
  const [fecha] = fechaISO.split('T');
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
}


function toLocalISOString(date = new Date()) {
  const pad2 = (n: any) => String(n).padStart(2, '0');
  const pad3 = (n: any) => String(n).padStart(3, '0');

  // valores en *local* time
  const Y  = date.getFullYear();
  const M  = pad2(date.getMonth() + 1);
  const D  = pad2(date.getDate());
  const h  = pad2(date.getHours());
  const m  = pad2(date.getMinutes());
  const s  = pad2(date.getSeconds());
  const ms = pad3(date.getMilliseconds());

  // diferencia con UTC (en minutos), la invertimos y formateamos
  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const offH = pad2(Math.floor(Math.abs(offsetMin) / 60));
  const offM = pad2(Math.abs(offsetMin) % 60);

  return `${Y}-${M}-${D}T${h}:${m}:${s}.${ms}${sign}${offH}:${offM}`;
}


export {
    formatDate,
    formatHour,
    formatCurrentDate,
    formatDateV2,
    formatCurrentDateV3,
    toLocalISOString
}