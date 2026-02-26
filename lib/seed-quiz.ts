import type { Quiz, QuizQuestion, PointCategory, AnswerIndex } from "./quiz-types"
import { randomUUID } from "crypto"

interface SeedQuestion {
  text: string
  answers: [string, string, string, string]
  correctIndex: AnswerIndex
  points: PointCategory
  timeLimit?: number
}

const CYBERSECURITY_QUESTIONS: SeedQuestion[] = [
  // ===== ŁATWE (1 punkt) =====
  {
    text: "Co to jest phishing?",
    answers: [
      "Atak polegający na podszywaniu się pod zaufaną osobę/instytucję",
      "Rodzaj wirusa komputerowego",
      "Metoda szyfrowania danych",
      "Narzędzie do testowania sieci",
    ],
    correctIndex: 0,
    points: 1,
  },
  {
    text: "Co oznacza skrót VPN?",
    answers: [
      "Virtual Private Network",
      "Very Protected Network",
      "Virtual Public Node",
      "Verified Private Node",
    ],
    correctIndex: 0,
    points: 1,
  },
  {
    text: "Które z poniższych jest przykładem silnego hasła?",
    answers: [
      "password123",
      "Tr0b@dor&3#kLm!",
      "qwerty",
      "12345678",
    ],
    correctIndex: 1,
    points: 1,
  },
  {
    text: "Co oznacza ikona kłódki w przeglądarce?",
    answers: [
      "Strona używa HTTPS (szyfrowane połączenie)",
      "Strona jest w 100% bezpieczna",
      "Strona nie zbiera danych",
      "Strona wymaga logowania",
    ],
    correctIndex: 0,
    points: 1,
  },
  {
    text: "Co to jest malware?",
    answers: [
      "Rodzaj sprzętu komputerowego",
      "Złośliwe oprogramowanie",
      "System operacyjny",
      "Protokół sieciowy",
    ],
    correctIndex: 1,
    points: 1,
  },
  {
    text: "Co to jest firewall?",
    answers: [
      "Program antywirusowy",
      "Rodzaj procesora",
      "System kontrolujący ruch sieciowy",
      "Serwer pocztowy",
    ],
    correctIndex: 2,
    points: 1,
  },
  {
    text: "Co powinno się zrobić po otrzymaniu podejrzanego e-maila?",
    answers: [
      "Otworzyć załącznik, żeby sprawdzić",
      "Kliknąć link i zobaczyć, co się stanie",
      "Nie otwierać załączników i zgłosić jako spam",
      "Przesłać dalej do znajomych",
    ],
    correctIndex: 2,
    points: 1,
  },
  {
    text: "Co to jest uwierzytelnianie dwuskładnikowe (2FA)?",
    answers: [
      "Logowanie dwoma hasłami",
      "Weryfikacja tożsamości dwoma niezależnymi metodami",
      "Podwójne szyfrowanie danych",
      "Korzystanie z dwóch przeglądarek",
    ],
    correctIndex: 1,
    points: 1,
  },
  {
    text: "Która z poniższych czynności jest najlepsza do ochrony danych na telefonie?",
    answers: [
      "Brak blokady ekranu",
      "Używanie PIN-u lub biometrii do blokady",
      "Zapisywanie haseł w notatkach",
      "Łączenie się z każdą dostępną siecią Wi-Fi",
    ],
    correctIndex: 1,
    points: 1,
  },
  {
    text: "Co to jest ransomware?",
    answers: [
      "Program do tworzenia kopii zapasowych",
      "Oprogramowanie szyfrujące dane i żądające okupu",
      "Narzędzie do zarządzania hasłami",
      "Typ bezpiecznej przeglądarki",
    ],
    correctIndex: 1,
    points: 1,
  },

  // ===== ŚREDNIE (2 punkty) =====
  {
    text: "Co to jest atak DDoS?",
    answers: [
      "Atak polegający na zalewaniu serwera dużą liczbą zapytań",
      "Atak na bazę danych SQL",
      "Metoda łamania haseł",
      "Rodzaj inżynierii społecznej",
    ],
    correctIndex: 0,
    points: 2,
  },
  {
    text: "Co to jest SQL Injection?",
    answers: [
      "Dodawanie nowych tabel do bazy danych",
      "Wstrzykiwanie złośliwego kodu SQL przez dane wejściowe",
      "Metoda optymalizacji zapytań",
      "Tworzenie kopii zapasowej bazy danych",
    ],
    correctIndex: 1,
    points: 2,
  },
  {
    text: "Co to jest inżynieria społeczna (social engineering)?",
    answers: [
      "Tworzenie sieci społecznościowych",
      "Manipulacja ludźmi w celu uzyskania poufnych informacji",
      "Projektowanie interfejsów użytkownika",
      "Budowanie zespołów IT",
    ],
    correctIndex: 1,
    points: 2,
  },
  {
    text: "Co to jest atak man-in-the-middle (MitM)?",
    answers: [
      "Atak, w którym atakujący przechwytuje komunikację między dwiema stronami",
      "Atak z wewnątrz organizacji",
      "Atak na fizyczny serwer",
      "Atak polegający na zgadywaniu haseł",
    ],
    correctIndex: 0,
    points: 2,
  },
  {
    text: "Co to jest XSS (Cross-Site Scripting)?",
    answers: [
      "Metoda tworzenia stron internetowych",
      "Wstrzykiwanie złośliwego skryptu do stron webowych",
      "Protokół bezpiecznej komunikacji",
      "Narzędzie do debugowania kodu",
    ],
    correctIndex: 1,
    points: 2,
  },
  {
    text: "Co robi protokół TLS/SSL?",
    answers: [
      "Kompresuje dane w sieci",
      "Szyfruje komunikację między klientem a serwerem",
      "Blokuje niechciane reklamy",
      "Zarządza adresami IP",
    ],
    correctIndex: 1,
    points: 2,
  },
  {
    text: "Co to jest zero-day vulnerability?",
    answers: [
      "Luka odkryta i naprawiona tego samego dnia",
      "Luka bezpieczeństwa nieznana jeszcze producentowi oprogramowania",
      "Atak przeprowadzany o północy",
      "Wirusy aktywne tylko pierwszego dnia miesiąca",
    ],
    correctIndex: 1,
    points: 2,
  },
  {
    text: "Co to jest keylogger?",
    answers: [
      "Program do zarządzania kluczami szyfrowania",
      "Oprogramowanie rejestrujące naciśnięcia klawiszy",
      "Narzędzie do tworzenia skrótów klawiszowych",
      "System autoryzacji kluczem fizycznym",
    ],
    correctIndex: 1,
    points: 2,
  },
  {
    text: "Co to jest atak brute force?",
    answers: [
      "Atak fizyczny na infrastrukturę IT",
      "Systematyczne próbowanie wszystkich możliwych kombinacji haseł",
      "Atak wykorzystujący luki w oprogramowaniu",
      "Kradzież danych przez pracownika",
    ],
    correctIndex: 1,
    points: 2,
  },
  {
    text: "Co to jest sandbox w kontekście bezpieczeństwa?",
    answers: [
      "Gra komputerowa",
      "Piaskownica na placu zabaw",
      "Izolowane środowisko do bezpiecznego uruchamiania podejrzanego kodu",
      "Kopia zapasowa systemu",
    ],
    correctIndex: 2,
    points: 2,
  },
  {
    text: "Czym różni się szyfrowanie symetryczne od asymetrycznego?",
    answers: [
      "Symetryczne używa jednego klucza, asymetryczne dwóch (publiczny + prywatny)",
      "Symetryczne jest nowsze od asymetrycznego",
      "Symetryczne działa tylko w sieciach lokalnych",
      "Nie ma żadnej różnicy",
    ],
    correctIndex: 0,
    points: 2,
  },
  {
    text: "Co to jest honeypot?",
    answers: [
      "Rodzaj wirusa komputerowego",
      "Pułapka - celowo podatny system do przyciągania atakujących",
      "Narzędzie do monitorowania temperatury serwera",
      "Metoda kompresji danych",
    ],
    correctIndex: 1,
    points: 2,
  },

  // ===== TRUDNE (3 punkty) =====
  {
    text: "Co to jest atak supply chain w cyberbezpieczeństwie?",
    answers: [
      "Atak na fizyczny łańcuch dostaw produktów",
      "Kompromitacja dostawcy oprogramowania w celu dotarcia do jego klientów",
      "Blokowanie dostępu do sklepów internetowych",
      "Kradzież danych z magazynów",
    ],
    correctIndex: 1,
    points: 3,
  },
  {
    text: "Co to jest OWASP Top 10?",
    answers: [
      "Lista 10 najpopularniejszych systemów operacyjnych",
      "Ranking 10 najlepszych antywirusów",
      "Lista 10 najkrytyczniejszych zagrożeń bezpieczeństwa aplikacji webowych",
      "Top 10 firm cyberbezpieczeństwa",
    ],
    correctIndex: 2,
    points: 3,
  },
  {
    text: "Co to jest atak CSRF (Cross-Site Request Forgery)?",
    answers: [
      "Wymuszenie wykonania niechcianej akcji w aplikacji, w której użytkownik jest zalogowany",
      "Podrabianie certyfikatów SSL",
      "Tworzenie fałszywych stron logowania",
      "Przechwytywanie ruchu sieciowego",
    ],
    correctIndex: 0,
    points: 3,
  },
  {
    text: "Co to jest privilege escalation?",
    answers: [
      "Instalacja systemu operacyjnego",
      "Uzyskanie wyższych uprawnień w systemie niż te, do których jest się uprawnionym",
      "Awansowanie w hierarchii firmy",
      "Zwiększanie mocy obliczeniowej serwera",
    ],
    correctIndex: 1,
    points: 3,
  },
  {
    text: "Co to jest atak DNS Spoofing?",
    answers: [
      "Zmiana nazwy domeny w rejestrze",
      "Podmienianie odpowiedzi DNS, by przekierować ruch na fałszywy serwer",
      "Kupowanie domen podobnych do znanych stron",
      "Blokowanie dostępu do serwera DNS",
    ],
    correctIndex: 1,
    points: 3,
  },
  {
    text: "Co to jest princip least privilege?",
    answers: [
      "Każdy użytkownik powinien mieć uprawnienia root",
      "Systemy powinny mieć minimalny zestaw funkcji",
      "Użytkownik/proces powinien mieć tylko minimalne uprawnienia potrzebne do wykonania zadania",
      "Administratorzy powinni pracować na kontach gościnnych",
    ],
    correctIndex: 2,
    points: 3,
  },
  {
    text: "Co to jest atak side-channel?",
    answers: [
      "Atak wykorzystujący fizyczne właściwości systemu (czas, zużycie energii, dźwięk)",
      "Atak przez boczne drzwi budynku",
      "Atak na zapasowy kanał komunikacji",
      "Atak na media społecznościowe",
    ],
    correctIndex: 0,
    points: 3,
  },
  {
    text: "Co to jest SIEM (Security Information and Event Management)?",
    answers: [
      "Standard szyfrowania e-maili",
      "System zbierający i analizujący logi bezpieczeństwa z całej infrastruktury IT w czasie rzeczywistym",
      "Protokół bezpiecznej komunikacji",
      "Narzędzie do tworzenia polityk bezpieczeństwa",
    ],
    correctIndex: 1,
    points: 3,
  },
]

export function seedCybersecurityQuiz(): Quiz {
  return {
    id: "seed-cybersecurity-quiz",
    name: "Cyberbezpieczeństwo - Podstawy i Zagrożenia",
    description:
      "30 pytań z zakresu cyberbezpieczeństwa: od podstaw po zaawansowane zagrożenia. Idealne na szkolenie pracowników lub warsztaty edukacyjne.",
    questions: CYBERSECURITY_QUESTIONS.map((q, i) => ({
      id: `seed-q-${i + 1}`,
      text: q.text,
      answers: q.answers,
      correctIndex: q.correctIndex,
      points: q.points,
      timeLimit: q.timeLimit ?? 30,
    })),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}
