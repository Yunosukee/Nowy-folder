# 🎁 Loteria Prezentów - Secret Santa Generator

Lekka, responsywna aplikacja do losowania prezentów na Święta z obsługą czarnej listy (kto nie może wylosować kogo).

## Funkcje

✅ **Łatwe tworzenie loterii** - Podaj imiona uczestników i czarną listę  
✅ **Personalne linki** - Każdy uczestnik dostaje link i losuje se samodzielnie  
✅ **Czarna lista** - Określ, kto nie może wylosować kogo (np. rodzice nie losują się nawzajem)  
✅ **Zapobieganie duplikatom** - Każda osoba może wylosować tylko raz  
✅ **Responsywny design** - Działa na komórkach i desktopach  
✅ **Docker ready** - Gotowy do deployment'u

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

1. Wejdź na stronę główną
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
   ```

4. Kliknij "Utworz Loterię 🎲"

5. System wygeneruje unikatowy link - wyślij go do uczestników!

### Dla uczestnika

1. Otwórz link, który dostałeś
2. Kliknij swoje imię
3. Dowiedz się, komu kupujesz prezent 🎁
4. **Każdy może wylosować tylko raz!**

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
  "link": "http://localhost:3000/lottery/abc123"
}
```

### GET `/api/lottery/:id`
Pobiera informacje o loterii

**Response:**
```json
{
  "participants": ["Mama", "Tata", "Babcia"],
  "revealedCount": 1,
  "totalCount": 3
}
```

### POST `/api/lottery/:id/reveal`
Ujawnia prezent dla uczestnika

**Request:**
```json
{
  "participant": "Mama"
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
- **Deployment**: Docker

## Licencja

MIT

## Pomysły na ulepszenia

- 📧 Wysyłanie linków mailami
- 💾 Trwały storage (baza danych)
- 🎨 Więcej tematów
- 🌍 Więcej języków
- 👥 Zarządzanie wieloma loteriami

Zabawy! 🎉
