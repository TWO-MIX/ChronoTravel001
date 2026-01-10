
# PRD: ChronoPortal - Time-Shift Watch AR

## 1. Vision
ChronoPortal is an immersive "Pseudo-AR" experience that uses an antique wristwatch as a physical key to unlock a visual representation of its historical era. By scanning a vintage watch, the app transforms the user's wrist (clothing) and their immediate environment (background) into a contextually accurate scene from the year the watch was released.

## 2. User Stories
- **As a vintage watch collector**, I want to see what my Casio Databank looked like on the wrist of a 1980s salaryman in Tokyo.
- **As a fashion enthusiast**, I want to explore historical aesthetics triggered by physical artifacts I own.
- **As a casual user**, I want a magical "time-travel" experience that feels seamless and high-quality.

## 3. Feature Breakdown

### Section 1: Artifact Identification (Computer Vision)
- **Objective:** Recognize the specific brand and model of the watch from a single frame.
- **Requirements:**
  - High-accuracy identification using Gemini 3 Flash.
  - Extraction of "Metadata": Brand, Model, Release Year.
  - Historical reasoning: Generating a vivid description of the "era's atmosphere."

### Section 2: Era Synthesis (Generative AI)
- **Objective:** Generate a "portal" view where the user's reality is altered.
- **Requirements:**
  - Gemini 2.5 Flash Image model for intelligent image-to-image transformation.
  - "Hand Preservation": The user's actual hand and watch must remain central, while the surroundings change.
  - "Stylistic Synthesis": Clothing must match the watch's intended demographic (e.g., diver suits for Seamasters, suits for Databanks).

### Section 3: Contextual Education
- **Objective:** Provide depth to the visual experience.
- **Requirements:**
  - A "History Card" explaining why the background and clothes were chosen.
  - Fun facts about the horological significance of the specific timepiece.

### Section 4: UX & Aesthetics
- **Objective:** A "Cyber-Historical" UI that feels like using high-tech equipment.
- **Requirements:**
  - Minimalist camera HUD with scanning animations.
  - Glassmorphism UI elements.
  - Seamless transitions between "Scanning" and "Transformed" states.

## 4. Technical Constraints
- Must run in mobile browser (React/Tailwind).
- Relies on API availability for Gemini.
- Requires camera permissions.
