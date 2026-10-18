# 🌿 NammaTrip AI — Your Karnataka Travel Companion

### ಕನ್ನಡದಲ್ಲಿ ನಿಮ್ಮ ಕರ್ನಾಟಕ ಪ್ರವಾಸದ ಸಂಗಾತಿ

**Tagline:** Your Budget. Your Journey. Your Karnataka. ❤️


🔗 Live demo:http://smiling-coder.github.io/NammaTripAI/

NammaTrip AI is a Karnataka-focused travel-planning web application designed to help travelers discover destinations and create personalized itineraries based on their budget, travel duration, interests, and language preference.

Built for the **Kannada Digital Innovation Hackathon 2026**, organized by HackerRank Campus Crew and The National Institute of Engineering (NIE), Mysuru.

---

## 📌 Problem Statement

Travelers often need to consult multiple sources to research destinations, estimate travel expenses, and organize their itineraries.

Language barriers can also make travel information less accessible to people who prefer Kannada.

NammaTrip AI aims to simplify this process through a user-friendly, bilingual travel-planning experience focused on Karnataka.

## 💡 Our Solution

NammaTrip AI combines destination recommendations, itinerary generation, budget estimation, and Kannada-language accessibility in one web application.

Users can enter their travel preferences and receive a suggested itinerary to help them begin planning their Karnataka journey.

## ✨ Key Features

- 🌐 **Kannada and English:** Switch between the two interface languages.
- 🧭 **Personalized Travel Planning:** Select a starting city, trip duration, budget, and interests.
- 💰 **Budget Estimation:** View estimated expenses for transport, accommodation, food, and activities.
- 🗓️ **Day-by-Day Itinerary:** Explore suggested activities organized by day.
- 🏛️ **Destination Discovery:** Explore Karnataka destinations such as Mysuru, Hampi, Coorg, and Jog Falls.
- 🗺️ **Map Integration:** Open destination searches in Google Maps.
- 📱 **Responsive Design:** Use the application on desktop and mobile screens.
- 🎨 **Interactive Interface:** Enjoy a Karnataka-inspired design and interactive planning experience.

## 🎯 Target Users

- Tourists exploring Karnataka for the first time.
- Kannada-speaking travelers.
- Students and budget-conscious travelers.
- Families planning short trips.
- Travelers interested in Karnataka's heritage, nature, food, and culture.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Website structure |
| CSS3 | Styling, layout, responsiveness, and animations |
| JavaScript | User interactions, recommendations, and budget calculations |
| Curated destination data | Destination information and itinerary suggestions |
| GitHub | Version control and source-code hosting |
| GitHub Pages | Static website deployment |

## ⚙️ How It Works

1. Open the NammaTrip AI website.
2. Select your starting city.
3. Choose the number of travel days.
4. Enter your total travel budget.
5. Select the number of travelers.
6. Choose your interests, such as heritage, nature, local food, adventure, or culture.
7. Generate your suggested itinerary.
8. Review the estimated expenses and daily activities.
9. Open destination map links to explore locations.
10. Switch between Kannada and English as needed.

## 🧠 Recommendation Approach

The initial prototype uses a rule-based recommendation engine implemented in JavaScript.

It compares the user's selected interests with destination categories and applies budget-related selection rules to generate a suggested itinerary.

**Important:** The current rule-based engine does not itself constitute a generative AI model. Integration with a real AI service is a potential future enhancement, not a feature to claim unless it has been implemented.

## 💰 Budget Estimation

The application displays illustrative estimates for:

- Transportation
- Accommodation
- Food
- Activities

These values are intended to help users begin planning.

The current prototype does not retrieve live transportation prices, hotel rates, ticket prices, traffic conditions, or booking availability.

Travelers should verify actual costs and travel information before departure.

## 🏛️ Destinations

The prototype includes suggestions related to destinations such as:

- Mysuru
- Coorg / Kodagu
- Hampi
- Jog Falls
- Belur and Halebidu
- Gokarna
- Badami
- Mangaluru

Destination recommendations depend on the current curated dataset and selection rules.

## 🚀 Getting Started

### Prerequisites

- A modern web browser.
- A code editor such as Visual Studio Code.
- GitHub access if you want to publish the project.

No API key or backend server is required to run the current static prototype.

### Installation

**Step 1: Clone the repository**

https://github.com/smiling-coder

```bash
git clone https://github.com/smiling-coder/NammaTrip-AI.git
```

**Step 2: Open the project folder**

```bash
cd NammaTrip-AI
```

**Step 3: Open the folder in Visual Studio Code**

```bash
code .
```

If the `code` command is unavailable, open VS Code manually and select:

`File → Open Folder → NammaTrip-AI`

**Step 4: Run the application**

Open `index.html` in your browser.

Alternatively, use the Live Server extension in VS Code.

## 📁 Project Structure

```text
NammaTrip-AI/
│
├── index.html
├── style.css
├── script.js
└── README.md
```

| File | Description |
|---|---|
| `index.html` | Main webpage and trip-planning form |
| `style.css` | Visual design and responsive layout |
| `script.js` | Language switching, recommendations, and estimates |
| `README.md` | Project documentation |

## 🌍 Deployment

The application can be deployed using GitHub Pages.

1. Push the project files to a public GitHub repository.
2. Open the repository's **Settings**.
3. Select **Pages**.
4. Choose **Deploy from a branch**.
5. Select the `main` branch and the root folder (`/`).
6. Save the configuration.
7. Wait for GitHub Pages to publish the website.
8. Open and test the deployed URL.

## 🧪 Testing

Before submitting the project, test the following:

- Language switching between Kannada and English.
- Trip generation with different interests.
- Different budgets and trip durations.
- Different numbers of travelers.
- Empty interest selections.
- Very low budget values.
- Day-by-day itinerary generation.
- Destination map links.
- Mobile and desktop layouts.
- Browser console errors.
- Live website access.

## 🔮 Future Enhancements

Potential improvements include:

- Secure integration with an AI model for natural-language trip planning.
- More extensive, verified Karnataka destination data.
- Improved route and travel-time optimization.
- Seasonal travel recommendations.
- Better budget-aware destination selection.
- Accessibility preferences.
- Weather information from a reliable service.
- Verified transport and accommodation data.
- More detailed Kannada descriptions and local travel phrases.
- User feedback and itinerary refinement.

These are proposed improvements, not necessarily features of the current version.

## 🌱 Social Impact

NammaTrip AI aims to make Karnataka tourism easier to explore while promoting Kannada-language accessibility and awareness of the state's cultural and natural heritage.

The project encourages travelers to discover local destinations, respect cultural practices, and travel responsibly.

🔗 Live demo:http://smiling-coder.github.io/NammaTripAI/

## 👩‍💻 Developer

**GitHub:** [smiling-coder](https://github.com/smiling-coder)

Developed as an individual student project for the Kannada Digital Innovation Hackathon 2026.

## 🏆 Hackathon

**Event:** Kannada Digital Innovation Hackathon 2026

**Organizers:** HackerRank Campus Crew and The National Institute of Engineering (NIE), Mysuru

**Theme:** Code. Create. Celebrate Kannada.

**Project:** NammaTrip AI — AI Travel Planner for Karnataka

## 📜 Disclaimer

NammaTrip AI is a hackathon prototype intended to assist with initial travel planning.

Destination information, itineraries, and cost estimates may be incomplete or inaccurate. They should not be treated as live prices, confirmed bookings, or official travel advice.

Always verify current travel conditions, opening hours, entry requirements, costs, and safety information using reliable sources.

---

**Made with ❤️ for Karnataka.**

**ಕನ್ನಡ • ಸಂಸ್ಕೃತಿ • ಪ್ರವಾಸ • ತಂತ್ರಜ್ಞಾನ**
