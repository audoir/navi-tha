## Project Setup

- Setup NextJS
```bash
npm i
```

- Setup Python Backend
```bash
cd python-backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

- Setup Environment Variables

In .env.local, add the following:
```bash
OPENAI_API_KEY=<key>
ANTHROPIC_API_KEY=<key>
```

## Running Development Servers

- NextJS
```bash
npm run dev
```

- Python Flask
```bash
cd python-backend
flask run
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

# File Description

- src/app/page.tsx: The frontend as a React single page app
- src/app/api/chat/route.ts: The backend as a NextJS API route
- python-backend/app.py: The backend as a Python Flask API route
