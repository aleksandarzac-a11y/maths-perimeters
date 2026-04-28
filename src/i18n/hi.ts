// src/i18n/hi.ts — Hindi translations

import type { Translations } from "./types";

const hi: Translations = {
  // Autopilot
  "autopilot.clickToStop": "ऑटोपायलट चालू है — रोकने के लिए क्लिक करें",
  "autopilot.ariaCancel": "ऑटोपायलट सक्रिय है — रद्द करने के लिए क्लिक करें",

  // Audio
  "audio.mute": "म्यूट करें",
  "audio.unmute": "अनम्यूट करें",

  // Toolbar
  "toolbar.menu": "मेनू",
  "toolbar.restart": "फिर से शुरू करें",
  "toolbar.screenshot": "स्क्रीनशॉट",
  "toolbar.showSolve": "यह सवाल कैसे हल करें, दिखाएं",
  "toolbar.share": "शेयर करें",
  "toolbar.comments": "टिप्पणियाँ",
  "toolbar.addComment": "+ टिप्पणी जोड़ें",
  "toolbar.showSquareSnip": "स्क्वायर स्निप टूल दिखाएं",
  "toolbar.hideSquareSnip": "स्क्वायर स्निप टूल छिपाएं",
  "toolbar.recordDemo": "डेमो वीडियो रिकॉर्ड करें",
  "toolbar.watchHowToPlay": "कैसे खेलें देखें",

  // Level buttons
  "level.completePrev": "पहले स्तर {n} पूरा करें",

  // Session report modal
  "report.shareReport": "रिपोर्ट शेयर करें",
  "report.creating": "बन रही है...",
  "report.nextLevel": "अगला स्तर",
  "report.playAgain": "फिर खेलें",
  "report.emailAria": "ईमेल रिपोर्ट",
  "report.sendTitle": "ईमेल द्वारा रिपोर्ट भेजें",
  "report.enterEmail": "ईमेल पता दर्ज करें",
  "report.emailPlaceholder": "parent@email.com",
  "report.levelComplete": "स्तर {level} पूरा हुआ!",
  "report.subheading": "मॉन्स्टर राउंड जीत लिया!",
  "report.score": "स्कोर",
  "report.accuracy": "सटीकता",
  "report.eggs": "जूते",
  "report.sendSuccess": "रिपोर्ट {email} पर भेज दी गई",
  "report.sendFail": "रिपोर्ट भेजने में विफल।",

  // Game
  "game.tapScreen": "लैप ट्रेस करें! ({count}/{total})",
  "game.correct": "सही!",
  "game.wrongAnswer": "गलत! सही उत्तर था {answer}",
  "game.levelComplete": "स्तर पूरा हुआ!",
  "game.entryPrompt": "उत्तर क्या है?",
  "game.tryOnYourOwn": "खुद कोशिश करें",
  "game.tapAnywhere": "अगला चेकपॉइंट थपथपाएं!",

  // Rotate
  "rotate.heading": "डिवाइस घुमाएं",
  "rotate.subtext": "यह गेम लैंडस्केप मोड में सबसे अच्छा खेला जाता है",

  // Social
  "social.shareTitle": "Interactive Maths पर यह गणित का खेल देखें!",
  "social.commentsTitle": "DiscussIt टिप्पणियाँ",
  "social.youtubePrompt": "पहली बार खेल रहे हैं? कैसे खेलें, यह वीडियो देखें।",
  "social.youtubeDismiss": "दोबारा न दिखाएं",

  // PDF
  "pdf.title": "Perimeter Explorer",
  "pdf.sessionReport": "सत्र रिपोर्ट (स्तर {n})",
  "pdf.gameDescription": "परिमाप और मीट्रिक मापन",
  "pdf.objectiveLabel": "उद्देश्य:",
  "pdf.objectiveText": "बाहरी सीमाएं ट्रेस करें, भुजाओं की लंबाइयां जोड़ें, और परिमाप प्रश्न हल करें।",
  "pdf.scoreLabel": "स्कोर",
  "pdf.accuracyLabel": "सटीकता",
  "pdf.timeLabel": "कुल समय",
  "pdf.questionLabel": "प्र{n}",
  "pdf.correct": "सही",
  "pdf.wrong": "गलत",
  "pdf.givenAnswer": "दिया गया उत्तर: {value}",
  "pdf.correctAnswer": "सही उत्तर: {value}",
  "pdf.rippleCount": "{count} लहर(ें)",
  "pdf.durationSeconds": "{seconds}से",
  "pdf.durationMinutesSeconds": "{minutes}मि {seconds}से",
  "pdf.encourage90": "अद्भुत काम! आप गिनती के चैंपियन हैं!",
  "pdf.encourage70": "शानदार! आप बहुत अच्छे हो रहे हैं!",
  "pdf.encourage50": "अच्छी कोशिश! अभ्यास जारी रखें!",
  "pdf.encourageBelow": "हिम्मत रखें! हर कोशिश आपको मजबूत बनाती है!",
  "pdf.tip": "सुझाव: अगली बार धीरे-धीरे और ध्यान से गिनें!",
  "pdf.footer": "SeeMaths - Perimeter Explorer द्वारा बनाया गया",
  "pdf.footerUrl": "https://www.seemaths.com",

  // Email
  "email.subject": "{gameName} रिपोर्ट",
  "email.greeting": "नमस्ते,",
  "email.bodyIntro": "एक खिलाड़ी ने {date} को {time} पर SeeMaths पर {game} खेला, {duration} के लिए। उन्होंने {score} स्कोर किया और उनकी सटीकता {accuracy} रही।",
  "email.curriculumIntro": "यह गेम {stageLabel} के विषय {curriculumCode} - {curriculumDescription} के बराबर है।",
  "email.regards": "सादर,",
  "email.invalidEmail": "कृपया एक वैध ईमेल पता दर्ज करें।",
  "email.missingPdf": "रिपोर्ट अनुलग्नक गायब है।",
  "email.notConfigured": "ईमेल सेवा कॉन्फ़िगर नहीं है।",
  "email.sendFailed": "रिपोर्ट ईमेल नहीं भेजी जा सकी।",

  // Curriculum
  "curriculum.stageEarlyStage1": "NSW पाठ्यक्रम चरण 3",
  "curriculum.outcomeMae1wm": "MA3-GM-02 - परिमाप सहित लंबाइयों और दूरियों को मापता है",

  // Language switcher
  "lang.label": "भाषा",
  "lang.en": "English",
  "lang.zh": "中文",
  "lang.es": "Español",
  "lang.ru": "Русский",
  "lang.hi": "हिन्दी",
  "lang.other": "अन्य...",
  "lang.translating": "अनुवाद हो रहा है...",
  "lang.translateFail": "अनुवाद विफल।",
  "lang.promptTitle": "किसी अन्य भाषा में अनुवाद करें",
  "lang.promptPlaceholder": "जैसे फ्रेंच, अरबी, जापानी...",
  "lang.translate": "अनुवाद करें",
  "lang.cancel": "रद्द करें",
};

export default hi;
