# ExplainHub
explainHub is a software solution that will help you better understand a project if you are new to it, clearly giving you a summary of what the project does.

##  Features (WIP)

- Analyze repository structure
- Extract key information from files
- Generate project summaries (coming soon)

##  Installation

```bash
git clone https://github.com/tadeolmd-ubu/ExplainHub.git
cd explainhub
npm install
```

##  Run the project

```bash
npm run dev
```

##  Health Check

Test if the server is running:

```bash
GET http://localhost:3000/health
```

Response:

```json
{
  "status": "ok"
}
```

##  Project Structure

```bash
src/
  modules/
    analyzer/
  utils/
  app.js
server.js
```

##  Tech Stack

- Node.js
- Express
- ES Modules

##  Current Status

This is the initial setup of the project. Core features are under development.

##  Contributing

Contributions are welcome. Feel free to open issues or submit pull requests.
