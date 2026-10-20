import type { DayHours, Exception } from '../../shared/rules.js';

// Isomórfico: se usa en el build y en el navegador (sin APIs de Node).

const TZ = 'America/Guatemala';
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export interface OpenStatus {
  open: boolean;
  label: string;
  /** Día de la semana actual en Guatemala, 0 = domingo. */
  todayIndex: number;
}

interface LocalNow { ymd: string; weekday: number; hhmm: string }

function localNow(now: Date): LocalNow {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(now).map((p) => [p.type, p.value]),
  );
  const ymd = `${parts.year}-${parts.month}-${parts.day}`;
  return { ymd, weekday: weekdayOf(ymd), hhmm: `${parts.hour}:${parts.minute}` };
}

function weekdayOf(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function hoursFor(ymd: string, horario: DayHours[], excepciones: Exception[]): { abre?: string; cierra?: string; exception?: Exception } {
  const exception = excepciones.find((e) => e.fecha === ymd);
  if (exception) return { abre: exception.abre, cierra: exception.cierra, exception };
  const day = horario.find((h) => h.dia === weekdayOf(ymd));
  return { abre: day?.abre, cierra: day?.cierra };
}

export function openStatus(now: Date, horario: DayHours[], excepciones: Exception[]): OpenStatus {
  const { ymd, weekday, hhmm } = localNow(now);
  const today = hoursFor(ymd, horario, excepciones);
  const base = { todayIndex: weekday };

  if (today.abre && today.cierra && hhmm >= today.abre && hhmm < today.cierra) {
    return { ...base, open: true, label: `Abierto ahora · cierra ${today.cierra}` };
  }
  if (today.exception && !today.abre && today.exception.nota) {
    return { ...base, open: false, label: `Cerrado hoy · ${today.exception.nota}` };
  }
  if (today.abre && hhmm < today.abre) {
    return { ...base, open: false, label: `Cerrado · abre hoy ${today.abre}` };
  }
  for (let d = 1; d <= 7; d++) {
    const day = addDays(ymd, d);
    const next = hoursFor(day, horario, excepciones);
    if (next.abre) {
      const when = d === 1 ? 'mañana' : `el ${WEEKDAYS[weekdayOf(day)]}`;
      return { ...base, open: false, label: `Cerrado · abre ${when} ${next.abre}` };
    }
  }
  return { ...base, open: false, label: 'Cerrado' };
}
