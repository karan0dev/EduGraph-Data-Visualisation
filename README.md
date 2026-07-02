# 🎓 EduGraph —  Records Analytics Portal

EduGraph is a premium, state-of-the-art EdTech SaaS welcome landing page and interactive analytics workspace. Designed for educators, it transforms raw student records into beautiful, high-fidelity visual insights, aiding in academic tracking, performance predictions, and attendance monitoring.

---

## ✨ Features

### 💎 Premium Welcome Portal
* **Glassmorphic UI**: Sleek, modern aesthetics using curated gradients, hardware-accelerated drop-shadow title text, soft background blur blobs (`blur(120px)`), and floating dynamic sparkles.
* **Mac OS Window Mockup**: A beautifully styled center-piece dashboard mockup with address bars, window controls, and interactive charts.
* **Balanced 3D Characters**: Symmetrical positioning of transparent boy and girl student characters resting on the card edge with responsive size scales.
* **Getting Started Wizard**: A 3-step workflow replacing traditional mock statistics, offering direct CSV template downloads and live spreadsheet uploading.

### 📊 Interactive Analytics Hub
* **CSV Data Parser**: Fully functional client-side CSV importer. Educators can upload structured spreadsheet data, map headers dynamically, and populate the dashboard in real-time.
* **Overview KPI Cards**: Instantly recalculates class averages, median GPA, registered student counts, and "At-Risk" ratios.
* **Visual Data Analytics**:
  * *Academic Progression*: Chart.js multi-term trend graphs.
  * *Subject Strengths*: Competency radar charts covering Math, Science, English, History, and Art.
  * *Attendance Scatter Plots*: Correlation graphs highlighting links between attendance levels and grades.
  * *Grade Breakdowns*: Clean grade distribution charts.
* **Student Directory Database**: Search, sort, filter, and page student tables, complete with single-student profile modals showing radar gauges and personalized teacher comments.
* **Local Storage Integration**: Secure, client-side data persistence with zero external server dependencies.

---

## 📁 File Structure

* **`index.html`**: Contains the full markup for both the welcome landing page, interactive mockup, workspace aside panel, and directory filters.
* **`style.css`**: Manages all glassmorphic tokens, CSS grid layouts, animations (`floatCard`, `pulseSparkle`), and viewport styling for laptops.
* **`app.js`**: Core controller containing the CSV reader, Chart.js update cycles, data recalculations, directory table pagination, and navigation animations.
* **`boy_character.png`** / **`girl_character.png`**: Transparent character graphics framing the welcome interface.

---

## 🚀 Getting Started

1. **Launch the Portal**: Open the main [index.html](file:///c:/Users/cgc/Documents/PROJECT/index.html) file directly in any modern browser.
2. **Download the Template**: Under **Step 1** on the landing page, click **Download CSV** to grab the structured template spreadsheet.
3. **Upload Student Sheet**: Edit the template with your own student names and scores, and click **Import File** under **Step 2**.
4. **Explore the Workspace**: The portal will load your class metrics and transition you straight to the active dashboard directory.

---

## 🛠️ CSV Format Template

To ensure seamless importing, align your CSV spreadsheet columns with the following headers:
```csv
Full Name, Grade Level, Attendance (%), Math Score, Science Score, English Score, History Score, Fine Arts Score
Alexander Davis, 9, 92, 85, 88, 76, 80, 90
Sophia Martinez, 10, 64, 45, 52, 68, 60, 72
```

---

## 🔒 Security & Privacy

EduGraph is **fully serverless**. All student scores, GPAs, and files uploaded are processed locally in your browser memory and cached in `localStorage`. No data is ever transmitted to external servers.
