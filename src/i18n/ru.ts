// src/i18n/ru.ts — Russian translations

import type { Translations } from "./types";

const ru: Translations = {
  // Autopilot
  "autopilot.clickToStop": "Автопилот ВКЛЮЧЁН — нажмите, чтобы остановить",
  "autopilot.ariaCancel": "Автопилот активен — нажмите, чтобы отменить",

  // Audio
  "audio.mute": "Без звука",
  "audio.unmute": "Включить звук",

  // Toolbar
  "toolbar.menu": "Меню",
  "toolbar.restart": "Начать заново",
  "toolbar.screenshot": "Снимок экрана",
  "toolbar.showSolve": "Показать решение этого вопроса",
  "toolbar.share": "Поделиться",
  "toolbar.comments": "Комментарии",
  "toolbar.addComment": "+ Добавить комментарий",
  "toolbar.showSquareSnip": "Показать инструмент квадратного фрагмента",
  "toolbar.hideSquareSnip": "Скрыть инструмент квадратного фрагмента",
  "toolbar.recordDemo": "Записать демо-видео",
  "toolbar.watchHowToPlay": "Посмотреть, как играть",

  // Level buttons
  "level.completePrev": "Сначала пройдите уровень {n}",

  // Session report modal
  "report.shareReport": "Поделиться отчётом",
  "report.creating": "Создание...",
  "report.nextLevel": "Следующий уровень",
  "report.playAgain": "Играть снова",
  "report.emailAria": "Отправить отчёт по email",
  "report.sendTitle": "Отправить отчёт по электронной почте",
  "report.enterEmail": "Введите адрес электронной почты",
  "report.emailPlaceholder": "parent@email.com",
  "report.levelComplete": "Уровень {level} пройден!",
  "report.subheading": "Монстр-раунд пройден!",
  "report.score": "Счёт",
  "report.accuracy": "Точность",
  "report.eggs": "Кроссовки",
  "report.sendSuccess": "Отчёт отправлен на {email}",
  "report.sendFail": "Не удалось отправить отчёт.",

  // Game
  "game.tapScreen": "Обведите круг! ({count}/{total})",
  "game.correct": "Правильно!",
  "game.wrongAnswer": "Неправильно! Ответ: {answer}",
  "game.levelComplete": "Уровень пройден!",
  "game.entryPrompt": "Какой ответ?",
  "game.tryOnYourOwn": "Попробуйте сами",
  "game.tapAnywhere": "Нажмите следующую контрольную точку!",

  // Rotate
  "rotate.heading": "Поверните устройство",
  "rotate.subtext": "Эта игра лучше работает в альбомном режиме",

  // Social
  "social.shareTitle": "Посмотрите эту математическую игру на Interactive Maths!",
  "social.commentsTitle": "Комментарии DiscussIt",
  "social.youtubePrompt": "В первый раз? Посмотрите видео о том, как играть.",
  "social.youtubeDismiss": "Больше не показывать",

  // PDF
  "pdf.title": "Perimeter Explorer",
  "pdf.sessionReport": "Отчёт о сессии (Уровень {n})",
  "pdf.gameDescription": "Периметр и метрические измерения",
  "pdf.objectiveLabel": "Цель:",
  "pdf.objectiveText": "Обводите внешние границы, складывайте длины сторон и решайте задачи на периметр.",
  "pdf.scoreLabel": "Счёт",
  "pdf.accuracyLabel": "Точность",
  "pdf.timeLabel": "Общее время",
  "pdf.questionLabel": "В{n}",
  "pdf.correct": "ПРАВИЛЬНО",
  "pdf.wrong": "НЕПРАВИЛЬНО",
  "pdf.givenAnswer": "Данный ответ: {value}",
  "pdf.correctAnswer": "Правильный ответ: {value}",
  "pdf.rippleCount": "{count} круг(ов)",
  "pdf.durationSeconds": "{seconds} с",
  "pdf.durationMinutesSeconds": "{minutes} мин {seconds} с",
  "pdf.encourage90": "Потрясающе! Ты чемпион по счёту!",
  "pdf.encourage70": "Отличная работа! Ты становишься всё лучше!",
  "pdf.encourage50": "Хорошая попытка! Продолжай тренироваться!",
  "pdf.encourageBelow": "Молодец! Каждая попытка делает тебя сильнее!",
  "pdf.tip": "Совет: В следующий раз считай внимательнее — не торопись!",
  "pdf.footer": "Создано SeeMaths - Perimeter Explorer",
  "pdf.footerUrl": "https://www.seemaths.com",

  // Email
  "email.subject": "Отчёт {gameName}",
  "email.greeting": "Здравствуйте,",
  "email.bodyIntro": "Игрок играл в {game} на SeeMaths в {time} {date} в течение {duration}. Результат: {score}, точность: {accuracy}.",
  "email.curriculumIntro": "Эта игра соответствует {stageLabel} по теме {curriculumCode} - {curriculumDescription}.",
  "email.regards": "С уважением,",
  "email.invalidEmail": "Введите корректный адрес электронной почты.",
  "email.missingPdf": "Вложение с отчётом отсутствует.",
  "email.notConfigured": "Почтовый сервис не настроен.",
  "email.sendFailed": "Не удалось отправить отчёт по email.",

  // Curriculum
  "curriculum.stageEarlyStage1": "Учебная программа NSW, этап 3",
  "curriculum.outcomeMae1wm": "MA3-GM-02 - измеряет длины и расстояния, включая периметры",

  // Language switcher
  "lang.label": "Язык",
  "lang.en": "English",
  "lang.zh": "中文",
  "lang.es": "Español",
  "lang.ru": "Русский",
  "lang.hi": "हिन्दी",
  "lang.other": "Другой...",
  "lang.translating": "Перевод...",
  "lang.translateFail": "Ошибка перевода.",
  "lang.promptTitle": "Перевести на другой язык",
  "lang.promptPlaceholder": "напр. Французский, Хинди, Арабский...",
  "lang.translate": "Перевести",
  "lang.cancel": "Отмена",
};

export default ru;
