# 🎁 Loteria Prezentów - Secret Santa Generator

Lekka, responsywna aplikacja do losowania prezentów na Święta z obsługą czarnej listy (kto nie może wylosować kogo), admin panelem i osobnymi linkami dla każdego uczestnika.

## Funkcje

✅ **Łatwe tworzenie loterii** - Podaj imiona uczestników i czarną listę  
✅ **Osobne linki dla każdego** - Każdy uczestnik dostaje unikalny link  
✅ **Admin panel** - Pełny podgląd wyników i statystyk  
✅ **Czarna lista** - Określ, kto nie może wylosować kogo (np. rodzice nie losują się nawzajem)  
✅ **Zapobieganie duplikatom** - Każda osoba może wylosować tylko raz  
✅ **Trwały zapis** - Wyniki są zapisywane w plikach JSON  
✅ **Responsywny design** - Działa na komórkach i desktopach  
✅ **Docker ready** - Gotowy do deployment'u

## Nowe funkcje v2

🆕 **Admin Panel** - Zarządzaj loterią, zobacz wszystkie wyniki w jednym miejscu  
🆕 **Personalne tokeny** - Każdy uczestnik ma bezpieczny link z tokenem  
🆕 **Zapis wyników** - Rezultaty zapisywane w plikach (przetrwają restart)  
🆕 **UX Po Wylosowaniu** - Zamiast "już wybrane", użytkownik widzi "kupujesz dla X"  
🆕 **Statystyka na żywo** - Admin widzi kto już wylosował  

## Jak zainstalować lokalnie

### Wymagania
- Node.js 18+
- npm

### Setup

```bash
# 1. Zainstaluj zależności
npm install

# 2. Uruchom serwer
npm start

# 3. Otwórz w przeglądarce
http://localhost:3000
```

## Jak używać

### Tworzenie loterii

1. Wejdź na stronę główną `http://localhost:3000`
2. Wpisz imiona uczestników (każde w nowej linii):
   ```
   Mama
   Tata
   Babcia
   Wujek
   Ciotka
   ```

3. (Opcjonalnie) Dodaj czarną listę - kto nie może wylosować kogo:
   ```
   Mama→Tata
   Tata→Mama
   Ciotka→Wujek
   Wujek→Ciotka
   ```

4. Kliknij "Utworz Loterię 🎲"

5. Otrzymasz:
   - **Link Administracyjny** - panel do śledzenia postępów
   - **Linki dla każdego uczestnika** - osobne linki do wysłania

### Dla Administratora

1. Otwórz link administracyjny (chronionym tokenem)
2. Widzisz:
   - 📊 Statystykę: ile osób już wylosowało
   - 👥 Wyniki: kto dla kogo kupuje prezent
   - 🔗 Linki: wszystkie linki do wysłania uczestnikom

### Dla Uczestnika

1. Otwórz link, który dostałeś od administratora
2. Kliknij "Pokaż Mi Mój Prezent 🎲"
3. Dowiedz się, komu kupujesz prezent 🎁
4. Po wylosowaniu zawsze widzi wynik

## Format czarnej listy

Czarna lista powinna być w formacie: `Osoba1→Osoba2`

Oznacza to, że Osoba1 **nie może wylosować** Osoby2.

Przykłady:
- `Mama→Tata` - Mama nie wylosuje Taty
- `Ciotka→Wujek` - Ciotka nie wylosuje Wujka

> Obsługujemy dwukierunkową czarną listę! Jeśli chcesz, żeby rodzice nie losowali się nawzajem, dodaj obie linijki:
> ```
> Mama→Tata
> Tata→Mama
> ```

## Struktura plików

```
gift-lottery/
├── server.js              # Backend Express + logika losowania
├── package.json           # Zależności
├── public/
│   └── index.html        # Frontend SPA (single page app)
├── data/                 # Folder z zapisanymi loteriami (JSON)
├── Dockerfile            # Gotowy do dockeryzacji
├── docker-compose.yml    # Docker orchestration
├── README.md             # Dokumentacja
└── .gitignore            # Git config
```

## Deployment na Dockerze

```bash
# 1. Zbuduj image
docker build -t gift-lottery .

# 2. Uruchom kontener
docker run -p 3000:3000 gift-lottery

# 3. Otwórz w przeglądarce
http://localhost:3000
```

## Deployment na produkcji

### Heroku / Railway / Render

```bash
# Wystarczy push do repozytorium
git push heroku main
```

### Docker Hub

```bash
# Zaloguj się do Docker Hub
docker login

# Zbuduj i wyślij image
docker build -t your-username/gift-lottery .
docker push your-username/gift-lottery

# Pobranie i uruchomienie
docker pull your-username/gift-lottery
docker run -p 3000:3000 your-username/gift-lottery
```

## API Endpoints

### POST `/api/lottery`
Tworzy nową loterię

**Request:**
```json
{
  "participants": ["Mama", "Tata", "Babcia"],
  "blacklist": ["Mama→Tata", "Tata→Mama"]
}
```

**Response:**
```json
{
  "lotteryId": "abc123",
  "adminToken": "token_1234...",
  "adminLink": "http://localhost:3000/admin/abc123?token=token_1234...",
  "participantLinks": [
    {
      "name": "Mama",
      "link": "http://localhost:3000/reveal?lotteryId=abc123&token=..."
    }
  ]
}
```

### GET `/api/lottery/:id/admin?token=TOKEN`
Pobiera panel administracyjny (wymaga token)

**Response:**
```json
{
  "id": "abc123",
  "participants": ["Mama", "Tata", "Babcia"],
  "results": [
    {
      "name": "Mama",
      "receiver": "Babcia",
      "revealed": true,
      "revealedAt": "2026-11-25T21:30:00Z"
    }
  ]
}
```

### GET `/api/lottery/:id/participant/:token`
Pobiera info o uczestnik (przed/po wylosowaniu)

**Response:**
```json
{
  "name": "Mama",
  "already_revealed": true,
  "receiver": "Babcia",
  "totalParticipants": 3,
  "participantsRevealed": 1
}
```

### POST `/api/lottery/:id/reveal`
Ujawnia prezent dla uczestnika

**Request:**
```json
{
  "token": "participant_token_1234..."
}
```

**Response:**
```json
{
  "giver": "Mama",
  "receiver": "Babcia",
  "remaining": 2
}
```

## Technologia

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Storage**: JSON files (data/)
- **Deployment**: Docker

## Licencja

MIT

## Pomysły na ulepszenia

- 📧 Wysyłanie linków mailami
- 💾 Baza danych (MongoDB/PostgreSQL) zamiast JSON
- 🎨 Więcej tematów i efektów
- 🌍 Więcej języków
- 👥 Zarządzanie wieloma loteriami jednocześnie
- 📊 Eksport wyników do PDF/Excel

Zabawy! 🎉

