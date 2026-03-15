# VeritasMail
# 🛡️ VeritasMail: Advanced Phishing Detection & Forensic Analysis

**VeritasMail** is a modern, Manifest V3 browser extension designed to empower users against sophisticated email-based threats. By securely parsing webmail content in real-time, it acts as a proactive defense layer that not only detects phishing attempts but also educates the user.

Unlike standard spam filters that operate as a "black box," VeritasMail provides transparent, comprehensive forensic reports and actionable security advice directly within the browser.

## ✨ Core Features

* **🎣 Real-Time Phishing Detection:** Securely extracts and analyzes email content (headers, subject, body, and links) directly from the webmail DOM.
* **📊 Forensic Threat Reports:** Generates an easy-to-read dashboard detailing the threat level, specific "red flags" (e.g., sense of urgency, spoofed domains), and malicious intent.
* **🛡️ Proactive Security Education:** Doesn't just block the threat—it teaches the user. Provides tailored advice based on the specific attack vector detected to help users build long-term security habits.
* **⚡ Modern & Secure Architecture:** Built entirely on **Manifest V3**. Utilizes isolated content scripts for DOM reading and secure service workers (`background.js`) for API communications, ensuring user privacy and strict CORS compliance.

## ⚙️ How It Works under the Hood

1.  **Extract:** A secure content script reads the currently opened email without storing sensitive data locally.
2.  **Analyze:** The data is passed to the background service worker, which securely communicates with our threat-analysis engine/API.
3.  **Report:** The extension's popup UI renders the forensic analysis, breaking down the anatomy of the phishing attempt for the user.
