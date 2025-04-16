# 📦 json-to-interface

**`json-to-interface`** is a simple CLI tool that lets you generate TypeScript interfaces directly from a JSON payload. It’s perfect for quickly scaffolding data contracts for your frontend or backend project.

## ✨ Features

- 🧠 Infers types from JSON structure  
- 📁 Outputs `.ts` files with clean, readable interfaces  
- 🏃‍♂️ No install required — run instantly with `npx`

---

## 🚀 Getting Started

### ✅ Requirements

- Node.js v14 or higher  
- Internet access (for `npx` to fetch the package)

---

## 🛠️ Usage

You can generate a TypeScript interface by piping or pasting your JSON payload when prompted.

### Run via CLI

```bash
npx json-to-interface
```

#### Then, follow the prompt:
- Create success and failure JSON payload
- Hit Enter and filled in mandatory input
- Done! Your interface will be generated and saved as a .ts file (e.g., Sample.contract.ts).