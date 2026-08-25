# Говори «Клод»

Скролли-опрос из 13 экранов про то, что ИИ-ассистент Claude читается **«Клод»**, а не «Клауд».
Мемы, агитплакат, схема Шеннона и итоговый процент «клодности».

## Запуск

```bash
npm install
npm run dev      # http://localhost:5173
```

## Сборка

```bash
npm run build    # проверка типов + сборка в dist/
npm run preview  # локально раздать собранное
```

## Стек

Vite + TypeScript, без фреймворков. Вся разметка в `index.html`,
логика в `src/main.ts`, стили в `src/style.css`, картинки в `src/assets/`.

Подробности для разработки и агентов — в [CLAUDE.md](CLAUDE.md),
журнал работ — в [PROGRESS.md](PROGRESS.md).
