
# ⏳ ChronoPortal

**ChronoPortal** is a high-fidelity "Pseudo-AR" experience that transforms the world around a vintage wristwatch into its original era. By utilizing the **Google Gemini API**, it identifies artifacts with forensic precision and generates immersive, context-aware visual transmutations.

## 🚀 Key Features

- **Artifact Identification**: Uses Gemini 3 Flash to forensicly identify watch models, release years, and historical contexts.
- **Era Transmutation**: Generates AI-edited images that replace the user's clothing and environment with period-accurate aesthetics while preserving the hand and watch.
- **Market Intel**: Real-time investment analysis and price tracking for horological collectors.

## 🛠️ Technical Stack

- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS
- **AI Engine**: 
  - `gemini-3-flash-preview` (Reasoning & Vision)
  - `gemini-2.5-flash-image` (Generative Editing)
- **Deployment**: Vite-ready for Vercel, Netlify, or GitHub Pages.

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/chronoportal.git
   cd chronoportal
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure API Key**:
   Create a `.env` file in the root and add your Gemini API Key:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

## 📜 License
MIT License - Developed with ❤️ using Google Gemini.
