import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("expenses.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    balance REAL DEFAULT 0,
    monthly_limit REAL DEFAULT 0,
    currency TEXT DEFAULT 'USD'
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_id INTEGER,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    FOREIGN KEY (wallet_id) REFERENCES wallets (id)
  );
`);

// Seed initial wallet if empty
const walletCount = db.prepare("SELECT COUNT(*) as count FROM wallets").get() as { count: number };
if (walletCount.count === 0) {
  db.prepare("INSERT INTO wallets (name, balance, monthly_limit) VALUES (?, ?, ?)").run("Main Wallet", 5000, 1000);
}

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // API Routes
  app.get("/api/data", (req, res) => {
    const wallets = db.prepare("SELECT * FROM wallets").all();
    const expenses = db.prepare("SELECT * FROM expenses ORDER BY date DESC").all();
    res.json({ wallets, expenses });
  });

  app.post("/api/wallet", (req, res) => {
    const { name, balance, monthly_limit } = req.body;
    const result = db.prepare("INSERT INTO wallets (name, balance, monthly_limit) VALUES (?, ?, ?)").run(name, balance, monthly_limit);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/wallet/:id", (req, res) => {
    const { id } = req.params;
    const { name, balance, monthly_limit } = req.body;
    db.prepare("UPDATE wallets SET name = ?, balance = ?, monthly_limit = ? WHERE id = ?").run(name, balance, monthly_limit, id);
    res.json({ success: true });
  });

  app.post("/api/expense", (req, res) => {
    const { wallet_id, amount, category, description, date } = req.body;
    
    // Start transaction
    const transaction = db.transaction(() => {
      const result = db.prepare("INSERT INTO expenses (wallet_id, amount, category, description, date) VALUES (?, ?, ?, ?, ?)").run(wallet_id, amount, category, description, date);
      db.prepare("UPDATE wallets SET balance = balance - ? WHERE id = ?").run(amount, wallet_id);
      return result.lastInsertRowid;
    });

    const expenseId = transaction();
    res.json({ id: expenseId });
  });

  app.put("/api/expense/:id", (req, res) => {
    const { id } = req.params;
    const { wallet_id, amount, category, description, date } = req.body;

    const transaction = db.transaction(() => {
      const oldExpense = db.prepare("SELECT amount, wallet_id FROM expenses WHERE id = ?").get() as { amount: number, wallet_id: number };
      if (!oldExpense) return false;

      // If wallet changed, adjust both wallets
      if (oldExpense.wallet_id !== wallet_id) {
        db.prepare("UPDATE wallets SET balance = balance + ? WHERE id = ?").run(oldExpense.amount, oldExpense.wallet_id);
        db.prepare("UPDATE wallets SET balance = balance - ? WHERE id = ?").run(amount, wallet_id);
      } else {
        // Same wallet, adjust by difference
        const diff = amount - oldExpense.amount;
        db.prepare("UPDATE wallets SET balance = balance - ? WHERE id = ?").run(diff, wallet_id);
      }

      db.prepare("UPDATE expenses SET wallet_id = ?, amount = ?, category = ?, description = ?, date = ? WHERE id = ?")
        .run(wallet_id, amount, category, description, date, id);
      return true;
    });

    const success = transaction();
    res.json({ success });
  });

  app.delete("/api/expense/:id", (req, res) => {
    const { id } = req.params;

    const transaction = db.transaction(() => {
      const expense = db.prepare("SELECT amount, wallet_id FROM expenses WHERE id = ?").get() as { amount: number, wallet_id: number };
      if (!expense) return false;

      db.prepare("UPDATE wallets SET balance = balance + ? WHERE id = ?").run(expense.amount, expense.wallet_id);
      db.prepare("DELETE FROM expenses WHERE id = ?").run(id);
      return true;
    });

    const success = transaction();
    res.json({ success });
  });

  app.post("/api/send-alert", (req, res) => {
    const { insight, walletName, limit } = req.body;
    console.log(`[EMAIL ALERT] To: user@example.com`);
    console.log(`Subject: Spending Limit Alert for ${walletName}`);
    console.log(`Body: You have exceeded your limit of ${limit}.`);
    console.log(`AI Insights: ${insight}`);
    res.json({ success: true, message: "Alert 'sent' successfully" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
