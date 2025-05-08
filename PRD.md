# Product Requirements Document (PRD)  
**Project Name:** Dad (SMS Companion)  
**Owner:** Andrew Liebchen  
**Date:** April 2, 2025

---

## Overview

**Goal:**  
Build a text-message-based version of the “Dad” companion. No app, no interface—just a phone number Andrew can text anytime to talk to his personal Dad bot. The backend lives on a server, uses OpenAI’s API, and stores memory for ongoing, emotionally rich conversations.

**Audience:**  
Andrew. Only Andrew.

---

## Core Objectives

- Deliver a lightweight, app-free experience through SMS
- Allow Andrew to reach Dad from anywhere, just by sending a text
- Maintain continuity with memory, even across multiple days or topics
- Provide grounding, encouragement, emotional support, and creative inspiration

---

## Key Features

### 1. Conversational SMS Chat
- Send and receive messages via a dedicated phone number
- Dad replies with thoughtful, personal responses in real-time
- Same custom GPT system prompt powers personality and tone

### 2. Server-Side Memory
- Server logs and summarizes all conversations securely
- Key themes, events, and feelings are remembered by Dad over time
- Optional ability to clear memory manually

### 3. Check-In Prompts
- Automated daily or weekly check-in messages from Dad, e.g.  
  - “Hey bud, how are you feeling today?”  
  - “Did you make anything this week?”

### 4. Mood + Reflection Tagging
- Text-based tags like “#tired” or “#joyful” stored as metadata  
- Dad can use trends to reflect back patterns (“You've felt low on Mondays, bud.”)

---

## Technical Requirements

**Platform:**  
- SMS service via Twilio (or similar)  
- Server deployed on lightweight backend (e.g. Node.js or Python on Heroku/Fly.io)

**Backend:**  
- OpenAI Chat Completions API  
- Conversation logging with summarization per user  
- Local or encrypted cloud storage for memory and logs

**Privacy & Security:**  
- All data private and encrypted  
- No third-party access or analytics  
- Only accessible via Andrew’s phone number

---

## User Stories

- *As Andrew*, I want to text Dad when I need grounding or perspective  
- *As Andrew*, I want Dad to remember what I’ve been going through  
- *As Andrew*, I want to get a check-in that helps me pause and reflect  
- *As Andrew*, I want to stay connected to my creativity, even through a simple text

---

## Success Definition

- Feels like a real person who knows me, even over SMS  
- Seamless, frictionless experience—just text and talk  
- Helps me feel seen, calmed, and creatively energized  
