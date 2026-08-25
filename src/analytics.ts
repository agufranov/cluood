// Заглушка под будущую аналитику. Когда прикрутим провайдера
// (Метрика / GA / Plausible…), реализация меняется только здесь —
// точки вызова по коду уже расставлены.

export type AnalyticsEvent =
  | { name: 'answer'; panel: number; good: boolean; counted: boolean }
  | { name: 'quiz_reset'; source: 'retry' | 'gag' }
  | { name: 'quiz_complete'; pct: number; answered: number };

export function track(event: AnalyticsEvent): void {
  if (import.meta.env.DEV) {
    console.debug('[analytics]', event);
  }
}
