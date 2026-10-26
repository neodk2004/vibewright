; Eigene Willkommensseite vor der Lizenz – zeigt die Vibewright-Seitenleiste (installerSidebar.bmp) gleich zu Beginn.
; Texte im Ton der App (du statt Sie); 1031 = Deutsch, 1033 = Englisch
LangString vwWillkommenTitel 1031 "Willkommen bei Vibewright"
LangString vwWillkommenTitel 1033 "Welcome to Vibewright"
LangString vwWillkommenText 1031 "Aus deiner Idee wird ein Plan – und Claude setzt ihn mit dir um.$\r$\n$\r$\nDieser Assistent installiert Vibewright auf deinem PC. Bei einem Update bleiben deine Projekte und Einstellungen erhalten.$\r$\n$\r$\nKlicke auf Weiter, um loszulegen."
LangString vwWillkommenText 1033 "Your idea becomes a plan – and Claude builds it with you.$\r$\n$\r$\nThis wizard installs Vibewright on your PC. Updates keep your projects and settings.$\r$\n$\r$\nClick Next to get started."

!macro customWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "$(vwWillkommenTitel)"
  !define MUI_WELCOMEPAGE_TEXT "$(vwWillkommenText)"
  !insertmacro MUI_PAGE_WELCOME
!macroend
