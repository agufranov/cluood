import './style.css';
import { track } from './analytics';

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Элемент #${id} не найден`);
  return el as T;
};

const hudScore = $('hud-score');
const finalPct = $('final-pct');
const finalVerdict = $('final-verdict');
const finalSub = $('final-sub');
const panels = Array.from(document.querySelectorAll<HTMLElement>('[data-panel]'));
const total = document.querySelectorAll('[data-panel]:not([data-nostat])').length;

let answered = 0;
let good = 0;
let completeTracked = false;

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function pct(): number | null {
  return answered ? Math.round((good / answered) * 100) : null;
}

function updateHud(): void {
  const p = pct();
  hudScore.textContent = p === null ? '—' : `${p}%`;
  hudScore.classList.remove('pop');
  void hudScore.offsetWidth;
  hudScore.classList.add('pop');
  updateFinal();
}

function verdictFor(p: number | null): [pct: string, verdict: string, sub: string] {
  if (p === null) return ['—', 'Ответь хотя бы на один вопрос выше — и комиссия вынесет вердикт.', ''];
  const sub = `Отвечено: ${answered} из ${total} (первый экран не в счёт — там была подстава).`;
  if (p === 100) return [`${p}%`, 'Абсолютный Клод. Клод Элвудович гордится тобой.', `${sub} Иди и поправляй людей — у тебя мандат.`];
  if (p >= 70) return [`${p}%`, 'Уверенный клодист. Пара шумов в канале — спишем на помехи.', `${sub} Перечитай экран №11 и будет сто.`];
  if (p >= 40) return [`${p}%`, 'Канал ощутимо шумит. Шеннон хмурится, но верит в тебя.', `${sub} Начни с Ван Дамма — он убеждает быстро.`];
  return [`${p}%`, 'Клауд-бро обыкновенный. Хорошо, что ты досмотрел до конца.', `${sub} Пройди заново. Медленно. Вслух.`];
}

function updateFinal(): void {
  const [pctText, verdict, sub] = verdictFor(pct());
  finalPct.textContent = pctText;
  finalVerdict.textContent = verdict;
  finalSub.textContent = sub;
  if (answered === total && !completeTracked) {
    completeTracked = true;
    track({ name: 'quiz_complete', pct: pct() ?? 0, answered });
  }
}

function feedback(fbEl: HTMLElement, goodPick: boolean, mark: string, text: string): void {
  fbEl.innerHTML = `<span class="mark ${goodPick ? 'good' : 'bad'}"></span><span class="txt"></span>`;
  fbEl.querySelector('.mark')!.textContent = mark;
  fbEl.querySelector('.txt')!.textContent = text;
  revealFb(fbEl);
}

function revealFb(fbEl: HTMLElement): void {
  requestAnimationFrame(() => {
    fbEl.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  });
}

panels.forEach((panel, panelIndex) => {
  const buttons = Array.from(panel.querySelectorAll<HTMLButtonElement>('.answers button'));
  const fb = panel.querySelector<HTMLElement>('.fb');
  if (!fb) return;
  const isGag = panel.hasAttribute('data-gag');
  const noStat = panel.hasAttribute('data-nostat');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => { b.disabled = true; });
      btn.classList.add('chosen');
      const isGood = btn.dataset.good === '1';
      if (!noStat) {
        answered++;
        if (isGood) good++;
      }
      track({ name: 'answer', panel: panelIndex + 1, good: isGood, counted: !noStat });
      const mark = btn.dataset.mark ?? '';
      const text = btn.dataset.fb ?? '';
      if (isGag) {
        fb.innerHTML = '<span class="mark bad">НЕВЕРНО. Правильный ответ: «Клауд» ☁️</span>';
        revealFb(fb);
        setTimeout(() => {
          feedback(fb, isGood, mark, text);
          updateHud();
          if (!isGood) {
            setTimeout(() => resetAll('gag'), 3200);
          }
        }, 1600);
        return;
      }
      feedback(fb, isGood, mark, text);
      if (!noStat) updateHud();
    });
  });
});

function resetAll(source: 'retry' | 'gag'): void {
  answered = 0;
  good = 0;
  completeTracked = false;
  panels.forEach((panel) => {
    panel.querySelectorAll<HTMLButtonElement>('.answers button').forEach((b) => {
      b.disabled = false;
      b.classList.remove('chosen');
    });
    const fb = panel.querySelector<HTMLElement>('.fb');
    if (fb) fb.innerHTML = '';
  });
  hudScore.textContent = '—';
  updateFinal();
  track({ name: 'quiz_reset', source });
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
}

$('btn-retry').addEventListener('click', () => resetAll('retry'));

const btnNext = $('btn-next');
const allPanels = Array.from(document.querySelectorAll<HTMLElement>('.panel'));
btnNext.addEventListener('click', () => {
  const next = allPanels.find((p) => p.getBoundingClientRect().top > 70);
  next?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
});

if ('IntersectionObserver' in window) {
  const finalIo = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      btnNext.classList.toggle('hidden', e.isIntersecting);
    });
  }, { threshold: 0.4 });
  finalIo.observe($('final'));
}

if ('IntersectionObserver' in window && !reduce) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add('in');
    });
  }, { threshold: 0.25 });
  allPanels.forEach((p) => io.observe(p));
} else {
  allPanels.forEach((p) => p.classList.add('in'));
}
